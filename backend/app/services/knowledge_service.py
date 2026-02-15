from typing import List, Tuple
import json

from ..config import settings
from ..services.gemini_service import gemini_service


class KnowledgeService:
    def __init__(self):
        self.gemini = gemini_service

    def generate_knowledge_map(self, text_chunk: str, instructions: str = None) -> Tuple[str, bool]:
        """Generate a knowledge map from a text chunk using Gemini. Returns (json_str, is_fallback)."""
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
2. Create at least 5 quiz questions per subtopic
3. ALL questions MUST have explanations
4. Base everything on the actual content provided
5. Return ONLY valid JSON, no markdown, no code blocks

### Educational Content to Analyze:
{text_chunk}

Remember: Return ONLY the JSON object, starting with {{ and ending with }}."""
        content, is_fallback = self.gemini.generate_response(prompt)
        return (content, is_fallback)

    def generate_additional_questions(
        self,
        subtopic_title: str,
        subtopic_description: str,
        key_concepts: List[str],
        num_questions: int = 3,
        focus_on_weak_areas: bool = False,
    ) -> str:
        """Generate additional quiz questions for a subtopic - optimized to avoid long prompts"""
        weak_areas_note = ""
        if focus_on_weak_areas:
            weak_areas_note = "\nIMPORTANT: Focus on creating questions that help reinforce understanding of challenging concepts. Make questions that test deeper comprehension."
        
        prompt = f"""Generate {num_questions} multiple choice quiz questions.

Subtopic: {subtopic_title}
Description: {subtopic_description}
Key Concepts: {', '.join(key_concepts[:5])}{weak_areas_note}

Return ONLY a valid JSON array. Start with [ and end with ]. No markdown, no code blocks.

Format:
[{{"question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "Correct option", "explanation": "..."}}]

Generate exactly {num_questions} questions. All must test understanding of: {subtopic_title}. Each MUST have an explanation."""

        # Try up to max retries
        for attempt in range(settings.MAX_RETRIES):
            try:
                print(
                    f"Generating questions (attempt {attempt + 1}/{settings.MAX_RETRIES})..."
                )
                result, _ = self.gemini.generate_response(prompt)
                if result and not result.startswith("Error:"):
                    print(f"AI Response: {result[:200]}...")
                    return result
                else:
                    print(f"Gemini error: {result}")
                    if attempt == settings.MAX_RETRIES - 1:
                        return result or "Error: No response from model"
            except Exception as e:
                error_msg = str(e).encode('ascii', errors='replace').decode('ascii')
                print(f"Unexpected error on attempt {attempt + 1}: {error_msg}")
                if attempt == settings.MAX_RETRIES - 1:
                    return f"Error: {error_msg}"

        return "Error: All attempts failed"

    def configure_knowledge_map(self, existing_map_json: str, instructions: str) -> str:
        """Modify an existing knowledge map based on instructions, preserving progress"""
        try:
            existing_map = json.loads(existing_map_json)
        except json.JSONDecodeError:
            return "Error: Invalid existing knowledge map JSON"
        
        # Prepare subtopic summaries with progress data for AI context
        subtopic_summaries = []
        for sub in existing_map.get("subtopics", []):
            progress_info = f"Progress: {sub.get('answered', 0)} answered, {sub.get('correct', 0)} correct, status: {sub.get('status', 'unmastered')}"
            subtopic_summaries.append(f"- {sub.get('title', 'Untitled')}: {sub.get('description', '')} ({progress_info})")
        
        subtopics_list = "\n".join(subtopic_summaries)
        
        prompt = f"""You are an educational AI assistant. Modify an existing knowledge map based on the user's instructions.

CRITICAL: Your response must be valid JSON that can be parsed directly. Start with {{ and end with }}. No markdown, no code blocks, no comments, no extra text.

### Current Knowledge Map:
Topic: {existing_map.get('topic', 'Unknown')}

Current Subtopics:
{subtopics_list}

### User Instructions:
{instructions}

### Required JSON Structure:
{{
  "topic": "Topic title (may be modified if instructed)",
  "subtopics": [
    {{
      "title": "Subtopic title",
      "description": "Brief summary",
      "key_concepts": ["concept1", "concept2", "concept3"],
      "status": "unmastered",
      "quiz": [
        {{
          "question": "Question text",
          "options": ["A. Option", "B. Option", "C. Option", "D. Option"],
          "answer": "Correct option",
          "explanation": "Explanation text"
        }}
      ]
    }}
  ]
}}

### IMPORTANT Rules:
1. Follow the user's instructions exactly (e.g., remove subtopic X, reorganize by Y, etc.)
2. If a subtopic is removed per instructions, do NOT include it in the response
3. If subtopics are reorganized, create new structure as instructed
4. For subtopics that remain, preserve their quiz questions (at least 5 per subtopic)
5. You may modify descriptions, key_concepts, and quiz questions based on instructions
6. If instructions ask to add new subtopics or content, do so
7. Always maintain at least 5 quiz questions per subtopic
8. Return ONLY valid JSON, no markdown, no code blocks

Return the COMPLETE modified knowledge map as JSON."""
        
        content, _ = self.gemini.generate_response(prompt)
        return content


knowledge_service = KnowledgeService()
