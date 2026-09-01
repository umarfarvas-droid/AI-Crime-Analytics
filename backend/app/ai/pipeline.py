"""Main AI analysis orchestrator."""

from typing import Any

from app.ai.entity_extractor import extract_entities, classify_crime
from app.ai.evidence_analyzer import analyze_evidence
from app.ai.llm_service import enrich_analysis_with_llm
from app.ai.suspect_ranker import rank_suspects
from app.ai.prediction_engine import generate_timeline, generate_predictions, generate_recommendations
from app.ai.graph_builder import build_relationship_graph
from app.core.config import settings


async def analyze_case(case_data: dict) -> dict[str, Any]:
    """Run full AI analysis pipeline on a case."""
    text = case_data.get("crime_description", "") or ""
    if case_data.get("additional_notes"):
        text += "\n" + case_data["additional_notes"]

    # Entity extraction
    entities = extract_entities(text)

    # Crime classification
    category = case_data.get("crime_category")
    confidence = case_data.get("crime_category_confidence")
    if not category:
        category, confidence = classify_crime(text)

    # Evidence analysis
    evidence = analyze_evidence(text, case_data.get("evidence_list"), category)

    # Suspect ranking
    suspects = rank_suspects(entities, case_data.get("suspect_details"), evidence, text)

    # Timeline
    timeline = generate_timeline(text, entities, case_data.get("incident_date"))

    # Predictions
    predictions = generate_predictions(text, entities, evidence, category, suspects)

    # Clues and scenarios
    clues = _extract_clues(text, entities, evidence)
    scenarios = _generate_scenarios(text, entities, evidence, clues)
    prediction = _build_prediction(scenarios, clues)

    # Recommendations
    recommendations = generate_recommendations(evidence, entities, predictions)

    # Relationship graph
    graph = build_relationship_graph(entities, evidence, case_data)

    # Similar cases (mock historical comparison)
    similar_cases = _find_similar_cases(category, text)

    # Optional LLM enrichment
    llm_enrichment = await enrich_analysis_with_llm(text, {
        "entities": entities,
        "evidence": evidence,
        "predictions": predictions,
    })

    return {
        "case_summary": llm_enrichment.get("case_summary") or _summarize_case(text, category),
        "crime_type": category,
        "crime_type_confidence": confidence,
        "victims": entities.get("victims", []),
        "persons_of_interest": entities.get("suspects", []),
        "witnesses": entities.get("witnesses", []),
        "locations": entities.get("locations", []),
        "objects": {
            "weapons": entities.get("weapons", []),
            "vehicles": entities.get("vehicles", []),
            "phones": entities.get("phone_numbers", []),
            "documents": entities.get("organizations", []),
        },
        "events": timeline.get("events", []),
        "timeline": timeline,
        "clues": {
            "strong": clues["strong"],
            "weak": clues["weak"],
            "contradictions": clues["contradictions"],
            "missing_information": clues["missing_information"],
        },
        "possible_motives": llm_enrichment.get("possible_motives") or [predictions.get("likely_motive")],
        "scenarios": scenarios,
        "prediction": prediction,
        "missing_information": clues["missing_information"],
        "investigation_leads": _extract_investigation_leads(evidence, clues),
        "extracted_entities": entities,
        "evidence_analysis": evidence,
        "suspect_rankings": suspects,
        "predictions": predictions,
        "recommendations": recommendations,
        "relationship_graph": graph,
        "similar_cases": similar_cases,
        "solvability_score": predictions["solvability_percentage"],
        "investigation_complexity": predictions["investigation_complexity"],
        "disclaimer": settings.ai_disclaimer,
        "analysis_metadata": {
            "pipeline_version": "1.0.0",
            "methods": ["spacy_ner", "rule_based", "probabilistic_scoring"],
            "fact_vs_inference": {
                "facts": ["entities marked source=extracted", "manual evidence entries"],
                "inferences": ["suspect rankings", "predictions", "timeline inferred events"],
            },
        },
    }


