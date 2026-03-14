import { useState, useCallback, useEffect } from 'react';
import { Sparkles, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  StudioNode as StudioNodeType,
  Connection,
  ExecState,
  ToolMode,
  PanelTab,
  NodeTypeId,
  NODE_TYPE_DEFS,
  DEFAULT_NODES,
  DEFAULT_CONNECTIONS,
  PRESET_FLOWS,
  AUTO_LAYOUT_COLUMNS,
  AUTO_LAYOUT_COL_X,
  AUTO_LAYOUT_ROW_GAP,
} from './studio/types';

import {
  executeFlow,
  executeNode,
  collectInputs,
  prePopulateInputOutputs,
  type NodeOutputs,
} from './studio/engine';

import { StudioCanvas } from './studio/StudioCanvas';
import { StudioNavbar } from './studio/StudioNavbar';
import { StudioToolbar } from './studio/StudioToolbar';
import { StudioTopMenu } from './studio/StudioTopMenu';
import { StudioChat } from './studio/StudioChat';
import { StudioNodePanel } from './studio/StudioNodePanel';
import { StudioProperties } from './studio/StudioProperties';
import { useI18n } from '@/i18n';

// Credits badge top-right
function CreditsBar({ propertiesOpen }: { propertiesOpen: boolean }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  // Shift left by properties panel width (224px) + gap when it's open
  const rightPos = propertiesOpen ? 14 + 224 + 10 : 14;
  return (
    <div style={{
      position: 'absolute',
      top: 14,
      right: rightPos,
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      transition: 'right 0.15s ease',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 10px',
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        color: '#ff713d',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <Sparkles size={13} />
        <span>120</span>
      </div>
      <button
        onClick={() => navigate('/app/billing')}
        style={{
          padding: '5px 12px',
          background: 'hsl(var(--primary) / 0.1)',
          border: '1.5px solid #ff713d',
          borderRadius: 8,
          color: '#ff713d',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
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
  const [nodeOutputs, setNodeOutputs] = useState<NodeOutputs>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [flowRunning, setFlowRunning] = useState(false);

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
      // Don't intercept shortcuts when user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

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

  const handleNodeRun = useCallback(async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setExecStates(prev => ({ ...prev, [nodeId]: 'running' }));

    try {
      // Pre-populate input node outputs so upstream data is always available
      // even when running a single node without "Run All".
      const enrichedOutputs = { ...nodeOutputs };
      prePopulateInputOutputs(nodes, enrichedOutputs);

      const inputs = collectInputs(nodeId, connections, enrichedOutputs);
      console.log(`[Studio:handleNodeRun] Node ${nodeId} (${node.type}) inputs:`, Object.keys(inputs).filter(k => k !== '_allUpstream'));
      const output = await executeNode(node, inputs);
      setNodeOutputs(prev => {
        const next = { ...prev, ...enrichedOutputs, [nodeId]: output };
        return next;
      });
      setExecStates(prev => ({ ...prev, [nodeId]: 'done' }));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Execution failed';
      console.error(`[Studio] Node ${nodeId} failed:`, error);
      setExecStates(prev => ({ ...prev, [nodeId]: 'error' }));
      alert(`Erro no node: ${msg}`);
    }
  }, [nodes, connections, nodeOutputs]);

  const handleRunAll = useCallback(async () => {
    if (flowRunning) return;
    setFlowRunning(true);
    setExecStates({});
    setNodeOutputs({});

    await executeFlow(
      nodes,
      connections,
      (nodeId) => {
        setExecStates(prev => ({ ...prev, [nodeId]: 'running' }));
      },
      (nodeId, output) => {
        setExecStates(prev => ({ ...prev, [nodeId]: 'done' }));
        setNodeOutputs(prev => ({ ...prev, [nodeId]: output }));
        // Auto-download when export node completes
        const node = nodes.find(n => n.id === nodeId);
        if (node?.type === 'export' && output?.type === 'export') {
          const imgSrc = output.image || output.finalImage;
          if (imgSrc && typeof imgSrc === 'string') {
            const fmt = (output.format as string) || 'png';
            const a = document.createElement('a');
            a.href = imgSrc;
            a.download = `creatyng-asset.${fmt}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        }
      },
      (nodeId, error) => {
        setExecStates(prev => ({ ...prev, [nodeId]: 'error' }));
        alert(`Erro no node: ${error}`);
      },
    );

    setFlowRunning(false);
  }, [nodes, connections, flowRunning]);

  const handleNodeDataChange = useCallback((nodeId: string, key: string, value: string) => {
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, [key]: value } } : n
    ));
  }, []);

  const handleAddConnection = useCallback((fromNode: string, toNode: string) => {
    // Prevent duplicate connections
    const exists = connections.some(c => c.fromNode === fromNode && c.toNode === toNode);
    if (exists) return;
    // Prevent self-connections
    if (fromNode === toNode) return;

    const newConn: Connection = {
      id: `c${Date.now()}`,
      fromNode,
      fromPort: 'output',
      toNode,
      toPort: 'input',
    };
    setConnections(prev => [...prev, newConn]);
  }, [connections]);

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

  const loadFlow = useCallback((flowId: string) => {
    const flow = PRESET_FLOWS[flowId];
    if (!flow) return;
    setNodes(JSON.parse(JSON.stringify(flow.nodes)));
    setConnections(JSON.parse(JSON.stringify(flow.connections)));
    setExecStates({});
    setNodeOutputs({});
    setSelectedNodeId(null);
  }, []);

  const handleNewFlow = useCallback(() => {
    if (window.confirm('Start a new flow? Current flow will be lost.')) {
      loadFlow('asset-generator');
    }
  }, [loadFlow]);

  const handleCloneFlow = useCallback(() => {
    alert('Flow cloned — feature coming soon!');
  }, []);

  const handleDeleteFlow = useCallback(() => {
    if (window.confirm('Delete this flow?')) {
      setNodes([]);
      setConnections([]);
      setExecStates({});
      setNodeOutputs({});
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
      position: 'absolute',
      inset: 0,
      zIndex: 0,
      background: 'hsl(var(--background))',
      overflow: 'hidden',
    }}>
      {/* Canvas fills entire screen */}
      <StudioCanvas
        nodes={nodes}
        connections={connections}
        execStates={execStates}
        nodeOutputs={nodeOutputs}
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
        onAddConnection={handleAddConnection}
      />

      {/* Fixed UI overlays */}
      <StudioTopMenu
        onNewFlow={handleNewFlow}
        onCloneFlow={handleCloneFlow}
        onAutoLayout={handleAutoLayout}
        onDeleteFlow={handleDeleteFlow}
      />

      <CreditsBar propertiesOpen={showProperties} />

      {/* Run All button */}
      <button
        onClick={handleRunAll}
        disabled={flowRunning || nodes.length === 0}
        style={{
          position: 'absolute',
          top: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 18px',
          background: flowRunning ? 'hsl(var(--muted))' : 'linear-gradient(135deg, #ff713d, #FF9B70)',
          color: flowRunning ? 'hsl(var(--muted-foreground))' : '#fff',
          border: 'none',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 700,
          cursor: flowRunning ? 'not-allowed' : 'pointer',
          boxShadow: flowRunning ? 'none' : '0 4px 16px rgba(255,113,61,0.3)',
          fontFamily: 'inherit',
          transition: 'all 150ms',
        }}
      >
        <Play size={14} />
        {flowRunning ? 'Executando...' : 'Executar fluxo'}
      </button>

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
