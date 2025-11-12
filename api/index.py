"""
Vercel serverless function handler for FastAPI backend
"""
import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from mangum import Mangum
from backend.main import app

# Create handler for Vercel
handler = Mangum(app, lifespan="off")

def lambda_handler(event, context):
    """Vercel serverless function entry point"""
    return handler(event, context)

