import { useState, useCallback, useEffect, useRef } from 'react';
import { Sparkles, Play, Download, Plus, Maximize2, ZoomIn, ZoomOut, LayoutGrid, Menu, LayoutDashboard, Undo2, Redo2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
  getExecutionOrder,
  type NodeOutputs,
} from './studio/engine';

import { StudioCanvas } from './studio/StudioCanvas';
import { StudioNavbar } from './studio/StudioNavbar';
import { StudioToolbar } from './studio/StudioToolbar';
import { StudioTopMenu } from './studio/StudioTopMenu';
import { StudioChat } from './studio/StudioChat';
import { StudioNodePanel } from './studio/StudioNodePanel';
import { StudioProperties } from './studio/StudioProperties';
import { FlowSelector } from './studio/FlowSelector';
import { FLOW_STYLES } from './studio/flowStyles';
import { useI18n } from '@/i18n';
import { useCreditStore } from '@/stores/useCreditStore';
import { calculateCost } from '@/lib/creditCosts';
import { PaywallModal } from '@/components/creatyng/CreditUpsell';

// Credits badge top-right
function CreditsBar({ propertiesOpen }: { propertiesOpen: boolean }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const credits = useCreditStore((s) => s.credits);
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
      <div
        style={{
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
          position: 'relative',
          cursor: 'default',
        }}
        title={`${credits} créditos`}
      >
        <Sparkles size={13} />
        <span>{credits}</span>
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
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Canvas state
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 80, y: 60 });
  const [toolMode, setToolMode] = useState<ToolMode>('cursor');

  // UI state
  const [openPanel, setOpenPanel] = useState<PanelTab | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  // Mobile: hide desktop chrome (side navbar, toolbar, center pill, chat) and use a
  // sticky bottom action bar instead. Canvas stays full-screen.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Optional ?flow=<id> from a dashboard card. Flows WITH styles open the selector
  // on their styles; flows WITHOUT styles load directly (see effect below).
  const [searchParams] = useSearchParams();
  const flowParam = searchParams.get('flow');
  const flowParamHasStyles = !!flowParam && !!PRESET_FLOWS[flowParam] && (FLOW_STYLES[flowParam]?.length ?? 0) > 0;
  const [initialStyleFlow] = useState<string | null>(() => (flowParamHasStyles ? flowParam : null));
  const [showFlowSelector, setShowFlowSelector] = useState(() => {
    // Don't flash the full selector for a no-styles flow param — it loads directly.
    if (flowParam && PRESET_FLOWS[flowParam] && (FLOW_STYLES[flowParam]?.length ?? 0) === 0) return false;
    return true;
  });

  // ── History stack (undo/redo) — past/future model ─────────────────────
  const MAX_HISTORY = 30;

  type Snapshot = { nodes: StudioNodeType[]; connections: Connection[] };
  const pastRef = useRef<Snapshot[]>([]);
  const futureRef = useRef<Snapshot[]>([]);
  const nodesRef = useRef(nodes);
  const connectionsRef = useRef(connections);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { connectionsRef.current = connections; }, [connections]);

  // Fetch credits on mount
  useEffect(() => { useCreditStore.getState().fetchCredits(); }, []);

  const pushSnapshot = useCallback(() => {
    const snap: Snapshot = {
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      connections: JSON.parse(JSON.stringify(connectionsRef.current)),
    };
    pastRef.current = pastRef.current.slice(-(MAX_HISTORY - 1)).concat(snap);
    futureRef.current = []; // clear redo on new action
  }, []);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    // Save current state into future for redo
    futureRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      connections: JSON.parse(JSON.stringify(connectionsRef.current)),
    });
    const snap = pastRef.current.pop()!;
    setNodes(snap.nodes);
    setConnections(snap.connections);
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    // Save current state into past for undo
    pastRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      connections: JSON.parse(JSON.stringify(connectionsRef.current)),
    });
    const snap = futureRef.current.pop()!;
    setNodes(snap.nodes);
    setConnections(snap.connections);
  }, []);

  // ── Delete node ──────────────────────────────────────────────────────────
  const handleDeleteNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Confirm if node has been executed (has output)
    if (nodeOutputs[nodeId]) {
      if (!window.confirm('This node has output. Delete it?')) return;
    }

    pushSnapshot();
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.fromNode !== nodeId && c.toNode !== nodeId));
    setExecStates(prev => { const next = { ...prev }; delete next[nodeId]; return next; });
    setNodeOutputs(prev => { const next = { ...prev }; delete next[nodeId]; return next; });
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }, [nodes, nodeOutputs, selectedNodeId, pushSnapshot]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts when user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // Undo/Redo — always capture unless editing text
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && !isEditing) {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey && !isEditing) {
        e.preventDefault();
        redo();
        return;
      }
      // Also support Ctrl+Y for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'y' && !isEditing) {
        e.preventDefault();
        redo();
        return;
      }

      if (isEditing) return;

      // Delete selected node
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        e.preventDefault();
        handleDeleteNode(selectedNodeId);
        return;
      }

      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setOpenPanel(null);
      }
      if (e.key === 'h' || e.key === 'H') setToolMode('hand');
      if (e.key === 'v' || e.key === 'V') setToolMode('cursor');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedNodeId, handleDeleteNode]);

  // Node operations
  const handleNodeDragStart = useCallback(() => {
    pushSnapshot();
  }, [pushSnapshot]);

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

    // ── Debit credits before execution ──
    const flowCostKey = activeFlowId || 'simple-gen';
    // NB: calculateCost always returns a number; do NOT use `|| 5` here —
    // that would turn a legitimately free flow (0 credits, e.g. remove-bg) into 5.
    const creditCost = calculateCost(flowCostKey);
    // Free flows (0 credits, e.g. remove-bg Eco) skip the debit call entirely.
    if (creditCost > 0) {
      try {
        await useCreditStore.getState().debitCredits(creditCost, `Studio — ${flowCostKey}`);
      } catch (debitErr: unknown) {
        const msg = debitErr instanceof Error ? debitErr.message : String(debitErr);
        if (msg === 'insufficient_credits') {
          setShowPaywall(true);
          return;
        }
        console.warn('[Studio] debit failed, proceeding anyway:', msg);
      }
    }

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
  }, [nodes, connections, flowRunning, activeFlowId]);

  const handleNodeDataChange = useCallback((nodeId: string, key: string, value: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id !== nodeId) return n;
      // Handle field_* keys → update nested fields object
      if (key.startsWith('field_')) {
        const fieldName = key.slice(6); // 'field_headline' → 'headline'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fields = { ...(n.data.fields as any || {}), [fieldName]: value };
        return { ...n, data: { ...n.data, fields } };
      }
      // Store numeric strings as numbers for known numeric keys
      const numericKeys = ['subjectScale', 'shadowBlur', 'shadowOpacity', 'width', 'height'];
      const parsed = numericKeys.includes(key) && value !== '' ? Number(value) : value;
      return { ...n, data: { ...n.data, [key]: parsed } };
    }));

    // Invalidate cached outputs for this node + all downstream dependents
    const toInvalidate = new Set<string>();
    toInvalidate.add(nodeId);
    // BFS forward through connections
    const queue = [nodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const c of connections) {
        if (c.fromNode === current && !toInvalidate.has(c.toNode)) {
          toInvalidate.add(c.toNode);
          queue.push(c.toNode);
        }
      }
    }

    setNodeOutputs(prev => {
      const next = { ...prev };
      for (const id of toInvalidate) delete next[id];
      return next;
    });
    setExecStates(prev => {
      const next = { ...prev };
      for (const id of toInvalidate) delete next[id];
      return next;
    });
  }, [connections]);

  const handleAddConnection = useCallback((fromNode: string, toNode: string) => {
    // Prevent duplicate connections
    const exists = connections.some(c => c.fromNode === fromNode && c.toNode === toNode);
    if (exists) return;
    // Prevent self-connections
    if (fromNode === toNode) return;

    pushSnapshot();
    const newConn: Connection = {
      id: `c${Date.now()}`,
      fromNode,
      fromPort: 'output',
      toNode,
      toPort: 'input',
    };
    setConnections(prev => [...prev, newConn]);
  }, [connections, pushSnapshot]);

  const handleAddNode = useCallback((typeId: NodeTypeId) => {
    const def = NODE_TYPE_DEFS[typeId];
    pushSnapshot();
    // Spawn at the CENTER of the current viewport (accounting for pan/zoom) so the
    // node is always visible. A fixed position lands off-screen once you pan/zoom —
    // which made it look like clicking a node "did nothing".
    const scale = zoom / 100;
    const cx = (window.innerWidth / 2 - pan.x) / scale - def.defaultWidth / 2;
    const cy = (window.innerHeight / 2 - pan.y) / scale - def.defaultHeight / 2;
    const newNode: StudioNodeType = {
      id: `n${Date.now()}`,
      type: typeId,
      x: cx + (Math.random() * 40 - 20),
      y: cy + (Math.random() * 40 - 20),
      data: {},
    };
    setNodes(prev => [...prev, newNode]);
    setOpenPanel(null);
    setSelectedNodeId(newNode.id);
  }, [pushSnapshot, pan, zoom]);

  // Auto layout
  const handleAutoLayout = useCallback(() => {
    pushSnapshot();
    // Mobile: stack vertically (top→bottom in execution order) instead of columns.
    if (isMobile) {
      setNodes(prev => {
        const order = getExecutionOrder(prev, connections);
        const byId = new Map(prev.map(n => [n.id, n]));
        const ordered: StudioNodeType[] = [];
        for (const id of order) { const n = byId.get(id); if (n) ordered.push(n); }
        for (const n of prev) if (!order.includes(n.id)) ordered.push(n);
        let y = 40;
        return ordered.map(n => {
          const def = NODE_TYPE_DEFS[n.type];
          const placed = { ...n, x: 40, y };
          y += (def?.defaultHeight ?? 180) + 40;
          return placed;
        });
      });
      return;
    }
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
  }, [pushSnapshot, isMobile, connections]);

  // Fit all nodes into the current viewport (used on flow load + the mobile "fit" button).
  const fitToView = useCallback((nodeList: StudioNodeType[]) => {
    if (nodeList.length === 0) return;
    const pad = 20, topOffset = 64, bottomOffset = 96;
    const vw = window.innerWidth;
    const availH = window.innerHeight - topOffset - bottomOffset;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodeList) {
      const def = NODE_TYPE_DEFS[n.type];
      const w = def?.defaultWidth ?? 260, h = def?.defaultHeight ?? 180;
      minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + w); maxY = Math.max(maxY, n.y + h);
    }
    const W = Math.max(1, maxX - minX), H = Math.max(1, maxY - minY);
    const scale = Math.max(0.15, Math.min(1, Math.min((vw - pad * 2) / W, (availH - pad * 2) / H)));
    setZoom(Math.round(scale * 100));
    setPan({
      x: (vw - W * scale) / 2 - minX * scale,
      y: topOffset + (availH - H * scale) / 2 - minY * scale,
    });
  }, []);

  // Mobile: stack nodes vertically (top→bottom in execution order) instead of the
  // desktop horizontal layout. The tree grows downward.
  const verticalLayout = useCallback((nodeList: StudioNodeType[], conns: Connection[]): StudioNodeType[] => {
    const order = getExecutionOrder(nodeList, conns);
    const byId = new Map(nodeList.map(n => [n.id, n]));
    const ordered: StudioNodeType[] = [];
    for (const id of order) { const n = byId.get(id); if (n) ordered.push(n); }
    for (const n of nodeList) if (!order.includes(n.id)) ordered.push(n); // safety
    const colX = 40, gap = 40;
    let y = 40;
    return ordered.map(n => {
      const def = NODE_TYPE_DEFS[n.type];
      const placed = { ...n, x: colX, y };
      y += (def?.defaultHeight ?? 180) + gap;
      return placed;
    });
  }, []);

  const loadFlow = useCallback((flowId: string, styleId?: string) => {
    const flow = PRESET_FLOWS[flowId];
    if (!flow) return;
    pushSnapshot();
    const nextNodes = JSON.parse(JSON.stringify(flow.nodes)) as StudioNodeType[];
    // Apply a pre-molded style: merge its fields into the flow's text_input(fields) node.
    if (styleId) {
      const tpl = FLOW_STYLES[flowId]?.find(s => s.id === styleId);
      if (tpl) {
        const fieldsNode = nextNodes.find(n => n.data && (n.data as Record<string, unknown>).fields);
        if (fieldsNode) {
          const current = (fieldsNode.data.fields || {}) as Record<string, string>;
          fieldsNode.data = { ...fieldsNode.data, fields: { ...current, ...tpl.fields } };
        }
      }
    }
    // Mobile defaults to a vertical node tree; desktop keeps the preset's horizontal layout.
    const positioned = isMobile ? verticalLayout(nextNodes, flow.connections) : nextNodes;
    setNodes(positioned);
    setConnections(JSON.parse(JSON.stringify(flow.connections)));
    setExecStates({});
    setNodeOutputs({});
    setSelectedNodeId(null);
    setActiveFlowId(flowId);
    setShowFlowSelector(false);

    // Mobile: auto fit-to-view so the whole flow is visible and nodes are separated.
    if (isMobile) fitToView(positioned);
  }, [pushSnapshot, isMobile, fitToView, verticalLayout]);

  // Dashboard card with ?flow=<no-styles flow> → load it directly (styles flows open
  // the selector on their styles via initialStyleFlow instead).
  const didInitFlowParam = useRef(false);
  useEffect(() => {
    if (didInitFlowParam.current) return;
    if (flowParam && PRESET_FLOWS[flowParam] && (FLOW_STYLES[flowParam]?.length ?? 0) === 0) {
      didInitFlowParam.current = true;
      loadFlow(flowParam);
    }
  }, [flowParam, loadFlow]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // The Studio is a full-screen (100dvh) app — lock body scroll so focusing an
  // input (e.g. the support chat) doesn't scroll the shell and leave the header
  // off-screen / a gap under the footer after the keyboard closes.
  useEffect(() => {
    const html = document.documentElement, body = document.body;
    const prevHtml = html.style.overflow, prevBody = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    return () => { html.style.overflow = prevHtml; body.style.overflow = prevBody; };
  }, []);

  const handleNewFlow = useCallback(() => {
    setShowFlowSelector(true);
  }, []);

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

  // Find last completed export node image for the header download button
  const lastExportImage = (() => {
    const exportNodes = nodes.filter(n => n.type === 'export' && execStates[n.id] === 'done');
    for (let i = exportNodes.length - 1; i >= 0; i--) {
      const out = nodeOutputs[exportNodes[i].id];
      const img = out?.image || out?.finalImage;
      if (img && typeof img === 'string') return { src: img, format: (out?.format as string) || 'png' };
    }
    return null;
  })();

  return (
    <div style={{
      // Mobile: fixed to the visual viewport so the keyboard / body scroll can't
      // shift the studio (header off-screen, gap under the footer). Desktop stays
      // absolute within the shell main (right of the sidebar).
      position: isMobile ? 'fixed' : 'absolute',
      top: 0, left: 0, right: 0,
      // 100dvh = the VISIBLE viewport on mobile (excludes the browser toolbar area).
      // Using inset:0 inherited 100vh from the shell, pushing the footer bar below
      // the fold / under the Safari toolbar where it couldn't be scrolled to.
      height: '100dvh',
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
        onNodeDragStart={handleNodeDragStart}
        onNodeRun={handleNodeRun}
        onNodeDataChange={handleNodeDataChange}
        onAddConnection={handleAddConnection}
        onDeleteNode={handleDeleteNode}
      />

      {/* Fixed UI overlays */}
      {!isMobile && (
        <StudioTopMenu
          onNewFlow={handleNewFlow}
          onCloneFlow={handleCloneFlow}
          onAutoLayout={handleAutoLayout}
          onDeleteFlow={handleDeleteFlow}
        />
      )}

      {/* Mobile: top-left menu with all the desktop studio actions */}
      {isMobile && (
        <div style={{ position: 'absolute', top: 'max(12px, env(safe-area-inset-top))', left: 12, zIndex: 260 }}>
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Menu"
            style={{
              width: 40, height: 40, borderRadius: 12, border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))', color: 'hsl(var(--foreground))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', padding: 0,
            }}
          >
            <Menu size={20} />
          </button>
          {mobileMenuOpen && (
            <>
              <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1 }} />
              <div style={{
                position: 'absolute', top: 48, left: 0, zIndex: 2, minWidth: 210,
                background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.18)', overflow: 'hidden', padding: 6,
              }}>
                {[
                  { icon: <LayoutDashboard size={16} />, label: 'Voltar pra Dashboard', fn: () => navigate('/app/dashboard') },
                  { icon: <LayoutGrid size={16} />, label: 'Novo fluxo', fn: handleNewFlow },
                  { icon: <Undo2 size={16} />, label: 'Desfazer', fn: undo },
                  { icon: <Redo2 size={16} />, label: 'Refazer', fn: redo },
                  { icon: <Sparkles size={16} />, label: 'Auto Layout', fn: handleAutoLayout },
                ].map((it, i) => (
                  <button
                    key={i}
                    onClick={() => { it.fn(); setMobileMenuOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '11px 12px', borderRadius: 10, border: 'none', background: 'transparent',
                      color: 'hsl(var(--foreground))', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    {it.icon} {it.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* On mobile the properties panel is a bottom-sheet, so the credits bar must
          NOT shift left (that shift is for the desktop right-side panel). */}
      <CreditsBar propertiesOpen={showProperties && !isMobile} />
      {showPaywall && <PaywallModal plan={useCreditStore.getState().plan} onClose={() => setShowPaywall(false)} />}

      {/* Run All + Download result buttons (desktop; mobile uses the bottom bar) */}
      {!isMobile && (
      <div style={{
        position: 'absolute',
        top: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <button
          onClick={handleRunAll}
          disabled={flowRunning || nodes.length === 0}
          style={{
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

        {lastExportImage && (
          <button
            onClick={() => {
              const { src, format } = lastExportImage;
              const a = document.createElement('a');
              a.href = src;
              a.download = `creatyng-asset.${format}`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 18px',
              background: '#10B981',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
              fontFamily: 'inherit',
              transition: 'all 150ms',
              animation: 'downloadPulse 2s ease-in-out 1',
            }}
          >
            <Download size={14} />
            Baixar resultado
          </button>
        )}
      </div>
      )}

      {!isMobile && (
        <StudioNavbar
          openPanel={openPanel}
          chatOpen={chatOpen}
          onPanelChange={handlePanelChange}
          onChatToggle={() => setChatOpen(v => !v)}
        />
      )}

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

      {/* Floating chat (desktop) */}
      {!isMobile && (
        <StudioChat
          open={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}

      {!isMobile && (
        <StudioToolbar
          toolMode={toolMode}
          zoom={zoom}
          onToolChange={setToolMode}
          onZoomChange={setZoom}
        />
      )}

      {/* Mobile sticky bottom action bar */}
      {isMobile && (() => {
        const sbtn: React.CSSProperties = {
          flexShrink: 0, width: 44, height: 46, borderRadius: 12,
          background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', padding: 0,
        };
        return (
        <div
          style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 300,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 10px',
            paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
            background: 'hsl(var(--card))',
            borderTop: '1px solid hsl(var(--border))',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.10)',
          }}
        >
          <button onClick={() => setOpenPanel(openPanel === 'nodes' ? null : 'nodes')} aria-label="Adicionar node" style={sbtn}>
            <Plus size={22} />
          </button>
          <button onClick={() => fitToView(nodes)} aria-label="Enquadrar" style={sbtn}>
            <Maximize2 size={19} />
          </button>
          <button onClick={() => setZoom(z => Math.max(20, z - 20))} aria-label="Diminuir zoom" style={sbtn}>
            <ZoomOut size={19} />
          </button>
          <button onClick={() => setZoom(z => Math.min(200, z + 20))} aria-label="Aumentar zoom" style={sbtn}>
            <ZoomIn size={19} />
          </button>
          <button
            onClick={handleRunAll}
            disabled={flowRunning || nodes.length === 0}
            style={{
              flex: 1, minWidth: 0, height: 46, borderRadius: 12, border: 'none',
              background: flowRunning ? 'hsl(var(--muted))' : 'linear-gradient(135deg, #ff713d, #FF9B70)',
              color: flowRunning ? 'hsl(var(--muted-foreground))' : '#fff',
              fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: flowRunning || nodes.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <Play size={17} /> {flowRunning ? '...' : 'Executar'}
          </button>
          {lastExportImage && (
            <button
              onClick={() => {
                const { src, format } = lastExportImage;
                const a = document.createElement('a');
                a.href = src;
                a.download = `creatyng-asset.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
              aria-label="Baixar resultado"
              style={{ ...sbtn, background: '#10B981', border: 'none', color: '#fff' }}
            >
              <Download size={20} />
            </button>
          )}
        </div>
        );
      })()}

      {/* Flow selector modal */}
      {showFlowSelector && (
        <FlowSelector
          initialStyleFlow={initialStyleFlow ?? undefined}
          onClose={() => setShowFlowSelector(false)}
          onSelectFlow={(flowId, styleId) => loadFlow(flowId, styleId)}
          onEmptyFlow={() => {
            pushSnapshot();
            setNodes([]);
            setConnections([]);
            setExecStates({});
            setNodeOutputs({});
            setSelectedNodeId(null);
            setShowFlowSelector(false);
          }}
        />
      )}
    </div>
  );
}

export default StudioPage;
