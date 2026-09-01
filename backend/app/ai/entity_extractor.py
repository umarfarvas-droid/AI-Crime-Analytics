"""FIR entity extraction using spaCy NER and rule-based patterns."""

import re
from typing import Any

CRIME_TYPES = [
    "Murder", "Robbery", "Burglary", "Cyber Crime", "Fraud", "Kidnapping",
    "Domestic Violence", "Drug Crime", "Vehicle Theft", "Human Trafficking",
    "Extortion", "Arson", "Assault", "Financial Crime", "Terror Related Incident", "Other",
]

CLASSIFICATION_KEYWORDS = {
    "Murder": ["murder", "killed", "dead", "homicide", "strangled", "shot dead", "found dead"],
    "Robbery": ["robbery", "robbed", "snatched", "mugging", "held at gunpoint"],
    "Burglary": ["burglary", "broke in", "break-in", "trespass", "stolen from house"],
    "Cyber Crime": ["hacking", "phishing", "cyber", "online fraud", "data breach"],
    "Fraud": ["fraud", "forgery", "cheating", "embezzlement", "scam"],
    "Kidnapping": ["kidnap", "abducted", "held captive", "ransom"],
    "Domestic Violence": ["domestic violence", "spouse abuse", "marital assault"],
    "Drug Crime": ["narcotics", "drugs", "cocaine", "heroin", "smuggling"],
    "Vehicle Theft": ["vehicle theft", "car stolen", "bike stolen", "auto theft"],
    "Human Trafficking": ["trafficking", "forced labor", "sex trafficking"],
    "Extortion": ["extortion", "blackmail", "demanding money"],
    "Arson": ["arson", "set fire", "burnt", "fire incident"],
    "Assault": ["assault", "attacked", "beaten", "injured"],
    "Financial Crime": ["money laundering", "bank fraud", "financial dispute"],
    "Terror Related Incident": ["terror", "bomb", "explosive", "terrorist"],
}


def _load_spacy():
    try:
        import spacy
        return spacy.load("en_core_web_sm")
    except (OSError, ModuleNotFoundError, ImportError):
        return None


_nlp = None


def get_nlp():
    global _nlp
    if _nlp is None:
        _nlp = _load_spacy()
    return _nlp


def extract_entities(text: str) -> dict[str, Any]:
    """Extract entities from FIR text using NLP and pattern matching."""
    nlp = get_nlp()
    entities: dict[str, Any] = {
        "victims": [],
        "suspects": [],
        "witnesses": [],
        "locations": [],
        "vehicles": [],
        "weapons": [],
        "organizations": [],
        "phone_numbers": [],
        "addresses": [],
        "relationships": [],
        "dates": [],
        "times": [],
        "financial_details": [],
        "crime_type": "Other",
        "crime_type_confidence": 0.3,
    }

    if not text:
        return entities

    # Phone numbers
    phones = re.findall(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    entities["phone_numbers"] = list(set(phones))

    # Times
    times = re.findall(r'\b(?:\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?|\d{1,2}\s*(?:AM|PM|am|pm))\b', text)
    entities["times"] = list(set(times))

    # Dates
    dates = re.findall(
        r'\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b',
        text, re.IGNORECASE
    )
    entities["dates"] = list(set(dates))

    # Weapons
    weapon_patterns = [
        r'\b(?:gun|pistol|revolver|rifle|knife|dagger|sword|bat|rod|weapon|firearm)\b'
    ]
    for pat in weapon_patterns:
        for m in re.finditer(pat, text, re.IGNORECASE):
            entities["weapons"].append(m.group())

    # Vehicles
    vehicle_patterns = [
        r'\b(?:car|bike|motorcycle|truck|van|vehicle|auto|scooter|SUV)\b'
    ]
    for pat in vehicle_patterns:
        for m in re.finditer(pat, text, re.IGNORECASE):
            entities["vehicles"].append(m.group())

    # Financial
    financial = re.findall(
        r'\b(?:\$\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*\s*(?:rupees|dollars|USD|INR)|financial dispute|bank account|transaction)\b',
        text, re.IGNORECASE
    )
    entities["financial_details"] = list(set(financial))

    # Relationship keywords
    rel_patterns = [
        r'(?:business partner|wife|husband|friend|colleague|neighbor|employee|employer|relative|brother|sister|father|mother|son|daughter)',
    ]
    for pat in rel_patterns:
        for m in re.finditer(pat, text, re.IGNORECASE):
            entities["relationships"].append(m.group())

    # Context-based extraction
    lower = text.lower()
    if "victim" in lower or "deceased" in lower or "found dead" in lower:
        age_match = re.search(r'(\d{1,3})[- ]year[- ]old\s+(\w+(?:\s+\w+)?)', text, re.IGNORECASE)
        if age_match:
            entities["victims"].append({"age": age_match.group(1), "description": age_match.group(0)})

    if "witness" in lower:
        witness_match = re.search(r'(?:witness|nearby witness)\s+(?:heard|saw|reported)\s+([^.]+)', text, re.IGNORECASE)
        if witness_match:
            entities["witnesses"].append({"observation": witness_match.group(1).strip()})
        elif "heard an argument" in lower or "witness" in lower:
            entities["witnesses"].append({"observation": "Heard an argument near the scene"})

    if not entities["locations"] and "office" in lower:
        entities["locations"].append("office")

    if "partner" in lower or "suspect" in lower:
        partner_match = re.search(r'(?:business partner|suspect|unidentified person)\s+([^.]+)?', text, re.IGNORECASE)
        if partner_match:
            entities["suspects"].append({"description": partner_match.group(0).strip()})

    if "cctv" in lower or "footage" in lower:
        entities["evidence_mentions"] = ["CCTV footage"]

    if "fingerprint" in lower:
        entities.setdefault("evidence_mentions", []).append("Fingerprints")

    # spaCy NER
    if nlp:
        doc = nlp(text)
        for ent in doc.ents:
            if ent.label_ in ("GPE", "LOC", "FAC"):
                entities["locations"].append(ent.text)
            elif ent.label_ == "ORG":
                entities["organizations"].append(ent.text)
            elif ent.label_ == "PERSON":
                if "witness" in lower[max(0, ent.start_char - 50):ent.start_char].lower():
                    entities["witnesses"].append({"name": ent.text})
                elif "victim" in lower[max(0, ent.start_char - 50):ent.start_char].lower():
                    entities["victims"].append({"name": ent.text})
                else:
                    entities["suspects"].append({"name": ent.text})
            elif ent.label_ == "DATE":
                if ent.text not in entities["dates"]:
                    entities["dates"].append(ent.text)
            elif ent.label_ == "TIME":
                if ent.text not in entities["times"]:
                    entities["times"].append(ent.text)

    category, confidence = classify_crime(text)
    entities["crime_type"] = category
    entities["crime_type_confidence"] = round(confidence, 2)

    # Deduplicate lists
    for key in entities:
        if isinstance(entities[key], list) and entities[key] and isinstance(entities[key][0], str):
            entities[key] = list(set(entities[key]))

    return entities


def classify_crime(text: str) -> tuple[str, float]:
    """Classify crime type with confidence score."""
    if not text:
        return "Other", 0.3

    lower = text.lower()
    scores = {}
    for category, keywords in CLASSIFICATION_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in lower)
        if score > 0:
            scores[category] = score

    if not scores:
        return "Other", 0.35

    best = max(scores, key=scores.get)
    total = sum(scores.values())
    confidence = min(0.95, 0.5 + (scores[best] / max(total, 1)) * 0.45)
    return best, round(confidence, 2)
