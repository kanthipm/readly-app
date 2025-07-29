from typing import List

from ..config import settings
from ..services.ollama_service import ollama_service


class KnowledgeService:
    def __init__(self):
        self.ollama = ollama_service

    def generate_knowledge_map(self, text_chunk: str) -> str:
        """Generate a knowledge map from a text chunk"""
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
        return self.ollama.generate_response(prompt)

    def generate_additional_questions(
        self,
        subtopic_title: str,
        subtopic_description: str,
        key_concepts: List[str],
        num_questions: int = 3,
    ) -> str:
        """Generate additional quiz questions for a subtopic"""
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

        # Try up to max retries
        for attempt in range(settings.MAX_RETRIES):
            try:
                print(
                    f"Generating questions (attempt {attempt + 1}/{settings.MAX_RETRIES})..."
                )
                result = self.ollama.generate_response(prompt)
                if result and not result.startswith("Error:"):
                    print(f"AI Response: {result[:200]}...")
                    return result
                else:
                    print(f"Ollama error: {result}")
                    if attempt == settings.MAX_RETRIES - 1:
                        return result or "Error: No response from model"
            except Exception as e:
                print(f"Unexpected error on attempt {attempt + 1}: {e}")
                if attempt == settings.MAX_RETRIES - 1:
                    return f"Error: {str(e)}"

        return "Error: All attempts failed"


knowledge_service = KnowledgeService()
