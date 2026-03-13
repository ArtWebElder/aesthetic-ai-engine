import { Connection, ExecState, NODE_TYPE_DEFS, StudioNode } from './types';

interface StudioConnectionProps {
  connection: Connection;
  nodes: StudioNode[];
  execStates: Record<string, ExecState>;
}

export function StudioConnection({ connection, nodes, execStates }: StudioConnectionProps) {
  const fromNode = nodes.find(n => n.id === connection.fromNode);
  const toNode = nodes.find(n => n.id === connection.toNode);
  if (!fromNode || !toNode) return null;

  const fromDef = NODE_TYPE_DEFS[fromNode.type];
  const toDef = NODE_TYPE_DEFS[toNode.type];

  const x1 = fromNode.x + fromDef.defaultWidth;
  const y1 = fromNode.y + fromDef.defaultHeight / 2;
  const x2 = toNode.x;
  const y2 = toNode.y + toDef.defaultHeight / 2;

  const dx = Math.max(60, Math.abs(x2 - x1) * 0.5);
  const d = `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;

  const fromExec = execStates[connection.fromNode] ?? 'idle';
  const toExec = execStates[connection.toNode] ?? 'idle';
  const isDone = fromExec === 'done' && toExec === 'done';
  const isRunning = fromExec === 'running' || toExec === 'running';

  const stroke = isDone ? '#10b981' : isRunning ? '#ff713d' : 'hsl(var(--border))';
  const strokeWidth = isDone ? 2 : 1.5;
  const strokeDasharray = isDone ? 'none' : isRunning ? '6 3' : '4 4';

  return (
    <g>
      {/* Shadow/glow path */}
      <path
        d={d}
        fill="none"
        stroke={isDone ? '#10b98140' : isRunning ? '#ff713d30' : 'transparent'}
        strokeWidth={6}
        strokeLinecap="round"
      />
      {/* Main path */}
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={strokeDasharray}
      >
        {isRunning && (
          <animate
            attributeName="stroke-dashoffset"
            values="0;-18"
            dur="0.6s"
            repeatCount="indefinite"
          />
        )}
      </path>
      {/* Endpoint dots */}
      <circle cx={x1} cy={y1} r={3} fill={stroke} opacity={0.8} />
      <circle cx={x2} cy={y2} r={3} fill={stroke} opacity={0.8} />
    </g>
  );
}
