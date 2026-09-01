import React, { useState, useMemo } from 'react';
import { 
  Share2, User, HardDrive, MapPin, Clock, Building, 
  Info, Filter, Maximize2, ZoomIn, ZoomOut, RotateCcw, AlertTriangle 
} from 'lucide-react';

export default function InvestigationGraph({
  analysis,
  onSelectPerson,
  onSelectEvidence,
}) {
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'PERSON', 'EVIDENCE', 'EVENT', 'LOCATION'
  const [zoomLevel, setZoomLevel] = useState(1);

  // Extract real entities from analysis
  const suspects = analysis?.suspect_rankings || analysis?.personsOfInterest || [];
  const victim = analysis?.victim;
  const witnesses = analysis?.witnesses || [];
  const evidenceList = analysis?.evidence_vault || analysis?.evidence || [];
  const timelineEvents = analysis?.timeline || [];
  const locations = analysis?.locations || [];
  const organizations = analysis?.organizations || [];

  // Build graph nodes & edges dynamically from actual case data
  const { nodes, edges } = useMemo(() => {
    const nodeList = [];
    const edgeList = [];

    const width = 850;
    const height = 480;
    const centerX = width / 2;
    const centerY = height / 2;

    // 1. Center / Primary Victim or Case Node
    const primaryTitle = victim?.name || analysis?.primary_crime || 'CASE FOCUS';
    nodeList.push({
      id: 'center_focus',
      label: primaryTitle,
      type: 'VICTIM',
      subtext: victim?.occupation || 'Primary Focus',
      x: centerX,
      y: centerY,
      color: '#f43f5e',
      radius: 28,
    });

    // 2. Suspect / Person Nodes (Arranged on inner left/top orbit)
    suspects.forEach((s, idx) => {
      const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim();
      const angle = (Math.PI * 0.8 / Math.max(1, suspects.length)) * idx - Math.PI * 0.9;
      const dist = 170;
      const x = centerX + dist * Math.cos(angle);
      const y = centerY + dist * Math.sin(angle);
      const risk = s.risk_score !== undefined ? s.risk_score : 50;

      const nodeId = `person_${idx}`;
      nodeList.push({
        id: nodeId,
        label: name,
        type: 'PERSON',
        subtext: s.role || 'Suspect',
        risk,
        data: s,
        x,
        y,
        color: risk >= 75 ? '#ef4444' : risk >= 50 ? '#f59e0b' : '#06b6d4',
        radius: 24,
      });

      // Link Suspect to Center Focus
      edgeList.push({
        id: `e_person_${idx}`,
        source: nodeId,
        target: 'center_focus',
        label: s.motive ? 'MOTIVE / DISPUTE' : 'INVOLVED',
        color: risk >= 75 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(6, 182, 212, 0.5)',
      });
    });

    // 3. Evidence Nodes (Arranged on inner right/bottom orbit)
    evidenceList.slice(0, 8).forEach((ev, idx) => {
      const angle = (Math.PI * 0.9 / Math.max(1, Math.min(8, evidenceList.length))) * idx + Math.PI * 0.1;
      const dist = 185;
      const x = centerX + dist * Math.cos(angle);
      const y = centerY + dist * Math.sin(angle);

      const nodeId = `ev_${idx}`;
      nodeList.push({
        id: nodeId,
        label: ev.title || 'Evidence Artifact',
        type: 'EVIDENCE',
        subtext: ev.category || 'Forensic',
        data: ev,
        x,
        y,
        color: '#3b82f6',
        radius: 22,
      });

      // Link Evidence to Center Focus or specific suspect
      edgeList.push({
        id: `e_ev_${idx}`,
        source: nodeId,
        target: 'center_focus',
        label: 'RECOVERED AT SCENE',
        color: 'rgba(59, 130, 246, 0.6)',
      });

      // If evidence mentions a suspect name, add direct edge
      suspects.forEach((s, sIdx) => {
        const sName = (s.name || '').toLowerCase();
        if (sName && (ev.details?.toLowerCase().includes(sName) || ev.related_suspect?.toLowerCase().includes(sName))) {
          edgeList.push({
            id: `e_ev_${idx}_person_${sIdx}`,
            source: nodeId,
            target: `person_${sIdx}`,
            label: 'CORROBORATES',
            color: 'rgba(244, 63, 94, 0.8)',
            isAlert: true,
          });
        }
      });
    });

    // 4. Timeline Event Anchors (Outer Ring)
    timelineEvents.slice(0, 5).forEach((t, idx) => {
      const angle = (Math.PI * 2 / 5) * idx - Math.PI / 2;
      const dist = 230;
      const x = centerX + dist * Math.cos(angle);
      const y = centerY + dist * Math.sin(angle);

      const nodeId = `timeline_${idx}`;
      nodeList.push({
        id: nodeId,
        label: t.time || 'Timestamp',
        type: 'EVENT',
        subtext: t.event ? t.event.slice(0, 24) + '...' : 'Event',
        data: t,
        x,
        y,
        color: '#10b981',
        radius: 18,
      });
    });

    return { nodes: nodeList, edges: edgeList };
  }, [suspects, victim, evidenceList, timelineEvents]);

  // Determine connected nodes when one is hovered
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return null;
    const set = new Set([hoveredNodeId]);
    edges.forEach((e) => {
      if (e.source === hoveredNodeId) set.add(e.target);
      if (e.target === hoveredNodeId) set.add(e.source);
    });
    return set;
  }, [hoveredNodeId, edges]);

  const handleNodeClick = (node) => {
    if (node.type === 'PERSON' && node.data) {
      onSelectPerson?.(node.data);
    } else if (node.type === 'EVIDENCE' && node.data) {
      onSelectEvidence?.(node.data);
    }
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case 'PERSON':
      case 'VICTIM':
        return User;
      case 'EVIDENCE':
        return HardDrive;
      case 'EVENT':
        return Clock;
      case 'LOCATION':
        return MapPin;
      default:
        return Building;
    }
  };

  return (
    <div className="forensic-panel p-6 rounded-2xl space-y-4 border border-slate-800 shadow-xl hud-corner relative overflow-hidden">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-cyan-glow">
            <Share2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold font-display text-white tracking-wide">
                INVESTIGATION RELATIONSHIP GRAPH
              </h2>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                INTERACTIVE NETWORK
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Multi-Entity Relationship Mapping • Click Any Node for Deep-Dive Dossier
            </p>
          </div>
        </div>

        {/* Zoom & Legend Controls */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <button
            onClick={() => setZoomLevel((prev) => Math.min(1.4, prev + 0.1))}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((prev) => Math.max(0.7, prev - 0.1))}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main SVG Interactive Graph Canvas */}
      <div className="relative w-full h-[480px] bg-[#05070d] rounded-xl border border-slate-800 overflow-hidden select-none flex items-center justify-center">
        
        {/* Background Subtle Radar Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

        <svg
          viewBox="0 0 850 480"
          className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Edges / Connections */}
          {edges.map((edge) => {
            const srcNode = nodes.find((n) => n.id === edge.source);
            const tgtNode = nodes.find((n) => n.id === edge.target);
            if (!srcNode || !tgtNode) return null;

            const isDimmed = connectedNodeIds && !connectedNodeIds.has(edge.source) && !connectedNodeIds.has(edge.target);
            const isHighlighted = connectedNodeIds && (connectedNodeIds.has(edge.source) && connectedNodeIds.has(edge.target));

            return (
              <g key={edge.id} className="transition-opacity duration-300" opacity={isDimmed ? 0.15 : 1}>
                {/* Connection Line */}
                <line
                  x1={srcNode.x}
                  y1={srcNode.y}
                  x2={tgtNode.x}
                  y2={tgtNode.y}
                  stroke={isHighlighted ? '#06b6d4' : edge.color}
                  strokeWidth={isHighlighted ? 2.5 : edge.isAlert ? 2 : 1.2}
                  strokeDasharray={edge.isAlert ? '4,4' : 'none'}
                />

                {/* Midpoint Label on Highlight */}
                {isHighlighted && (
                  <text
                    x={(srcNode.x + tgtNode.x) / 2}
                    y={(srcNode.y + tgtNode.y) / 2 - 5}
                    textAnchor="middle"
                    fill="#06b6d4"
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="bg-black px-1"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const isHovered = hoveredNodeId === node.id;
            const isDimmed = connectedNodeIds && !connectedNodeIds.has(node.id);
            const isConnected = connectedNodeIds && connectedNodeIds.has(node.id);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => handleNodeClick(node)}
                className="cursor-pointer transition-all duration-300"
                opacity={isDimmed ? 0.2 : 1}
              >
                {/* Node Outer Glow Halo on Hover / Connect */}
                {(isHovered || isConnected) && (
                  <circle
                    r={node.radius + 8}
                    fill="none"
                    stroke={node.color}
                    strokeWidth="1.5"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}

                {/* Node Body */}
                <circle
                  r={node.radius}
                  fill="#080d1a"
                  stroke={node.color}
                  strokeWidth={isHovered ? 3 : 2}
                  className="filter drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]"
                />

                {/* Node Inner Fill */}
                <circle
                  r={node.radius - 4}
                  fill={node.color}
                  opacity="0.15"
                />

                {/* Node Text Label */}
                <text
                  y="4"
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize={node.radius > 24 ? "10" : "8"}
                  fontFamily="sans-serif"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {node.label.length > 14 ? node.label.slice(0, 12) + '..' : node.label}
                </text>

                {/* Subtext Below */}
                <text
                  y={node.radius + 12}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="7.5"
                  fontFamily="monospace"
                  pointerEvents="none"
                >
                  {node.subtext}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend Badge */}
        <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md p-2 rounded-lg border border-slate-800 text-[10px] font-mono flex items-center space-x-3 text-slate-300">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Focus/Victim</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Suspect</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Evidence</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Event</span>
        </div>

      </div>

    </div>
  );
}
