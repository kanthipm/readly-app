# Vercel Deployment Guide

This guide will help you deploy your Quista application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. GitHub account (if deploying from Git repository)
3. Gemini API key (for AI features)

## Deployment Steps

### 1. Prepare Your Repository

Make sure all changes are committed and pushed to your Git repository.

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will automatically detect Next.js

### 3. Configure Environment Variables

In the Vercel project settings, add the following environment variables:

#### Required Variables:

- `GEMINI_API_KEY` - Your Google Gemini API key (required for AI features)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins (e.g., `https://your-app.vercel.app,http://localhost:3000`)

#### Optional Variables:

- `NEXT_PUBLIC_API_URL` - Leave empty to use same-origin API calls (recommended for Vercel serverless functions)
- `MAX_CHUNKS` - Maximum number of chunks to process (default: 3)
- `MAX_TOKENS_PER_CHUNK` - Maximum tokens per chunk (default: 1500)
- `MAX_RETRIES` - Maximum retry attempts (default: 3)

### 4. Configure Build Settings

Vercel should automatically detect:
- **Framework Preset**: Next.js
- **Root Directory**: `.` (root)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### 5. Deploy

Click "Deploy" and wait for the build to complete.

## Important Notes

### Backend API

The FastAPI backend is configured to run as Vercel serverless functions. The API routes are accessible at:
- `/api/v1/upload` - Upload PDF files
- `/api/v1/process-text` - Process text content
- `/api/v1/generate-questions` - Generate quiz questions
- `/api/v1/configure-map` - Configure knowledge maps
- `/api/v1/health` - Health check

### Limitations

1. **Function Timeout**: Serverless functions have a maximum execution time of 60 seconds (Pro plan) or 10 seconds (Hobby plan). For long-running AI operations, consider upgrading to Pro.

2. **File Size Limits**: Vercel has limits on request/response sizes. Large PDF files may need to be handled differently.

3. **Ollama**: The local Ollama service cannot be used on Vercel. You must use the Gemini API instead. Make sure `GEMINI_API_KEY` is set.

### Troubleshooting

#### Build Fails

- Check that all dependencies are listed in `package.json` and `api/requirements.txt`
- Ensure Python 3.11 is specified in `vercel.json`

#### API Calls Fail

- Verify `GEMINI_API_KEY` is set correctly
- Check CORS settings in `ALLOWED_ORIGINS`
- Review Vercel function logs in the dashboard

#### Timeout Errors

- Upgrade to Vercel Pro plan for 60-second timeouts
- Optimize AI processing to complete faster
- Consider breaking large operations into smaller chunks

## Alternative: Separate Backend Deployment

If you prefer to deploy the backend separately (e.g., on Railway, Render, or Fly.io):

1. Deploy the backend to your chosen platform
2. Set `NEXT_PUBLIC_API_URL` in Vercel to your backend URL
3. Update `ALLOWED_ORIGINS` in your backend to include your Vercel frontend URL

## Post-Deployment

After deployment:

1. Test all features (upload, text processing, quiz generation)
2. Monitor function logs in Vercel dashboard
3. Check API response times
4. Verify CORS is working correctly

## Support

For issues specific to:
- **Vercel**: Check [Vercel Documentation](https://vercel.com/docs)
- **Next.js**: Check [Next.js Documentation](https://nextjs.org/docs)
- **FastAPI**: Check [FastAPI Documentation](https://fastapi.tiangolo.com)

