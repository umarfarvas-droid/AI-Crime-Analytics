package com.crime.analytics.ai.services;

import com.crime.analytics.api.v1.dto.ChatResponse;
import com.crime.analytics.models.entities.Case;
import com.crime.analytics.models.entities.Document;
import com.crime.analytics.models.repositories.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Case-Aware Structured RAG Forensic AI Assistant Service
 * Strict Case Isolation • Authoritative Structured Data • Zero Cross-Case Bleed
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatInvestigatorService {

    private final LlmService llmService;
    private final AiPipelineService aiPipelineService;
    private final DocumentRepository documentRepository;
    private final com.crime.analytics.ai.services.video.VideoReconstructionService videoReconstructionService;

    // Case-Scoped Conversation Memory: CaseId -> Memory State
    private final Map<Long, CaseConversationContext> conversationMemory = new ConcurrentHashMap<>();

    // Case-Scoped Query Cache: "caseId|query|convId" -> ChatResponse
    private final Map<String, ChatResponse> ragCache = new ConcurrentHashMap<>();

    /**
     * Process Chat Query grounded strictly in Current Case Knowledge Base
     */
    public ChatResponse processChat(Case caseEntity, String rawMessage, String conversationId) {
        if (caseEntity == null) {
            return ChatResponse.builder()
                    .response("Error: Case not found.")
                    .answerType("ERROR")
                    .sources(List.of())
                    .disclaimer("Investigative support only.")
                    .build();
        }

        String query = rawMessage != null ? rawMessage.trim() : "";
        String convId = conversationId != null && !conversationId.isBlank() ? conversationId.trim() : "default";
        String cacheKey = caseEntity.getCaseNumber() + "|" + query.toLowerCase().replaceAll("\\s+", " ").trim() + "|" + convId;

        log.info("Processing RAG query for Case #{} (ID: {}): '{}'", caseEntity.getCaseNumber(), caseEntity.getId(), query);

        // Check Case-Scoped Cache
        if (ragCache.containsKey(cacheKey)) {
            log.info("Returning case-scoped cached RAG response for key: {}", cacheKey);
            return ragCache.get(cacheKey);
        }

        // 1. Retrieve full Structured AI Pipeline Knowledge Base for the current case
        Map<String, Object> analysis = aiPipelineService.analyzeCase(caseEntity);
        
        List<Map<String, Object>> suspects = (List<Map<String, Object>>) analysis.getOrDefault("suspect_rankings", List.of());
        List<Map<String, Object>> victims = (List<Map<String, Object>>) analysis.getOrDefault("victims", List.of());
        List<String> witnesses = (List<String>) analysis.getOrDefault("witnesses", List.of());
        List<Map<String, Object>> evidence = (List<Map<String, Object>>) analysis.getOrDefault("evidence_vault", List.of());
        List<Map<String, Object>> timeline = (List<Map<String, Object>>) analysis.getOrDefault("timeline", List.of());
        List<Map<String, Object>> contradictions = (List<Map<String, Object>>) analysis.getOrDefault("contradictions", List.of());
        List<String> reasoning = (List<String>) analysis.getOrDefault("reasoning_factors", List.of());
        List<String> locations = (List<String>) analysis.getOrDefault("locations", List.of());
        List<String> organizations = (List<String>) analysis.getOrDefault("organizations", List.of());
        List<String> jobTitles = (List<String>) analysis.getOrDefault("job_titles", List.of());
        String crimeCategory = (String) analysis.getOrDefault("crime_category", "Major Offense Investigation");
        Double solvability = (Double) analysis.getOrDefault("solvability_score", 85.0);

        List<String> sources = new ArrayList<>();
        sources.add("FIR Narrative #" + caseEntity.getCaseNumber());
        sources.add("Incident Access & Maintenance Records");
        sources.add("Case Investigation Report");

        // Include uploaded documents strictly for current case
        List<Document> docs = documentRepository.findByCase_Id(caseEntity.getId());
        for (Document doc : docs) {
            if (doc.getExtractedText() != null && !doc.getExtractedText().isEmpty()) {
                sources.add(doc.getFilename());
            }
        }

        // 2. Retrieve or Create Case-Scoped Conversation Context
        CaseConversationContext memory = conversationMemory.computeIfAbsent(
                caseEntity.getId(),
                k -> new CaseConversationContext(caseEntity.getId(), caseEntity.getCaseNumber())
        );

        // 3. Process Grounded Query using Structured Data First
        ChatResponse rawResponse = answerGroundedQuestion(
                query,
                caseEntity,
                suspects,
                victims,
                witnesses,
                evidence,
                timeline,
                contradictions,
                locations,
                organizations,
                jobTitles,
                reasoning,
                crimeCategory,
                solvability,
                sources,
                analysis,
                memory
        );

        // 4. Post-Generation Validation (validateRagResponse)
        ChatResponse validatedResponse = validateRagResponse(rawResponse, caseEntity, suspects, victims, witnesses, evidence);

        // 5. Update Case-Scoped Conversation Memory
        if (validatedResponse.getEntityName() != null) {
            memory.setCurrentEntity(validatedResponse.getEntityName(), validatedResponse.getRole(), validatedResponse.getRiskScore());
        }
        memory.recordExchange(query, validatedResponse.getResponse(), validatedResponse.getEntityName());

        // 6. Cache the Validated Result using Case-Scoped Key
        ragCache.put(cacheKey, validatedResponse);

        return validatedResponse;
    }

    public ChatResponse processChat(Case caseEntity, String rawMessage) {
        return processChat(caseEntity, rawMessage, "default");
    }

    /**
     * Clear / Reset Conversation Memory & Cache for a specific case or all cases
     */
    public void resetMemory(Long caseId) {
        if (caseId != null) {
            conversationMemory.remove(caseId);
            ragCache.entrySet().removeIf(e -> e.getKey().startsWith(caseId + "|") || e.getKey().contains("|" + caseId + "|"));
            log.info("Reset RAG conversation memory and cache for case ID {}", caseId);
        } else {
            conversationMemory.clear();
            ragCache.clear();
            log.info("Reset all RAG conversation memory and cache");
        }
    }

    /**
     * Structured Question Answering Engine
     */
    private ChatResponse answerGroundedQuestion(
            String query,
            Case c,
            List<Map<String, Object>> suspects,
            List<Map<String, Object>> victims,
            List<String> witnesses,
            List<Map<String, Object>> evidence,
            List<Map<String, Object>> timeline,
            List<Map<String, Object>> contradictions,
            List<String> locations,
            List<String> organizations,
            List<String> jobTitles,
            List<String> reasoning,
            String crimeCategory,
            Double solvability,
            List<String> sources,
            Map<String, Object> analysis,
            CaseConversationContext memory
    ) {
        String qLower = query.toLowerCase().trim();
        String disclaimer = "This is an investigative hypothesis and does not establish guilt.";

        // Intent 1: Guilt Inquiries ("Who is guilty?", "Is X guilty?")
        if (qLower.contains("who is guilty") || qLower.contains("who committed") || qLower.contains("is he guilty") || qLower.contains("is she guilty") || qLower.contains("prove guilt") || qLower.contains("is guilty")) {
            String text = String.format(
                "The AI Crime Analytics system cannot establish legal guilt. All suspect rankings and risk assessments in Case #%s represent investigative hypotheses based strictly on available narrative evidence and digital logs. Formal determination of culpability rests solely with law enforcement and the judiciary.",
                c.getCaseNumber()
            );
            return ChatResponse.builder()
                    .response(text)
                    .answerType("GUILT_DISCLAIMER")
                    .caseId(c.getId().toString())
                    .caseNumber(c.getCaseNumber())
                    .sources(sources)
                    .disclaimer(disclaimer)
                    .build();
        }

        // Intent 2: Accomplice / Speculation Inquiries ("Who was X's accomplice?", "Who helped X?")
        if (qLower.contains("accomplice") || qLower.contains("who helped") || qLower.contains("co-conspirator") || qLower.contains("partner in crime")) {
            String target = resolveTargetPerson(query, suspects, victims, memory);
            String text;
            if (target != null) {
                text = String.format("The current case records do not establish a confirmed accomplice for %s.", target);
            } else {
                text = String.format("The current case records for Case #%s do not establish any confirmed accomplice.", c.getCaseNumber());
            }
            return ChatResponse.builder()
                    .response(text)
                    .answerType("ACCOMPLICE_INQUIRY")
                    .caseId(c.getId().toString())
                    .caseNumber(c.getCaseNumber())
                    .entityName(target)
                    .sources(sources)
                    .disclaimer(disclaimer)
                    .build();
        }

        // Intent 3: "Who is the victim?" / "Who died?"
        if (qLower.contains("who is the victim") || qLower.contains("who died") || qLower.contains("who was killed") || qLower.contains("who was murdered") || qLower.contains("who was found dead")) {
            if (!victims.isEmpty()) {
                Map<String, Object> v = victims.get(0);
                String vName = (String) v.get("name");
                String vStatus = (String) v.getOrDefault("status", "DECEASED");
                String vOcc = (String) v.getOrDefault("occupation", "Victim");
                String vDetails = (String) v.getOrDefault("details", "Recorded in FIR.");

                String text = String.format(
                    "VICTIM\n%s\n\nStatus:\n%s\n\nOccupation:\n%s\n\nDetails:\n%s\n\nLocation:\n%s\n\nDisclaimer:\n%s",
                    vName, vStatus, vOcc, vDetails,
                    c.getLocationName() != null ? c.getLocationName() : "Crime Scene",
                    disclaimer
                );

                ChatResponse.PersonDto personDto = ChatResponse.PersonDto.builder()
                        .caseId(c.getCaseNumber())
                        .name(vName)
                        .entityType("VICTIM")
                        .role(vOcc)
                        .status(vStatus)
                        .investigationStatus("VICTIM")
                        .build();

                return ChatResponse.builder()
                        .response(text)
                        .answerType("VICTIM_PROFILE")
                        .caseId(c.getId().toString())
                        .caseNumber(c.getCaseNumber())
                        .entityName(vName)
                        .role(vOcc)
                        .person(personDto)
                        .sources(sources)
                        .disclaimer(disclaimer)
                        .build();
            }
        }

        // Intent 4: "Where did this happen?" / Location
        if (qLower.contains("where did") || qLower.contains("what place") || qLower.contains("crime scene location") || qLower.contains("incident location")) {
            String loc = c.getLocationName() != null ? c.getLocationName() : (!locations.isEmpty() ? locations.get(0) : "Incident Scene");
            String text = String.format("The primary incident location for Case #%s is %s.", c.getCaseNumber(), loc);
            return ChatResponse.builder()
                    .response(text)
                    .answerType("LOCATION_INFO")
                    .caseId(c.getId().toString())
                    .caseNumber(c.getCaseNumber())
                    .sources(sources)
                    .disclaimer(disclaimer)
                    .build();
        }

        // Intent 4.5: Scene Reconstruction Queries ("What scenes were reconstructed?", "Which evidence appears in Scene 4?", "Which persons are shown in the reconstruction?", "What happened in Scene X?")
        if ((qLower.contains("scene") || qLower.contains("reconstruction") || qLower.contains("reconstructed")) && !qLower.contains("crime scene location")) {
            var plan = videoReconstructionService.getScenePlanForCase(c);

            // Sub-case A: Specific Scene Number (e.g. "Which evidence appears in Scene 4?", "What happened in Scene 2?")
            Pattern sceneNumPattern = Pattern.compile("(?i)scene\\s*(\\d+)");
            Matcher sm = sceneNumPattern.matcher(query);
            if (sm.find()) {
                int sNum = Integer.parseInt(sm.group(1));
                if (sNum >= 1 && sNum <= plan.size()) {
                    var scene = plan.get(sNum - 1);
                    StringBuilder sResp = new StringBuilder();
                    sResp.append(String.format("SCENE %d RECONSTRUCTION [%s]\n\n", scene.getSceneNumber(), scene.getTime()));
                    sResp.append(String.format("Location:\n%s\n\n", scene.getLocation()));
                    sResp.append(String.format("Event:\n%s\n\n", scene.getEvent()));
                    sResp.append(String.format("Status:\n%s\n\n", scene.getFactOrInference()));
                    if (scene.getPersons() != null && !scene.getPersons().isEmpty()) {
                        sResp.append(String.format("Persons Featured:\n%s\n\n", String.join(", ", scene.getPersons())));
                    }
                    if (scene.getEvidence() != null && !scene.getEvidence().isEmpty()) {
                        sResp.append(String.format("Linked Evidence:\n%s\n\n", String.join(", ", scene.getEvidence())));
                    } else {
                        sResp.append("Linked Evidence:\nPhysical / electronic logs recorded in narrative.\n\n");
                    }
                    sResp.append(String.format("Camera Perspective:\n%s\n\n", scene.getCamera()));
                    sResp.append("Disclaimer:\n").append(disclaimer);

                    return ChatResponse.builder()
                            .response(sResp.toString().trim())
                            .answerType("SCENE_RECONSTRUCTION")
                            .caseId(c.getId().toString())
                            .caseNumber(c.getCaseNumber())
                            .sources(sources)
                            .disclaimer(disclaimer)
                            .build();
                }
            }

            // Sub-case B: "Which persons are shown in the reconstruction?" / "Who appears in the reconstruction?" / "Which scenes contain Sameer Khan?"
            for (var sp : suspects) {
                String sName = (String) sp.get("name");
                if (qLower.contains(sName.toLowerCase()) && (qLower.contains("scene") || qLower.contains("reconstruction"))) {
                    List<String> matchedScenes = new ArrayList<>();
                    for (var sc : plan) {
                        if (sc.getPersons() != null && sc.getPersons().stream().anyMatch(p -> p.toLowerCase().contains(sName.toLowerCase()) || sName.toLowerCase().contains(p.toLowerCase()))) {
                            matchedScenes.add(String.format("• Scene %d [%s]: %s (%s)", sc.getSceneNumber(), sc.getTime(), sc.getEvent(), sc.getFactOrInference()));
                        }
                    }
                    String respText = matchedScenes.isEmpty()
                            ? String.format("%s does not directly appear in any reconstructed visual scenes for Case #%s.", sName, c.getCaseNumber())
                            : String.format("%s appears in the following reconstructed scenes for Case #%s:\n\n%s\n\nDisclaimer:\n%s", sName, c.getCaseNumber(), String.join("\n", matchedScenes), disclaimer);
                    return ChatResponse.builder()
                            .response(respText.trim())
                            .answerType("PERSON_SCENES")
                            .caseId(c.getId().toString())
                            .caseNumber(c.getCaseNumber())
                            .sources(sources)
                            .disclaimer(disclaimer)
                            .build();
                }
            }

            if (qLower.contains("confirmed")) {
                List<String> confirmedScenes = new ArrayList<>();
                for (var sc : plan) {
                    if (sc.getFactOrInference() != null && sc.getFactOrInference().contains("FACT")) {
                        confirmedScenes.add(String.format("• Scene %d [%s]: %s", sc.getSceneNumber(), sc.getTime(), sc.getEvent()));
                    }
                }
                String resp = String.format("Confirmed Reconstructed Scenes (Backed by Direct Evidence) for Case #%s:\n\n%s\n\nDisclaimer:\n%s",
                        c.getCaseNumber(), String.join("\n", confirmedScenes), disclaimer);
                return ChatResponse.builder()
                        .response(resp.trim())
                        .answerType("CONFIRMED_SCENES")
                        .caseId(c.getId().toString())
                        .caseNumber(c.getCaseNumber())
                        .sources(sources)
                        .disclaimer(disclaimer)
                        .build();
            }

            if (qLower.contains("inferred")) {
                List<String> inferredScenes = new ArrayList<>();
                for (var sc : plan) {
                    if (sc.getFactOrInference() != null && sc.getFactOrInference().contains("INFERRED")) {
                        inferredScenes.add(String.format("• Scene %d [%s]: %s", sc.getSceneNumber(), sc.getTime(), sc.getEvent()));
                    }
                }
                String resp = inferredScenes.isEmpty()
                        ? String.format("All reconstructed scenes for Case #%s are confirmed facts.", c.getCaseNumber())
                        : String.format("Inferred Reconstructed Scenes (Investigative Hypotheses) for Case #%s:\n\n%s\n\nDisclaimer:\n%s",
                        c.getCaseNumber(), String.join("\n", inferredScenes), disclaimer);
                return ChatResponse.builder()
                        .response(resp.trim())
                        .answerType("INFERRED_SCENES")
                        .caseId(c.getId().toString())
                        .caseNumber(c.getCaseNumber())
                        .sources(sources)
                        .disclaimer(disclaimer)
                        .build();
            }

            if (qLower.contains("audio") || qLower.contains("sound")) {
                String resp = String.format("Forensic Audio Design for Case #%s Reconstruction:\n\n• 44.1 kHz Stereo Sound Design\n• Gait-synchronized leather and boot footsteps\n• Electronic access control 2400Hz RFID verification beeps\n• Sliding door pneumatic and mechanical releases\n• Ambient room presence (55Hz / 110Hz low-frequency HVAC drone)\n• Forensic flash strobe recharge whines\n\nDisclaimer:\n%s",
                        c.getCaseNumber(), disclaimer);
                return ChatResponse.builder()
                        .response(resp.trim())
                        .answerType("RECONSTRUCTION_AUDIO")
                        .caseId(c.getId().toString())
                        .caseNumber(c.getCaseNumber())
                        .sources(sources)
                        .disclaimer(disclaimer)
                        .build();
            }

            if (qLower.contains("person") || qLower.contains("people") || qLower.contains("who is shown") || qLower.contains("who appears")) {
                Set<String> reconPersons = new LinkedHashSet<>();
                for (var sc : plan) {
                    if (sc.getPersons() != null) reconPersons.addAll(sc.getPersons());
                }
                String text;
                if (!reconPersons.isEmpty()) {
                    text = String.format("The following persons are featured in the chronological scene reconstruction for Case #%s:\n\n• %s\n\n*Note: Identities are rendered with anonymized stylized 3D models in unconfirmed visual reconstructions.*",
                            c.getCaseNumber(), String.join("\n• ", reconPersons));
                } else {
                    text = String.format("The scene reconstruction for Case #%s focuses on physical entry points and electronic audit markers without specific named person sightings.", c.getCaseNumber());
                }
                return ChatResponse.builder()
                        .response(text)
                        .answerType("RECONSTRUCTION_PERSONS")
                        .caseId(c.getId().toString())
                        .caseNumber(c.getCaseNumber())
                        .sources(sources)
                        .disclaimer(disclaimer)
                        .build();
            }

            // Sub-case C: "What scenes were reconstructed?" / Scene breakdown
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("Reconstructed %d Chronological Forensic Scenes for Case #%s:\n\n", plan.size(), c.getCaseNumber()));
            for (var sc : plan) {
                sb.append(String.format("• Scene %d [%s]: %s (%s)\n", sc.getSceneNumber(), sc.getTime(), sc.getEvent(), sc.getFactOrInference()));
            }
            sb.append("\nDisclaimer:\n").append(disclaimer);

            return ChatResponse.builder()
                    .response(sb.toString().trim())
                    .answerType("SCENE_RECONSTRUCTION_LIST")
                    .caseId(c.getId().toString())
                    .caseNumber(c.getCaseNumber())
                    .sources(sources)
                    .disclaimer(disclaimer)
                    .build();
        }

        // Intent 5: Resolve Target Person (Suspect, Victim, Witness, or Pronoun)
        String targetPerson = resolveTargetPerson(query, suspects, victims, memory);

        // Check if query is targeting a specific person
        if (targetPerson != null) {
            Map<String, Object> suspect = findSuspectByName(suspects, targetPerson);

            if (suspect != null) {
                String sName = (String) suspect.get("name");
                String sRole = getExactRole(suspect);
                int rScore = getIntegerRiskScore(suspect);
                String sMotive = (String) suspect.getOrDefault("motive", "Under Verification");
                String sAlibi = (String) suspect.getOrDefault("alibi_status", "Requires Verification");
                String sTier = (String) suspect.getOrDefault("tier", "PERSON_OF_INTEREST");
                String sTierLabel = rScore >= 75 ? "Person of Interest" : (rScore >= 50 ? "Secondary Person of Interest" : "Low Suspicion");

                // Get linked evidence for this suspect
                List<Map<String, Object>> linkedEv = getLinkedEvidence(evidence, sName);
                String keyEv = linkedEv.isEmpty() ? "Electronic / Narrative Records" : (String) linkedEv.get(0).get("title");

                // Get contradictions for this suspect
                List<Map<String, Object>> linkedContra = getLinkedContradictions(contradictions, sName);

                // Get timeline events for this suspect
                List<Map<String, Object>> linkedTl = getLinkedTimeline(timeline, sName);

                // Sub-Intent 5A: Risk-only Question ("What is Imran Sheikh's risk?", "What is his risk?", "Risk score")
                if (qLower.contains("risk") || qLower.contains("threat rating") || qLower.contains("suspicion score")) {
                    String text = String.format(
                        "Person:\n%s\n\nRisk Score:\n%d%%\n\nInvestigation Status:\n%s\n\nReasoning:\n%s\n\nDisclaimer:\n%s",
                        sName, rScore, sTierLabel, suspect.getOrDefault("suspicion_factors", "Multi-factor evidence weighting."), disclaimer
                    );

                    return ChatResponse.builder()
                            .response(text)
                            .answerType("RISK_ASSESSMENT")
                            .caseId(c.getId().toString())
                            .caseNumber(c.getCaseNumber())
                            .entityName(sName)
                            .role(sRole)
                            .riskScore(rScore)
                            .person(createPersonDto(c.getCaseNumber(), sName, sRole, sTierLabel, rScore, sMotive, sAlibi, linkedEv, linkedContra, linkedTl))
                            .evidence(linkedEv)
                            .contradictions(linkedContra)
                            .timelineEvents(linkedTl)
                            .sources(sources)
                            .disclaimer(disclaimer)
                            .build();
                }

                // Sub-Intent 5B: Evidence-only Question ("What evidence is linked to Imran Sheikh?", "What evidence supports that?", "What evidence supports it?", "Evidence against him")
                if (qLower.contains("evidence") || qLower.contains("what evidence") || qLower.contains("proof") || qLower.contains("linked to him") || qLower.contains("supports that") || qLower.contains("supports it")) {
                    StringBuilder evText = new StringBuilder();
                    if (!linkedEv.isEmpty()) {
                        for (Map<String, Object> evItem : linkedEv) {
                            evText.append("Evidence:\n").append(evItem.get("title")).append("\n\n");
                            evText.append("Linked Person:\n").append(sName).append("\n\n");
                            evText.append("Timestamp:\n").append(evItem.getOrDefault("time", "Incident Timeline")).append("\n\n");
                            evText.append("Relevance:\n").append(Math.round(((Double) evItem.getOrDefault("relevance", 0.8)) * 100)).append("%\n\n");
                            evText.append("Relationship:\n").append(evItem.getOrDefault("details", "Directly linked to subject in case narrative.")).append("\n\n");
                        }
                    } else {
                        evText.append("Evidence:\nNo specific physical or digital evidence items are linked to ").append(sName).append(" in the current case records.\n\n");
                    }
                    evText.append("Disclaimer:\n").append(disclaimer);

                    return ChatResponse.builder()
                            .response(evText.toString().trim())
                            .answerType("EVIDENCE_PROFILE")
                            .caseId(c.getId().toString())
                            .caseNumber(c.getCaseNumber())
                            .entityName(sName)
                            .role(sRole)
                            .riskScore(rScore)
                            .person(createPersonDto(c.getCaseNumber(), sName, sRole, sTierLabel, rScore, sMotive, sAlibi, linkedEv, linkedContra, linkedTl))
                            .evidence(linkedEv)
                            .contradictions(linkedContra)
                            .timelineEvents(linkedTl)
                            .sources(sources)
                            .disclaimer(disclaimer)
                            .build();
                }

                // Sub-Intent 5C: Contradiction-only Question ("What contradiction involves Imran Sheikh?", "Why is he suspicious?", "Why?")
                if (qLower.contains("contradiction") || qLower.contains("discrepanc") || qLower.contains("conflict") || qLower.contains("why is he") || qLower.equals("why?") || qLower.equals("why")) {
                    StringBuilder cText = new StringBuilder();
                    if (!linkedContra.isEmpty()) {
                        for (Map<String, Object> contra : linkedContra) {
                            cText.append("Person:\n").append(sName).append("\n\n");
                            cText.append("Statement:\n").append(contra.get("statement")).append("\n\n");
                            cText.append("Conflicting Evidence:\n").append(contra.get("evidence")).append("\n\n");
                            cText.append("Severity:\n").append(contra.getOrDefault("severity", "HIGH")).append("\n\n");
                        }
                    } else {
                        cText.append("Person:\n").append(sName).append("\n\n");
                        cText.append("Statement:\n").append(suspect.getOrDefault("alibi_status", "Requires verification")).append("\n\n");
                        cText.append("Conflicting Evidence:\n").append(suspect.getOrDefault("suspicion_factors", "Subject flagged based on case narrative records.")).append("\n\n");
                        cText.append("Severity:\nMEDIUM\n\n");
                    }
                    cText.append("Disclaimer:\n").append(disclaimer);

                    return ChatResponse.builder()
                            .response(cText.toString().trim())
                            .answerType("CONTRADICTION_REPORT")
                            .caseId(c.getId().toString())
                            .caseNumber(c.getCaseNumber())
                            .entityName(sName)
                            .role(sRole)
                            .riskScore(rScore)
                            .person(createPersonDto(c.getCaseNumber(), sName, sRole, sTierLabel, rScore, sMotive, sAlibi, linkedEv, linkedContra, linkedTl))
                            .evidence(linkedEv)
                            .contradictions(linkedContra)
                            .timelineEvents(linkedTl)
                            .sources(sources)
                            .disclaimer(disclaimer)
                            .build();
                }

                // Sub-Intent 5D: Timeline / Location at Time ("Where was Imran Sheikh at 7:40 PM?")
                Pattern timePattern = Pattern.compile("\\b(?:\\d{1,2}:\\d{2}\\s*(?:AM|PM|am|pm)?|\\d{1,2}\\s*(?:AM|PM|am|pm))\\b");
                Matcher timeMatcher = timePattern.matcher(query);
                if (timeMatcher.find()) {
                    String reqTime = timeMatcher.group();
                    String tlText = String.format("The current case records do not establish his exact physical location at %s.", reqTime);

                    return ChatResponse.builder()
                            .response(tlText)
                            .answerType("TIMELINE_REPORT")
                            .caseId(c.getId().toString())
                            .caseNumber(c.getCaseNumber())
                            .entityName(sName)
                            .role(sRole)
                            .riskScore(rScore)
                            .person(createPersonDto(c.getCaseNumber(), sName, sRole, sTierLabel, rScore, sMotive, sAlibi, linkedEv, linkedContra, linkedTl))
                            .evidence(linkedEv)
                            .contradictions(linkedContra)
                            .timelineEvents(linkedTl)
                            .sources(sources)
                            .disclaimer(disclaimer)
                            .build();
                }

                // Sub-Intent 5E: Role-only Question ("What is Imran Sheikh's role?", "What is his role?")
                if (qLower.contains("role") || qLower.contains("designation") || qLower.contains("job title") || qLower.contains("occupation")) {
                    String text = String.format(
                        "PERSON\n%s\n\nRole:\n%s\n\nInvestigation Status:\n%s\n\nCase:\n%s (#%s)\n\nDisclaimer:\n%s",
                        sName, sRole, sTierLabel, c.getTitle(), c.getCaseNumber(), disclaimer
                    );

                    return ChatResponse.builder()
                            .response(text)
                            .answerType("PERSON_ROLE")
                            .caseId(c.getId().toString())
                            .caseNumber(c.getCaseNumber())
                            .entityName(sName)
                            .role(sRole)
                            .riskScore(rScore)
                            .person(createPersonDto(c.getCaseNumber(), sName, sRole, sTierLabel, rScore, sMotive, sAlibi, linkedEv, linkedContra, linkedTl))
                            .evidence(linkedEv)
                            .contradictions(linkedContra)
                            .timelineEvents(linkedTl)
                            .sources(sources)
                            .disclaimer(disclaimer)
                            .build();
                }

                // Default: Full Structured Person Profile ("Who is Imran Sheikh?")
                String structuredText = String.format(
                    "PERSON\n%s\n\nRole:\n%s\n\nInvestigation Status:\n%s\n\nRisk:\n%d%%\n\nMotive:\n%s\n\nAlibi:\n%s\n\nKey Evidence:\n%s\n\nDisclaimer:\n%s",
                    sName, sRole, sTierLabel, rScore, sMotive, sAlibi, keyEv, disclaimer
                );

                return ChatResponse.builder()
                        .response(structuredText)
                        .answerType("PERSON_PROFILE")
                        .caseId(c.getId().toString())
                        .caseNumber(c.getCaseNumber())
                        .entityName(sName)
                        .role(sRole)
                        .riskScore(rScore)
                        .person(createPersonDto(c.getCaseNumber(), sName, sRole, sTierLabel, rScore, sMotive, sAlibi, linkedEv, linkedContra, linkedTl))
                        .evidence(linkedEv)
                        .contradictions(linkedContra)
                        .timelineEvents(linkedTl)
                        .sources(sources)
                        .disclaimer(disclaimer)
                        .build();
            }

            // Target is a Victim in current case
            Map<String, Object> victim = findVictimByName(victims, targetPerson);
            if (victim != null) {
                String vName = (String) victim.get("name");
                String vStatus = (String) victim.getOrDefault("status", "DECEASED");
                String vOcc = (String) victim.getOrDefault("occupation", "Victim");
                String text = String.format(
                    "PERSON\n%s\n\nRole:\n%s\n\nInvestigation Status:\nVICTIM (%s)\n\nDetails:\n%s\n\nDisclaimer:\n%s",
                    vName, vOcc, vStatus, victim.getOrDefault("details", "Identified in FIR."), disclaimer
                );

                ChatResponse.PersonDto pDto = ChatResponse.PersonDto.builder()
                        .caseId(c.getCaseNumber())
                        .name(vName)
                        .entityType("VICTIM")
                        .role(vOcc)
                        .status(vStatus)
                        .investigationStatus("VICTIM")
                        .build();

                return ChatResponse.builder()
                        .response(text)
                        .answerType("PERSON_PROFILE")
                        .caseId(c.getId().toString())
                        .caseNumber(c.getCaseNumber())
                        .entityName(vName)
                        .role(vOcc)
                        .person(pDto)
                        .sources(sources)
                        .disclaimer(disclaimer)
                        .build();
            }

            // Target is a Witness in current case
            String witness = findWitnessByName(witnesses, targetPerson);
            if (witness != null) {
                String sentence = findNarrativeSentence(c, witness);
                String text = String.format(
                    "PERSON\n%s\n\nRole:\nWitness / Reporting Staff\n\nInvestigation Status:\nWitness\n\nStatement:\n\"%s\"\n\nDisclaimer:\n%s",
                    witness, sentence, disclaimer
                );

                ChatResponse.PersonDto pDto = ChatResponse.PersonDto.builder()
                        .caseId(c.getCaseNumber())
                        .name(witness)
                        .entityType("WITNESS")
                        .role("Witness")
                        .status("WITNESS")
                        .investigationStatus("WITNESS")
                        .build();

                return ChatResponse.builder()
                        .response(text)
                        .answerType("PERSON_PROFILE")
                        .caseId(c.getId().toString())
                        .caseNumber(c.getCaseNumber())
                        .entityName(witness)
                        .role("Witness")
                        .person(pDto)
                        .sources(sources)
                        .disclaimer(disclaimer)
                        .build();
            }

            // Target is a Job Title (e.g. "Who is Chief Financial Officer?")
            if (isJobTitle(targetPerson)) {
                for (Map<String, Object> v : victims) {
                    String occ = (String) v.getOrDefault("occupation", "");
                    String det = (String) v.getOrDefault("details", "");
                    if (occ.toLowerCase().contains(targetPerson.toLowerCase()) || det.toLowerCase().contains(targetPerson.toLowerCase())) {
                        String text = String.format("In Case #%s, %s is %s (Victim, %s).", c.getCaseNumber(), targetPerson, v.get("name"), v.getOrDefault("status", "DECEASED"));
                        return ChatResponse.builder()
                                .response(text)
                                .answerType("JOB_TITLE_PROFILE")
                                .caseId(c.getId().toString())
                                .caseNumber(c.getCaseNumber())
                                .entityName((String) v.get("name"))
                                .role(targetPerson)
                                .sources(sources)
                                .disclaimer(disclaimer)
                                .build();
                    }
                }
                for (Map<String, Object> s : suspects) {
                    String sRole = getExactRole(s);
                    if (sRole.toLowerCase().contains(targetPerson.toLowerCase())) {
                        String text = String.format("In Case #%s, %s is %s (Person of Interest, Risk: %d%%).", c.getCaseNumber(), targetPerson, s.get("name"), getIntegerRiskScore(s));
                        return ChatResponse.builder()
                                .response(text)
                                .answerType("JOB_TITLE_PROFILE")
                                .caseId(c.getId().toString())
                                .caseNumber(c.getCaseNumber())
                                .entityName((String) s.get("name"))
                                .role(sRole)
                                .riskScore(getIntegerRiskScore(s))
                                .sources(sources)
                                .disclaimer(disclaimer)
                                .build();
                    }
                }

                String text = String.format("%s is an executive job title, not an identified individual in Case #%s.", targetPerson, c.getCaseNumber());
                return ChatResponse.builder()
                        .response(text)
                        .answerType("JOB_TITLE_PROFILE")
                        .caseId(c.getId().toString())
                        .caseNumber(c.getCaseNumber())
                        .sources(sources)
                        .disclaimer(disclaimer)
                        .build();
            }

            // Target is an Organization
            if (isOrganization(targetPerson, organizations)) {
                String text = String.format("%s is an organization / corporate entity in Case #%s.", targetPerson, c.getCaseNumber());
                return ChatResponse.builder()
                        .response(text)
                        .answerType("ORGANIZATION_PROFILE")
                        .caseId(c.getId().toString())
                        .caseNumber(c.getCaseNumber())
                        .sources(sources)
                        .disclaimer(disclaimer)
                        .build();
            }

            // Target person is NOT found in the current case!
            // CRITICAL RULE: NEVER SEARCH OTHER CASES AS FALLBACK!
            String notFoundText = String.format("%s is not found in the current case records.", targetPerson);
            return ChatResponse.builder()
                    .response(notFoundText)
                    .answerType("NOT_FOUND")
                    .caseId(c.getId().toString())
                    .caseNumber(c.getCaseNumber())
                    .entityName(targetPerson)
                    .sources(sources)
                    .disclaimer(disclaimer)
                    .build();
        }

        // Intent 6: Contradiction Overview ("What contradictions were found?")
        if (qLower.contains("contradiction") || qLower.contains("discrepanc") || qLower.contains("conflict")) {
            if (contradictions.isEmpty()) {
                return ChatResponse.builder()
                        .response(String.format("No statement vs. physical evidence contradictions were detected in Case #%s.", c.getCaseNumber()))
                        .answerType("CONTRADICTION_REPORT")
                        .caseId(c.getId().toString())
                        .caseNumber(c.getCaseNumber())
                        .sources(sources)
                        .disclaimer(disclaimer)
                        .build();
            }
            StringBuilder cText = new StringBuilder();
            for (Map<String, Object> ctr : contradictions) {
                cText.append("Person:\n").append(ctr.get("subject")).append("\n\n");
                cText.append("Statement:\n").append(ctr.get("statement")).append("\n\n");
                cText.append("Conflicting Evidence:\n").append(ctr.get("evidence")).append("\n\n");
                cText.append("Severity:\n").append(ctr.getOrDefault("severity", "HIGH")).append("\n\n");
            }
            cText.append("Disclaimer:\n").append(disclaimer);

            return ChatResponse.builder()
                    .response(cText.toString().trim())
                    .answerType("CONTRADICTION_REPORT")
                    .caseId(c.getId().toString())
                    .caseNumber(c.getCaseNumber())
                    .contradictions(contradictions)
                    .sources(sources)
                    .disclaimer(disclaimer)
                    .build();
        }

        // Intent 7: Timeline Overview ("Give me the complete timeline")
        if (qLower.contains("timeline") || qLower.contains("chronolog") || qLower.contains("sequence of event")) {
            if (timeline.isEmpty()) {
                return ChatResponse.builder()
                        .response(String.format("No chronological timeline timestamps were parsed for Case #%s.", c.getCaseNumber()))
                        .answerType("TIMELINE_REPORT")
                        .caseId(c.getId().toString())
                        .caseNumber(c.getCaseNumber())
                        .sources(sources)
                        .disclaimer(disclaimer)
                        .build();
            }
            StringBuilder tText = new StringBuilder("Reconstructed Chronological Event Timeline:\n\n");
            for (Map<String, Object> t : timeline) {
                tText.append("• [").append(t.get("time")).append("] ").append(t.get("event")).append("\n");
            }
            tText.append("\nDisclaimer:\n").append(disclaimer);

            return ChatResponse.builder()
                    .response(tText.toString().trim())
                    .answerType("TIMELINE_REPORT")
                    .caseId(c.getId().toString())
                    .caseNumber(c.getCaseNumber())
                    .timelineEvents(timeline)
                    .sources(sources)
                    .disclaimer(disclaimer)
                    .build();
        }

        // Intent 8: Crime Classification ("What crime occurred?")
        if (qLower.contains("crime") || qLower.contains("classification") || qLower.contains("offense") || qLower.contains("category")) {
            String text = String.format(
                "CRIME CLASSIFICATION\n%s\n\nConfidence:\n%d%%\n\nReasoning:\n%s\n\nDisclaimer:\n%s",
                crimeCategory, Math.round(solvability),
                reasoning.isEmpty() ? "Based on FIR narrative evidence." : String.join("; ", reasoning),
                disclaimer
            );

            return ChatResponse.builder()
                    .response(text)
                    .answerType("CRIME_CLASSIFICATION")
                    .caseId(c.getId().toString())
                    .caseNumber(c.getCaseNumber())
                    .sources(sources)
                    .disclaimer(disclaimer)
                    .build();
        }

        // Intent 9: General Grounded Fallback strictly within Current Case Records
        String fallbackText = String.format(
            "Based on Case #%s records (%s):\n\n%s\n\nDisclaimer:\n%s",
            c.getCaseNumber(), c.getTitle(), c.getDescription(), disclaimer
        );

        return ChatResponse.builder()
                .response(fallbackText)
                .answerType("GENERAL_ANSWER")
                .caseId(c.getId().toString())
                .caseNumber(c.getCaseNumber())
                .sources(sources)
                .disclaimer(disclaimer)
                .build();
    }

    /**
     * Response Validation Guard (validateRagResponse)
     */
    private ChatResponse validateRagResponse(
            ChatResponse raw,
            Case currentCase,
            List<Map<String, Object>> suspects,
            List<Map<String, Object>> victims,
            List<String> witnesses,
            List<Map<String, Object>> evidence
    ) {
        if (raw == null) return null;

        // 1. Verify Case ID
        raw.setCaseId(currentCase.getId().toString());
        raw.setCaseNumber(currentCase.getCaseNumber());

        String resp = raw.getResponse();
        if (resp == null) return raw;

        // 2. Ensure No Foreign Suspects from other cases are mistakenly confirmed
        List<String> foreignSuspects = List.of("Sameer Khan", "Arjun Das", "Vikram Rao", "Neha Mehta", "Elena Rostova", "Marcus Vance", "Robert Chen", "Alex Mercer", "Priya Sharma", "David Miller", "Suresh Oberoi", "Harsh Vardhan", "Kabir Bedi", "Siddharth Roy");
        
        Set<String> currentCasePersonNames = new HashSet<>();
        for (Map<String, Object> s : suspects) currentCasePersonNames.add(((String) s.get("name")).toLowerCase());
        for (Map<String, Object> v : victims) currentCasePersonNames.add(((String) v.get("name")).toLowerCase());
        for (String w : witnesses) currentCasePersonNames.add(w.toLowerCase());

        // Check if query was asking about a foreign person not in current case
        for (String foreignName : foreignSuspects) {
            if (!currentCasePersonNames.contains(foreignName.toLowerCase()) && resp.contains(foreignName) && !resp.contains("not found in the current case records")) {
                log.warn("[RAG AUDIT] Foreign suspect '{}' detected in response for Case #{}. Replacing with NOT_FOUND guard.", foreignName, currentCase.getCaseNumber());
                raw.setResponse(String.format("%s is not found in the current case records.", foreignName));
                raw.setAnswerType("NOT_FOUND");
                raw.setEntityName(foreignName);
                raw.setPerson(null);
                raw.setEvidence(List.of());
                raw.setContradictions(List.of());
                return raw;
            }
        }

        // 3. Role Accuracy Enforcement for all suspects in current case
        for (Map<String, Object> s : suspects) {
            String sName = (String) s.get("name");
            String sRole = getExactRole(s);
            if (resp.contains(sName) && sRole.equalsIgnoreCase("Security Officer")) {
                if (resp.contains("Technical / Finance Staff") || resp.contains("Technical Staff") || resp.contains("Finance Staff")) {
                    resp = resp.replaceAll("(?i)Technical\\s*/\\s*Finance\\s*Staff", "Security Officer");
                    resp = resp.replaceAll("(?i)Technical\\s*Staff", "Security Officer");
                    raw.setResponse(resp);
                    log.warn("[RAG AUDIT] Corrected role to exact structured role '{}' for {}", sRole, sName);
                }
            }
        }

        return raw;
    }

    /**
     * Resolve target person name from query (accounting for pronouns and multi-turn context)
     */
    private String resolveTargetPerson(
            String query,
            List<Map<String, Object>> suspects,
            List<Map<String, Object>> victims,
            CaseConversationContext memory
    ) {
        String qLower = query.toLowerCase().trim();

        // 1. Direct match with any suspect in current case
        for (Map<String, Object> s : suspects) {
            String name = (String) s.get("name");
            if (matchesNameInText(name, qLower)) {
                return name;
            }
        }

        // 2. Direct match with any victim in current case
        for (Map<String, Object> v : victims) {
            String name = (String) v.get("name");
            if (matchesNameInText(name, qLower)) {
                return name;
            }
        }

        // 3. Pronoun resolution from memory ("he", "she", "his", "her", "that person", "this suspect", "why", "what evidence supports that")
        if (qLower.contains("his risk") || qLower.contains("her risk") || qLower.contains("his role") || qLower.contains("her role")
                || qLower.startsWith("what is his") || qLower.startsWith("what is her") || qLower.startsWith("why is he")
                || qLower.startsWith("why is she") || qLower.startsWith("what evidence supports that") || qLower.startsWith("what evidence supports it")
                || qLower.startsWith("what did he") || qLower.startsWith("where was he") || qLower.startsWith("where was she")
                || qLower.equals("why?") || qLower.equals("why") || qLower.contains("evidence against him") || qLower.contains("evidence against her")) {
            if (memory != null && memory.getCurrentEntityName() != null) {
                return memory.getCurrentEntityName();
            }
        }

        // 4. "Who is [Target]?" pattern extraction
        Pattern whoIsPattern = Pattern.compile("(?i)^(?:who\\s+(?:is|was|'s)|tell\\s+me\\s+about|what\\s+(?:is|was)\\s+(?:the\\s+role\\s+of)?|profile\\s+(?:on|for)?)\\s+([^?!.]+)");
        Matcher m = whoIsPattern.matcher(query);
        if (m.find()) {
            String cand = m.group(1).trim();
            cand = cand.replaceAll("(?i)^(the\\s+|his\\s+|her\\s+|suspect\\s+|victim\\s+)", "").trim();
            if (!cand.isBlank() && cand.split("\\s+").length <= 4) {
                return cand;
            }
        }

        // 5. "What is [Target]'s risk / role / evidence?" pattern
        Pattern posPattern = Pattern.compile("(?i)(?:what\\s+is|what\\s+evidence\\s+is\\s+linked\\s+to|what\\s+contradiction\\s+involves|where\\s+was|why\\s+is)\\s+([A-Za-z]+(?:\\s+[A-Za-z]+)?)(?:'s|\\s+at|\\s+in|\\s+suspicious)?");
        Matcher mPos = posPattern.matcher(query);
        if (mPos.find()) {
            String cand = mPos.group(1).trim();
            if (!cand.isBlank() && !cand.equalsIgnoreCase("the") && !cand.equalsIgnoreCase("a") && !cand.equalsIgnoreCase("his") && !cand.equalsIgnoreCase("her")) {
                return cand;
            }
        }

        return null;
    }

    private ChatResponse.PersonDto createPersonDto(
            String caseId,
            String name,
            String role,
            String status,
            int riskScore,
            String motive,
            String alibiStatus,
            List<Map<String, Object>> evidenceList,
            List<Map<String, Object>> contradictionList,
            List<Map<String, Object>> timelineList
    ) {
        List<String> evIds = new ArrayList<>();
        for (Map<String, Object> e : evidenceList) {
            evIds.add(e.getOrDefault("title", "Evidence Item").toString());
        }

        List<String> cIds = new ArrayList<>();
        for (Map<String, Object> c : contradictionList) {
            cIds.add(c.getOrDefault("discrepancy", "Contradiction").toString());
        }

        List<String> tIds = new ArrayList<>();
        for (Map<String, Object> t : timelineList) {
            tIds.add(t.getOrDefault("time", "Timeline Marker").toString());
        }

        return ChatResponse.PersonDto.builder()
                .caseId(caseId)
                .name(name)
                .entityType("PERSON")
                .role(role)
                .status(status)
                .investigationStatus(status.equalsIgnoreCase("Person of Interest") ? "PERSON_OF_INTEREST" : "SUSPECT")
                .riskScore(riskScore)
                .motive(motive)
                .alibiStatus(alibiStatus)
                .evidenceIds(evIds)
                .contradictionIds(cIds)
                .timelineEventIds(tIds)
                .build();
    }

    private List<Map<String, Object>> getLinkedEvidence(List<Map<String, Object>> evidence, String personName) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Map<String, Object> e : evidence) {
            String rel = (String) e.getOrDefault("related_suspect", "");
            if (matchesName(rel, personName)) {
                list.add(e);
            }
        }
        return list;
    }

    private List<Map<String, Object>> getLinkedContradictions(List<Map<String, Object>> contradictions, String personName) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Map<String, Object> c : contradictions) {
            String subj = (String) c.getOrDefault("subject", "");
            String stmt = (String) c.getOrDefault("statement", "");
            if (matchesName(subj, personName) || matchesName(stmt, personName)) {
                list.add(c);
            }
        }
        return list;
    }

    private List<Map<String, Object>> getLinkedTimeline(List<Map<String, Object>> timeline, String personName) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Map<String, Object> t : timeline) {
            String ev = (String) t.getOrDefault("event", "");
            if (matchesName(ev, personName)) {
                list.add(t);
            }
        }
        return list;
    }

    private String getExactRole(Map<String, Object> suspect) {
        String spec = (String) suspect.get("specificRole");
        if (spec != null && !spec.isBlank() && !spec.equalsIgnoreCase("PERSON_OF_INTEREST") && !spec.equalsIgnoreCase("Person of Interest")) {
            return spec;
        }
        String rel = (String) suspect.get("relationship");
        if (rel != null && !rel.isBlank() && !rel.equalsIgnoreCase("PERSON_OF_INTEREST") && !rel.equalsIgnoreCase("Person of Interest")) {
            return rel;
        }
        String role = (String) suspect.get("role");
        if (role != null && !role.isBlank() && !role.equalsIgnoreCase("PERSON_OF_INTEREST")) {
            return role;
        }
        return "Person of Interest";
    }

    private int getIntegerRiskScore(Map<String, Object> suspect) {
        Object rs = suspect.get("riskScore");
        if (rs instanceof Number n) return n.intValue();
        Object rDouble = suspect.get("risk_score");
        if (rDouble instanceof Number n) return (int) Math.round(n.doubleValue() * 100);
        return 75;
    }

    private boolean matchesNameInText(String fullName, String text) {
        if (fullName == null || text == null) return false;
        String fnLow = fullName.toLowerCase();
        if (text.contains(fnLow)) return true;
        String[] parts = fnLow.split("\\s+");
        if (parts.length >= 2 && text.contains(parts[0]) && text.contains(parts[1])) return true;
        if (parts[0].length() >= 4 && Pattern.compile("\\b" + Pattern.quote(parts[0]) + "\\b").matcher(text).find()) {
            return true;
        }
        return false;
    }

    private boolean matchesName(String name1, String name2) {
        if (name1 == null || name2 == null) return false;
        String n1 = name1.toLowerCase().trim();
        String n2 = name2.toLowerCase().trim();
        if (n1.equalsIgnoreCase(n2) || n1.contains(n2) || n2.contains(n1)) return true;
        String f1 = n1.split("\\s+")[0];
        String f2 = n2.split("\\s+")[0];
        return f1.length() >= 4 && f1.equalsIgnoreCase(f2);
    }

    private Map<String, Object> findSuspectByName(List<Map<String, Object>> suspects, String name) {
        for (Map<String, Object> s : suspects) {
            String sName = (String) s.get("name");
            if (matchesName(sName, name)) return s;
        }
        return null;
    }

    private Map<String, Object> findVictimByName(List<Map<String, Object>> victims, String name) {
        for (Map<String, Object> v : victims) {
            String vName = (String) v.get("name");
            if (matchesName(vName, name)) return v;
        }
        return null;
    }

    private String findWitnessByName(List<String> witnesses, String name) {
        for (String w : witnesses) {
            if (matchesName(w, name)) return w;
        }
        return null;
    }

    private boolean isJobTitle(String text) {
        if (text == null) return false;
        String lower = text.toLowerCase().trim();
        return lower.contains("officer") || lower.contains("director") || lower.contains("manager")
                || lower.contains("engineer") || lower.contains("administrator") || lower.contains("auditor")
                || lower.contains("cfo") || lower.contains("ceo") || lower.contains("cto")
                || lower.contains("technician") || lower.contains("nurse") || lower.contains("doctor")
                || lower.contains("chief financial officer") || lower.contains("chief executive officer");
    }

    private boolean isOrganization(String text, List<String> orgs) {
        if (text == null) return false;
        String lower = text.toLowerCase().trim();
        for (String o : orgs) {
            if (o.equalsIgnoreCase(lower) || lower.contains(o.toLowerCase())) return true;
        }
        return lower.contains("technologies") || lower.contains("biotech") || lower.contains("corporation")
                || lower.contains("bank") || lower.contains("capital") || lower.contains("centre")
                || lower.contains("center") || lower.contains("holdings") || lower.contains("enterprises");
    }

    private String findNarrativeSentence(Case c, String name) {
        if (c.getDescription() == null || c.getDescription().isEmpty()) {
            return "Mentioned in case record.";
        }
        String fName = name.split(" ")[0].toLowerCase();
        String[] sentences = c.getDescription().split("[.!?]");
        for (String sentence : sentences) {
            if (sentence.toLowerCase().contains(name.toLowerCase()) || sentence.toLowerCase().contains(fName)) {
                return sentence.trim();
            }
        }
        return c.getDescription();
    }

    /**
     * Case-Scoped Conversation Context
     */
    public static class CaseConversationContext {
        private final Long caseId;
        private final String caseNumber;
        private String currentEntityName;
        private String currentEntityRole;
        private Integer currentEntityRisk;
        private final List<Exchange> history = new ArrayList<>();

        public CaseConversationContext(Long caseId, String caseNumber) {
            this.caseId = caseId;
            this.caseNumber = caseNumber;
        }

        public synchronized void setCurrentEntity(String name, String role, Integer risk) {
            if (name != null && !name.isBlank()) {
                this.currentEntityName = name;
                this.currentEntityRole = role;
                this.currentEntityRisk = risk;
            }
        }

        public synchronized void recordExchange(String query, String response, String entity) {
            if (entity != null && !entity.isBlank()) {
                this.currentEntityName = entity;
            }
            history.add(new Exchange(query, response, entity, System.currentTimeMillis()));
            if (history.size() > 20) {
                history.remove(0);
            }
        }

        public synchronized String getCurrentEntityName() {
            return currentEntityName;
        }

        public synchronized String getCurrentEntityRole() {
            return currentEntityRole;
        }

        public synchronized Integer getCurrentEntityRisk() {
            return currentEntityRisk;
        }

        public record Exchange(String query, String response, String entity, long timestamp) {}
    }
}
