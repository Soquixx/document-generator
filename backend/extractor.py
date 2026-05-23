import os
import shutil
import tempfile
import git

def extract_repository_context(repo_url: str) -> dict:
    """
    Clones a public GitHub repository deterministically, filters out non-code 
    clutter, and returns a compiled codebase text context along with file metadata.
    """
    # Create a unique temporary directory to host the cloned workspace safely
    temp_dir = tempfile.mkdtemp(prefix="docuagent_")
    
    try:
        # Perform a shallow clone (depth=1) to minimize downloading history logs
        git.Repo.clone_from(repo_url, temp_dir, depth=1)
        
        compiled_context = []
        file_tree_map = []
        
        # Extensions relevant to software analysis and technical documentation
        allowed_extensions = ('.ts', '.js', '.py', '.go', '.json', '.md', '.tsx', '.jsx', '.rs')
        # Standard build, environment, dependency, and configuration clutter to omit
        ignored_dirs = {'node_modules', '.git', 'dist', 'build', 'venv', '__pycache__', 'target', '.github'}
        
        for root, dirs, files in os.walk(temp_dir):
            # Prune ignored directories in-place so os.walk avoids entering them entirely
            dirs[:] = [d for d in dirs if d not in ignored_dirs]
            
            for file in files:
                if file.endswith(allowed_extensions):
                    full_path = os.path.join(root, file)
                    # Compute a clean relative path from the root of the repository
                    relative_path = os.path.relpath(full_path, temp_dir)
                    
                    file_tree_map.append(relative_path)
                    
                    try:
                        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                        
                        # Pack each file cleanly into an easily parsed visual separator for the AI
                        file_payload = f"--- START FILE: {relative_path} ---\n{content}\n--- END FILE: {relative_path} ---\n"
                        compiled_context.append(file_payload)
                    except Exception:
                        # Skip corrupted or unreadable files gracefully
                        continue
                        
        return {
            "success": True,
            "codebase_string": "\n".join(compiled_context),
            "file_tree": file_tree_map,
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "codebase_string": "",
            "file_tree": [],
            "error": str(e)
        }
        
    finally:
        # Clean up local system disk memory immediately after compiling context string
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)