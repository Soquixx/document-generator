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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "https://docuagent-wine.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def root():
    return {"message": "DocuAgent backend running successfully"}


@app.get("/health")
def health():
    return {"status": "healthy"}
# 3. Define the Structured Input Request Models
class RepoRequest(BaseModel):
    repo_url: HttpUrl  # Natively validates that the incoming string is a real, well-formed URL

class DiffRequest(BaseModel):
    current_docs: str
    raw_diff: str

# 4. Expose the Core Generation Endpoint (REMOVED 'async' keyword)
@app.post("/api/generate-docs")
def generate_documentation(payload: RepoRequest):
    """
    Primary API hook. Accepts a verified GitHub URL, triggers the CrewAI 
    orchestration pipeline, and returns the structural Pydantic JSON documentation.
    """
    # Cast the verified Pydantic URL object to a standard string for our git tools
    url_str = str(payload.repo_url)
    
    # Fire off the multi-agent execution loop safely in a background thread
    result = run_documentation_pipeline(url_str)
    
    return result

# 5. Expose the Patch/Diff Update Endpoint (REMOVED 'async' keyword)
@app.post("/api/update-docs-from-diff")
def update_documentation_from_diff(payload: DiffRequest):
    """
    Accepts current documentation and a raw .diff string, updates the docs 
    in place using the CI agent, and returns the unified result.
    """
    result = run_diff_updater_pipeline(payload.current_docs, payload.raw_diff)
    return result
