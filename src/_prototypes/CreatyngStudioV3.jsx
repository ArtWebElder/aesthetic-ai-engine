import { useState, useEffect, useRef, useCallback } from "react";

const C = {
  accent: "#ff713d", accentLight: "#FF9B70", accentPale: "#FFF0EA",
  bg: "#f5f5f3", dark: "#141417", white: "#ffffff",
  border: "rgba(20,20,23,0.06)", borderStrong: "rgba(20,20,23,0.12)",
  text1: "#141417", text2: "#5a5a60", text3: "#8e8e96", text4: "#b5b5bb",
  success: "#10B981", error: "#EF4444", purple: "#7C3AED", cyan: "#06B6D4",
  canvas: "#F0F0EE",
};

/* ─── ICONS ─── */
const Ico = ({ children, size = 20, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);
const IcoPlus = (p) => <Ico size={18} {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ico>;
const IcoImage = (p) => <Ico size={16} {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></Ico>;
const IcoScissors = (p) => <Ico size={16} {...p}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/></Ico>;
const IcoSparkle = (p) => <Ico size={16} {...p}><path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" fill="currentColor" stroke="none"/></Ico>;
const IcoType = (p) => <Ico size={16} {...p}><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></Ico>;
const IcoDownload = (p) => <Ico size={16} {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Ico>;
const IcoPlay = (p) => <Ico size={14} {...p}><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none"/></Ico>;
const IcoLayers = (p) => <Ico size={16} {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Ico>;
const IcoGrid = (p) => <Ico size={16} {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Ico>;
const IcoChat = (p) => <Ico size={16} {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></Ico>;
const IcoBook = (p) => <Ico size={16} {...p}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></Ico>;
const IcoMinus = (p) => <Ico size={16} {...p}><line x1="5" y1="12" x2="19" y2="12"/></Ico>;
const IcoCheck = (p) => <Ico size={12} {...p}><polyline points="20 6 9 17 4 12"/></Ico>;
const IcoX = (p) => <Ico size={14} {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ico>;
const IcoSend = (p) => <Ico size={14} {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Ico>;
const IcoUndo = (p) => <Ico size={14} {...p}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></Ico>;
const IcoRedo = (p) => <Ico size={14} {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></Ico>;
const IcoLayout = (p) => <Ico size={14} {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></Ico>;
const IcoTrash = (p) => <Ico size={14} {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></Ico>;
const IcoCopy = (p) => <Ico size={14} {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></Ico>;
const IcoChevDown = (p) => <Ico size={12} {...p}><polyline points="6 9 12 15 18 9"/></Ico>;
// Cursor icons
const IcoCursor = (p) => <Ico size={16} {...p}><path d="M4 4l7.07 17 2.51-7.39L21 11.07z"/></Ico>;
const IcoHand = (p) => <Ico size={16} {...p}><path d="M18 11V6a2 2 0 00-4 0"/><path d="M14 10V4a2 2 0 00-4 0v7"/><path d="M10 10.5V8a2 2 0 00-4 0v8a6 6 0 006 6h2.3a6 6 0 005.04-2.74L22 14a2 2 0 00-3.3-1.47L18 13"/></Ico>;
const IcoZap = (p) => <Ico size={12} {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={C.accent} stroke={C.accent}/></Ico>;
const IcoUpgrade = (p) => <Ico size={14} {...p}><path d="M12 2L19 8l-3 0v6H8V8H5z"/><line x1="5" y1="18" x2="19" y2="18"/><line x1="5" y1="21" x2="19" y2="21"/></Ico>;

/* ─── NODE TYPES ─── */
const NODES = {
  brand_input: { label: "Dados da Marca", icon: IcoGrid, color: C.accent, ai: null, w: 280, h: 180 },
  image_upload: { label: "Upload de Imagem", icon: IcoImage, color: "#EC4899", ai: null, w: 280, h: 200 },
  text_input: { label: "Headline / Briefing", icon: IcoType, color: C.accent, ai: null, w: 280, h: 160 },
  prompt_builder: { label: "Prompt Builder", icon: IcoSparkle, color: C.purple, ai: "Gemini", w: 320, h: 250 },
  image_gen: { label: "Gerar Imagem", icon: IcoImage, color: "#10B981", ai: "Gemini", w: 300, h: 220 },
  export: { label: "Exportar", icon: IcoDownload, color: C.dark, ai: null, w: 200, h: 120 },
};

/* ─── INITIAL FLOW ─── */
const initNodes = [
  { id: "n1", type: "brand_input", x: 60, y: 40 },
  { id: "n2", type: "image_upload", x: 60, y: 280 },
  { id: "n3", type: "text_input", x: 60, y: 540 },
  { id: "n4", type: "prompt_builder", x: 480, y: 180 },
  { id: "n5", type: "image_gen", x: 880, y: 200 },
];
const initConns = [
  { from: "n1", to: "n4" }, { from: "n2", to: "n5" }, { from: "n3", to: "n4" }, { from: "n4", to: "n5" },
];

/* ─── CONNECTION SVG ─── */
function Conn({ from, to, nodes, zoom }) {
  const fn = nodes.find(n => n.id === from);
  const tn = nodes.find(n => n.id === to);
  if (!fn || !tn) return null;
  const fd = NODES[fn.type] || {};
  const x1 = fn.x + (fd.w || 280), y1 = fn.y + (fd.h || 180) / 2;
  const x2 = tn.x, y2 = tn.y + (NODES[tn.type]?.h || 180) / 2;
  const cx1 = x1 + 60, cx2 = x2 - 60;
  return <path d={`M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`} fill="none" stroke={C.accent} strokeWidth={2} opacity={0.25} />;
}

/* ─── NODE CARD ─── */
function NodeCard({ node, selected, onSelect, onDrag, onRun, execState }) {
  const def = NODES[node.type] || {};
  const Icon = def.icon;
  const [isDrag, setIsDrag] = useState(false);
  const ref = useRef({});

  const down = (e) => {
    e.stopPropagation();
    onSelect(node.id);
    setIsDrag(true);
    ref.current = { x: e.clientX, y: e.clientY, nx: node.x, ny: node.y };
    const mv = (e2) => onDrag(node.id, ref.current.nx + e2.clientX - ref.current.x, ref.current.ny + e2.clientY - ref.current.y);
    const up = () => { setIsDrag(false); window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up);
  };

  const running = execState === "running";
  const done = execState === "done";

  return (
    <div onMouseDown={down} style={{
      position: "absolute", left: node.x, top: node.y, width: def.w || 280,
      background: C.white, borderRadius: 12, overflow: "visible",
      border: `1px solid ${selected ? def.color : done ? C.success : C.borderStrong}`,
      boxShadow: selected ? `0 0 0 2px ${def.color}30, 0 4px 16px rgba(0,0,0,0.06)` : running ? `0 0 20px ${C.accent}25` : "0 1px 6px rgba(0,0,0,0.04)",
      cursor: isDrag ? "grabbing" : "grab", userSelect: "none", zIndex: selected ? 10 : 1,
      transition: isDrag ? "none" : "box-shadow 200ms, border 200ms",
    }}>
      {/* Header */}
      <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 7, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ width: 20, height: 20, borderRadius: 5, background: `${def.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: def.color }}><Icon size={12} /></div>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.text1, flex: 1 }}>{def.label}</span>
        {def.ai && (
          <span style={{ padding: "1px 6px", borderRadius: 4, background: `${C.purple}10`, fontSize: 9.5, fontWeight: 600, color: C.purple, display: "flex", alignItems: "center", gap: 3 }}>
            <IcoSparkle size={9} style={{ color: C.purple }} />{def.ai}
          </span>
        )}
      </div>

      {/* Content by type */}
      <div style={{ padding: "10px 12px" }}>
        {node.type === "brand_input" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div><label style={{ fontSize: 10, color: C.text3, display: "block", marginBottom: 3 }}>Brand Name</label><input placeholder="Nome da marca" style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: `1px solid ${C.borderStrong}`, fontSize: 12, fontFamily: "inherit", background: C.bg, color: C.text1 }} onClick={e => e.stopPropagation()} /></div>
            <div><label style={{ fontSize: 10, color: C.text3, display: "block", marginBottom: 3 }}>Description</label><textarea placeholder="Descreva seu negócio..." rows={2} style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: `1px solid ${C.borderStrong}`, fontSize: 12, fontFamily: "inherit", background: C.bg, color: C.text1, resize: "none" }} onClick={e => e.stopPropagation()} /></div>
          </div>
        )}

        {node.type === "image_upload" && (
          <div style={{ border: `1.5px dashed ${C.borderStrong}`, borderRadius: 10, padding: "24px 16px", textAlign: "center", cursor: "pointer", color: C.text4 }} onClick={e => e.stopPropagation()}>
            <IcoImage size={24} stroke={C.text4} style={{ margin: "0 auto 6px", display: "block" }} />
            <div style={{ fontSize: 12, fontWeight: 500 }}>Drag and drop image(s)</div>
            <div style={{ fontSize: 10.5, marginTop: 2 }}>or click to upload</div>
          </div>
        )}

        {node.type === "text_input" && (
          <div>
            <textarea placeholder="Write a prompt here" rows={3} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1px solid ${C.borderStrong}`, fontSize: 12, fontFamily: "inherit", background: C.bg, color: C.text1, resize: "none" }} onClick={e => e.stopPropagation()} />
          </div>
        )}

        {node.type === "prompt_builder" && (
          <div>
            <div style={{
              minHeight: 100, padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
              background: done ? C.bg : running ? `${C.accent}04` : C.bg, fontSize: 12, color: C.text2, lineHeight: 1.5,
              transition: "all 300ms",
            }}>
              {done ? "It looks like you submitted a form with the fields \"brand_name\" and \"description\". Please provide more details about your brand." : running ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.accent }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${C.accent}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ fontSize: 11.5, fontWeight: 500 }}>Generating...</span>
                </div>
              ) : <span style={{ color: C.text4, fontStyle: "italic" }}>Output will appear here...</span>}
            </div>
            {/* Footer with AI model + Run */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ padding: "2px 7px", borderRadius: 4, background: `${C.purple}10`, fontSize: 10, fontWeight: 600, color: C.purple, display: "flex", alignItems: "center", gap: 3 }}>
                  <IcoSparkle size={9} style={{ color: C.purple }} />Gemini Pro
                </span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onRun?.(node.id); }} style={{
                padding: "5px 14px", borderRadius: 7, border: "none",
                background: done ? C.bg : `${C.accent}`, color: done ? C.text3 : "#fff",
                fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 4,
              }}><IcoPlay size={10} />Run</button>
            </div>
          </div>
        )}

        {node.type === "image_gen" && (
          <div>
            <div style={{ fontSize: 10.5, color: C.text3, marginBottom: 6 }}>Text prompt</div>
            <div style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, fontSize: 11, color: C.text2, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
              <IcoType size={11} stroke={C.accent} /><span>Prompt Builder</span><button style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: C.text4 }}><IcoX size={10} /></button>
            </div>
            <div style={{ fontSize: 10.5, color: C.text3, marginBottom: 4 }}>Reference image(s) <span style={{ color: C.text4, fontSize: 9.5 }}>OPTIONAL</span></div>
            <div style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, fontSize: 11, color: C.text4, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
              <IcoImage size={11} />Connect an image input
            </div>
            {/* Preview area */}
            <div style={{
              height: 60, borderRadius: 8, background: done ? `linear-gradient(135deg, ${C.accent}, ${C.accentLight})` : C.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${done ? `${C.accent}30` : C.border}`, transition: "all 400ms",
            }}>
              {done ? <span style={{ color: "#fff", fontSize: 10, fontWeight: 600, textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>Preview generated</span> : <span style={{ fontSize: 10, color: C.text4 }}>Preview</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ padding: "2px 7px", borderRadius: 4, background: `${C.success}10`, fontSize: 10, fontWeight: 600, color: C.success, display: "flex", alignItems: "center", gap: 3 }}>
                <IcoSparkle size={9} style={{ color: C.success }} />Gemini Pro
              </span>
              <button onClick={(e) => { e.stopPropagation(); onRun?.(node.id); }} style={{
                padding: "5px 14px", borderRadius: 7, border: "none",
                background: C.accent, color: "#fff", fontSize: 11.5, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4,
              }}><IcoPlay size={10} />Run</button>
            </div>
          </div>
        )}
      </div>

      {/* Connection port - output */}
      {node.type !== "export" && (
        <div style={{ position: "absolute", right: -7, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, borderRadius: "50%", background: C.white, border: `2px solid ${def.color}`, zIndex: 5, cursor: "crosshair" }}>
          <div style={{ position: "absolute", inset: 3, borderRadius: "50%", background: def.color }} />
        </div>
      )}
    </div>
  );
}

/* ─── MAIN ─── */
export default function StudioV3() {
  const [nodes, setNodes] = useState(initNodes);
  const [selected, setSelected] = useState(null);
  const [tool, setTool] = useState("cursor"); // cursor | hand
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, px: 0, py: 0 });
  const [sideTab, setSideTab] = useState(null);
  const [sideHover, setSideHover] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [execStates, setExecStates] = useState({});
  const [chatMsgs, setChatMsgs] = useState([{ role: "ai", text: "Descreva o que quer criar e eu monto o fluxo!" }]);
  const [chatInput, setChatInput] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const canvasRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const moveNode = useCallback((id, x, y) => setNodes(ns => ns.map(n => n.id === id ? { ...n, x, y } : n)), []);

  const autoLayout = () => {
    const cols = [
      ["n1", "n2", "n3"],
      ["n4"],
      ["n5"],
    ];
    const colX = [80, 460, 840];
    const newNodes = nodes.map(n => {
      for (let ci = 0; ci < cols.length; ci++) {
        const idx = cols[ci].indexOf(n.id);
        if (idx !== -1) {
          const totalH = cols[ci].length * 220;
          const startY = Math.max(40, (600 - totalH) / 2);
          return { ...n, x: colX[ci], y: startY + idx * 230 };
        }
      }
      // For dynamically added nodes, stack them
      const dynIdx = nodes.filter(nd => !["n1","n2","n3","n4","n5"].includes(nd.id)).indexOf(n);
      return { ...n, x: 1200, y: 80 + dynIdx * 200 };
    });
    setNodes(newNodes);
  };

  const runNode = (id) => {
    setExecStates(s => ({ ...s, [id]: "running" }));
    const dur = nodes.find(n => n.id === id)?.type === "image_gen" ? 3000 : 1800;
    setTimeout(() => setExecStates(s => ({ ...s, [id]: "done" })), dur);
  };

  // Canvas pan
  const canvasDown = (e) => {
    if (tool === "hand" || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY, px: pan.x, py: pan.y });
    }
  };
  const canvasMove = (e) => {
    if (isPanning) setPan({ x: panStart.px + e.clientX - panStart.x, y: panStart.py + e.clientY - panStart.y });
  };
  const canvasUp = () => setIsPanning(false);

  // Zoom with wheel
  const onWheel = (e) => {
    e.preventDefault();
    setZoom(z => Math.max(30, Math.min(200, z + (e.deltaY > 0 ? -5 : 5))));
  };

  const sendChat = (text) => {
    if (!text.trim()) return;
    setChatMsgs(m => [...m, { role: "user", text }]);
    setChatInput("");
    setTimeout(() => setChatMsgs(m => [...m, { role: "ai", text: `Fluxo montado para "${text.slice(0,35)}..."! Os nodes estão no canvas.` }]), 1200);
  };

  const scale = zoom / 100;
  const gridSvg = `url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='0.6' fill='rgba(20,20,23,0.07)'/%3E%3C/svg%3E")`;

  const sideItems = [
    { id: "add", icon: IcoPlus, label: "Add node", color: C.accent, filled: true },
    { id: "assets", icon: IcoGrid, label: "Assets" },
    { id: "templates", icon: IcoLayers, label: "Templates" },
    { id: "chat", icon: IcoChat, label: "Chat with AI", action: "chat" },
    { id: "learn", icon: IcoBook, label: "Aprenda" },
  ];

  return (
    <div style={{ fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif", height: "100vh", position: "relative", overflow: "hidden", background: C.canvas, color: C.text1 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fdUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input:focus,textarea:focus{outline:none}input::placeholder,textarea::placeholder{color:${C.text4}}
      `}</style>

      {/* ═══ TOP LEFT: Logo + Menu ═══ */}
      <div ref={menuRef} style={{ position: "absolute", top: 14, left: 14, zIndex: 30 }}>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "6px 12px 6px 6px",
          borderRadius: 10, border: `1px solid ${C.borderStrong}`, background: C.white,
          cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 11 }}>C</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>Creatyng Studio</span>
          <IcoChevDown stroke={C.text3} />
        </button>
        {menuOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, width: 200, background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: "0 8px 30px rgba(0,0,0,0.1)", padding: 5, animation: "fdUp 150ms ease both" }}>
            {[
              { label: "Voltar ao Home", icon: IcoLayout },
              { label: "Novo Fluxo", icon: IcoPlus },
              { label: "Clonar Fluxo", icon: IcoCopy },
              { divider: true },
              { label: "Undo", icon: IcoUndo, shortcut: "Ctrl+Z" },
              { label: "Redo", icon: IcoRedo, shortcut: "Ctrl+Shift+Z" },
              { divider: true },
              { label: "Auto Layout", icon: IcoGrid, action: "autoLayout" },
              { divider: true },
              { label: "Excluir Fluxo", icon: IcoTrash, danger: true },
            ].map((item, i) => item.divider ? (
              <div key={i} style={{ height: 1, background: C.border, margin: "3px 0" }} />
            ) : (
              <button key={i} onClick={() => { setMenuOpen(false); if (item.action === "autoLayout") autoLayout(); }} style={{
                width: "100%", padding: "7px 10px", borderRadius: 7, border: "none", background: "transparent",
                cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, textAlign: "left",
                color: item.danger ? C.error : C.text1, display: "flex", alignItems: "center", gap: 8,
                transition: "background 80ms",
              }}
                onMouseEnter={e => e.currentTarget.style.background = item.danger ? `${C.error}08` : "rgba(20,20,23,0.03)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <item.icon size={14} stroke={item.danger ? C.error : C.text3} />
                <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                {item.shortcut && <span style={{ fontSize: 10, color: C.text4 }}>{item.shortcut}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══ TOP RIGHT: Actions ═══ */}
      <div style={{ position: "absolute", top: 14, right: 14, zIndex: 30, display: "flex", gap: 6, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, background: C.white, border: `1px solid ${C.borderStrong}`, fontSize: 11.5, color: C.text3, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <IcoZap /><span style={{ fontWeight: 600, color: C.accent }}>221</span>
        </div>
        <button style={{ padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${C.accent}`, background: C.accentPale, color: C.accent, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <IcoUpgrade />Upgrade
        </button>
      </div>

      {/* ═══ LEFT: Floating Nav ═══ */}
      <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", zIndex: 30, display: "flex", flexDirection: "column", gap: 2 }}>
        {sideItems.map(item => (
          <div key={item.id} style={{ position: "relative" }}
            onMouseEnter={() => setSideHover(item.id)} onMouseLeave={() => setSideHover(null)}
          >
            <button onClick={() => { if (item.action === "chat") { setChatOpen(c => !c); } else { setSideTab(sideTab === item.id ? null : item.id); } }} style={{
              width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.borderStrong}`,
              background: item.filled ? C.accent : (item.action === "chat" ? (chatOpen ? C.accentPale : C.white) : (sideTab === item.id ? C.accentPale : C.white)),
              color: item.filled ? "#fff" : (item.action === "chat" ? (chatOpen ? C.accent : C.text3) : (sideTab === item.id ? C.accent : C.text3)),
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)", transition: "all 120ms",
            }}><item.icon /></button>
            {/* Expand label on hover */}
            {sideHover === item.id && !sideTab && (
              <div style={{ position: "absolute", left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)", padding: "5px 12px", borderRadius: 7, background: C.white, border: `1px solid ${C.borderStrong}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", whiteSpace: "nowrap", fontSize: 12, fontWeight: 500, color: C.text1, animation: "fdUp 100ms ease both" }}>
                {item.label}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ═══ SIDE PANEL (expanded) ═══ */}
      {sideTab && sideTab !== "chat" && (
        <div style={{ position: "absolute", left: 62, top: 60, bottom: 60, width: 260, background: C.white, borderRadius: 14, border: `1px solid ${C.borderStrong}`, boxShadow: "0 8px 30px rgba(0,0,0,0.08)", zIndex: 25, display: "flex", flexDirection: "column", overflow: "hidden", animation: "fdUp 150ms ease both" }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{sideItems.find(s => s.id === sideTab)?.label}</span>
            <button onClick={() => setSideTab(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.text4 }}><IcoX /></button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
            {sideTab === "templates" && (
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 600, color: C.text4, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Fluxos prontos</div>
                {["Food/Pop Básico", "Pop Design Completo", "Editorial Premium", "Clone de Anúncio", "Multi-formato"].map((t, i) => (
                  <button key={i} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.borderStrong}`, background: C.white, cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: C.text1, marginBottom: 5, textAlign: "left", display: "flex", alignItems: "center", gap: 7, transition: "all 100ms" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.accentPale; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderStrong; e.currentTarget.style.background = C.white; }}
                  ><IcoLayers size={13} stroke={C.text3} />{t}</button>
                ))}
              </div>
            )}

            {sideTab === "assets" && (
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 600, color: C.text4, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Seus assets</div>
                {["Logo principal.png", "Paleta de cores", "Fonte — Instrument Sans", "Foto produto 01.jpg"].map((a, i) => (
                  <div key={i} style={{ padding: "8px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, marginBottom: 4, fontSize: 12, color: C.text2, display: "flex", alignItems: "center", gap: 7 }}>
                    <IcoImage size={13} stroke={C.text4} />{a}
                  </div>
                ))}
              </div>
            )}

            {sideTab === "learn" && (
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 600, color: C.text4, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Aprenda Creatyng Studio</div>
                {[
                  { t: "Primeiros passos", d: "Como criar seu primeiro fluxo" },
                  { t: "Nodes disponíveis", d: "Todos os blocos que você pode usar" },
                  { t: "Conectando nodes", d: "Como ligar inputs e outputs" },
                  { t: "Dicas avançadas", d: "Atalhos e truques de produtividade" },
                ].map((item, i) => (
                  <button key={i} style={{ width: "100%", padding: "10px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", fontFamily: "inherit", marginBottom: 5, textAlign: "left", transition: "all 100ms" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = C.white}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text1 }}>{item.t}</div>
                    <div style={{ fontSize: 10.5, color: C.text3, marginTop: 2 }}>{item.d}</div>
                  </button>
                ))}
              </div>
            )}

            {sideTab === "add" && (
              <div>
                <input placeholder="Search" style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: `1px solid ${C.borderStrong}`, fontSize: 12, fontFamily: "inherit", marginBottom: 12, background: C.bg, color: C.text1 }} />
                {[
                  { cat: "FREQUENTLY USED", items: ["Text prompt", "Upload image", "Generate Text", "Generate Image"] },
                  { cat: "USE AI", items: [{ l: "AI Image", d: "Generate visuals with AI" }, { l: "AI Video", d: "Generate videos with AI", tag: "New" }] },
                  { cat: "PROVIDE CONTEXT", items: [{ l: "Inputs", d: "Starting point for most agents" }, { l: "Brand system", d: "Keep your brand consistent" }] },
                ].map((sec, si) => (
                  <div key={si} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 600, color: C.text4, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{sec.cat}</div>
                    {sec.items.map((item, ii) => {
                      const isStr = typeof item === "string";
                      return (
                        <button key={ii} style={{
                          width: "100%", padding: isStr ? "6px 8px" : "8px 10px", borderRadius: 7, border: "none",
                          background: "transparent", cursor: "pointer", fontFamily: "inherit",
                          display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.text1,
                          transition: "background 80ms", textAlign: "left", marginBottom: 1,
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(20,20,23,0.03)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          {!isStr && <div style={{ width: 28, height: 28, borderRadius: 7, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", color: C.text3, flexShrink: 0 }}><IcoSparkle size={13} /></div>}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>{isStr ? item : item.l}{!isStr && item.tag && <span style={{ padding: "1px 5px", borderRadius: 3, background: `${C.accent}15`, color: C.accent, fontSize: 9, fontWeight: 600 }}>{item.tag}</span>}</div>
                            {!isStr && <div style={{ fontSize: 10.5, color: C.text3, marginTop: 1 }}>{item.d}</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ CANVAS ═══ */}
      <div
        ref={canvasRef}
        onMouseDown={canvasDown} onMouseMove={canvasMove} onMouseUp={canvasUp} onMouseLeave={canvasUp}
        onWheel={onWheel}
        onClick={() => { setSelected(null); setMenuOpen(false); }}
        style={{
          position: "absolute", inset: 0, background: `${gridSvg}, ${C.canvas}`,
          cursor: tool === "hand" || isPanning ? "grab" : "default",
          overflow: "hidden",
        }}
      >
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: "0 0", position: "relative", width: 3000, height: 2000 }}>
          {/* Connections */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            {initConns.map((c, i) => <Conn key={i} from={c.from} to={c.to} nodes={nodes} zoom={zoom} />)}
          </svg>
          {/* Nodes */}
          {nodes.map(n => <NodeCard key={n.id} node={n} selected={selected === n.id} execState={execStates[n.id] || "idle"} onSelect={setSelected} onDrag={moveNode} onRun={runNode} />)}

          {/* Empty state hint (center) */}
          {nodes.length === 0 && (
            <div style={{ position: "absolute", top: 300, left: 500, textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.text2, marginBottom: 4 }}>Add your first <span style={{ padding: "3px 10px", borderRadius: 6, background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700 }}>+ node</span>, or use a template:</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                {["Enhance my prompt", "Create a product shot", "Turn an image into a video"].map((t, i) => (
                  <button key={i} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.borderStrong}`, background: C.white, fontSize: 12, color: C.text2, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
                    <IcoSparkle size={12} style={{ color: C.text3 }} />{t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ FLOATING CHAT MODAL (centered above toolbar) ═══ */}
      {chatOpen && (
        <div style={{ position: "absolute", bottom: 68, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 35, pointerEvents: "none" }}>
          <div style={{ width: 480, pointerEvents: "auto", animation: "fdUp 200ms ease both" }}>
            <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.borderStrong}`, boxShadow: "0 12px 40px rgba(0,0,0,0.12)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: 370 }}>
              {/* Chat header */}
              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IcoSparkle size={11} style={{ color: "#fff" }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Descreva e o AI monta o fluxo</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button onClick={() => setChatOpen(false)} title="Minimizar" style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text4, transition: "all 100ms" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = C.white}
                  ><IcoMinus size={12} /></button>
                  <button onClick={() => setChatOpen(false)} title="Fechar" style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text4, transition: "all 100ms" }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${C.error}08`; e.currentTarget.style.color = C.error; }}
                    onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.color = C.text4; }}
                  ><IcoX /></button>
                </div>
              </div>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8, minHeight: 120 }}>
                {chatMsgs.map((m, i) => (
                  <div key={i} style={{
                    padding: "9px 13px", borderRadius: m.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                    fontSize: 12.5, lineHeight: 1.45, maxWidth: "85%",
                    background: m.role === "user" ? `linear-gradient(135deg,${C.accent},${C.accentLight})` : C.bg,
                    color: m.role === "user" ? "#fff" : C.text2,
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  }}>{m.text}</div>
                ))}
              </div>
              {/* Input */}
              <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendChat(chatInput)}
                    placeholder="Descreva o que quer criar hoje"
                    style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: `1px solid ${C.borderStrong}`, fontSize: 12.5, fontFamily: "inherit", background: C.bg, color: C.text1 }}
                    onClick={e => e.stopPropagation()}
                  />
                  <button onClick={() => sendChat(chatInput)} style={{
                    width: 34, height: 34, borderRadius: 9, border: "none",
                    background: chatInput.trim() ? C.accent : "rgba(20,20,23,0.06)",
                    color: chatInput.trim() ? "#fff" : C.text4,
                    cursor: chatInput.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", transition: "all 150ms",
                  }}><IcoSend /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ BOTTOM TOOLBAR ═══ */}
      <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", zIndex: 30, display: "flex", gap: 6, alignItems: "center" }}>
        {/* Tool toggle */}
        <div style={{ display: "flex", background: C.white, borderRadius: 9, padding: 3, border: `1px solid ${C.borderStrong}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <button onClick={() => setTool("cursor")} style={{
            width: 32, height: 32, borderRadius: 7, border: "none", cursor: "pointer",
            background: tool === "cursor" ? C.bg : "transparent", color: tool === "cursor" ? C.accent : C.text3,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><IcoCursor /></button>
          <button onClick={() => setTool("hand")} style={{
            width: 32, height: 32, borderRadius: 7, border: "none", cursor: "pointer",
            background: tool === "hand" ? C.bg : "transparent", color: tool === "hand" ? C.accent : C.text3,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><IcoHand /></button>
        </div>
        {/* Zoom */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, background: C.white, borderRadius: 9, padding: 3, border: `1px solid ${C.borderStrong}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <button onClick={() => setZoom(z => Math.max(30, z - 10))} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text3 }}><IcoMinus /></button>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.text1, minWidth: 38, textAlign: "center" }}>{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(200, z + 10))} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text3 }}><IcoPlus /></button>
        </div>
      </div>
    </div>
  );
}
