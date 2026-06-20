"""
MoneyViya API — Vercel Serverless Handler
==========================================
Wraps the FastAPI app for Vercel Python runtime.
"""

import sys
import os

# Add project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the FastAPI app
from app import app

# Vercel expects a handler named 'app' or 'handler'
# FastAPI/Starlette apps are ASGI-compatible and work natively with Vercel