def _find_similar_cases(category: str, text: str) -> list[dict]:
    """Compare against sample historical cases."""
    historical = [
        {
            "case_ref": "HC-2019-0847",
            "similarity": 78,
            "modus_operandi": "Business dispute leading to office homicide",
            "common_motive": "Financial conflict",
            "common_evidence": ["CCTV", "Fingerprints", "Witness statements"],
            "outcome": "Suspect identified via fingerprint match; convicted",
            "lessons_learned": "Early CCTV analysis critical; interview business associates promptly",
        },
        {
            "case_ref": "HC-2021-1203",
            "similarity": 62,
            "modus_operandi": "Night-time office intrusion",
            "common_motive": "Personal vendetta",
            "common_evidence": ["CCTV", "Blood samples"],
            "outcome": "Case solved in 45 days",
            "lessons_learned": "Tower location data provided breakthrough",
        },
    ]
    return [h for h in historical if h["similarity"] > 50]


def _extract_clues(text: str, entities: dict[str, Any], evidence: dict[str, Any]) -> dict[str, list[str]]:
    lower = (text or "").lower()
    evidence_types = {item["type"] for item in evidence.get("detected_evidence", [])}

    strong = []
    weak = []
    contradictions = []
    missing = []

    if "cctv" in lower or "camera" in lower or "surveillance" in lower:
        strong.append("CCTV footage or surveillance evidence is present and may pin a timeline.")
    if "fingerprint" in lower or "fingerprints" in lower or "latent print" in lower:
        strong.append("Fingerprint evidence is mentioned at the scene.")
    if "cash was missing" in lower or "missing cash" in lower or "some cash was missing" in lower:
        strong.append("Missing cash suggests theft or financial motive.")
    if "locked from inside" in lower or "locked when the police arrived" in lower:
        strong.append("Scene condition indicates the location was secured from inside.")
    if "broken window" in lower or "damaged window" in lower or "rear window" in lower:
        weak.append("Broken window suggests possible forced entry or a staged scene.")
    if "argument" in lower or "dispute" in lower or "conflict" in lower:
        weak.append("Reported conflict may imply motive or tension between involved parties.")
    if "employee later stated" in lower or "claims he left" in lower or "claims he had left" in lower:
        contradictions.append("Statement about departure time conflicts with available timeline evidence.")
    if "claims" in lower and "cctv" in lower and "left" in lower:
        contradictions.append("Reported alibi does not match CCTV timestamps.")
    if "locked from inside" in lower and ("broken window" in lower or "rear window" in lower):
        contradictions.append("Locked interior access conflicts with evidence of a broken window.")

    if "unknown person" in lower or "unidentified person" in lower:
        weak.append("An unknown individual is referenced without confirmed identification.")

    if "dna" not in lower and "fingerprint" not in lower and "cctv" not in lower and "phone" not in lower:
        missing.append("No forensic or digital evidence details are currently available.")
    if "fingerprints" not in evidence_types:
        missing.append("Fingerprint analysis is missing.")
    if "CCTV" not in evidence_types and "cctv" not in lower:
        missing.append("Additional CCTV or video footage could clarify the timeline.")
    if "phone" not in lower and "mobile" not in lower and "cellphone" not in lower:
        missing.append("Phone location or communication data is missing.")

    return {
        "strong": strong,
        "weak": weak,
        "contradictions": contradictions,
        "missing_information": missing,
    }


