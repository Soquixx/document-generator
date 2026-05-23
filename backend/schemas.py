from pydantic import BaseModel, Field
from typing import List

class ArchitectureComponent(BaseModel):
    name: str = Field(..., description="The name of the module, class, or service component.")
    purpose: str = Field(..., description="A clear summary of what this specific component is responsible for.")

class TechnicalDocumentationSchema(BaseModel):
    """
    The structured output contract returned by the CrewAI workflow.
    Ensures that the documentation, architectural graphs, and pull request 
    artifacts align perfectly with the frontend data contracts.
    """
    project_title: str = Field(..., description="High-level, clean title for the repository.")
    executive_summary: str = Field(..., description="A 2-3 sentence overview explaining what this software does.")
    
    components: List[ArchitectureComponent] = Field(
        ..., description="A deep structural inventory breakdown of the core modules detected in the source code."
    )
    
    documentation_markdown: str = Field(
        ..., description="The primary technical documentation. Use headers, blockquotes, and Markdown formatting."
    )
    
    mermaid_graph: str = Field(
        ..., description="A perfectly formatted, valid Mermaid.js graph string (e.g., graph TD or sequenceDiagram) illustrating code execution flows."
    )
    
    pull_request_template: str = Field(
        ..., description="A highly professional GitHub Pull Request markdown text summary, including summary, scope of changes, and setup rules."
    )

class DiffUpdateSchema(BaseModel):
    """
    Ensures that when a code diff is analyzed, the agent returns the fully 
    mutated, updated documentation along with a precise summary of changes.
    """
    updated_documentation_markdown: str = Field(..., description="The entire technical documentation file, cleanly modified to reflect the new code changes from the diff.")
    change_summary_bullets: List[str] = Field(..., description="A direct list of bullet points detailing exactly what was updated in the documentation.")