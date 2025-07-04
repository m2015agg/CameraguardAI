from datetime import datetime
import os
from supabase import create_client, Client

def log_codex_task(
    prompt: str,
    command: str,
    model: str,
    file_path: str,
    tokens: int,
    summary: str,
    status: str = "completed"
):
    SUPABASE_URL = os.getenv("SUPABASE_URL") or f"http://{os.getenv('DB_HOST', 'localhost')}:54321"
    SERVICE_ROLE_KEY = os.getenv("SERVICE_ROLE_KEY")

    supabase: Client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    result = supabase.table("tasks").insert({
        "prompt": prompt,
        "command": command,
        "model_used": model,
        "file_path": file_path,
        "token_count": tokens,
        "cost_estimate": round(tokens * 0.000006, 5),  # o4-mini Flex estimate
        "response_summary": summary,
        "task_status": status,
        "created_at": datetime.utcnow().isoformat()
    }).execute()
    return result
