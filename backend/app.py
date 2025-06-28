from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz  # PyMuPDF
import requests
import json
import time

app = Flask(__name__)
CORS(app)

# ---------- Utils ----------

def check_ollama_status():
    """Check if Ollama is running and accessible"""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get("models", [])
            mistral_available = any("mistral" in model.get("name", "").lower() for model in models)
            if mistral_available:
                print("✅ Ollama is running and Mistral model is available")
                return True
            else:
                print("⚠️ Ollama is running but Mistral model not found")
                print("💡 Install with: ollama pull mistral")
                return False
        else:
            print(f"⚠️ Ollama responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Ollama - is it running?")
        print("💡 Start Ollama with: ollama serve")
        return False
    except Exception as e:
        print(f"⚠️ Error checking Ollama: {e}")
        return False


def preload_model():
    """Preload the model to avoid cold start delays"""
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            print(f"🔄 Preloading Mistral model (attempt {attempt + 1}/{max_attempts})...")
            response = requests.post(
                "http://localhost:11434/api/generate",
                json={"model": "mistral", "prompt": "Hello", "stream": False}
            )
            if response.status_code == 200:
                print("✅ Model preloaded successfully")
                return True
            else:
                print(f"❌ Model preload failed: {response.status_code}")
        except requests.exceptions.Timeout:
            print(f"⏱️ Attempt {attempt + 1} timed out - retrying...")
        except requests.exceptions.ConnectionError:
            print("❌ Cannot connect to Ollama - make sure it's running")
            print("💡 Start Ollama with: ollama serve")
            return False
        except Exception as e:
            print(f"⚠️ Attempt {attempt + 1} failed: {e}")
    
    print("❌ Failed to preload model after all attempts")
    return False


def extract_text_from_pdf(file_stream):
    doc = fitz.open(stream=file_stream.read(), filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text


def chunk_text(text, max_tokens=1500):
    paragraphs = text.split("\n\n")
    chunks = []
    current = ""
    for para in paragraphs:
        if len(current) + len(para) < max_tokens * 4:
            current += para + "\n\n"
        else:
            chunks.append(current.strip())
            current = para + "\n\n"
    if current:
        chunks.append(current.strip())
    return chunks


def generate_knowledge_map(text_chunk):
    prompt = f"""
You are an educational AI assistant. Given the following educational content, return ONLY a valid JSON object structured exactly as below. Do not include any commentary or extra text — only valid JSON.

### JSON Format:
{{
  "topic": "Main topic title",
  "subtopics": [
    {{
      "title": "Subtopic A",
      "description": "Short summary of this subtopic.",
      "key_concepts": ["concept 1", "concept 2", "concept 3"],
      "status": "unmastered",
      "quiz": [
        {{
          "question": "What is ...?",
          "options": ["A", "B", "C", "D"],
          "answer": "B",
          "explanation": "B is correct because..."
        }},
        {{
          "question": "Why does ...?",
          "options": ["W", "X", "Y", "Z"],
          "answer": "X",
          "explanation": "X is correct because..."
        }}
      ]
    }}
  ]
}}

### Your Task:
Generate a knowledge map based on the content below. Every quiz question **must** include an `explanation`. Do not omit it. Do not generate partial or invalid JSON.

### Educational Content:
{text_chunk}
"""

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={"model": "mistral", "prompt": prompt, "stream": False}
    )

    if response.status_code == 200:
        return response.json()["response"]
    else:
        return f"Error: {response.status_code} - {response.text}"


def generate_more_questions(subtopic_title, subtopic_description, key_concepts, num_questions=3):
    # More explicit prompt to ensure explanations are included
    prompt = f"""Generate {num_questions} multiple choice quiz questions for: {subtopic_title}

Key concepts: {', '.join(key_concepts[:3])}

IMPORTANT: Every question MUST include an explanation field. Do not omit it.

Return ONLY valid JSON array like this:
[
  {{
    "question": "What is the main purpose of X?",
    "options": ["A. Option A", "B. Option B", "C. Option C", "D. Option D"],
    "answer": "B. Option B",
    "explanation": "B is correct because it explains the main purpose clearly."
  }},
  {{
    "question": "Why does Y happen?",
    "options": ["A. Reason A", "B. Reason B", "C. Reason C", "D. Reason D"],
    "answer": "C. Reason C",
    "explanation": "C is correct because it provides the scientific explanation."
  }}
]

Make questions challenging but fair. ALWAYS include explanations for each question."""

    # Try up to 2 times
    for attempt in range(2):
        try:
            print(f"🔄 Generating questions (attempt {attempt + 1}/2)...")
            response = requests.post(
                "http://localhost:11434/api/generate",
                json={"model": "mistral", "prompt": prompt, "stream": False}
            )

            if response.status_code == 200:
                result = response.json()["response"]
                print(f"🤖 AI Response: {result[:200]}...")  # Debug: show first 200 chars
                return result
            else:
                print(f"❌ Ollama error: {response.status_code}")
                if attempt == 1:  # Last attempt
                    return f"Error: {response.status_code}"
        except requests.exceptions.Timeout:
            print(f"⏱️ Attempt {attempt + 1} timed out")
            if attempt == 1:  # Last attempt
                return "Error: Request timed out"
        except requests.exceptions.ConnectionError:
            print("❌ Cannot connect to Ollama - is it running?")
            return "Error: Cannot connect to Ollama"
        except Exception as e:
            print(f"❌ Unexpected error on attempt {attempt + 1}: {e}")
            if attempt == 1:  # Last attempt
                return f"Error: {str(e)}"
    
    return "Error: All attempts failed"


