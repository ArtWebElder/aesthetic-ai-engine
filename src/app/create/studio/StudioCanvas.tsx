import { useRef, useState, useCallback, useEffect } from 'react';
import {
  Connection, ExecState, StudioNode as StudioNodeType,
  ToolMode, NODE_TYPE_DEFS
} from './types';
import { StudioNode } from './StudioNode';
import { StudioConnection } from './StudioConnection';

const CANVAS_W = 4000;
const CANVAS_H = 3000;
const ZOOM_MIN = 30;
const ZOOM_MAX = 200;
const ZOOM_STEP = 8;

interface StudioCanvasProps {
  nodes: StudioNodeType[];
  connections: Connection[];
  execStates: Record<string, ExecState>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodeOutputs: Record<string, any>;
  selectedNodeId: string | null;
  zoom: number;
  pan: { x: number; y: number };
  toolMode: ToolMode;
  onZoomChange: (z: number) => void;
  onPanChange: (p: { x: number; y: number }) => void;
  onSelectNode: (id: string | null) => void;
  onNodeMove: (id: string, x: number, y: number) => void;
  onNodeDragStart?: () => void;
  onNodeRun: (id: string) => void;
  onNodeDataChange: (id: string, key: string, value: string) => void;
  onAddConnection: (fromNode: string, toNode: string) => void;
  onDeleteNode?: (id: string) => void;
}

