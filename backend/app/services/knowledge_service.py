from typing import List
import json

from ..config import settings
from ..services.gemini_service import gemini_service


class KnowledgeService:
    def __init__(self):
        self.gemini = gemini_service

    def generate_knowledge_map(self, text_chunk: str, instructions: str = None) -> str:
        """Generate a knowledge map from a text chunk using Gemini"""
        instructions_section = ""
        if instructions and instructions.strip():
            instructions_section = f"\n### Additional Instructions:\n{instructions.strip()}\n"
        
        prompt = f"""You are an educational AI assistant. Analyze the educational content and return ONLY a valid JSON object. Do NOT include any markdown, code blocks, explanations, or extra text. Return ONLY the raw JSON.

CRITICAL: Your response must be valid JSON that can be parsed directly. Start with {{ and end with }}. No markdown code blocks, no comments, no extra text.

{instructions_section if instructions_section else ""}### Required JSON Structure:
{{
  "topic": "Main topic title based on the content",
  "subtopics": [
    {{
      "title": "Subtopic title",
      "description": "Brief summary of this subtopic from the content",
      "key_concepts": ["concept from content", "another concept", "third concept"],
      "status": "unmastered",
      "quiz": [
        {{
          "question": "Question based on the content",
          "options": ["A. Option from content", "B. Option from content", "C. Option from content", "D. Option from content"],
          "answer": "Correct option letter with text",
          "explanation": "Detailed explanation of why the answer is correct based on the content"
        }},
        {{
          "question": "Another question from the content",
          "options": ["A. Option", "B. Option", "C. Option", "D. Option"],
          "answer": "Correct option",
          "explanation": "Explanation based on the content"
        }}
      ]
    }}
  ]
}}

### Instructions:
1. Generate 2-5 subtopics based on the content
2. Create at least 2 quiz questions per subtopic
3. ALL questions MUST have explanations
4. Base everything on the actual content provided
5. Return ONLY valid JSON, no markdown, no code blocks

### Educational Content to Analyze:
{text_chunk}

Remember: Return ONLY the JSON object, starting with {{ and ending with }}."""
        return self.gemini.generate_response(prompt)

    def generate_additional_questions(
        self,
        subtopic_title: str,
        subtopic_description: str,
        key_concepts: List[str],
        num_questions: int = 3,
    ) -> str:
        """Generate additional quiz questions for a subtopic"""
        prompt = f"""Generate {num_questions} multiple choice quiz questions based on this subtopic.

Subtopic: {subtopic_title}
Description: {subtopic_description}
Key Concepts: {', '.join(key_concepts[:5])}

CRITICAL: Return ONLY a valid JSON array. Do NOT include markdown, code blocks, or any extra text. Start with [ and end with ].

Required Format:
[
  {{
    "question": "Question about the subtopic based on the description and key concepts",
    "options": ["A. Option A", "B. Option B", "C. Option C", "D. Option D"],
    "answer": "Correct option with letter and text",
    "explanation": "Detailed explanation of why this answer is correct based on the subtopic content"
  }}
]

Requirements:
- Generate exactly {num_questions} questions
- All questions must be based on: {subtopic_title} - {subtopic_description}
- Each question MUST have an explanation
- Questions should test understanding of the key concepts: {', '.join(key_concepts[:5])}
- Return ONLY the JSON array, no markdown, no code blocks"""

        # Try up to max retries
        for attempt in range(settings.MAX_RETRIES):
            try:
                print(
                    f"Generating questions (attempt {attempt + 1}/{settings.MAX_RETRIES})..."
                )
                result = self.gemini.generate_response(prompt)
                if result and not result.startswith("Error:"):
                    print(f"AI Response: {result[:200]}...")
                    return result
                else:
                    print(f"Gemini error: {result}")
                    if attempt == settings.MAX_RETRIES - 1:
                        return result or "Error: No response from model"
            except Exception as e:
                print(f"Unexpected error on attempt {attempt + 1}: {e}")
                if attempt == settings.MAX_RETRIES - 1:
                    return f"Error: {str(e)}"

        return "Error: All attempts failed"


knowledge_service = KnowledgeService()
