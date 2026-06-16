'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RecuperarSenhaPage() {
  const router = useRouter();
  const [novaSenha, setNovaSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleAtualizarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (error) throw error;

      alert('Senha redefinida com sucesso! Redirecionando para o login...');
      router.push('/login');
    } catch (err: any) {
      setMsg('❌ Erro ao atualizar senha: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fb', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '100%', maxWidth: '420px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '700', textAlign: 'center', color: '#0f172a' }}>Nova Senha</h2>
        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>Defina a sua nova credencial de acesso abaixo.</p>

        {msg && (
          <div style={{ padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', backgroundColor: '#fee2e2', color: '#991b1b' }}>
            {msg}
          </div>
        )}

        <form onSubmit={handleAtualizarSenha} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Nova Senha (mínimo 6 caracteres)</label>
            <input type="password" placeholder="******" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required minLength={6} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#000', backgroundColor: '#fff' }} />
          </div>

          <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
            {loading ? 'Salvando...' : 'Modificar e Salvar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}