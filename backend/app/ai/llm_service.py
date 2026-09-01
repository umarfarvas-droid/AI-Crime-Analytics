"""AI service abstraction for optional LLM enrichment."""

import json
from typing import Any

from app.core.config import settings


def _get_openai_client() -> Any | None:
    if not settings.openai_api_key:
        return None

    try:
        import openai
    except ImportError:
        return None

    openai.api_key = settings.openai_api_key
    return openai


async def enrich_analysis_with_llm(text: str, baseline: dict[str, Any]) -> dict[str, Any]:
    """Optionally enrich local analysis with an LLM API.

    If OpenAI is unavailable or not configured, this gracefully returns an empty dict.
    """
    openai = _get_openai_client()
    if not openai:
        return {}

    prompt = (
        "You are an investigative assistant."
        " Analyze the following crime description and return valid JSON with keys:"
        " case_summary, possible_motives."
        " Do not invent details. Keep the values concise."
        "\n\nText:\n" + text
    )

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a careful AI crime analysis assistant."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.35,
            max_tokens=300,
        )
        content = response.choices[0].message["content"]
        return json.loads(content)
    except Exception:
        return {}
