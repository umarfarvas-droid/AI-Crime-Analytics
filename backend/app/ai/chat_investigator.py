"""RAG-powered AI chat investigator."""

from typing import Any, Optional

from app.core.config import settings


DISCLAIMER = (
    "This response is AI-generated investigative assistance based on case documents. "
    "It does not constitute proof of guilt. Verify all information through proper investigative procedures."
)


class ChatInvestigator:
    def __init__(self):
        self._vectorstore = None
        self._llm = None

    def _get_llm(self):
        if self._llm is None and settings.openai_api_key:
            try:
                from langchain_openai import ChatOpenAI
                self._llm = ChatOpenAI(model="gpt-4o-mini", api_key=settings.openai_api_key, temperature=0.3)
            except Exception:
                pass
        return self._llm

    async def index_case_documents(self, case_id: int, documents: list[dict]):
        """Index case documents for RAG retrieval."""
        try:
            import chromadb
            from chromadb.config import Settings as ChromaSettings

            client = chromadb.PersistentClient(
                path=settings.chroma_persist_dir,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
            collection_name = f"case_{case_id}"
            try:
                client.delete_collection(collection_name)
            except Exception:
                pass
            collection = client.create_collection(collection_name)

            texts = [d.get("extracted_text", "") or d.get("content", "") for d in documents if d.get("extracted_text") or d.get("content")]
            if texts:
                ids = [f"doc_{i}" for i in range(len(texts))]
                collection.add(documents=texts, ids=ids)
        except Exception:
            pass

    async def chat(
        self,
        case_id: int,
        message: str,
        case_context: dict,
    ) -> dict[str, Any]:
        """Process investigator chat query with RAG context."""
        context = self._build_context(case_context)
        llm = self._get_llm()

        if llm:
            try:
                from langchain.schema import HumanMessage, SystemMessage
                system = f"""You are an AI investigation assistant. Help investigators analyze case data.
IMPORTANT RULES:
- Never declare anyone guilty
- Distinguish facts from hypotheses
- Provide confidence levels
- Include reasoning for all conclusions
- This is decision support only

Case Context:
{context}

Disclaimer: {DISCLAIMER}"""

                response = llm.invoke([
                    SystemMessage(content=system),
                    HumanMessage(content=message),
                ])
                return {
                    "response": response.content,
                    "sources": [{"type": "case_data", "reference": "FIR and analysis"}],
                    "disclaimer": DISCLAIMER,
                }
            except Exception:
                pass

        return self._rule_based_response(message, case_context)

    def _build_context(self, case: dict) -> str:
        parts = []
        if case.get("crime_description"):
            parts.append(f"FIR Description: {case['crime_description']}")
        if case.get("crime_category"):
            parts.append(f"Category: {case['crime_category']}")
        if case.get("extracted_entities"):
            parts.append(f"Entities: {case['extracted_entities']}")
        if case.get("suspect_rankings"):
            parts.append(f"Suspect Rankings: {case['suspect_rankings']}")
        if case.get("predictions"):
            parts.append(f"Predictions: {case['predictions']}")
        return "\n".join(parts) or "No case data available."

    def _rule_based_response(self, message: str, case: dict) -> dict[str, Any]:
        lower = message.lower()
        rankings = case.get("suspect_rankings", {}).get("rankings", [])
        evidence = case.get("ai_analysis", {}).get("evidence", {})
        predictions = case.get("predictions", {})

        if "most suspicious" in lower or "who is" in lower:
            if rankings:
                top = rankings[0]
                response = (
                    f"Based on available evidence, **{top['suspect']}** ranks highest "
                    f"(probability: {top['probability']:.0%}, confidence: {top['confidence']:.0%}). "
                    f"Reason: {top['reason']}. "
                    f"Supporting evidence: {', '.join(top['supporting_evidence'])}. "
                    f"Note: This is NOT proof of guilt."
                )
            else:
                response = "No suspect rankings available yet. Run case analysis first."

        elif "why" in lower:
            if rankings:
                top = rankings[0]
                response = f"{top['suspect']} is ranked highest because: {top['reason']}. Risk level: {top['risk_level']}. Possible motive: {top['possible_motive']}."
            else:
                response = "Insufficient data for reasoning. Please analyze the case first."

        elif "missing evidence" in lower or "evidence missing" in lower:
            missing = evidence.get("missing_evidence", [])
            if missing:
                items = [m["type"] for m in missing]
                response = f"Missing evidence identified: {', '.join(items)}. Priority collection recommended."
            else:
                response = "No critical missing evidence flagged. Review forensic reports for completeness."

        elif "summary" in lower or "investigation summary" in lower:
            response = (
                f"Case Summary: {case.get('crime_category', 'Unknown')} at {case.get('location', 'unknown location')}. "
                f"Solvability: {predictions.get('solvability_percentage', 'N/A')}%. "
                f"Likely motive: {predictions.get('likely_motive', 'Under investigation')}. "
                f"Top suspect (hypothesis): {predictions.get('likely_suspect', 'Unknown')}."
            )

        elif "next step" in lower or "recommend" in lower:
            actions = predictions.get("next_recommended_actions", [])
            response = "Recommended next steps:\n" + "\n".join(f"- {a}" for a in actions) if actions else "Review case recommendations panel."

        elif "witness" in lower and "question" in lower:
            response = (
                "Suggested witness interview questions:\n"
                "- What did you hear/see at the time of the incident?\n"
                "- Did you recognize any persons entering/leaving the scene?\n"
                "- What was the nature of the argument you heard?\n"
                "- Can you describe the unidentified person from CCTV?\n"
                "- Did the victim mention any disputes recently?"
            )

        elif "reasoning" in lower or "explain" in lower:
            response = (
                f"Analysis methodology: Entity extraction from FIR, evidence strength assessment, "
                f"probabilistic suspect scoring based on relationship/opportunity/motive indicators. "
                f"Confidence: {predictions.get('confidence_score', 0.6):.0%}. "
                f"All outputs require human verification."
            )

        elif "evidence support" in lower or "supports this" in lower:
            if rankings:
                response = f"Supporting evidence for top suspect: {', '.join(rankings[0]['supporting_evidence'])}"
            else:
                response = "Run case analysis to identify supporting evidence."

        else:
            response = (
                "I can help with: suspect analysis, missing evidence, investigation summary, "
                "next steps, witness questions, and reasoning explanations. What would you like to know?"
            )

        return {"response": response, "sources": [{"type": "case_analysis"}], "disclaimer": DISCLAIMER}


chat_investigator = ChatInvestigator()
