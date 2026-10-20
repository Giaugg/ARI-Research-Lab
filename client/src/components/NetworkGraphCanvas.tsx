'use client';

import React, { useRef, useEffect, useState } from 'react';

interface Node {
  id: number;
  label: string;
  institution?: string;
  avatar_url?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface Edge {
  source: number | Node;
  target: number | Node;
}

interface NetworkGraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
  highlightPath?: number[];
  selectedNodeId?: number | null;
  onSelectNode?: (nodeId: number) => void;
}

export default function NetworkGraphCanvas({
  nodes: rawNodes,
  edges: rawEdges,
  highlightPath = [],
  selectedNodeId,
  onSelectNode
}: NetworkGraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  // Position initialization using circle layout + force relaxation
  const nodesRef = useRef<Node[]>([]);
  const draggingNodeRef = useRef<Node | null>(null);

  useEffect(() => {
    if (!rawNodes || rawNodes.length === 0) return;

    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.75;

    // Preserve existing positions if available, or arrange in circular ring
    nodesRef.current = rawNodes.map((n, i) => {
      const existing = nodesRef.current.find((x) => x.id === n.id);
      if (existing && existing.x && existing.y) {
        return { ...n, x: existing.x, y: existing.y, vx: 0, vy: 0 };
      }
      const angle = (i / rawNodes.length) * 2 * Math.PI;
      return {
        ...n,
        x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 40,
        y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0
      };
    });
  }, [rawNodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const nodes = nodesRef.current;
      const idMap = new Map<number, Node>();
      nodes.forEach((n) => idMap.set(n.id, n));

      // 1. Draw Edges
      rawEdges.forEach((edge) => {
        const sourceId = typeof edge.source === 'object' ? (edge.source as any).id : edge.source;
        const targetId = typeof edge.target === 'object' ? (edge.target as any).id : edge.target;

        const s = idMap.get(sourceId);
        const t = idMap.get(targetId);
        if (!s || !t || !s.x || !s.y || !t.x || !t.y) return;

        // Check if this edge is part of highlight path
        let isHighlighted = false;
        if (highlightPath.length > 1) {
          for (let i = 0; i < highlightPath.length - 1; i++) {
            if (highlightPath[i] === sourceId && highlightPath[i + 1] === targetId) {
              isHighlighted = true;
              break;
            }
          }
        }

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);

        if (isHighlighted) {
          ctx.strokeStyle = '#38bdf8'; // bright cyan
          ctx.lineWidth = 3.5;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
        } else {
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)'; // slate-600
          ctx.lineWidth = 1.2;
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Arrow head for directed relation
        const headlen = isHighlighted ? 10 : 7;
        const angle = Math.atan2(t.y - s.y, t.x - s.x);
        // Offset to stop before node radius
        const stopX = t.x - Math.cos(angle) * 18;
        const stopY = t.y - Math.sin(angle) * 18;

        ctx.beginPath();
        ctx.moveTo(stopX, stopY);
        ctx.lineTo(stopX - headlen * Math.cos(angle - Math.PI / 6), stopY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(stopX - headlen * Math.cos(angle + Math.PI / 6), stopY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = isHighlighted ? '#38bdf8' : 'rgba(100, 116, 139, 0.7)';
        ctx.fill();
      });

      // 2. Draw Nodes
      nodes.forEach((n) => {
        if (!n.x || !n.y) return;

        const isSelected = selectedNodeId === n.id;
        const isPathMember = highlightPath.includes(n.id);
        const isHovered = hoveredNode?.id === n.id;

        const radius = isSelected ? 18 : isPathMember ? 16 : isHovered ? 16 : 13;

        // Outer glow for path / selected
        if (isSelected || isPathMember) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + 4, 0, 2 * Math.PI);
          ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.35)' : 'rgba(56, 189, 248, 0.35)';
          ctx.fill();
        }

        // Main node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? '#2563eb' : isPathMember ? '#0284c7' : '#1e293b';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#60a5fa' : isPathMember ? '#38bdf8' : '#475569';
        ctx.lineWidth = isSelected || isPathMember ? 2.5 : 1.5;
        ctx.stroke();

        // Node ID or initials inside circle
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.id.toString(), n.x, n.y);

        // Label below node
        ctx.font = isSelected || isPathMember ? 'bold 11px sans-serif' : '10px sans-serif';
        ctx.fillStyle = isSelected || isPathMember ? '#e0f2fe' : '#94a3b8';
        ctx.fillText(n.label.split(' ')[0] + ' ' + (n.label.split(' ')[1] || ''), n.x, n.y + radius + 11);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [rawEdges, highlightPath, selectedNodeId, hoveredNode]);

  // Mouse event handlers for interaction & dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clicked = nodesRef.current.find((n) => {
      if (!n.x || !n.y) return false;
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= 18;
    });

    if (clicked) {
      draggingNodeRef.current = clicked;
      if (onSelectNode) onSelectNode(clicked.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggingNodeRef.current) {
      draggingNodeRef.current.x = x;
      draggingNodeRef.current.y = y;
      return;
    }

    const hovered = nodesRef.current.find((n) => {
      if (!n.x || !n.y) return false;
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= 18;
    });
    setHoveredNode(hovered || null);
  };

  const handleMouseUp = () => {
    draggingNodeRef.current = null;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-800">
      <canvas
        ref={canvasRef}
        width={800}
        height={480}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-[480px] cursor-grab active:cursor-grabbing block"
      />

      {/* Hover Info Tooltip */}
      {hoveredNode && (
        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 shadow-xl pointer-events-none text-xs">
          <p className="font-bold text-slate-100">{hoveredNode.label} (ID: {hoveredNode.id})</p>
          {hoveredNode.institution && (
            <p className="text-[11px] text-slate-400">{hoveredNode.institution}</p>
          )}
          <p className="text-[10px] text-cyan-400 font-mono mt-1">Click to select & inspect graph</p>
        </div>
      )}

      {/* Canvas Controls Info */}
      <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-md px-2.5 py-1 text-[10px] font-mono text-slate-400 pointer-events-none">
        Drag nodes to rearrange • Click to inspect
      </div>
    </div>
  );
}
