'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ tipo: '', texto: '' });

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(false);
    setMsg({ tipo: '', texto: '' });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/recuperar-senha`,
      });

      if (error) throw error;

      setMsg({
        tipo: 'sucesso',
        texto: '✅ Link de recuperação enviado! Verifique sua caixa de entrada ou spam.',
      });
    } catch (err: any) {
      setMsg({
        tipo: 'erro',
        texto: '❌ Erro ao enviar link: ' + err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fb', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '100%', maxWidth: '420px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '700', textAlign: 'center', color: '#0f172a' }}>Recuperar Senha</h2>
        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>Insira seu e-mail para receber o link de redefinição.</p>

        {msg.texto && (
          <div style={{ padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', backgroundColor: msg.tipo === 'sucesso' ? '#d1fae5' : '#fee2e2', color: msg.tipo === 'sucesso' ? '#065f46' : '#991b1b' }}>
            {msg.texto}
          </div>
        )}

        <form onSubmit={handleRecuperar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>E-mail cadastrado</label>
            <input type="email" placeholder="seuemail@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#000', backgroundColor: '#fff' }} />
          </div>

          <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
            {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
          <Link href="/login" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: '600' }}>Voltar para o Login</Link>
        </div>
      </div>
    </div>
  );
}