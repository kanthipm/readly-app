# Setting Up Gemini API for Quista

To enable real AI-powered knowledge map generation, you need to set up your Gemini API key.

## Steps:

1. **Get a Gemini API Key:**
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy your API key

2. **Set the Environment Variable:**

   **Windows (PowerShell):**
   ```powershell
   $env:GEMINI_API_KEY="your_api_key_here"
   ```

   **Windows (Command Prompt):**
   ```cmd
   set GEMINI_API_KEY=your_api_key_here
   ```

   **Linux/Mac:**
   ```bash
   export GEMINI_API_KEY="your_api_key_here"
   ```

3. **Or create a .env file** in the backend directory:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Restart the backend server** after setting the environment variable.

## Verification:

When the backend starts, you should see:
```
Gemini API is accessible
Server ready!
```

If you see:
```
WARNING: GEMINI_API_KEY not found. Using mock responses.
```

Then the API key is not set correctly.

## Cost Information:

- Gemini 1.5 Flash is free for development (generous free tier)
- For production, check current pricing at: https://ai.google.dev/pricing
- The app uses `gemini-1.5-flash` which is fast and cost-effective

## Troubleshooting:

- Make sure there are no spaces or quotes around the API key
- Restart the backend server after setting the variable
- Check that the variable is set: `echo $GEMINI_API_KEY` (Linux/Mac) or `echo %GEMINI_API_KEY%` (Windows)

