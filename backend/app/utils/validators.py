import json


def validate_knowledge_map(json_str: str) -> bool:
    """Validate that a knowledge map JSON string is properly formatted"""
    try:
        parsed = json.loads(json_str)

        # Check required top-level fields
        if not isinstance(parsed, dict):
            print("Validation failed: Response is not an object")
            return False

        if "topic" not in parsed or "subtopics" not in parsed:
            print("Validation failed: Missing required fields")
            return False

        # Check subtopics
        subtopics = parsed.get("subtopics", [])
        if not isinstance(subtopics, list):
            print("Validation failed: subtopics is not a list")
            return False

        for i, sub in enumerate(subtopics):
            if not isinstance(sub, dict):
                print(f"Validation failed: Subtopic {i} is not an object")
                return False

            required_fields = ["title", "description", "key_concepts", "status", "quiz"]
            for field in required_fields:
                if field not in sub:
                    print(f"Validation failed: Subtopic {i} missing '{field}' field")
                    return False

            # Validate quiz questions
            for j, q in enumerate(sub.get("quiz", [])):
                if not isinstance(q, dict):
                    print(
                        f"Validation failed: Question {j} in subtopic {i} is not an object"
                    )
                    return False

                if "explanation" not in q or not q["explanation"].strip():
                    print(
                        f"Validation failed: Question {j} in subtopic {i} missing explanation"
                    )
                    return False

        return True
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        return False
    except Exception as e:
        print(f"Validation error: {e}")
        return False


def validate_questions(json_str: str) -> bool:
    """Validate that a questions JSON string is properly formatted"""
    try:
        questions = json.loads(json_str)
        if not isinstance(questions, list):
            print("Validation failed: Response is not a list")
            return False

        for i, q in enumerate(questions):
            if not isinstance(q, dict):
                print(f"Validation failed: Question {i} is not an object")
                return False

            required_fields = ["question", "options", "answer", "explanation"]
            for field in required_fields:
                if field not in q:
                    print(f"Validation failed: Question {i} missing '{field}' field")
                    return False
                if not q[field] or not str(q[field]).strip():
                    print(f"Validation failed: Question {i} has empty '{field}' field")
                    return False

        print(f"Validation passed: {len(questions)} questions are valid")
        return True
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        print(f"Raw response: {json_str[:200]}...")
        return False
    except Exception as e:
        print(f"Validation error: {e}")
        return False
