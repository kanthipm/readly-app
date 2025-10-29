# PowerShell setup script for Quista App

# Install Python dependencies
pip install -r backend/requirements.txt

# Pull Ollama models
Get-Content ollama-models.txt | ForEach-Object { ollama pull $_ } 