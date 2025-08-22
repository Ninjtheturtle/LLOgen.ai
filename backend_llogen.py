"""
LLOgen Backend - FastAPI service for generating llms.txt files
"""

import os
import json
import logging
from typing import Optional, Dict, Any, List
from urllib.parse import urljoin, urlparse
import asyncio
from datetime import datetime

import httpx
import trafilatura
from bs4 import BeautifulSoup
import google.generativeai as genai
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not found in environment variables")
else:
    genai.configure(api_key=GEMINI_API_KEY)

# FastAPI app
app = FastAPI(title="LLOgen API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Must be False when using allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class GeneratorRequest(BaseModel):
    siteUrl: HttpUrl
    extras: str = ""
    maxPages: int = 50
    language: str = "auto"
    strictMode: bool = True
    includeOptional: bool = True
    whitelistDomains: str = ""

class GenerationResponse(BaseModel):
    content: str
    siteUrl: str
    timestamp: str

class GenerationStatus(BaseModel):
    status: str
    step: str
    progress: int
    message: str = ""

# In-memory storage for generation status (in production, use Redis or database)
generation_status = {}

class WebScraper:
    """Web scraping utility class"""
    
    def __init__(self, max_pages: int = 50, timeout: int = 10):
        self.max_pages = max_pages
        self.timeout = timeout
        self.session = None
    
    async def __aenter__(self):
        self.session = httpx.AsyncClient(timeout=self.timeout)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.aclose()
    
    async def get_page_content(self, url: str) -> Optional[str]:
        """Fetch and extract content from a single page"""
        try:
            logger.info(f"Fetching: {url}")
            response = await self.session.get(url, follow_redirects=True)
            response.raise_for_status()
            
            # Use trafilatura for content extraction
            content = trafilatura.extract(response.text, include_comments=False, include_tables=True)
            return content
        except Exception as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            return None
    
    async def discover_pages(self, base_url: str, whitelist_domains: List[str] = None) -> List[str]:
        """Discover pages to crawl from the website"""
        pages = set([base_url])  # Always include the base URL
        
        try:
            response = await self.session.get(base_url, follow_redirects=True)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            base_domain = urlparse(base_url).netloc
            
            # Find all links
            for link in soup.find_all('a', href=True):
                href = link['href'].strip()
                if not href:
                    continue
                    
                full_url = urljoin(base_url, href)
                parsed = urlparse(full_url)
                
                # Filter by domain and file types
                if (parsed.netloc == base_domain or 
                    (whitelist_domains and parsed.netloc in whitelist_domains) or 
                    parsed.netloc == ''):  # Relative URLs
                    
                    # Skip anchors, files, and certain paths
                    if (not parsed.fragment and 
                        not parsed.path.endswith(('.pdf', '.jpg', '.png', '.gif', '.css', '.js', '.xml', '.json')) and
                        not parsed.path.startswith(('/api/', '/admin/', '/_'))):
                        pages.add(full_url)
            
            # Limit to max_pages but ensure we have at least the base page
            pages_list = list(pages)[:self.max_pages]
            logger.info(f"Discovered {len(pages_list)} pages to crawl")
            return pages_list
            
        except Exception as e:
            logger.error(f"Error discovering pages from {base_url}: {str(e)}")
            return [base_url]  # Fallback to just the main page
    
    async def scrape_website(self, base_url: str, whitelist_domains: List[str] = None) -> Dict[str, Any]:
        """Scrape entire website and return structured content"""
        update_status(base_url, "running", "discover", 10, "Discovering pages...")
        
        # Discover pages
        pages = await self.discover_pages(base_url, whitelist_domains)
        
        update_status(base_url, "running", "extract", 30, f"Extracting content from {len(pages)} pages...")
        
        # Extract content from all pages
        site_content = {
            "base_url": base_url,
            "pages": [],
            "total_pages": len(pages),
            "extracted_at": datetime.now().isoformat()
        }
        
        # Process pages concurrently (with semaphore to limit concurrent requests)
        semaphore = asyncio.Semaphore(5)  # Limit to 5 concurrent requests
        
        async def process_page(url):
            async with semaphore:
                content = await self.get_page_content(url)
                if content:
                    return {
                        "url": url,
                        "content": content,
                        "word_count": len(content.split()) if content else 0
                    }
                return None
        
        tasks = [process_page(url) for url in pages]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter successful results
        for result in results:
            if isinstance(result, dict) and result:
                site_content["pages"].append(result)
        
        # If no pages were extracted, add a minimal entry for the base page
        if not site_content["pages"]:
            logger.warning("No content extracted, adding minimal base page entry")
            site_content["pages"].append({
                "url": base_url,
                "content": f"Website: {base_url}\nNo content could be extracted from this website.",
                "word_count": 10
            })
        
        logger.info(f"Successfully extracted content from {len(site_content['pages'])} pages")
        return site_content

class LLMSGenerator:
    """Generate llms.txt using Gemini AI"""
    
    def __init__(self):
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not configured")
        self.model = genai.GenerativeModel('gemini-1.5-flash')
    
    def create_prompt(self, site_content: Dict[str, Any], config: GeneratorRequest) -> str:
        """Create the prompt for Gemini AI"""
        
        # Combine all page content
        all_content = []
        for page in site_content["pages"]:
            all_content.append(f"=== PAGE: {page['url']} ===\n{page['content']}\n")
        
        combined_content = "\n".join(all_content)
        
        # Truncate if too long (Gemini has token limits)
        if len(combined_content) > 100000:  # Rough character limit
            combined_content = combined_content[:100000] + "\n[CONTENT TRUNCATED]"
        
        prompt = f"""You are an expert web content analyzer tasked with generating a standards-compliant llms.txt file for a website. The llms.txt format is designed to help Large Language Models understand and interact with websites more effectively.

**Input Data:**
- Primary URL: {site_content['base_url']}
- Total Pages Analyzed: {site_content['total_pages']}
- Language: {config.language}
- Strict Mode: {config.strictMode}
- Include Optional Sections: {config.includeOptional}
- Custom Context: {config.extras}

**Website Content:**
{combined_content}

**Instructions:**
Generate a comprehensive llms.txt file following this exact structure:

# Company/Organization Name

> Brief, compelling description of what this organization does

## Overview
[2-3 paragraph overview of the organization, its mission, and core offerings]

## Products & Services
[Detailed breakdown of main products, services, or offerings]

## Key Information
- **Founded**: [Year if available]
- **Industry**: [Primary industry/sector]
- **Location**: [Headquarters/primary location]
- **Website**: [Primary website URL]
- **Size**: [Company size if determinable]

## Target Audience
[Who this organization serves, their primary customer base]

## Unique Value Proposition
[What makes this organization distinctive, competitive advantages]

## Recent Developments
[Recent news, updates, or significant developments if available]

## Contact & Social
- Website: [URL]
- [Any social media or contact information found]

## Technical Details
[For technical companies: key technologies, platforms, APIs]

## Use Cases for LLMs
[Specific scenarios where an LLM might need to reference this organization]

**Requirements:**
- Only include information that can be verified from the provided content
- Be comprehensive but concise
- Use business-appropriate language
- If the website is e-commerce, focus on products and shopping experience
- If it's SaaS, emphasize features and target users
- If it's a portfolio site, highlight skills and experience
- Generate content in {config.language} (if not "auto", translate accordingly)
- DO NOT include placeholder text like "TODO" or "[CONTENT TO BE ADDED]"

Generate ONLY the llms.txt content in plain text format without any explanations or metadata."""

        return prompt
    
    async def generate_llms_txt(self, site_content: Dict[str, Any], config: GeneratorRequest) -> str:
        """Generate llms.txt content using Gemini AI"""
        try:
            update_status(config.siteUrl, "running", "summarize", 60, "Analyzing content with Gemini AI...")
            
            prompt = self.create_prompt(site_content, config)
            
            # Generate content with Gemini
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=4000,
                )
            )
            
            if not response.text:
                raise Exception("Gemini AI returned empty response")
            
            update_status(config.siteUrl, "running", "compose", 80, "Composing final llms.txt...")
            
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"Error generating llms.txt: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to generate llms.txt: {str(e)}")

