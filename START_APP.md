# Starting the App

Follow these steps to start both the backend and frontend servers.

## Step 1: Start Backend Server

Open a terminal in the project root and run:

```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 5000 --reload
```

You should see:
```
Gemini API key loaded successfully
Initialized with model: gemini-2.0-flash
Starting FastAPI server...
Checking Gemini API status...
Successfully connected to Gemini API using model: gemini-2.0-flash
Gemini API is accessible
Server ready!
INFO:     Uvicorn running on http://127.0.0.1:5000
```

## Step 2: Start Frontend Server

Open a **second** terminal in the project root and run:

```powershell
npm run dev
```

You should see:
```
- Local:        http://localhost:3000
```

## Step 3: Open the App

Navigate to: **http://localhost:3000**

## Troubleshooting

### Backend won't start
- Make sure `backend/.env` exists and has `GEMINI_API_KEY=your_key_here`
- If not set, run: `cd backend; python ensure_env.py --api-key YOUR_KEY`

### Port already in use
- Backend uses port 5000 - make sure nothing else is using it
- Frontend uses port 3000 - make sure nothing else is using it

### Import errors
- Make sure you're in the **project root** when running commands
- The backend must be started with: `python -m uvicorn backend.main:app ...`