def validate_map(json_str):
    try:
        parsed = json.loads(json_str)
        for sub in parsed.get("subtopics", []):
            for q in sub.get("quiz", []):
                if "explanation" not in q or not q["explanation"].strip():
                    return False
        return True
    except Exception as e:
        print("Validation error:", e)
        return False


def validate_questions(json_str):
    try:
        questions = json.loads(json_str)
        if not isinstance(questions, list):
            print("❌ Validation failed: Response is not a list")
            return False
        
        for i, q in enumerate(questions):
            if not isinstance(q, dict):
                print(f"❌ Validation failed: Question {i} is not an object")
                return False
            
            required_fields = ["question", "options", "answer", "explanation"]
            for field in required_fields:
                if field not in q:
                    print(f"❌ Validation failed: Question {i} missing '{field}' field")
                    return False
                if not q[field] or not str(q[field]).strip():
                    print(f"❌ Validation failed: Question {i} has empty '{field}' field")
                    return False
        
        print(f"✅ Validation passed: {len(questions)} questions are valid")
        return True
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {e}")
        print(f"❌ Raw response: {json_str[:200]}...")
        return False
    except Exception as e:
        print(f"❌ Validation error: {e}")
        return False


# ---------- Routes ----------

@app.route("/upload", methods=["POST"])
def upload_pdf():
    global uploaded_file_content
    
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    uploaded_file_content = extract_text_from_pdf(file)  # Store the content globally
    chunks = chunk_text(uploaded_file_content)

    knowledge_maps = []
    for chunk in chunks[:3]:  # Limit to 3 chunks for now
        map_json = generate_knowledge_map(chunk)
        if validate_map(map_json):
            knowledge_maps.append(map_json)
        else:
            print("❌ Skipping invalid map (missing explanation)")

    return jsonify({"maps": knowledge_maps})


@app.route("/generate-questions", methods=["POST"])
def generate_additional_questions():
    start_time = time.time()
    
    data = request.get_json()
    
    if not data or not all(key in data for key in ["title", "description", "key_concepts"]):
        return jsonify({"error": "Missing required fields: title, description, key_concepts"}), 400
    
    num_questions = data.get("num_questions", 3)
    
    print(f"🔄 Generating {num_questions} questions for: {data['title']}")
    
    questions_json = generate_more_questions(
        data["title"], 
        data["description"], 
        data["key_concepts"],
        num_questions
    )
    
    generation_time = time.time() - start_time
    print(f"⏱️ Question generation took {generation_time:.2f} seconds")
    
    if validate_questions(questions_json):
        try:
            questions = json.loads(questions_json)
            return jsonify({"questions": questions})
        except json.JSONDecodeError:
            return jsonify({"error": "Invalid JSON response from AI model"}), 500
    else:
        print("❌ Skipping invalid questions (missing explanation)")
        return jsonify({"error": "Generated questions are invalid"}), 500


@app.route("/test-ollama", methods=["GET"])
def test_ollama():
    """Test endpoint to check Ollama performance"""
    import time
    start_time = time.time()
    
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "mistral", "prompt": "Say hello", "stream": False},
            timeout=60
        )
        
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            return jsonify({
                "status": "success",
                "response_time": f"{elapsed:.2f} seconds",
                "response": response.json()["response"]
            })
        else:
            return jsonify({
                "status": "error",
                "response_time": f"{elapsed:.2f} seconds",
                "error": f"HTTP {response.status_code}"
            })
    except Exception as e:
        elapsed = time.time() - start_time
        return jsonify({
            "status": "error",
            "response_time": f"{elapsed:.2f} seconds",
            "error": str(e)
        })


# ---------- Run Server ----------

if __name__ == "__main__":
    print("🚀 Starting Flask server on http://localhost:5000")
    print("🔄 Preloading model...")
    
    if preload_model():
        print("✅ Server ready!")
    else:
        print("❌ Failed to preload model - please check Ollama")
        print("💡 Make sure Ollama is running: ollama serve")
        exit(1)
    
    app.run(debug=True)
