"""Relationship graph builder for case entities."""

from typing import Any


def build_relationship_graph(
    entities: dict,
    evidence_analysis: dict,
    case_data: dict,
) -> dict[str, Any]:
    """Build nodes and edges for interactive relationship graph."""
    nodes = []
    edges = []
    node_id = 0

    def add_node(label: str, node_type: str, metadata: dict | None = None) -> str:
        nonlocal node_id
        nid = f"{node_type}_{node_id}"
        node_id += 1
        nodes.append({
            "id": nid,
            "label": label,
            "type": node_type,
            "metadata": metadata or {},
        })
        return nid

    victim_ids = []
    for v in entities.get("victims", []):
        label = v.get("name") or v.get("description", "Victim")
        victim_ids.append(add_node(label, "victim", v))

    suspect_ids = []
    for s in entities.get("suspects", []):
        label = s.get("name") or s.get("description", "Suspect")
        suspect_ids.append(add_node(label, "suspect", s))

    witness_ids = []
    for w in entities.get("witnesses", []):
        label = w.get("name") or w.get("observation", "Witness")[:30]
        witness_ids.append(add_node(label, "witness", w))

    location_ids = []
    for loc in entities.get("locations", [])[:5]:
        location_ids.append(add_node(loc, "location"))

    if case_data.get("location") and not location_ids:
        location_ids.append(add_node(case_data["location"], "location"))

    weapon_ids = []
    for w in entities.get("weapons", []):
        weapon_ids.append(add_node(w, "weapon"))

    evidence_ids = []
    for ev in evidence_analysis.get("detected_evidence", []):
        evidence_ids.append(add_node(ev["type"], "evidence", {"strength": ev.get("strength")}))

    org_ids = []
    for org in entities.get("organizations", [])[:3]:
        org_ids.append(add_node(org, "organization"))

    phone_ids = []
    for phone in entities.get("phone_numbers", [])[:3]:
        phone_ids.append(add_node(phone, "phone_number"))

    # Edges
    for sid in suspect_ids:
        for vid in victim_ids:
            rel = "business_partner" if "partner" in str(case_data.get("crime_description", "")).lower() else "associated_with"
            edges.append({"source": sid, "target": vid, "relationship": rel, "label": rel.replace("_", " ").title()})

    for wid in witness_ids:
        for vid in victim_ids:
            edges.append({"source": wid, "target": vid, "relationship": "witnessed", "label": "Witnessed"})
        for lid in location_ids:
            edges.append({"source": wid, "target": lid, "relationship": "present_at", "label": "Present At"})

    for eid in evidence_ids:
        for vid in victim_ids:
            edges.append({"source": eid, "target": vid, "relationship": "related_to", "label": "Related To"})
        for sid in suspect_ids:
            edges.append({"source": eid, "target": sid, "relationship": "links_to", "label": "Links To"})

    for wid in weapon_ids:
        for vid in victim_ids:
            edges.append({"source": wid, "target": vid, "relationship": "used_against", "label": "Used Against"})

    for lid in location_ids:
        for vid in victim_ids:
            edges.append({"source": lid, "target": vid, "relationship": "crime_scene", "label": "Crime Scene"})

    return {
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "node_types": list(set(n["type"] for n in nodes)),
        },
    }