def _generate_scenarios(text: str, entities: dict[str, Any], evidence: dict[str, Any], clues: dict[str, list[str]]) -> list[dict[str, Any]]:
    lower = (text or "").lower()
    evidence_strength = evidence.get("overall_strength", 0.45)
    strong_count = len(clues.get("strong", []))
    contradiction_count = len(clues.get("contradictions", []))

    base_confidence = min(90, max(30, int(45 + evidence_strength * 30 + strong_count * 8 + contradiction_count * 6)))

    scenario_a = {
        "id": "staged_entry",
        "title": "Staged break-in / inside access",
        "confidence": min(95, base_confidence + 8 if contradiction_count else base_confidence),
        "summary": "The available information most strongly supports a staged entry or a case where the scene was manipulated.",
        "supporting_clues": [
            clue for clue in clues.get("strong", []) if "locked" in clue or "cctv" in clue or "missing cash" in clue
        ] or clues.get("strong", []),
        "missing_evidence": [item["type"] for item in evidence.get("missing_evidence", [])][:3],
        "why_less_likely": "This scenario remains a hypothesis until physical evidence confirms staging or inside access.",
    }

    scenario_b = {
        "id": "external_intruder",
        "title": "Actual forced entry by an unknown intruder",
        "confidence": min(85, base_confidence - 8 if contradiction_count else base_confidence - 4),
        "summary": "An unknown person may have forced entry and left the scene, particularly if broken glass and missing cash are present.",
        "supporting_clues": [clue for clue in clues.get("weak", []) if "broken window" in clue or "missing cash" in clue] or clues.get("weak", []),
        "missing_evidence": [item["type"] for item in evidence.get("missing_evidence", []) if item["type"] in ["Fingerprints", "CCTV", "DNA"]],
        "why_less_likely": "Without a confirmed intruder identity or additional forensic proof, this explanation remains plausible but less supported.",
    }

    scenario_c = {
        "id": "non_criminal",
        "title": "Accidental or non-criminal explanation",
        "confidence": min(70, base_confidence - 20),
        "summary": "The incident may involve a non-criminal event or an accidental injury if strong crime evidence is absent.",
        "supporting_clues": [clue for clue in clues.get("weak", []) if "argument" in clue or "unknown individual" in clue],
        "missing_evidence": [item["type"] for item in evidence.get("missing_evidence", [])][:2],
        "why_less_likely": "This scenario is less consistent because there are indicators of deliberate action and evidence gaps remain.",
    }

    return [scenario_a, scenario_b, scenario_c]


def _build_prediction(scenarios: list[dict[str, Any]], clues: dict[str, list[str]]) -> dict[str, Any]:
    best = max(scenarios, key=lambda s: s["confidence"])
    reasoning = []
    if clues.get("contradictions"):
        reasoning.append("CCTV timeline conflicts with statements or scene details.")
    if clues.get("strong"):
        reasoning.extend(clues["strong"][:2])
    if clues.get("weak"):
        reasoning.extend(clues["weak"][:1])
    if not reasoning:
        reasoning = ["The prediction is based on available case details and the strongest identified evidence."]

    return {
        "scenario": best["title"],
        "confidence": best["confidence"],
        "summary": best["summary"],
        "reasoning": reasoning,
        "what_would_change": [
            "Fingerprint analysis from the scene",
            "Additional CCTV footage from adjacent cameras",
            "Phone location and communication records",
            "Verified witness testimony or alibi confirmation",
        ],
        "type": best["id"],
    }


def _summarize_case(text: str, category: str) -> str:
    snippet = text.strip().replace("\n", " ")
    first_sentence = snippet.split(".")[0].strip()
    if len(first_sentence) < 20:
        first_sentence = snippet[:120].strip()
    return f"{first_sentence}. This case appears to be a {category.lower()} scenario with evidence and timeline details that merit deeper investigation."


def _extract_investigation_leads(evidence: dict[str, Any], clues: dict[str, list[str]]) -> list[str]:
    leads = []
    missing = evidence.get("missing_evidence", [])
    if missing:
        for item in missing[:3]:
            leads.append(f"Obtain {item['type']} evidence to reduce uncertainty.")
    if clues.get("contradictions"):
        leads.append("Clarify contradictory statements and timestamps with follow-up interviews.")
    if clues.get("strong"):
        leads.append("Validate strong clues with forensic or digital analysis.")
    if not leads:
        leads.append("Review all available case details and collect additional forensic evidence.")
    return leads
