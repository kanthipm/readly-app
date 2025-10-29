import json
import os
from typing import Dict, Any, Optional
from openai import OpenAI
import time


class OpenAIService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")  # Use cheaper model by default
        self.max_retries = 3
        self.retry_delay = 1

    def generate_response(self, prompt: str, max_tokens: int = 4000) -> str:
        """Generate response using OpenAI API with retry logic"""
        for attempt in range(self.max_retries):
            try:
                print(f"🤖 OpenAI API call (attempt {attempt + 1}/{self.max_retries})")
                print(f"📝 Prompt length: {len(prompt)} characters")
                
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an educational AI assistant. Always return valid JSON without any additional text or commentary."
                        },
                        {
                            "role": "user", 
                            "content": prompt
                        }
                    ],
                    max_tokens=max_tokens,
                    temperature=0.7,
                    timeout=30
                )
                
                content = response.choices[0].message.content.strip()
                print(f"✅ OpenAI response received: {len(content)} characters")
                
                # Validate JSON
                try:
                    json.loads(content)
                    return content
                except json.JSONDecodeError as e:
                    print(f"❌ Invalid JSON response: {e}")
                    if attempt == self.max_retries - 1:
                        return self._create_fallback_response()
                    continue
                    
            except Exception as e:
                print(f"❌ OpenAI API error (attempt {attempt + 1}): {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay * (attempt + 1))
                else:
                    return self._create_fallback_response()
        
        return self._create_fallback_response()

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
        """Check if OpenAI API is accessible"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "test"}],
                max_tokens=5,
                timeout=5
            )
            return True
        except Exception as e:
            print(f"❌ OpenAI API not accessible: {e}")
            return False


# Global instance
openai_service = OpenAIService()

