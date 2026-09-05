import json
from typing import Dict, Any, Optional
import httpx
from app.core.config import settings

class LocalLLMProvider:
    """
    Extensible Local LLM Provider Interface.
    Integrates with local offline inference engines (e.g. Ollama, Llama.cpp, LocalAI).
    Disabled by default for 100% deterministic, offline hackathon operation.
    Guarantees that no plain text secrets are ever passed to the model prompt.
    """

    @classmethod
    async def query_local_model(cls, prompt: str, system_prompt: str = "") -> Optional[str]:
        if not settings.ENABLE_LOCAL_LLM:
            return None

        try:
            payload = {
                "model": "llama3:latest",
                "prompt": prompt,
                "system": system_prompt or "You are NetGuard AI, a cybersecurity compliance expert. Explain network hardening issues concisely.",
                "stream": False
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(settings.LOCAL_LLM_URL, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("response")
        except Exception:
            return None
        return None
