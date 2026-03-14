import { useRef, useCallback, useEffect } from 'react';
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
  onNodeRun: (id: string) => void;
  onNodeDataChange: (id: string, key: string, value: string) => void;
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
  onNodeRun,
  onNodeDataChange,
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
    nodeDragRef.current = {
      nodeId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startNodeX: node.x,
      startNodeY: node.y,
    };
  }, [nodes]);

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
    // Left click on canvas background → deselect
    if (e.target === e.currentTarget) {
      onSelectNode(null);
    }
  }, [onSelectNode]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = -Math.sign(e.deltaY) * ZOOM_STEP;
    const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomRef.current + delta));
    onZoomChange(newZoom);
  }, [onZoomChange]);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    const onMouseMove = (e: MouseEvent) => {
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
      nodeDragRef.current = null;
      panDragRef.current = null;
    };

    outer.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      outer.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleWheel, onNodeMove, onPanChange]);

  const scale = zoom / 100;
  const dotSize = 24;

  // Dot grid pattern synced with pan/zoom
  const bgPatternSize = dotSize * scale;
  const bgOffsetX = (pan.x % bgPatternSize + bgPatternSize) % bgPatternSize;
  const bgOffsetY = (pan.y % bgPatternSize + bgPatternSize) % bgPatternSize;

  return (
    <div
      ref={outerRef}
      onMouseDown={handleCanvasMouseDown}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        cursor: toolMode === 'hand' ? 'grab' : 'default',
        background: 'hsl(var(--background))',
        backgroundImage: 'radial-gradient(circle, hsl(var(--foreground) / 0.09) 1.2px, transparent 1.2px)',
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
        </svg>

        {/* Nodes layer */}
        {nodes.map(node => (
          <StudioNode
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            execState={execStates[node.id] ?? 'idle'}
            output={nodeOutputs[node.id]}
            onMouseDown={handleNodeMouseDown}
            onSelect={onSelectNode}
            onRun={onNodeRun}
            onDataChange={onNodeDataChange}
          />
        ))}
      </div>
    </div>
  );
}
