import { Zap } from 'lucide-react';

export default function AdminTokens() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fafafa', marginBottom: 16 }}>Tokens & Providers</h1>
      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 48, textAlign: 'center' }}>
        <Zap size={32} style={{ color: '#3f3f46', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 14, color: '#71717a', marginBottom: 4 }}>Monitoramento de tokens em desenvolvimento</p>
        <p style={{ fontSize: 12, color: '#52525b' }}>Os dados de uso por provider serão integrados quando o sistema de tracking de tokens estiver ativo.</p>
      </div>
    </div>
  );
}
