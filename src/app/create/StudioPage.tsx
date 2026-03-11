import { useState, useCallback, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  StudioNode as StudioNodeType,
  Connection,
  ExecState,
  ToolMode,
  PanelTab,
  NodeTypeId,
  NODE_TYPE_DEFS,
  NODE_RUN_TIMEOUT,
  DEFAULT_NODES,
  DEFAULT_CONNECTIONS,
  AUTO_LAYOUT_COLUMNS,
  AUTO_LAYOUT_COL_X,
  AUTO_LAYOUT_ROW_GAP,
} from './studio/types';

import { StudioCanvas } from './studio/StudioCanvas';
import { StudioNavbar } from './studio/StudioNavbar';
import { StudioToolbar } from './studio/StudioToolbar';
import { StudioTopMenu } from './studio/StudioTopMenu';
import { StudioChat } from './studio/StudioChat';
import { StudioNodePanel } from './studio/StudioNodePanel';
import { StudioProperties } from './studio/StudioProperties';
import { useI18n } from '@/i18n';

// Credits badge top-right
function CreditsBar() {
  const { t } = useI18n();
  const navigate = useNavigate();
  return (
    <div style={{
      position: 'fixed',
      top: 14,
      right: 14,
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 10px',
        background: '#1e1e24',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        color: '#ff713d',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}>
        <Sparkles size={13} />
        <span>120</span>
      </div>
      <button
        onClick={() => navigate('/app/billing')}
        style={{
          padding: '5px 12px',
          background: 'rgba(255,113,61,0.1)',
          border: '1px solid rgba(255,113,61,0.4)',
          borderRadius: 8,
          color: '#ff713d',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {t('studio.credits.upgrade')}
      </button>
    </div>
  );
}

export function StudioPage() {
  const navigate = useNavigate();

  // Core state
  const [nodes, setNodes] = useState<StudioNodeType[]>(() =>
    JSON.parse(JSON.stringify(DEFAULT_NODES))
  );
  const [connections, setConnections] = useState<Connection[]>(() =>
    JSON.parse(JSON.stringify(DEFAULT_CONNECTIONS))
  );
  const [execStates, setExecStates] = useState<Record<string, ExecState>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Canvas state
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 80, y: 60 });
  const [toolMode, setToolMode] = useState<ToolMode>('cursor');

  // UI state
  const [openPanel, setOpenPanel] = useState<PanelTab | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setOpenPanel(null);
      }
      if (e.key === 'h' || e.key === 'H') setToolMode('hand');
      if (e.key === 'v' || e.key === 'V') setToolMode('cursor');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Node operations
  const handleNodeMove = useCallback((id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  }, []);

  const handleNodeRun = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const timeout = NODE_RUN_TIMEOUT[node.type] ?? 1000;
    setExecStates(prev => ({ ...prev, [nodeId]: 'running' }));
    setTimeout(() => {
      setExecStates(prev => ({ ...prev, [nodeId]: 'done' }));
    }, timeout);
  }, [nodes]);

  const handleNodeDataChange = useCallback((nodeId: string, key: string, value: string) => {
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, [key]: value } } : n
    ));
  }, []);

  const handleAddNode = useCallback((typeId: NodeTypeId) => {
    const def = NODE_TYPE_DEFS[typeId];
    const newNode: StudioNodeType = {
      id: `n${Date.now()}`,
      type: typeId,
      x: 200 + Math.random() * 300,
      y: 100 + Math.random() * 250,
      data: {},
    };
    setNodes(prev => [...prev, newNode]);
    setOpenPanel(null);
    setSelectedNodeId(newNode.id);
    // Suppress unused variable warning
    void def;
  }, []);

  // Auto layout
  const handleAutoLayout = useCallback(() => {
    setNodes(prev => prev.map(node => {
      let colIdx = 3; // default: last column
      let rowIdx = 0;
      for (const [col, types] of Object.entries(AUTO_LAYOUT_COLUMNS)) {
        const idx = (types as NodeTypeId[]).indexOf(node.type);
        if (idx !== -1) {
          colIdx = Number(col);
          rowIdx = idx;
          break;
        }
      }
      return {
        ...node,
        x: AUTO_LAYOUT_COL_X[colIdx] ?? 80,
        y: 40 + rowIdx * AUTO_LAYOUT_ROW_GAP,
      };
    }));
  }, []);

  const handleNewFlow = useCallback(() => {
    if (window.confirm('Start a new flow? Current flow will be lost.')) {
      setNodes(JSON.parse(JSON.stringify(DEFAULT_NODES)));
      setConnections(JSON.parse(JSON.stringify(DEFAULT_CONNECTIONS)));
      setExecStates({});
      setSelectedNodeId(null);
    }
  }, []);

  const handleCloneFlow = useCallback(() => {
    alert('Flow cloned — feature coming soon!');
  }, []);

  const handleDeleteFlow = useCallback(() => {
    if (window.confirm('Delete this flow?')) {
      setNodes([]);
      setConnections([]);
      setExecStates({});
      setSelectedNodeId(null);
    }
  }, []);

  const handleSelectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
  }, []);

  const handlePanelChange = useCallback((tab: PanelTab | null) => {
    setOpenPanel(tab);
    // Close properties panel when opening side panel
  }, []);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;
  // Show properties only when no side panel is open (or always show — up to UX)
  const showProperties = selectedNode !== null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      background: '#F0F0EE',
      overflow: 'hidden',
    }}>
      {/* Canvas fills entire screen */}
      <StudioCanvas
        nodes={nodes}
        connections={connections}
        execStates={execStates}
        selectedNodeId={selectedNodeId}
        zoom={zoom}
        pan={pan}
        toolMode={toolMode}
        onZoomChange={setZoom}
        onPanChange={setPan}
        onSelectNode={handleSelectNode}
        onNodeMove={handleNodeMove}
        onNodeRun={handleNodeRun}
        onNodeDataChange={handleNodeDataChange}
      />

      {/* Fixed UI overlays */}
      <StudioTopMenu
        onNewFlow={handleNewFlow}
        onCloneFlow={handleCloneFlow}
        onAutoLayout={handleAutoLayout}
        onDeleteFlow={handleDeleteFlow}
      />

      <CreditsBar />

      <StudioNavbar
        openPanel={openPanel}
        chatOpen={chatOpen}
        onPanelChange={handlePanelChange}
        onChatToggle={() => setChatOpen(v => !v)}
      />

      {/* Left panel (Add/Assets/Templates/Learn) */}
      {openPanel && (
        <StudioNodePanel
          tab={openPanel}
          onClose={() => setOpenPanel(null)}
          onAddNode={handleAddNode}
        />
      )}

      {/* Right properties panel */}
      {showProperties && (
        <StudioProperties
          node={selectedNode}
          execState={execStates[selectedNode?.id ?? ''] ?? 'idle'}
          onClose={() => setSelectedNodeId(null)}
          onDataChange={handleNodeDataChange}
        />
      )}

      {/* Floating chat */}
      <StudioChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      <StudioToolbar
        toolMode={toolMode}
        zoom={zoom}
        onToolChange={setToolMode}
        onZoomChange={setZoom}
      />
    </div>
  );
}

export default StudioPage;
