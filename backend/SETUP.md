# Backend Setup Guide

This guide helps you set up the backend so it works automatically every time you open the project.

## Quick Start

### 1. Set Your Gemini API Key (One Time)

Run this command from the project root:

```powershell
# Windows PowerShell
python -m backend.ensure_env --api-key YOUR_API_KEY_HERE

# Or from backend directory
cd backend
python ensure_env.py --api-key YOUR_API_KEY_HERE
```

**Or** manually create/edit `backend/.env` file:

```
GEMINI_API_KEY=your_api_key_here
```

### 2. Start the Backend Server

From the project root:

```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 5000 --reload
```

**Or** use the convenience script:

```powershell
cd backend
python start_server.py
```

## What Gets Set Up Automatically

1. **`.env` file creation**: If missing, it's created automatically
2. **Model detection**: The system automatically finds and uses a working Gemini model
3. **Model persistence**: The working model name is saved to `.env` so it works next time
4. **Error messages**: Clear instructions if something goes wrong

## Troubleshooting

### "GEMINI_API_KEY not found"

1. Make sure `backend/.env` exists and contains:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

2. Restart the server after setting the API key

3. Verify the API key is correct (no extra spaces or quotes)

### "Model not found" errors

The system will automatically try different models and save the working one. If you see model errors:

1. Check `backend/.env` - the `GEMINI_MODEL` line should have a working model
2. The system tries these models in order:
   - gemini-2.0-flash (default)
   - gemini-2.5-flash
   - gemini-2.0-flash-001
   - gemini-2.5-pro
   - gemini-pro-latest

### Server won't start

1. Make sure you're in the project root when running:
   ```powershell
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 5000 --reload
   ```

2. Check that Python dependencies are installed:
   ```powershell
   pip install -r requirements.txt
   ```

## Getting Your API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and set it using the commands above

## Files Created/Modified

- `backend/.env` - Your API key and model preferences (auto-created, git-ignored)
- The system automatically updates `GEMINI_MODEL` in `.env` when it finds a working model

Once set up, you should never need to fix Gemini issues again! The system remembers your working configuration.


