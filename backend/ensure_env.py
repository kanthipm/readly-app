"""
Ensure .env file exists and is properly configured.
This script creates .env if it doesn't exist and helps set up the API key.
"""
import os
from pathlib import Path

def ensure_env_file():
    """Create .env file if it doesn't exist"""
    backend_dir = Path(__file__).parent
    env_file = backend_dir / ".env"
    env_example = backend_dir / "env_example.txt"
    
    if not env_file.exists():
        print(f"Creating .env file at: {env_file}")
        
        # Read API key from env_example if it exists, otherwise prompt
        api_key = None
        if env_example.exists():
            with open(env_example, 'r') as f:
                content = f.read()
                # Try to extract API key from example
                for line in content.split('\n'):
                    if line.startswith('GEMINI_API_KEY='):
                        api_key = line.split('=', 1)[1].strip()
                        break
        
        # Create .env file with default values
        env_content = f"""# Environment Variables for Quista Backend
# This file is auto-generated. Modify as needed.

# Gemini API Configuration
# Get your API key from: https://makersuite.google.com/app/apikey
# Or use: python -m backend.ensure_env --api-key YOUR_KEY
GEMINI_API_KEY={api_key if api_key else ''}

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
        
        print(f"Created .env file. Please set your GEMINI_API_KEY in: {env_file}")
        return False  # API key not set
    else:
        # Check if API key is set
        with open(env_file, 'r') as f:
            content = f.read()
            if 'GEMINI_API_KEY=' in content:
                for line in content.split('\n'):
                    if line.startswith('GEMINI_API_KEY='):
                        api_key = line.split('=', 1)[1].strip()
                        if api_key and api_key != '':
                            return True  # API key is set
        
        print(f".env file exists but GEMINI_API_KEY is not set.")
        print(f"Please set GEMINI_API_KEY in: {env_file}")
        return False  # API key not set

if __name__ == "__main__":
    import sys
    api_key = None
    
    # Check for command line argument
    if len(sys.argv) > 1:
        if '--api-key' in sys.argv:
            idx = sys.argv.index('--api-key')
            if idx + 1 < len(sys.argv):
                api_key = sys.argv[idx + 1]
        
        if api_key:
            backend_dir = Path(__file__).parent
            env_file = backend_dir / ".env"
            
            # Read existing .env or create new
            if env_file.exists():
                with open(env_file, 'r') as f:
                    content = f.read()
            else:
                content = ""
            
            # Update or add API key
            lines = content.split('\n') if content else []
            updated = False
            new_lines = []
            for line in lines:
                if line.startswith('GEMINI_API_KEY='):
                    new_lines.append(f'GEMINI_API_KEY={api_key}')
                    updated = True
                else:
                    new_lines.append(line)
            
            if not updated:
                # Add API key line
                new_lines.append(f'GEMINI_API_KEY={api_key}')
            
            with open(env_file, 'w') as f:
                f.write('\n'.join(new_lines))
            
            print(f"API key saved to: {env_file}")
            sys.exit(0)
    
    # Just check/ensure .env exists
    has_api_key = ensure_env_file()
    if has_api_key:
        print("✓ .env file is configured correctly")
        sys.exit(0)
    else:
        print("\nTo set your API key, run:")
        print("  python -m backend.ensure_env --api-key YOUR_API_KEY")
        sys.exit(1)


