'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Script from 'next/script'; // 🔥 Importado para injetar o Google Analytics com segurança
import styles from './painel.module.css';

export default function PainelPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [vagas, setVagas] = useState<any[]>([]);
  const [vagasFiltradas, setVagasFiltradas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidatadoIds, setCandidatadoIds] = useState<number[]>([]);
  const [minhasCandidaturasComStatus, setMinhasCandidaturasComStatus] = useState<any[]>([]);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  // Filtros de Pesquisa
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [localizacaoFiltro, setLocalizacaoFiltro] = useState('');

  // Controle de abertura do perfil no mobile
  const [perfilAbertoMobile, setPerfilAbertoMobile] = useState(false);

  // Estados do Perfil do Candidato
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [resumo, setResumo] = useState('');
  const [curriculoUrl, setCurriculoUrl] = useState('');
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [perfilMsg, setPerfilMsg] = useState('');

  const formatarTelefone = (value: string) => {
    if (!value) return '';
    const apenasNumeros = value.replace(/\D/g, '');
    if (apenasNumeros.length <= 2) return `(${apenasNumeros}`;
    if (apenasNumeros.length <= 6) return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
    if (apenasNumeros.length <= 10) return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7, 11)}`;
  };

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUser(user);

        const { data: perfil } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', user.id)
          .single();

        if (perfil) {
          setNome(perfil.nome || '');
          setTelefone(formatarTelefone(perfil.telefone || ''));
          setLinkedin(perfil.linkedin || '');
          setResumo(perfil.resumo || '');
          setCurriculoUrl(perfil.curriculo || '');
        }

        const { data: listaVagas } = await supabase
          .from('vagas')
          .select('*, candidaturas(id)')
          .neq('status', 'pendente')
          .order('criado_em', { ascending: false });
        
        setVagas(listaVagas || []);

        const { data: minhasCandidaturas } = await supabase
          .from('candidaturas')
          .select('vaga_id, status')
          .eq('candidato_id', user.id);

        if (minhasCandidaturas) {
          setCandidatadoIds(minhasCandidaturas.map(c => c.vaga_id));
          setMinhasCandidaturasComStatus(minhasCandidaturas);
        }
      } catch (err) {
        console.error('Erro ao carregar painel:', err);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [router]);

  useEffect(() => {
    // Filtramos para a listagem principal apenas vagas que têm posições disponíveis
    let resultado = vagas.filter(v => v.vagas_disponiveis > 0 && v.status !== 'esgotada');

    if (busca.trim() !== '') {
      resultado = resultado.filter(v => 
        v.titulo.toLowerCase().includes(busca.toLowerCase()) || 
        v.descricao.toLowerCase().includes(busca.toLowerCase())
      );
    }
    if (categoriaFiltro !== '') {
      resultado = resultado.filter(v => v.categoria === categoriaFiltro);
    }
    if (localizacaoFiltro !== '') {
      resultado = resultado.filter(v => v.localizacao === localizacaoFiltro);
    }
    setVagasFiltradas(resultado);
  }, [busca, categoriaFiltro, localizacaoFiltro, vagas]);

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoPerfil(true);
    setPerfilMsg('');

    try {
      let urlFinal = curriculoUrl;

      if (arquivoSelecionado) {
        const extensao = arquivoSelecionado.name.split('.').pop();
        const nomeArquivo = `${user.id}-${Date.now()}.${extensao}`;

        const { error: uploadError } = await supabase.storage
          .from('curriculos')
          .upload(nomeArquivo, arquivoSelecionado, { cacheControl: '3600', upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('curriculos')
          .getPublicUrl(nomeArquivo);

        urlFinal = publicUrlData.publicUrl;
        setCurriculoUrl(urlFinal);
      }

      const { error } = await supabase
        .from('perfis')
        .update({
          nome,
          telefone,
          linkedin,
          resumo,
          curriculo: urlFinal
        })
        .eq('id', user.id);

      if (error) throw error;
      setPerfilMsg('✅ Perfil e arquivo atualizados com sucesso!');
      setArquivoSelecionado(null);
    } catch (err: any) {
      setPerfilMsg('❌ Erro ao salvar dados ou fazer upload do arquivo.');
      console.error(err);
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const handleCandidatar = async (vagaId: number, vagasDisponiveis: number) => {
    if (!user) return;
    
    if (!telefone || !resumo || !curriculoUrl || !nome) {
      alert('⚠️ Atenção: Você precisa preencher seu perfil completo e salvar o arquivo do seu Currículo antes de se candidatar!');
      return;
    }

    if (vagasDisponiveis <= 0) {
      alert('Desculpe, esta vaga está esgotada!');
      return;
    }

    setSubmittingId(vagaId);
    try {
      const { error } = await supabase.from('candidaturas').insert({
        vaga_id: vagaId,
        candidato_id: user.id,
        status: 'novo'
      });

      if (error) {
        alert('Erro ao se candidatar: ' + error.message);
      } else {
        setVagas(prev => prev.map(v => {
          if (v.id === vagaId) {
            const novasDisponiveis = Math.max(0, v.vagas_disponiveis - 1);
            return {
              ...v,
              vagas_disponiveis: novasDisponiveis,
              status: novasDisponiveis === 0 ? 'esgotada' : v.status,
              candidaturas: [...(v.candidaturas || []), { id: Date.now() }]
            };
          }
          return v;
        }));
        setCandidatadoIds([...candidatadoIds, vagaId]);
        setMinhasCandidaturasComStatus([...minhasCandidaturasComStatus, { vaga_id: vagaId, status: 'novo' }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingId(null);
    }
  };

  // Mantemos a leitura com base em todas as vagas para popular filtros e histórico corretamente
  const categoriasDisponiveis = Array.from(new Set(vagas.map(v => v.categoria).filter(Boolean)));
  const localizacoesDisponiveis = Array.from(new Set(vagas.map(v => v.localizacao).filter(Boolean)));
  const minhasVagasInscritas = vagas.filter(v => candidatadoIds.includes(v.id));

  if (loading) {
    return <div className={styles.loadingContainer}>Carregando dados do portal...</div>;
  }

  return (
    <div className={styles.containerPortal}>
      {/* 🔥 Configuração Segura do Google Analytics (gtag.js) */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-ZVL93GGMV9"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-ZVL93GGMV9');
        `}
      </Script>
      
      {/* NAVBAR */}
      <header className={styles.headerPortal}>
        <div className={styles.logoContainer}>
          <div className={styles.logoEmoji}>💼</div>
          <h2 className={styles.logoTitulo}>Sant'Anna Agencia de Empregos</h2>
        </div>
        <button 
          onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} 
          className={styles.btnSair}
        >
          Sair
        </button>
      </header>

      {/* GRID CONTAINER */}
      <div className={styles.gridContainer}>
        
        {/* COLUNA ESQUERDA: LISTA DE VAGAS + FILTROS */}
        <section> 
          <div className={styles.buscaFiltrosContainer}>
            <div className={styles.filtroItemInput}>
              <input 
                type="text" 
                placeholder="🔍 Pesquisar por cargo ou palavra-chave..." 
                value={busca} 
                onChange={(e) => setBusca(e.target.value)}
                className={styles.inputBusca}
              />
            </div>
            <div className={styles.filtroItemSelect}>
              <select 
                value={categoriaFiltro} 
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className={styles.selectFiltro}
              >
                <option value="">📁 Todas as Categorias</option>
                {categoriasDisponiveis.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className={styles.filtroItemSelect}>
              <select 
                value={localizacaoFiltro} 
                onChange={(e) => setLocalizacaoFiltro(e.target.value)}
                className={styles.selectFiltro}
              >
                <option value="">📍 Todas as Regiões</option>
                {localizacoesDisponiveis.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          <h3 className={styles.tituloSecao}>Oportunidades Disponíveis</h3>
          
          {vagasFiltradas.length === 0 ? (
            <div className={styles.vagasVazias}>
              <p className={styles.vagasVaziasTexto}>Nenhuma vaga aberta encontrada para os filtros aplicados.</p>
            </div>
          ) : (
            <div className={styles.vagasLista}>
              {vagasFiltradas.map((vaga) => {
                const jaInscrito = candidatadoIds.includes(vaga.id);

                return (
                  <div key={vaga.id} className={styles.vagaCard}>
                    <div className={styles.vagaHeader}>
                      <div>
                        <div className={styles.vagaBadges}>
                          <span className={styles.badgeCodigo}>
                            {vaga.codigo_vaga}
                          </span>
                          <span className={styles.badgeCategoria}>
                            📁 {vaga.categoria || 'Geral'}
                          </span>
                          <span className={styles.badgeStatus}>🟢 Disponível ({vaga.vagas_disponiveis} de {vaga.vagas_totais} restando)</span>
                        </div>

                        <h4 className={styles.vagaTitulo}>{vaga.titulo}</h4>
                        <div className={styles.vagaDetalhes}>
                          <span>📍 {vaga.localizacao}</span>
                          {vaga.salario && <span className={styles.vagaSalario}>💰 {vaga.salario}</span>}
                        </div>
                      </div>
                      <button
                        disabled={jaInscrito || submittingId === vaga.id}
                        onClick={() => handleCandidatar(vaga.id, vaga.vagas_disponiveis)}
                        className={styles.vagaBotao}
                        style={{ 
                          backgroundColor: jaInscrito ? '#10b981' : '#0070f3',
                          cursor: jaInscrito ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {jaInscrito ? '✓ Já Candidatado' : 'Candidatar-se'}
                      </button>
                    </div>
                    <div className={styles.vagaDivisor}></div>
                    <p className={styles.vagaDescricao}>{vaga.descricao}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* COLUNA DIREITA: FORMULÁRIO DE PERFIL */}
        <aside className={styles.asideColuna}>
          <div className={styles.perfilCard}>
            
            {/* Header visível APENAS no Desktop */}
            <div className={styles.perfilDesktopHeader}>
              <h3 className={styles.perfilTitulo}>📝 Meu Perfil Profissional</h3>
              <p className={styles.perfilSubtitulo}>Suba o seu arquivo de currículo para poder concorrer às vagas.</p>
            </div>

            {/* Botão Gatilho visível APENAS no Mobile */}
            <button 
              className={styles.perfilToggleBtn}
              onClick={() => setPerfilAbertoMobile(!perfilAbertoMobile)}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>📝 Meu Perfil Profissional</h3>
              <span className={styles.perfilToggleBtnText}>
                {perfilAbertoMobile ? '▲ Recolher' : '▼ Expandir'}
              </span>
            </button>

            {/* Conteúdo do Form: Sempre aberto no desktop, dinâmico no mobile via classe condicional */}
            <div className={`${styles.perfilConteudo} ${perfilAbertoMobile ? styles.perfilConteudoAberto : ''}`}>
              
              {perfilMsg && (
                <div style={{ padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '13px', backgroundColor: perfilMsg.includes('✅') ? '#d1fae5' : '#fee2e2', color: perfilMsg.includes('✅') ? '#065f46' : '#991b1b' }}>
                  {perfilMsg}
                </div>
              )}

              <form onSubmit={handleSalvarPerfil} className={styles.perfilForm}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nome Completo</label>
                  <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required className={styles.formInput} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Telefone com DDD</label>
                  <input type="text" placeholder="(51) 99999-9999" value={telefone} onChange={(e) => setTelefone(formatarTelefone(e.target.value))} required className={styles.formInput} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Link do LinkedIn</label>
                  <input type="url" placeholder="https://linkedin.com/in/seu-perfil" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={styles.formInput} />
                </div>
                
                {/* ÁREA DE UPLOAD DO CURRÍCULO CUSTOMIZADA */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Arquivo de Currículo (PDF, DOCX)</label>
                  <label className={styles.uploadLabel}>
                    <span className={styles.uploadIcon}>📁</span>
                    <span className={styles.uploadTextoPrincipal}>
                      {arquivoSelecionado ? 'Alterar arquivo selecionado' : 'Clique para selecionar o Currículo'}
                    </span>
                    <span className={styles.uploadTextoSecundario}>
                      {arquivoSelecionado ? `Selecionado: ${arquivoSelecionado.name}` : 'Formatos aceitos: PDF, DOC ou DOCX'}
                    </span>
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setArquivoSelecionado(e.target.files?.[0] || null)} 
                      required={!curriculoUrl}
                      style={{ display: 'none' }} 
                    />
                  </label>
                  {curriculoUrl && (
                    <p className={styles.uploadSucessoMsg}>
                      <span>✓</span> Você já possui um currículo válido salvo no sistema.
                    </p>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Resumo de Competências e Experiência</label>
                  <textarea rows={4} placeholder="Ex: Experiência com automações em Python, desenvolvimento Next.js..." value={resumo} onChange={(e) => setResumo(e.target.value)} required className={styles.formTextarea} />
                </div>
                <button type="submit" disabled={salvandoPerfil} className={styles.btnSalvarPerfil}>
                  {salvandoPerfil ? 'Processando e Salvando...' : 'Salvar Dados do Perfil'}
                </button>
              </form>
            </div>

          </div>

          {/* MINHAS INSCRIÇÕES COM STATUS DINÂMICO */}
          <div className={styles.candidaturasCard}>
            <h3 className={styles.candidaturasTitulo}>💼 Minhas Candidaturas</h3>
            {minhasVagasInscritas.length === 0 ? (
              <p className={styles.candidaturasVazio}>Nenhuma inscrição realizada.</p>
            ) : (
              <div className={styles.candidaturasLista}>
                {minhasVagasInscritas.map((vaga) => {
                  const dadosCand = minhasCandidaturasComStatus.find(c => c.vaga_id === vaga.id);
                  const stts = dadosCand?.status || 'novo';

                  let badgeLabel = 'Novo';
                  let badgeBg = '#d1fae5';
                  let badgeColor = '#065f46';

                  if (stts === 'analise') {
                    badgeLabel = 'Em Análise';
                    badgeBg = '#fef3c7';
                    badgeColor = '#92400e';
                  } else if (stts === 'recusado') {
                    badgeLabel = '❌ Não foi desta vez';
                    badgeBg = '#fee2e2';
                    badgeColor = '#991b1b';
                  }

                  return (
                    <div key={vaga.id} className={styles.candidaturaItem}>
                      <span className={styles.candidaturaVagaNome}>
                        <strong className={styles.candidaturaCodigo}>[{vaga.codigo_vaga}]</strong>
                        {vaga.titulo}
                      </span>
                      <div className={styles.candidaturaBadgeContainer}>
                        <span 
                          className={styles.candidaturaBadge}
                          style={{ backgroundColor: badgeBg, color: badgeColor }}
                        >
                          {badgeLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}