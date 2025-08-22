#!/usr/bin/env python3
"""
Start script for LLOgen backend
"""

import os
import sys
import subprocess
from pathlib import Path

def install_requirements():
    """Install Python requirements"""
    print("Installing Python requirements...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)

def check_env_file():
    """Check if .env file exists"""
    env_file = Path(".env")
    if not env_file.exists():
        print("WARNING: .env file not found!")
        print("Please create a .env file based on .env.example")
        print("You need to add your GEMINI_API_KEY")
        print("\nExample .env content:")
        print("GEMINI_API_KEY=your_actual_gemini_api_key_here")
        print("SUPABASE_URL=your_supabase_url_here")
        print("SUPABASE_ANON_KEY=your_supabase_anon_key_here")
        return False
    return True

def start_server():
    """Start the FastAPI server"""
    print("Starting LLOgen backend server...")
    print("Server will be available at: http://localhost:8000")
    print("API docs will be available at: http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop the server")
    
    subprocess.run([
        sys.executable, "-m", "uvicorn", 
        "backend_llogen:app", 
        "--host", "0.0.0.0", 
        "--port", "8000", 
        "--reload"
    ])

def main():
    print("LLOgen Backend Startup")
    print("=" * 40)
    
    # Install requirements
    try:
        install_requirements()
    except subprocess.CalledProcessError:
        print("ERROR: Failed to install requirements")
        return 1
    
    # Check .env file
    if not check_env_file():
        return 1
    
    # Start server
    try:
        start_server()
    except KeyboardInterrupt:
        print("\nServer stopped")
        return 0
    except Exception as e:
        print(f"ERROR: Error starting server: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())