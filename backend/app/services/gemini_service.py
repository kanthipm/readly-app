import json
import os
from typing import Dict, Any, Optional, Tuple
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
        # Ensure .env file exists (create if missing)
        try:
            from pathlib import Path
            backend_dir = Path(__file__).parent.parent.parent
            env_file = backend_dir / ".env"
            
            if not env_file.exists():
                # Create .env file with template
                env_content = """# Environment Variables for Readly Backend
# This file is auto-generated. Modify as needed.

# Gemini API Configuration
# Get your API key from: https://makersuite.google.com/app/apikey
# Or run: python -m backend.ensure_env --api-key YOUR_KEY
GEMINI_API_KEY=

# Server Configuration
HOST=0.0.0.0
PORT=5000
DEBUG=true

# Preferred Gemini Model (auto-detected, but you can override)
# Options: gemini-2.0-flash, gemini-2.5-flash, gemini-2.5-pro, etc.
GEMINI_MODEL=

# Processing Configuration
MAX_CHUNKS=3
MAX_RETRIES=3
"""
                with open(env_file, 'w') as f:
                    f.write(env_content)
                print(f"Created {env_file} - please set your GEMINI_API_KEY")
        except Exception as e:
            pass  # If we can't create .env, continue anyway
        
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
            print("=" * 60)
            print("WARNING: GEMINI_API_KEY not found. Using mock responses.")
            print("")
            print("To set your API key, run:")
            print("  python -m backend.ensure_env --api-key YOUR_API_KEY")
            print("")
            print("Or create backend/.env file with:")
            print("  GEMINI_API_KEY=your_api_key_here")
            print("=" * 60)
            self.api_key = None
        else:
            genai.configure(api_key=api_key)
            self.api_key = api_key
            print("Gemini API key loaded successfully")
        
        # Try to get preferred model from env, otherwise use default
        preferred_model = os.getenv("GEMINI_MODEL", "").strip()
        if preferred_model:
            self.model = preferred_model
            print(f"Using preferred model from .env: {self.model}")
        else:
            # Use gemini-2.0-flash which is available and fast
            self.model = "gemini-2.0-flash"
        
        self.max_retries = 3
        self.retry_delay = 1
        print(f"Initialized with model: {self.model}")

    def generate_response(self, prompt: str, max_tokens: int = 4000) -> Tuple[str, bool]:
        """Generate response using Gemini API with retry logic. Returns (content, is_fallback)."""
        
        # If no API key, do not return mock - caller should check and return 503
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not set. Add it in backend/.env to generate knowledge maps from your content.")
        
        print(f"Using model: {self.model} for API call")
        
        for attempt in range(self.max_retries):
            try:
                print(f"Gemini API call (attempt {attempt + 1}/{self.max_retries})")
                print(f"Prompt length: {len(prompt)} characters")
                print(f"Model being used: {self.model}")
                
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
                    return (content, False)
                except json.JSONDecodeError as e:
                    error_msg = str(e).encode('ascii', errors='replace').decode('ascii')
                    print(f"Invalid JSON response: {error_msg}")
                    print(f"Response preview: {content[:200]}...")
                    if attempt == self.max_retries - 1:
                        return (self._create_fallback_response(), True)
                    continue
                    
            except Exception as e:
                # Safely encode error message to avoid emoji encoding issues on Windows
                error_msg = str(e).encode('ascii', errors='replace').decode('ascii')
                print(f"Gemini API error (attempt {attempt + 1}): {error_msg}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay * (attempt + 1))
                else:
                    return (self._create_fallback_response(), True)
        
        return (self._create_fallback_response(), True)

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

        content, _ = self.generate_response(prompt, max_tokens=2000)
        return content

    def list_available_models(self):
        """List available Gemini models"""
        if not self.api_key:
            print("No API key available to list models")
            return []
        try:
            models = genai.list_models()
            available = [m.name for m in models if 'generateContent' in m.supported_generation_methods]
            print(f"Available models: {available}")
            return available
        except Exception as e:
            error_msg = str(e).encode('ascii', errors='replace').decode('ascii')
            print(f"Error listing models: {error_msg}")
            return []

    def check_api_status(self) -> bool:
        """Check if Gemini API is accessible"""
        if not self.api_key:
            return False
        
        # First, try to list models to see what's available
        try:
            self.list_available_models()
        except:
            pass
            
        try:
            model = genai.GenerativeModel(self.model)
            response = model.generate_content("test", generation_config=genai.types.GenerationConfig(max_output_tokens=5))
            print(f"Successfully connected to Gemini API using model: {self.model}")
            return True
        except Exception as e:
            error_msg = str(e).encode('ascii', errors='replace').decode('ascii')
            print(f"Gemini API not accessible: {error_msg}")
            print(f"Tried model: {self.model}")
            # Try to find a working model
            available = self.list_available_models()
            if available:
                # Try available models in order of preference (these match the actual available models)
                preferred_models = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-001", "gemini-2.5-pro", "gemini-pro-latest"]
                for preferred in preferred_models:
                    # Find matching model in available list (which has "models/" prefix)
                    matching_model = None
                    for avail_model in available:
                        # Extract model name from "models/gemini-X.X-flash" format
                        model_name = avail_model.replace("models/", "")
                        if model_name == preferred or preferred in model_name:
                            matching_model = model_name  # Use without "models/" prefix
                            break
                    
                    if matching_model:
                        print(f"Trying model: {matching_model}")
                        self.model = matching_model
                        try:
                            model = genai.GenerativeModel(self.model)
                            response = model.generate_content("test", generation_config=genai.types.GenerationConfig(max_output_tokens=5))
                            print(f"SUCCESS: Successfully connected to Gemini API using model: {self.model}")
                            
                            # Save the working model to .env for persistence
                            self._save_working_model_to_env(self.model)
                            return True
                        except Exception as e:
                            error_msg = str(e).encode('ascii', errors='replace').decode('ascii')
                            print(f"ERROR: Model {matching_model} failed: {error_msg}")
                            continue
            return False
    
    def _save_working_model_to_env(self, working_model: str):
        """Save the working model name to .env file for persistence"""
        try:
            from dotenv import load_dotenv, set_key
            from pathlib import Path
            
            # Find .env file
            env_paths = [
                Path(__file__).parent.parent.parent / ".env",  # backend/.env
                Path(__file__).parent.parent.parent.parent / ".env",  # root/.env
            ]
            
            env_file = None
            for env_path in env_paths:
                if env_path.exists():
                    env_file = env_path
                    break
            
            if env_file:
                # Update or add GEMINI_MODEL in .env
                # Read existing content
                with open(env_file, 'r') as f:
                    content = f.read()
                
                lines = content.split('\n')
                updated = False
                new_lines = []
                for line in lines:
                    if line.startswith('GEMINI_MODEL='):
                        new_lines.append(f'GEMINI_MODEL={working_model}')
                        updated = True
                    else:
                        new_lines.append(line)
                
                if not updated:
                    # Add model line after GEMINI_API_KEY
                    found_api_key = False
                    for i, line in enumerate(new_lines):
                        if line.startswith('GEMINI_API_KEY='):
                            new_lines.insert(i + 1, f'GEMINI_MODEL={working_model}')
                            found_api_key = True
                            break
                    if not found_api_key:
                        new_lines.append(f'GEMINI_MODEL={working_model}')
                
                # Write back
                with open(env_file, 'w') as f:
                    f.write('\n'.join(new_lines))
                
                print(f"Saved working model '{working_model}' to {env_file}")
        except Exception as e:
            # Don't fail if we can't save - just log
            pass  # Silent failure is OK


# Global instance
gemini_service = GeminiService()
