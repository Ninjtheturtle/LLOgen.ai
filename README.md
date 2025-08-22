
# LLOgen: Web LLM Optimizer

LLOgen is a full-stack application for generating standards-compliant `llms.txt` files to optimize Large Language Model (LLM) interactions with websites. It provides a user-friendly interface for site owners and developers to create, validate, and download LLM-friendly metadata for their web properties.

## Features
- **Frontend:**
  - Built with React, Vite, TypeScript, Tailwind CSS, and shadcn-ui components.
  - Interactive form for submitting website URLs and custom options.
  - Stepper UI for visualizing the generation process.
  - Markdown rendering for generated `llms.txt` output.
  - Download, copy, and history management for generated files.
- **Backend:**
  - FastAPI service for crawling, extracting, and summarizing website content.
  - Uses `httpx` for async HTTP requests and `trafilatura`/BeautifulSoup for text extraction.
  - Integrates with Gemini API for LLM-powered summarization and formatting.
  - Loads secrets from `.env` (using `python-dotenv`).
  - CORS enabled for local development.
- **Database:**
  - Supabase integration for storing run history and artifacts (optional).

## How It Works
1. **User submits a website URL and options.**
2. **Backend crawls and extracts readable content from the site.**
3. **Content is summarized and formatted via Gemini API.**
4. **Frontend displays the generated `llms.txt` in Markdown, with options to download or copy.**
5. **Run history and artifacts are stored in Supabase for later retrieval.**

## Tech Stack
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn-ui
- **Backend:** FastAPI, httpx, trafilatura, BeautifulSoup, python-dotenv
- **Database:** Supabase
- **LLM Integration:** Gemini API
