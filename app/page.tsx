'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Vaga {
  id: number;
  titulo: string;
  descricao: string;
  localizacao: string;
  salario: string;
}

export default function Home() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function buscarVagas() {
      const { data } = await supabase
        .from('vagas')
        .select('*')
        .eq('status', 'ativa')
        .order('criado_em', { ascending: false });

      if (data) setVagas(data);
      setLoading(false);
    }
    buscarVagas();
  }, []);

  if (loading) return <p style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'Arial' }}>Carregando vagas...</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #f0f0f0', paddingBottom: '20px' }}>
        <h1>Portal de Vagas</h1>
        <Link href="/login" style={{ padding: '12px 20px', backgroundColor: '#0070f3', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
          Acessar Sistema
        </Link>
      </header>

      <h2>Últimas Oportunidades Cadastradas</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
        {vagas.length === 0 ? (
          <p style={{ color: '#666' }}>Nenhuma vaga aberta no momento. Volte mais tarde!</p>
        ) : (
          vagas.map((vaga) => (
            <div key={vaga.id} style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{vaga.titulo}</h3>
              <p style={{ fontSize: '14px', color: '#666', margin: '0 0 15px 0' }}>
                📌 {vaga.localizacao} {vaga.salario && `| 💰 ${vaga.salario}`}
              </p>
              <p style={{ color: '#444', lineHeight: '1.5' }}>{vaga.descricao}</p>
              <Link href="/login" style={{ display: 'inline-block', marginTop: '10px', color: '#0070f3', fontWeight: 'bold', textDecoration: 'none' }}>
                Quero me candidatar →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}