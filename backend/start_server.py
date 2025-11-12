#!/usr/bin/env python
"""
Convenient script to start the backend server with proper setup.
This ensures .env exists and provides helpful error messages.
"""
import sys
import subprocess
from pathlib import Path

def main():
    """Start the backend server"""
    backend_dir = Path(__file__).parent
    
    # Ensure .env exists
    print("Checking environment setup...")
    try:
        from ensure_env import ensure_env_file
        has_api_key = ensure_env_file()
        if not has_api_key:
            print("\n" + "=" * 60)
            print("WARNING: GEMINI_API_KEY not set!")
            print("\nTo set your API key, run:")
            print(f"  cd {backend_dir}")
            print("  python ensure_env.py --api-key YOUR_API_KEY")
            print("\nOr manually edit backend/.env file")
            print("=" * 60)
            print("\nStarting server anyway (will use mock responses)...\n")
    except Exception as e:
        print(f"Note: Could not check .env file: {e}")
    
    # Start uvicorn
    print("Starting backend server...")
    print("Press Ctrl+C to stop\n")
    
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn",
            "backend.main:app",
            "--host", "127.0.0.1",
            "--port", "5000",
            "--reload"
        ], cwd=backend_dir.parent)
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
    except Exception as e:
        print(f"\nError starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()


