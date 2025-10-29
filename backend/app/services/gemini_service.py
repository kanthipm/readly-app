import json
import os
from typing import Dict, Any, Optional
from pathlib import Path
import google.generativeai as genai
import time

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    # Try loading from backend/.env or root .env
    env_paths = [
        Path(__file__).parent.parent.parent / ".env",  # backend/.env
        Path(__file__).parent.parent.parent.parent / ".env",  # root/.env
    ]
    for env_path in env_paths:
        if env_path.exists():
            load_dotenv(env_path)
            break
    else:
        load_dotenv()  # Try default location
except ImportError:
    pass  # dotenv not installed, rely on system env vars


class GeminiService:
    def __init__(self):
        # Ensure .env is loaded before checking for API key
        try:
            from dotenv import load_dotenv
            # Try loading from backend/.env or root .env
            env_paths = [
                Path(__file__).parent.parent.parent / ".env",  # backend/.env
                Path(__file__).parent.parent.parent.parent / ".env",  # root/.env
            ]
            for env_path in env_paths:
                if env_path.exists():
                    load_dotenv(env_path, override=True)
                    break
            else:
                load_dotenv(override=True)  # Try default location
        except ImportError:
            pass  # dotenv not installed, rely on system env vars
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("WARNING: GEMINI_API_KEY not found. Using mock responses.")
            self.api_key = None
        else:
            genai.configure(api_key=api_key)
            self.api_key = api_key
            print("Gemini API key loaded successfully")
        
        self.model = "gemini-1.5-flash-lite"  # Fast and cost-effective model
        self.max_retries = 3
        self.retry_delay = 1

    def generate_response(self, prompt: str, max_tokens: int = 4000) -> str:
        """Generate response using Gemini API with retry logic"""
        
        # If no API key, return mock response
        if not self.api_key:
            return self._create_mock_response()
        
        for attempt in range(self.max_retries):
            try:
                print(f"Gemini API call (attempt {attempt + 1}/{self.max_retries})")
                print(f"Prompt length: {len(prompt)} characters")
                
                model = genai.GenerativeModel(self.model)
                
                response = model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        max_output_tokens=max_tokens,
                        temperature=0.7,
                    )
                )
                
                content = response.text.strip()
                print(f"Gemini response received: {len(content)} characters")
                
                # Remove markdown code blocks if present
                if content.startswith("```json"):
                    content = content[7:]  # Remove ```json
                elif content.startswith("```"):
                    content = content[3:]  # Remove ```
                
                if content.endswith("```"):
                    content = content[:-3]  # Remove trailing ```
                
                content = content.strip()
                
                # Validate JSON
                try:
                    json.loads(content)
                    return content
                except json.JSONDecodeError as e:
                    print(f"Invalid JSON response: {e}")
                    print(f"Response preview: {content[:200]}...")
                    if attempt == self.max_retries - 1:
                        return self._create_fallback_response()
                    continue
                    
            except Exception as e:
                print(f"Gemini API error (attempt {attempt + 1}): {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay * (attempt + 1))
                else:
                    return self._create_fallback_response()
        
        return self._create_fallback_response()

    def _create_mock_response(self) -> str:
        """Create a mock response when API key is not available"""
        mock_response = {
            "topic": "Educational Content Analysis (Mock)",
            "subtopics": [
                {
                    "title": "Key Concepts Overview",
                    "description": "Important concepts from the uploaded content",
                    "key_concepts": ["fundamental concept", "advanced concept", "practical application"],
                    "status": "unmastered",
                    "quiz": [
                        {
                            "question": "What is the main topic of this content?",
                            "options": ["A. Topic A", "B. Topic B", "C. Topic C", "D. Topic D"],
                            "answer": "B. Topic B",
                            "explanation": "This is a mock response. Set GEMINI_API_KEY environment variable for real AI responses."
                        },
                        {
                            "question": "Why is this topic important?",
                            "options": ["A. Reason A", "B. Reason B", "C. Reason C", "D. Reason D"],
                            "answer": "C. Reason C",
                            "explanation": "This explanation is generated by the mock service."
                        }
                    ]
                },
                {
                    "title": "Advanced Applications",
                    "description": "How to apply these concepts in real-world scenarios",
                    "key_concepts": ["application 1", "application 2", "application 3"],
                    "status": "unmastered",
                    "quiz": [
                        {
                            "question": "How do you apply this concept?",
                            "options": ["A. Method A", "B. Method B", "C. Method C", "D. Method D"],
                            "answer": "A. Method A",
                            "explanation": "Method A is the most effective approach for this concept."
                        }
                    ]
                }
            ]
        }
        return json.dumps(mock_response)

    def _create_fallback_response(self) -> str:
        """Create a fallback response when API fails"""
        fallback = {
            "topic": "Educational Content Analysis",
            "subtopics": [
                {
                    "title": "Key Concepts",
                    "description": "Important concepts from the uploaded content",
                    "key_concepts": ["concept 1", "concept 2", "concept 3"],
                    "status": "unmastered",
                    "quiz": [
                        {
                            "question": "What is the main topic of this content?",
                            "options": ["A. Topic A", "B. Topic B", "C. Topic C", "D. Topic D"],
                            "answer": "B. Topic B",
                            "explanation": "This is a fallback response when AI service is unavailable."
                        }
                    ]
                }
            ]
        }
        return json.dumps(fallback)

    def generate_questions(self, content: str, num_questions: int = 3) -> str:
        """Generate additional quiz questions"""
        prompt = f"""Generate {num_questions} multiple choice quiz questions based on this content:

{content}

Return ONLY a valid JSON array like this:
[
  {{
    "question": "What is the main purpose of X?",
    "options": ["A. Option A", "B. Option B", "C. Option C", "D. Option D"],
    "answer": "B. Option B",
    "explanation": "B is correct because it explains the concept clearly."
  }}
]

Make questions challenging but fair. ALWAYS include explanations."""

        return self.generate_response(prompt, max_tokens=2000)

    def check_api_status(self) -> bool:
        """Check if Gemini API is accessible"""
        if not self.api_key:
            return False
            
        try:
            model = genai.GenerativeModel(self.model)
            response = model.generate_content("test", generation_config=genai.types.GenerationConfig(max_output_tokens=5))
            return True
        except Exception as e:
            print(f"Gemini API not accessible: {e}")
            return False


# Global instance
gemini_service = GeminiService()
