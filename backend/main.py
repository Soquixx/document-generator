from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from orchestrator import run_documentation_pipeline
from orchestrator import run_diff_updater_pipeline 
# 1. Initialize FastAPI Application
app = FastAPI(
    title="DocuAgent AI Engine",
    description="Production-grade automated technical documentation multi-agent server."
)

# 2. Configure CORS Middleware (Crucial Hackathon Linkage)
# Allows the Next.js frontend application to freely stream data from this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Define the Structured Input Request Model
class RepoRequest(BaseModel):
    repo_url: HttpUrl  # Natively validates that the incoming string is a real, well-formed URL

# 4. Expose the Core Generation Endpoint
@app.post("/api/generate-docs")
async def generate_documentation(payload: RepoRequest):
    """
    Primary API hook. Accepts a verified GitHub URL, triggers the CrewAI 
    orchestration pipeline, and returns the structural Pydantic JSON documentation.
    """
    # Cast the verified Pydantic URL object to a standard string for our git tools
    url_str = str(payload.repo_url)
    
    # Fire off the multi-agent execution loop
    result = run_documentation_pipeline(url_str)
    
    return result

class DiffRequest(BaseModel):
    current_docs: str
    raw_diff: str

@app.post("/api/update-docs-from-diff")
async def update_documentation_from_diff(payload: DiffRequest):
    """
    Accepts current documentation and a raw .diff string, updates the docs 
    in place using the CI agent, and returns the unified result.
    """
    result = run_diff_updater_pipeline(payload.current_docs, payload.raw_diff)
    return result