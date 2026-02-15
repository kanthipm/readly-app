# PowerShell setup script for Readly App

# Install Python dependencies
pip install -r backend/requirements.txt

# Pull Ollama models
Get-Content ollama-models.txt | ForEach-Object { ollama pull $_ } 