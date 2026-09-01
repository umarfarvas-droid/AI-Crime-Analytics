package com.crime.analytics.ai.services;

import org.springframework.stereotype.Service;

import com.crime.analytics.models.entities.Case;
import com.crime.analytics.models.entities.ExtractedEntity;
import com.crime.analytics.models.repositories.ExtractedEntityRepository;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for building and analyzing entity relationship graphs
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GraphBuilderService {

    private final ExtractedEntityRepository extractedEntityRepository;

    /**
     * Build an entity relationship graph for a case
     */
    public EntityGraph buildCaseGraph(Case caseEntity) {
        log.info("Building entity graph for case: {}", caseEntity.getId());

        EntityGraph graph = new EntityGraph();

        // Get all extracted entities for this case
        caseEntity.getEvidences().forEach(evidence -> {
            List<ExtractedEntity> entities = extractedEntityRepository.findByEvidence_Id(evidence.getId());
            entities.forEach(entity -> {
                graph.addNode(entity);
                graph.addNodeToEvidence(entity.getId(), evidence.getId());
            });
        });

        // Build relationships between entities
        buildEntityRelationships(graph);

        return graph;
    }

    /**
     * Build relationships between entities in the graph
     */
    private void buildEntityRelationships(EntityGraph graph) {
        List<GraphNode> nodes = new ArrayList<>(graph.getNodes().values());

        for (int i = 0; i < nodes.size(); i++) {
            for (int j = i + 1; j < nodes.size(); j++) {
                GraphNode node1 = nodes.get(i);
                GraphNode node2 = nodes.get(j);

                double relationshipStrength = calculateRelationshipStrength(node1, node2);
                if (relationshipStrength > 0.3) {
                    graph.addEdge(node1.getId(), node2.getId(), relationshipStrength);
                }
            }
        }
    }

    /**
     * Calculate relationship strength between two entities
     */
    private Double calculateRelationshipStrength(GraphNode node1, GraphNode node2) {
        double strength = 0.0;

        // Same evidence sources increase relationship strength
        Set<Long> evidenceSources1 = new HashSet<>();
        Set<Long> evidenceSources2 = new HashSet<>();
        // In real implementation, these would be populated from the nodes

        int commonEvidences = (int) evidenceSources1.stream()
                .filter(evidenceSources2::contains)
                .count();

        strength += commonEvidences * 0.2;

        // Entity type compatibility
        strength += getTypeCompatibility(node1.getType(), node2.getType());

        return Math.min(strength, 1.0);
    }

    /**
     * Get compatibility score between entity types
     */
    private Double getTypeCompatibility(String type1, String type2) {
        // Define compatible entity type pairs
        Map<String, Set<String>> compatibility = new HashMap<>();
        compatibility.put("PERSON", Set.of("ORGANIZATION", "LOCATION", "PHONE_NUMBER", "EMAIL"));
        compatibility.put("ORGANIZATION", Set.of("PERSON", "LOCATION", "MONEY"));
        compatibility.put("LOCATION", Set.of("PERSON", "ORGANIZATION", "VEHICLE"));
        compatibility.put("VEHICLE", Set.of("PERSON", "LOCATION"));

        if (compatibility.containsKey(type1) && compatibility.get(type1).contains(type2)) {
            return 0.2;
        }
        return 0.0;
    }

    /**
     * Find connected components in the graph
     */
    public List<Set<Long>> findConnectedComponents(EntityGraph graph) {
        Map<Long, Boolean> visited = new HashMap<>();
        List<Set<Long>> components = new ArrayList<>();

        for (Long nodeId : graph.getNodes().keySet()) {
            if (!visited.getOrDefault(nodeId, false)) {
                Set<Long> component = new HashSet<>();
                dfs(nodeId, graph, visited, component);
                components.add(component);
            }
        }

        return components;
    }

    /**
     * Depth-first search for graph traversal
     */
    private void dfs(Long nodeId, EntityGraph graph, Map<Long, Boolean> visited, Set<Long> component) {
        visited.put(nodeId, true);
        component.add(nodeId);

        Set<Long> neighbors = graph.getNeighbors(nodeId);
        for (Long neighbor : neighbors) {
            if (!visited.getOrDefault(neighbor, false)) {
                dfs(neighbor, graph, visited, component);
            }
        }
    }

    /**
     * Find shortest path between two entities
     */
    public List<Long> findShortestPath(EntityGraph graph, Long startId, Long endId) {
        Map<Long, Long> parent = new HashMap<>();
        Queue<Long> queue = new LinkedList<>();
        Set<Long> visited = new HashSet<>();

        queue.offer(startId);
        visited.add(startId);

        while (!queue.isEmpty()) {
            Long current = queue.poll();
            if (current.equals(endId)) {
                return reconstructPath(parent, startId, endId);
            }

            Set<Long> neighbors = graph.getNeighbors(current);
            for (Long neighbor : neighbors) {
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    parent.put(neighbor, current);
                    queue.offer(neighbor);
                }
            }
        }

        return new ArrayList<>();
    }

    /**
     * Reconstruct path from parent map
     */
    private List<Long> reconstructPath(Map<Long, Long> parent, Long start, Long end) {
        List<Long> path = new ArrayList<>();
        Long current = end;

        while (current != null) {
            path.add(0, current);
            if (current.equals(start)) break;
            current = parent.get(current);
        }

        return path;
    }

    /**
     * Entity Graph class
     */
    @Data
    public static class EntityGraph {
        private Map<Long, GraphNode> nodes = new HashMap<>();
        private Map<Long, Set<Long>> adjacencyList = new HashMap<>();
        private Map<String, Double> edges = new HashMap<>();
        private Map<Long, Set<Long>> entityToEvidences = new HashMap<>();

        public void addNode(ExtractedEntity entity) {
            if (!nodes.containsKey(entity.getId())) {
                GraphNode node = GraphNode.builder()
                        .id(entity.getId())
                        .text(entity.getEntityText())
                        .type(entity.getType().name())
                        .confidence(entity.getConfidenceScore())
                        .build();
                nodes.put(entity.getId(), node);
                adjacencyList.put(entity.getId(), new HashSet<>());
            }
        }

        public void addEdge(Long from, Long to, Double weight) {
            String edgeKey = Math.min(from, to) + "-" + Math.max(from, to);
            edges.put(edgeKey, weight);
            adjacencyList.get(from).add(to);
            adjacencyList.get(to).add(from);
        }

        public void addNodeToEvidence(Long nodeId, Long evidenceId) {
            entityToEvidences.computeIfAbsent(nodeId, k -> new HashSet<>()).add(evidenceId);
        }

        public Set<Long> getNeighbors(Long nodeId) {
            return adjacencyList.getOrDefault(nodeId, new HashSet<>());
        }
    }

    /**
     * Graph Node class
     */
    @Data
    @lombok.Builder
    public static class GraphNode {
        private Long id;
        private String text;
        private String type;
        private Double confidence;
    }
}
