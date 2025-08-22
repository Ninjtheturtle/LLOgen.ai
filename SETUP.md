# LLOgen Setup Guide

This guide will help you set up the LLOgen web application for generating llms.txt files.

## Prerequisites

- **Python 3.8+** - For the backend API
- **Node.js 16+** - For the frontend React application  
- **Gemini API Key** - From Google AI Studio

## Quick Start

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" 
4. Create a new API key
5. Copy the API key (keep it secure!)

### 2. Backend Setup

1. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file** and add your API keys:
   ```
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **Start the backend server:**
   ```bash
   python start_backend.py
   ```
   
   The backend will be available at: `http://localhost:8000`
   API documentation at: `http://localhost:8000/docs`

### 3. Frontend Setup

1. **Install frontend dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The frontend will be available at: `http://localhost:5173`

## Usage

1. Open your browser to `http://localhost:5173`
2. Enter a website URL you want to analyze
3. Optionally configure advanced settings
4. Click "Generate llms.txt" 
5. Wait for the AI to analyze the website and generate the content
6. Download or copy the generated llms.txt file

## How It Works

1. **Web Scraping**: The backend crawls the specified website and extracts readable content
2. **Content Analysis**: Gemini AI analyzes the content to understand the organization
3. **llms.txt Generation**: AI generates a structured llms.txt file following best practices
4. **Download**: The generated file is displayed and can be downloaded

## API Endpoints

- `POST /generate` - Start llms.txt generation for a website
- `GET /status/{site_url}` - Check generation status
- `GET /result/{site_url}` - Get the generated content
- `GET /docs` - API documentation

## Configuration Options

- **Max Pages**: Limit how many pages to crawl (default: 50)
- **Language**: Target language for the output (auto-detect or specific)
- **Strict Mode**: Follow llms.txt format more strictly
- **Include Optional**: Add optional sections to the output
- **Whitelist Domains**: Only crawl specific domains

## Troubleshooting

### Backend Issues

- **"GEMINI_API_KEY not found"**: Make sure you created the .env file with your API key
- **Generation fails**: Check that the website is accessible and doesn't block crawlers
- **Import errors**: Run `pip install -r requirements.txt` to install dependencies

### Frontend Issues

- **Can't connect to backend**: Make sure the backend is running on port 8000
- **CORS errors**: The backend includes CORS headers for localhost development

## Production Deployment

For production deployment:

1. Set environment variables instead of using .env file
2. Use a production WSGI server like gunicorn
3. Set up proper domain names and SSL certificates
4. Configure database persistence (currently uses in-memory storage)
5. Add rate limiting and authentication as needed

## Dependencies

### Backend
- FastAPI - Web framework
- httpx - HTTP client for web scraping  
- trafilatura - Content extraction
- BeautifulSoup - HTML parsing
- google-generativeai - Gemini AI integration

### Frontend
- React + TypeScript
- Vite - Build tool
- Tailwind CSS - Styling
- shadcn/ui - UI components
- Supabase - Database (optional)