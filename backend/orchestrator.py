import os
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, LLM
from extractor import extract_repository_context
from schemas import TechnicalDocumentationSchema
from schemas import DiffUpdateSchema 

# Load keys dynamically from .env file
load_dotenv()

# Initialize the LLM with production defaults (low temperature for deterministic technical outputs)
gemini_llm = LLM(
    model="gemini/gemini-2.5-flash",
    temperature=0.1,
    api_key=os.getenv("GEMINI_API_KEY")
)

def run_documentation_pipeline(repo_url: str) -> dict:
    """Executes the specialized multi-agent workflow to document raw repositories."""

    if not os.getenv("GEMINI_API_KEY") or "Placeholder" in os.getenv("GEMINI_API_KEY"):
        return {
            "success":False,
            "data":None,
            "error":"GEMINI_API_KEY is not set or is a placeholder. Please set it in your .env file from  valid Gemini API Key from Google AI Studio."
        }
    
    # Step 1: Extract code cleanly without wasting context tokens
    extraction = extract_repository_context(repo_url)
    if not extraction["success"]:
        return {"success": False, "error": f"Extraction failed: {extraction['error']}"}
        
    code_base = extraction["codebase_string"]
    
    # Step 2: Define Agents with minimal, highly targeted personas
    analyst = Agent(
        role="Principal Software Architect",
        goal="Deconstruct source code to map high-level architecture and processing flows.",
        backstory="You are a senior systems architect. You instantly spot system patterns, design flaws, and relationships between code modules.",
        llm=gemini_llm,
        verbose=True
    )

    writer = Agent(
        role="Lead Technical Documentation Writer",
        goal="Translate dense structural code maps into elegant, clear Markdown developer guides.",
        backstory="You are a clear-text developer advocate. You reject fluff and organize complex backend logic into scannable technical docs.",
        llm=gemini_llm,
        verbose=True
    )

    # Step 3: Define Pipeline Tasks passing raw code via string context interpolations
    analysis_task = Task(
        description=f"Analyze this raw codebase context:\n\n{code_base}\n\nIdentify the core modules, their unique purpose, and structural relationships.",
        expected_output="A structured architectural blueprint outlining the functional design of the application.",
        agent=analyst
    )

    documentation_task = Task(
        description="Compile the architectural insights into developer-ready reference manuals, a clean visual Mermaid graph layout, and a crisp GitHub PR template.",
        expected_output="An instance matching the TechnicalDocumentationSchema structure.",
        agent=writer,
        context=[analysis_task],
        output_json=TechnicalDocumentationSchema  # Forces CrewAI/Gemini to output perfect structural JSON
    )

    # Step 4: Assemble the Crew and fire it up
    crew = Crew(
        agents=[analyst, writer],
        tasks=[analysis_task, documentation_task],
        verbose=True
    )
    
    try:
        # Kickoff returns a CrewOutput instance; native JSON extraction avoids manual regex string splitting
        result = crew.kickoff()
        return {
            "success": True,
            "data": result.json_dict if hasattr(result, 'json_dict') else result.raw,
            "error": None
        }
    except Exception as e:
        return {"success": False, "data": None, "error": str(e)}

def run_diff_updater_pipeline(current_docs: str, raw_diff: str) -> dict:
    """Surgically updates existing documentation based on an incoming Git Diff string."""
    
    if not os.getenv("GEMINI_API_KEY") or "Placeholder" in os.getenv("GEMINI_API_KEY"):
        return {"success": False, "data": None, "error": "Missing Configuration: Please configure your Gemini API Key."}

    # Define our focused documentation updater agent
    updater = Agent(
        role="Continuous Integration Documentation Sync Agent",
        goal="Surgically mutate existing technical documentation to perfectly reflect incoming code changes.",
        backstory="You are an automated CI system tracking documentation accuracy. You read a Git Diff, spot structural changes, and update only the impacted sections of the markdown file without destroying unchanged text.",
        llm=gemini_llm,
        verbose=True
    )

    # Core task that handles the modification logic
    update_task = Task(
        description=(
            f"You are given the existing codebase documentation:\n\n{current_docs}\n\n"
            f"A developer just opened a PR with this raw Git Diff:\n\n{raw_diff}\n\n"
            "Analyze the changes in the diff. Update the documentation markdown file so it remains 100% accurate. "
            "Do not truncate or delete unrelated documentation chapters. Generate clear bullet points summarizing your updates."
        ),
        expected_output="An instance matching the DiffUpdateSchema structure.",
        agent=updater,
        output_json=DiffUpdateSchema
    )

    crew = Crew(agents=[updater], tasks=[update_task], verbose=True)
    
    try:
        result = crew.kickoff()
        return {
            "success": True,
            "data": result.json_dict if hasattr(result, 'json_dict') else result.raw,
            "error": None
        }
    except Exception as e:
        return {"success": False, "data": None, "error": str(e)}    