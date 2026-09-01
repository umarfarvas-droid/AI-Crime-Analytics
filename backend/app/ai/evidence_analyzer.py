"""Evidence analysis engine."""

from typing import Any

EVIDENCE_TYPES = [
    "Weapons", "DNA", "Blood", "Fingerprints", "Footprints", "Documents",
    "Digital Devices", "Mobile Phones", "Laptop", "Hard Disk", "USB",
    "Email", "Chat Messages", "CCTV", "Audio", "Video",
    "Financial Transactions", "Vehicle", "Recovered Items",
]

EVIDENCE_KEYWORDS = {
    "Weapons": ["weapon", "gun", "knife", "firearm", "pistol"],
    "DNA": ["dna", "genetic", "blood sample"],
    "Blood": ["blood", "bloodstain", "blood stain"],
    "Fingerprints": ["fingerprint", "finger print", "latent print"],
    "Footprints": ["footprint", "shoe print", "tire mark"],
    "Documents": ["document", "contract", "letter", "receipt"],
    "Digital Devices": ["digital device", "electronic device"],
    "Mobile Phones": ["mobile", "phone", "cellphone", "smartphone"],
    "Laptop": ["laptop", "computer", "pc"],
    "Hard Disk": ["hard disk", "hard drive", "hdd"],
    "USB": ["usb", "flash drive", "pen drive"],
    "Email": ["email", "e-mail"],
    "Chat Messages": ["chat", "whatsapp", "message", "sms"],
    "CCTV": ["cctv", "surveillance", "camera footage", "video footage"],
    "Audio": ["audio", "recording", "voice"],
    "Video": ["video", "footage"],
    "Financial Transactions": ["transaction", "bank", "payment", "transfer"],
    "Vehicle": ["vehicle", "car", "bike", "license plate"],
    "Recovered Items": ["recovered", "seized", "confiscated"],
}

EXPECTED_EVIDENCE_BY_CRIME = {
    "Murder": ["Weapons", "DNA", "Blood", "Fingerprints", "CCTV", "Mobile Phones"],
    "Robbery": ["CCTV", "Fingerprints", "Witness Statements", "Vehicle"],
    "Burglary": ["Fingerprints", "Footprints", "CCTV", "Recovered Items"],
    "Cyber Crime": ["Laptop", "Hard Disk", "Email", "Chat Messages", "Digital Devices"],
    "Fraud": ["Documents", "Financial Transactions", "Email"],
}


def analyze_evidence(
    text: str,
    evidence_list: dict | None,
    crime_category: str,
) -> dict[str, Any]:
    """Detect evidence types, strength, reliability, and missing evidence."""
    detected = []
    lower = (text or "").lower()

    for ev_type, keywords in EVIDENCE_KEYWORDS.items():
        for kw in keywords:
            if kw in lower:
                detected.append({
                    "type": ev_type,
                    "strength": 0.7 + (0.1 * keywords.index(kw) if len(keywords) > 1 else 0),
                    "reliability": 0.75,
                    "source": "text_extraction",
                    "collected": True,
                })
                break

    if evidence_list:
        items = evidence_list if isinstance(evidence_list, list) else evidence_list.get("items", [])
        for item in items:
            if isinstance(item, str):
                detected.append({"type": item, "strength": 0.8, "reliability": 0.85, "source": "manual", "collected": True})
            elif isinstance(item, dict):
                detected.append({
                    "type": item.get("type", item.get("name", "Unknown")),
                    "strength": item.get("strength", 0.7),
                    "reliability": item.get("reliability", 0.75),
                    "source": "manual",
                    "collected": item.get("collected", True),
                })

    # Deduplicate by type
    seen = set()
    unique = []
    for d in detected:
        if d["type"] not in seen:
            seen.add(d["type"])
            unique.append(d)

    expected = EXPECTED_EVIDENCE_BY_CRIME.get(crime_category, ["CCTV", "Fingerprints", "Documents"])
    found_types = {d["type"] for d in unique}
    missing = [{"type": t, "importance": "high" if t in ["DNA", "CCTV", "Fingerprints"] else "medium"} 
               for t in expected if t not in found_types and t in EVIDENCE_TYPES]

    avg_strength = sum(d["strength"] for d in unique) / len(unique) if unique else 0.0
    avg_reliability = sum(d["reliability"] for d in unique) / len(unique) if unique else 0.0

    return {
        "detected_evidence": unique,
        "missing_evidence": missing,
        "overall_strength": round(avg_strength, 2),
        "overall_reliability": round(avg_reliability, 2),
        "total_items": len(unique),
    }