def update_status(site_url: str, status: str, step: str, progress: int, message: str = ""):
    """Update generation status"""
    generation_status[site_url] = {
        "status": status,
        "step": step,
        "progress": progress,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }

async def generate_llms_background(config: GeneratorRequest):
    """Background task to generate llms.txt"""
    site_url = str(config.siteUrl)
    
    try:
        update_status(site_url, "running", "start", 0, "Starting generation...")
        
        # Parse whitelist domains
        whitelist_domains = []
        if config.whitelistDomains:
            whitelist_domains = [d.strip() for d in config.whitelistDomains.split(",")]
        
        # Scrape website
        async with WebScraper(max_pages=config.maxPages) as scraper:
            site_content = await scraper.scrape_website(site_url, whitelist_domains)
        
        # Generate llms.txt
        generator = LLMSGenerator()
        llms_content = await generator.generate_llms_txt(site_content, config)
        
        update_status(site_url, "running", "validate", 90, "Validating output...")
        
        # Simple validation
        if len(llms_content.strip()) < 100:
            raise Exception("Generated content is too short")
        
        # Store result
        generation_status[site_url].update({
            "status": "completed",
            "step": "done",
            "progress": 100,
            "message": "Generation completed successfully",
            "content": llms_content
        })
        
        logger.info(f"Successfully generated llms.txt for {site_url}")
        
    except Exception as e:
        logger.error(f"Error in background generation for {site_url}: {str(e)}")
        update_status(site_url, "error", "error", 0, str(e))

# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "LLOgen API is running", "version": "1.0.0"}

@app.options("/{full_path:path}")
async def options_handler(request: Request, response: Response):
    """Handle all OPTIONS requests for CORS preflight"""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Max-Age"] = "86400"
    return {"status": "ok"}


@app.post("/generate", response_model=dict)
async def start_generation(config: GeneratorRequest, background_tasks: BackgroundTasks):
    """Start llms.txt generation process"""
    site_url = str(config.siteUrl)
    
    # Check if generation is already running
    if site_url in generation_status and generation_status[site_url]["status"] == "running":
        return {"message": "Generation already in progress", "site_url": site_url}
    
    # Start background task
    background_tasks.add_task(generate_llms_background, config)
    
    update_status(site_url, "running", "start", 0, "Generation started")
    
    return {
        "message": "Generation started",
        "site_url": site_url,
        "status_endpoint": f"/status/{site_url}"
    }

@app.get("/status/{site_url:path}", response_model=GenerationStatus)
async def get_generation_status(site_url: str):
    """Get generation status for a specific URL"""
    if site_url not in generation_status:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    status = generation_status[site_url]
    return GenerationStatus(**status)

@app.get("/result/{site_url:path}", response_model=GenerationResponse)
async def get_generation_result(site_url: str):
    """Get the generated llms.txt content"""
    if site_url not in generation_status:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    status = generation_status[site_url]
    
    if status["status"] != "completed":
        raise HTTPException(status_code=400, detail="Generation not completed yet")
    
    if "content" not in status:
        raise HTTPException(status_code=500, detail="Generated content not found")
    
    return GenerationResponse(
        content=status["content"],
        siteUrl=site_url,
        timestamp=status["timestamp"]
    )

@app.delete("/generation/{site_url:path}")
async def cancel_generation(site_url: str):
    """Cancel or clean up generation for a URL"""
    if site_url in generation_status:
        del generation_status[site_url]
        return {"message": "Generation cancelled/cleaned up", "site_url": site_url}
    
    raise HTTPException(status_code=404, detail="Generation not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)