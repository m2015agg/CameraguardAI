import subprocess
import sys
import json
import os
from codex_logger import log_codex_task
from datetime import datetime

# Load env manually if not preloaded
from dotenv import load_dotenv
load_dotenv()

def run_codex(prompt: str, model="o4-mini"):
    cmd = ["codex", "-m", model, prompt]
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print("Codex error:", result.stderr)
        return

    output = result.stdout.strip()
    tokens_used = len(prompt.split()) + len(output.split())  # crude estimate

    # Optional summary compression
    summary = output.splitlines()[0][:150] if output else "No response"

    log_codex_task(
        prompt=prompt,
        command=" ".join(cmd),
        model=model,
        file_path="N/A",
        tokens=tokens_used,
        summary=summary
    )

    print("\n--- Codex Output ---\n")
    print(output)
    print("\n--- Logged to Supabase ---")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python codex_wrapper.py \"your prompt here\"")
        sys.exit(1)

    user_prompt = " ".join(sys.argv[1:])
    run_codex(user_prompt)
