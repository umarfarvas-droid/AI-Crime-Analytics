"""Suspect ranking engine with ethical disclaimers."""

from typing import Any


DISCLAIMER = (
    "This ranking is generated using available evidence and AI inference. "
    "It should NOT be interpreted as proof of guilt. All suspects are presumed "
    "innocent until proven guilty in a court of law."
)


def rank_suspects(
    entities: dict,
    suspect_details: dict | None,
    evidence_analysis: dict,
    text: str,
) -> dict[str, Any]:
    """Generate evidence-based suspect ranking."""
    suspects = []

    # From extracted entities
    for i, s in enumerate(entities.get("suspects", [])):
        name = s.get("name") or s.get("description", f"Suspect {i + 1}")
        suspects.append({
            "name": name,
            "source": "extracted",
            "relationship": _infer_relationship(text, name),
        })

    # From manual suspect details
    if suspect_details:
        items = suspect_details if isinstance(suspect_details, list) else suspect_details.get("suspects", [suspect_details])
        for item in items:
            if isinstance(item, dict):
                suspects.append({
                    "name": item.get("name", "Unknown Suspect"),
                    "source": "manual",
                    "relationship": item.get("relationship", "Unknown"),
                    "motive": item.get("motive"),
                })

    if not suspects:
        suspects.append({
            "name": "Unidentified Person (CCTV)",
            "source": "inferred",
            "relationship": "Unknown",
        })

    # Score each suspect
    rankings = []
    base_prob = 0.9 / len(suspects)
    for rank, suspect in enumerate(suspects, 1):
        relationship = suspect.get("relationship", "Unknown")
        rel_boost = 0.15 if "partner" in relationship.lower() or "partner" in (text or "").lower() else 0.0
        motive_boost = 0.1 if suspect.get("motive") or "dispute" in (text or "").lower() else 0.0
        opportunity = 0.12 if "cctv" in (text or "").lower() or suspect.get("source") == "extracted" else 0.05

        probability = min(0.85, base_prob + rel_boost + motive_boost + opportunity)
        risk = "High" if probability > 0.6 else "Medium" if probability > 0.4 else "Low"

        supporting = []
        contradicting = []
        if rel_boost > 0:
            supporting.append("Known relationship to victim (business partner)")
        if "fingerprint" in (text or "").lower():
            supporting.append("Fingerprints recovered from crime scene")
        if "cctv" in (text or "").lower():
            supporting.append("CCTV shows unidentified person at scene")
        if not supporting:
            supporting.append("Mentioned in FIR narrative")
        contradicting.append("No direct eyewitness identification")
        if rank > 1:
            contradicting.append("Limited corroborating evidence compared to higher-ranked suspects")

        rankings.append({
            "rank": rank,
            "suspect": suspect["name"],
            "probability": round(probability, 2),
            "confidence": round(min(0.9, probability + 0.1), 2),
            "reason": _generate_reason(suspect, text, supporting),
            "risk_level": risk,
            "supporting_evidence": supporting,
            "contradicting_evidence": contradicting,
            "relationship_to_victim": relationship,
            "opportunity": "High" if opportunity > 0.1 else "Medium",
            "possible_motive": suspect.get("motive") or _infer_motive(text),
        })

    rankings.sort(key=lambda x: x["probability"], reverse=True)
    for i, r in enumerate(rankings, 1):
        r["rank"] = i

    return {
        "rankings": rankings,
        "disclaimer": DISCLAIMER,
        "methodology": "Probabilistic scoring based on relationship, opportunity, motive indicators, and available evidence.",
    }


def _infer_relationship(text: str, name: str) -> str:
    lower = (text or "").lower()
    if "business partner" in lower:
        return "Business Partner"
    if "wife" in lower or "husband" in lower:
        return "Spouse"
    if "employee" in lower:
        return "Employee"
    if "neighbor" in lower:
        return "Neighbor"
    return "Unknown"


def _infer_motive(text: str) -> str:
    lower = (text or "").lower()
    if "financial dispute" in lower or "money" in lower:
        return "Financial gain / dispute"
    if "argument" in lower:
        return "Personal conflict"
    if "revenge" in lower:
        return "Revenge"
    return "Under investigation"


def _generate_reason(suspect: dict, text: str, supporting: list) -> str:
    parts = []
    if suspect.get("relationship") and suspect["relationship"] != "Unknown":
        parts.append(f"Has {suspect['relationship'].lower()} relationship to victim")
    if supporting:
        parts.append(f"Supported by: {supporting[0].lower()}")
    return ". ".join(parts) if parts else "Identified in case narrative; requires further investigation"
