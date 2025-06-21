from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz  # PyMuPDF
import requests

app = Flask(__name__)
CORS(app)

# ---------- Utils ----------
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
You are an educational AI assistant. Given the following educational content, return ONLY a valid JSON knowledge map structured as below. Do not include any explanation or text outside the JSON.

Each output must follow this format:

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
    }},
    ...
  ]
}}

Content:
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


@app.route("/upload", methods=["POST"])
def upload_pdf():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    text = extract_text_from_pdf(file)
    chunks = chunk_text(text)

    knowledge_maps = []
    for chunk in chunks[:3]:  # Limit to 3 chunks for now
        map_json = generate_knowledge_map(chunk)
        knowledge_maps.append(map_json)

    return jsonify({"maps": knowledge_maps})


# Start the server
if __name__ == "__main__":
    print("🚀 Starting Flask server on http://localhost:5000")
    app.run(debug=True)

