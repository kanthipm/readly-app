import time
from typing import Optional

import requests

from ..config import settings


class OllamaService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT

    def check_status(self) -> bool:
        """Check if Ollama is running and accessible"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get("models", [])
                mistral_available = any(
                    self.model in model.get("name", "").lower() for model in models
                )
                if mistral_available:
                    print(f"Ollama is running and {self.model} model is available")
                    return True
                else:
                    print(f"Ollama is running but {self.model} model not found")
                    print(f"Install with: ollama pull {self.model}")
                    return False
            else:
                print(f"Ollama responded with status: {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            print("Cannot connect to Ollama - is it running?")
            print("Start Ollama with: ollama serve")
            return False
        except Exception as e:
            print(f"Error checking Ollama: {e}")
            return False

    def preload_model(self) -> bool:
        """Preload the model to avoid cold start delays"""
        max_attempts = settings.MAX_RETRIES
        for attempt in range(max_attempts):
            try:
                print(
                    f"Preloading {self.model} model (attempt {attempt + 1}/{max_attempts})..."
                )
                response = requests.post(
                    f"{self.base_url}/api/generate",
                    json={"model": self.model, "prompt": "Hello", "stream": False},
                    timeout=self.timeout,
                )
                if response.status_code == 200:
                    print("Model preloaded successfully")
                    return True
                else:
                    print(f"Model preload failed: {response.status_code}")
            except requests.exceptions.Timeout:
                print(f"Attempt {attempt + 1} timed out - retrying...")
            except requests.exceptions.ConnectionError:
                print("Cannot connect to Ollama - make sure it's running")
                print("Start Ollama with: ollama serve")
                return False
            except Exception as e:
                print(f"Attempt {attempt + 1} failed: {e}")

        print("Failed to preload model after all attempts")
        return False

    def generate_response(self, prompt: str) -> Optional[str]:
        """Generate a response using the Ollama model"""
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={"model": self.model, "prompt": prompt, "stream": False},
                timeout=self.timeout,
            )
            if response.status_code == 200:
                return response.json()["response"]
            else:
                return f"Error: {response.status_code} - {response.text}"
        except Exception as e:
            return f"Error: {str(e)}"

    def test_connection(self) -> dict:
        """Test endpoint to check Ollama performance"""
        start_time = time.time()

        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={"model": self.model, "prompt": "Say hello", "stream": False},
                timeout=self.timeout,
            )

            elapsed = time.time() - start_time

            if response.status_code == 200:
                return {
                    "status": "success",
                    "response_time": f"{elapsed:.2f} seconds",
                    "response": response.json()["response"],
                }
            else:
                return {
                    "status": "error",
                    "response_time": f"{elapsed:.2f} seconds",
                    "error": f"HTTP {response.status_code}",
                }
        except Exception as e:
            elapsed = time.time() - start_time
            return {
                "status": "error",
                "response_time": f"{elapsed:.2f} seconds",
                "error": str(e),
            }


ollama_service = OllamaService()


def check_ollama_status() -> bool:
    return ollama_service.check_status()


def preload_model() -> bool:
    return ollama_service.preload_model()