export function StudioCanvas({
  nodes,
  connections,
  execStates,
  nodeOutputs,
  selectedNodeId,
  zoom,
  pan,
  toolMode,
  onZoomChange,
  onPanChange,
  onSelectNode,
  onNodeMove,
  onNodeDragStart,
  onNodeRun,
  onNodeDataChange,
  onAddConnection,
  onDeleteNode,
}: StudioCanvasProps) {
  const outerRef = useRef<HTMLDivElement>(null);

  // Track active drag/pan with refs to avoid stale closures
  const nodeDragRef = useRef<{
    nodeId: string;
    startMouseX: number;
    startMouseY: number;
    startNodeX: number;
    startNodeY: number;
  } | null>(null);

  const panDragRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);

  // Two-finger pinch-to-zoom state (mobile)
  const pinchRef = useRef<{
    startDist: number; startZoom: number;
    startPanX: number; startPanY: number;
    startMidX: number; startMidY: number;
  } | null>(null);

  // Connection drag state
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectingMouse, setConnectingMouse] = useState<{ x: number; y: number } | null>(null);
  const connectingRef = useRef<string | null>(null);

  // Stable refs to latest state (avoid re-attaching listeners)
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const toolModeRef = useRef(toolMode);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { toolModeRef.current = toolMode; }, [toolMode]);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (toolModeRef.current !== 'cursor') return;
    e.preventDefault();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    onNodeDragStart?.();
    nodeDragRef.current = {
      nodeId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startNodeX: node.x,
      startNodeY: node.y,
    };
  }, [nodes, onNodeDragStart]);

  // Port drag: start connection from output port
  const handleOutputPortDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    connectingRef.current = nodeId;
    setConnectingFrom(nodeId);
    // Convert client coords to canvas coords for the temp line
    const outer = outerRef.current;
    if (outer) {
      const rect = outer.getBoundingClientRect();
      const scale = zoomRef.current / 100;
      const cx = (e.clientX - rect.left - panRef.current.x) / scale;
      const cy = (e.clientY - rect.top - panRef.current.y) / scale;
      setConnectingMouse({ x: cx, y: cy });
    }
  }, []);

  // Port drag: complete connection on input port
  const handleInputPortUp = useCallback((nodeId: string) => {
    const from = connectingRef.current;
    if (from && from !== nodeId) {
      onAddConnection(from, nodeId);
    }
    connectingRef.current = null;
    setConnectingFrom(null);
    setConnectingMouse(null);
  }, [onAddConnection]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle mouse or hand tool → pan
    if (e.button === 1 || toolModeRef.current === 'hand') {
      e.preventDefault();
      panDragRef.current = {
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startPanX: panRef.current.x,
        startPanY: panRef.current.y,
      };
      return;
    }
    // Left click on canvas background → deselect + cancel connection drag
    if (e.target === e.currentTarget) {
      onSelectNode(null);
      if (connectingRef.current) {
        connectingRef.current = null;
        setConnectingFrom(null);
        setConnectingMouse(null);
      }
    }
  }, [onSelectNode]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = -Math.sign(e.deltaY) * ZOOM_STEP;
    const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomRef.current + delta));
    onZoomChange(newZoom);
  }, [onZoomChange]);

  // ── Touch (mobile): drag nodes, pan, and connect ports ──────────────────────
  const handleNodeTouchStart = useCallback((e: React.TouchEvent, nodeId: string) => {
    const t = e.touches[0]; if (!t) return;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    onNodeDragStart?.();
    nodeDragRef.current = {
      nodeId, startMouseX: t.clientX, startMouseY: t.clientY,
      startNodeX: node.x, startNodeY: node.y,
    };
  }, [nodes, onNodeDragStart]);

  const handleOutputPortTouchStart = useCallback((e: React.TouchEvent, nodeId: string) => {
    e.stopPropagation();
    const t = e.touches[0]; if (!t) return;
    connectingRef.current = nodeId;
    setConnectingFrom(nodeId);
    const outer = outerRef.current;
    if (outer) {
      const rect = outer.getBoundingClientRect();
      const scale = zoomRef.current / 100;
      setConnectingMouse({
        x: (t.clientX - rect.left - panRef.current.x) / scale,
        y: (t.clientY - rect.top - panRef.current.y) / scale,
      });
    }
  }, []);

  const handleCanvasTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return; // 2-finger pinch handled in touchmove
    const t = e.touches[0]; if (!t) return;
    // Single finger anywhere → pan the canvas (node headers/ports stopPropagation,
    // so dragging a node or connecting still wins). This makes panning fluid even
    // when zoomed in and a node is under the finger.
    panDragRef.current = {
      startMouseX: t.clientX, startMouseY: t.clientY,
      startPanX: panRef.current.x, startPanY: panRef.current.y,
    };
    if (e.target === e.currentTarget) {
      onSelectNode(null);
      if (connectingRef.current) {
        connectingRef.current = null; setConnectingFrom(null); setConnectingMouse(null);
      }
    }
  }, [onSelectNode]);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    const onMouseMove = (e: MouseEvent) => {
      // Connection drag — update temp line endpoint
      if (connectingRef.current) {
        const rect = outer.getBoundingClientRect();
        const scale = zoomRef.current / 100;
        const cx = (e.clientX - rect.left - panRef.current.x) / scale;
        const cy = (e.clientY - rect.top - panRef.current.y) / scale;
        setConnectingMouse({ x: cx, y: cy });
        return;
      }

      if (nodeDragRef.current) {
        const scale = zoomRef.current / 100;
        const dx = (e.clientX - nodeDragRef.current.startMouseX) / scale;
        const dy = (e.clientY - nodeDragRef.current.startMouseY) / scale;
        onNodeMove(
          nodeDragRef.current.nodeId,
          Math.max(0, nodeDragRef.current.startNodeX + dx),
          Math.max(0, nodeDragRef.current.startNodeY + dy),
        );
        return;
      }
      if (panDragRef.current) {
        const dx = e.clientX - panDragRef.current.startMouseX;
        const dy = e.clientY - panDragRef.current.startMouseY;
        onPanChange({
          x: panDragRef.current.startPanX + dx,
          y: panDragRef.current.startPanY + dy,
        });
      }
    };

    const onMouseUp = () => {
      // Cancel connection drag if mouse released on canvas (not on a port)
      if (connectingRef.current) {
        connectingRef.current = null;
        setConnectingFrom(null);
        setConnectingMouse(null);
      }
      nodeDragRef.current = null;
      panDragRef.current = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      // Two-finger pinch → zoom around the fingers' midpoint
      if (e.touches.length >= 2) {
        const a = e.touches[0], b = e.touches[1];
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        const midX = (a.clientX + b.clientX) / 2, midY = (a.clientY + b.clientY) / 2;
        const rect = outer.getBoundingClientRect();
        if (!pinchRef.current) {
          pinchRef.current = {
            startDist: dist, startZoom: zoomRef.current,
            startPanX: panRef.current.x, startPanY: panRef.current.y,
            startMidX: midX, startMidY: midY,
          };
          nodeDragRef.current = null; panDragRef.current = null;
          if (connectingRef.current) { connectingRef.current = null; setConnectingFrom(null); setConnectingMouse(null); }
        } else {
          const p = pinchRef.current;
          const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, p.startZoom * (dist / Math.max(1, p.startDist))));
          const startScale = p.startZoom / 100;
          const cx = (p.startMidX - rect.left - p.startPanX) / startScale;
          const cy = (p.startMidY - rect.top - p.startPanY) / startScale;
          const newScale = newZoom / 100;
          onZoomChange(Math.round(newZoom));
          onPanChange({ x: (midX - rect.left) - cx * newScale, y: (midY - rect.top) - cy * newScale });
        }
        e.preventDefault();
        return;
      }
      const t = e.touches[0]; if (!t) return;
      const scale = zoomRef.current / 100;
      if (connectingRef.current) {
        const rect = outer.getBoundingClientRect();
        setConnectingMouse({
          x: (t.clientX - rect.left - panRef.current.x) / scale,
          y: (t.clientY - rect.top - panRef.current.y) / scale,
        });
        e.preventDefault(); return;
      }
      if (nodeDragRef.current) {
        const dx = (t.clientX - nodeDragRef.current.startMouseX) / scale;
        const dy = (t.clientY - nodeDragRef.current.startMouseY) / scale;
        onNodeMove(
          nodeDragRef.current.nodeId,
          Math.max(0, nodeDragRef.current.startNodeX + dx),
          Math.max(0, nodeDragRef.current.startNodeY + dy),
        );
        e.preventDefault(); return;
      }
      if (panDragRef.current) {
        onPanChange({
          x: panDragRef.current.startPanX + (t.clientX - panDragRef.current.startMouseX),
          y: panDragRef.current.startPanY + (t.clientY - panDragRef.current.startMouseY),
        });
        e.preventDefault();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      // Complete a connection: find the input port under the finger via elementFromPoint
      if (connectingRef.current) {
        const t = e.changedTouches[0];
        if (t) {
          const el = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null;
          const portEl = el?.closest('[data-input-node]') as HTMLElement | null;
          const targetId = portEl?.getAttribute('data-input-node');
          if (targetId && targetId !== connectingRef.current) onAddConnection(connectingRef.current, targetId);
        }
        connectingRef.current = null; setConnectingFrom(null); setConnectingMouse(null);
      }
      nodeDragRef.current = null;
      panDragRef.current = null;
      pinchRef.current = null;
    };

    outer.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      outer.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleWheel, onNodeMove, onPanChange, onAddConnection]);

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  const scale = zoom / 100;
  const dotSize = 24;

  // Dot grid pattern synced with pan/zoom
  const bgPatternSize = dotSize * scale;
  const bgOffsetX = (pan.x % bgPatternSize + bgPatternSize) % bgPatternSize;
  const bgOffsetY = (pan.y % bgPatternSize + bgPatternSize) % bgPatternSize;

  // Compute temp connection line from the output port of connectingFrom node
  let tempConnectionPath: string | null = null;
  if (connectingFrom && connectingMouse) {
    const fromNode = nodes.find(n => n.id === connectingFrom);
    if (fromNode) {
      const fromDef = NODE_TYPE_DEFS[fromNode.type];
      const x1 = fromNode.x + fromDef.defaultWidth;
      const y1 = fromNode.y + fromDef.defaultHeight / 2;
      const x2 = connectingMouse.x;
      const y2 = connectingMouse.y;
      const dx = Math.max(60, Math.abs(x2 - x1) * 0.5);
      tempConnectionPath = `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
    }
  }

  return (
    <div
      ref={outerRef}
      onMouseDown={handleCanvasMouseDown}
      onTouchStart={handleCanvasTouchStart}
      style={{
        position: 'absolute',
        // Mobile: leave room for the top menu/credits and the bottom action bar so
        // both are ALWAYS visible; the canvas occupies only the middle band.
        top: isMobile ? 60 : 0,
        bottom: isMobile ? 'calc(66px + env(safe-area-inset-bottom, 0px))' : 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
        touchAction: 'none',
        cursor: connectingFrom ? 'crosshair' : toolMode === 'hand' ? 'grab' : 'default',
        background: 'hsl(var(--background))',
        // Hide the dot grid on mobile — it caused a "stuck/flicker" look during
        // pinch-zoom (the dots scaling). Desktop keeps it.
        backgroundImage: isMobile ? 'none' : 'radial-gradient(circle, hsl(var(--foreground) / 0.09) 1.2px, transparent 1.2px)',
        backgroundSize: `${bgPatternSize}px ${bgPatternSize}px`,
        backgroundPosition: `${bgOffsetX}px ${bgOffsetY}px`,
      }}
    >
      {/* Transformed inner canvas */}
      <div
        style={{
          position: 'absolute',
          width: CANVAS_W,
          height: CANVAS_H,
          transformOrigin: '0 0',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          willChange: 'transform',
        }}
      >
        {/* SVG layer for connections */}
        <svg
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: CANVAS_W,
            height: CANVAS_H,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {connections.map(conn => (
            <StudioConnection
              key={conn.id}
              connection={conn}
              nodes={nodes}
              execStates={execStates}
            />
          ))}
          {/* Temporary connection line while dragging */}
          {tempConnectionPath && (
            <path
              d={tempConnectionPath}
              fill="none"
              stroke="hsl(var(--brand))"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="6 4"
              opacity={0.7}
            />
          )}
        </svg>

        {/* Nodes layer */}
        {nodes.map(node => (
          <StudioNode
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            execState={execStates[node.id] ?? 'idle'}
            output={nodeOutputs[node.id]}
            isConnecting={Boolean(connectingFrom)}
            onMouseDown={handleNodeMouseDown}
            onTouchStart={handleNodeTouchStart}
            onSelect={onSelectNode}
            onRun={onNodeRun}
            onDataChange={onNodeDataChange}
            onDelete={onDeleteNode}
            onOutputPortDown={handleOutputPortDown}
            onOutputPortTouchStart={handleOutputPortTouchStart}
            onInputPortUp={handleInputPortUp}
          />
        ))}
      </div>
    </div>
  );
}
