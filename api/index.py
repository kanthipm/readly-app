"""
Vercel serverless function handler for FastAPI backend
"""
import sys
import os

# Add project root to Python path so "from backend.main" works
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from mangum import Mangum
from backend.main import app

# Create handler for Vercel
handler = Mangum(app, lifespan="off")

def lambda_handler(event, context):
    """Vercel serverless function entry point"""
    return handler(event, context)


