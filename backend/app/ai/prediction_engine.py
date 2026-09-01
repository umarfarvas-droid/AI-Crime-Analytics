"""Timeline and investigation prediction engines."""

from typing import Any
from datetime import datetime, timedelta


def _parse_date(value: datetime | str | None) -> datetime | None:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str) and value:
        for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%SZ"):
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
    return None


def generate_timeline(
    text: str,
    entities: dict,
    incident_date: datetime | str | None = None,
) -> dict[str, Any]:
    """Generate investigation timeline events."""
    parsed_date = _parse_date(incident_date)
    base_time = parsed_date or datetime.now()
    events = []

    event_templates = [
        ("planning", "Pre-incident activity / Planning phase", -120, "inferred"),
        ("victim_movement", "Victim arrived at location", -30, "inferred"),
        ("suspect_movement", "Unidentified person entered building (CCTV)", -5, "extracted" if "cctv" in (text or "").lower() else "inferred"),
        ("witness_observation", "Witness heard argument nearby", -2, "extracted" if "witness" in (text or "").lower() else "inferred"),
        ("crime_occurrence", "Crime occurred — victim found deceased", 0, "extracted"),
        ("escape_route", "Suspect fled scene (inferred from CCTV)", 5, "inferred"),
        ("police_notification", "Police notified / FIR registered", 30, "inferred"),
        ("evidence_collection", "Evidence collection initiated (fingerprints, CCTV)", 60, "extracted" if "fingerprint" in (text or "").lower() else "inferred"),
        ("investigation_progress", "Investigation ongoing — suspect identification pending", 120, "inferred"),
    ]

    for event_type, description, offset_min, source in event_templates:
        events.append({
            "id": event_type,
            "type": event_type,
            "title": description.split("—")[0].strip() if "—" in description else description[:50],
            "description": description,
            "timestamp": (base_time + timedelta(minutes=offset_min)).isoformat(),
            "source": source,
            "confidence": 0.85 if source == "extracted" else 0.55,
        })

    return {"events": events, "total_events": len(events)}


def generate_predictions(
    text: str,
    entities: dict,
    evidence_analysis: dict,
    crime_category: str,
    suspect_rankings: dict,
) -> dict[str, Any]:
    """Predict investigation outcomes and next steps."""
    missing_count = len(evidence_analysis.get("missing_evidence", []))
    evidence_strength = evidence_analysis.get("overall_strength", 0.5)
    suspect_count = len(suspect_rankings.get("rankings", []))

    solvability = min(95, max(20, int(
        40 + evidence_strength * 30 + (10 if suspect_count > 0 else 0) - missing_count * 5
    )))

    complexity_map = {range(70, 101): "Low", range(45, 70): "Medium", range(0, 45): "High"}
    complexity = next(v for k, v in complexity_map.items() if solvability in k)

    top_suspect = suspect_rankings.get("rankings", [{}])[0].get("suspect", "Unknown") if suspect_rankings.get("rankings") else "Unknown"

    return {
        "likely_motive": _predict_motive(text, crime_category),
        "likely_suspect": top_suspect,
        "likely_sequence": [
            "Pre-incident dispute or planning",
            "Suspect gained access to location",
            "Crime committed during victim's presence",
            "Suspect fled via unknown route",
            "Evidence left at scene (fingerprints/CCTV)",
        ],
        "possible_escape_route": "Unknown — CCTV analysis recommended to trace exit path",
        "missing_investigation_steps": _missing_steps(evidence_analysis),
        "next_recommended_actions": _next_actions(evidence_analysis, entities),
        "investigation_complexity": complexity,
        "solvability_percentage": solvability,
        "expected_duration_days": _estimate_duration(complexity, solvability),
        "possible_legal_charges": _legal_charges(crime_category),
        "confidence_score": round(0.5 + evidence_strength * 0.3, 2),
        "disclaimer": "Predictions are investigative hypotheses only. Not legal conclusions.",
    }


def generate_recommendations(
    evidence_analysis: dict,
    entities: dict,
    predictions: dict,
) -> dict[str, Any]:
    """Prioritized investigation recommendations."""
    recs = []
    priority = 1

    for missing in evidence_analysis.get("missing_evidence", []):
        ev_type = missing["type"]
        action_map = {
            "CCTV": "Recover and analyze CCTV footage from surrounding areas",
            "DNA": "Collect DNA samples from crime scene and suspects",
            "Fingerprints": "Submit fingerprints to AFIS database for matching",
            "Mobile Phones": "Analyze phone records and tower location data",
            "Financial Transactions": "Check bank transactions of persons of interest",
        }
        recs.append({
            "priority": priority,
            "action": action_map.get(ev_type, f"Collect and analyze {ev_type} evidence"),
            "importance": missing.get("importance", "medium"),
            "category": "evidence_collection",
        })
        priority += 1

    standard_recs = [
        ("Interview witnesses identified in FIR", "high", "interview"),
        ("Cross-reference suspect alibis with CCTV timestamps", "high", "investigation"),
        ("Perform forensic examination of recovered weapons", "high", "forensic"),
        ("Analyze phone records of business partner", "medium", "digital_forensics"),
        ("Obtain search warrant if probable cause established", "medium", "legal"),
        ("Track vehicle movement near crime location", "medium", "surveillance"),
        ("Perform financial audit of victim's business accounts", "medium", "financial"),
    ]

    for action, importance, category in standard_recs:
        if priority <= 10:
            recs.append({"priority": priority, "action": action, "importance": importance, "category": category})
            priority += 1

    return {"recommendations": recs, "total": len(recs)}


def _predict_motive(text: str, category: str) -> str:
    lower = (text or "").lower()
    if "financial dispute" in lower:
        return "Financial dispute with business associate (high confidence hypothesis)"
    if category == "Murder":
        return "Personal or financial conflict leading to homicide"
    return f"Motive under investigation — consistent with {category} patterns"


def _missing_steps(evidence: dict) -> list[str]:
    steps = []
    for m in evidence.get("missing_evidence", []):
        steps.append(f"Collect {m['type']} evidence")
    if not steps:
        steps.append("Complete forensic analysis of existing evidence")
    return steps


def _next_actions(evidence: dict, entities: dict) -> list[str]:
    actions = ["Review CCTV footage for suspect identification"]
    if entities.get("witnesses"):
        actions.append("Interview witnesses listed in FIR")
    if entities.get("suspects"):
        actions.append("Question persons of interest")
    actions.append("Submit fingerprints for database matching")
    return actions[:5]


def _estimate_duration(complexity: str, solvability: int) -> str:
    durations = {"Low": "2-4 weeks", "Medium": "1-3 months", "High": "3-6 months"}
    return durations.get(complexity, "1-3 months")


def _legal_charges(category: str) -> list[str]:
    charges = {
        "Murder": ["IPC 302 / Murder", "IPC 201 / Causing disappearance of evidence"],
        "Robbery": ["IPC 392 / Robbery", "IPC 397 / Robbery with attempt to cause death"],
        "Fraud": ["IPC 420 / Cheating", "IPC 468 / Forgery"],
        "Assault": ["IPC 323 / Voluntarily causing hurt", "IPC 325 / Grievous hurt"],
    }
    return charges.get(category, [f"Charges per {category} applicable statutes — consult legal counsel"])
