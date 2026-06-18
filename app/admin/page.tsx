'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vagas, setVagas] = useState<any[]>([]);
  const [todasCandidaturas, setTodasCandidaturas] = useState<any[]>([]);

  // 🔥 NOVO ESTADO: Armazena as vagas externas solicitadas pelas empresas parceiras
  const [vagasExternas, setVagasExternas] = useState<any[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'internas' | 'solicitacoes'>('internas');
  const [processandoAprovacao, setProcessandoAprovacao] = useState<number | null>(null);

  // Estados dos Filtros de Busca
  const [buscaTexto, setBuscaTexto] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // 🔥 NOVO ESTADO: Armazena o mês e ano selecionado para o Relatório Mensal (Formato: YYYY-MM)
  const [mesRelatorio, setMesRelatorio] = useState(() => {
    const dataAtual = new Date();
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  });

  // Estados do Formulário (Criação e Edição)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [vagaOriginal, setVagaOriginal] = useState<any>(null);
  const [titulo, setTitulo] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [descricao, setDescricao] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [salario, setSalario] = useState('');
  const [categoria, setCategoria] = useState('Tecnologia');
  const [vagasTotais, setVagasTotais] = useState('1');
  const [status, setStatus] = useState('disponivel');
  const [salvandoVaga, setSalvandoVaga] = useState(false);

  // Estados para gerenciar a modal de candidatos
  const [vagaSelecionada, setVagaSelecionada] = useState<any>(null);
  const [candidatosDaVaga, setCandidatosDaVaga] = useState<any[]>([]);
  const [loadingCandidatos, setLoadingCandidatos] = useState(false);

  // Gerenciamento Dinâmico de Categorias
  const [categoriasDB, setCategoriasDB] = useState<any[]>([]);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);
  const [mostrarGerenciadorCategorias, setMostrarGerenciadorCategorias] = useState(false);

  // 🛠️ NOVO ESTADO: Controla se o gráfico de vagas por categoria inicia expandido ou recolhido
  const [isChartExpanded, setIsChartExpanded] = useState(false);

  // Tema Light/Dark Mode
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('admin-theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('admin-theme', newTheme);
  };

  const formatarMoeda = (value: string) => {
    const apenasNumeros = value.replace(/\D/g, '');
    if (!apenasNumeros) return '';
    const valorFlutuante = parseFloat(apenasNumeros) / 100;
    return valorFlutuante.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const carregarCategorias = async () => {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nome', { ascending: true });

    if (!error && data) {
      setCategoriasDB(data);
    }
  };

  const carregarDadosGlobais = async () => {
    const { data: listaVagas } = await supabase
      .from('vagas')
      .select('*, candidaturas(id)')
      .order('criado_em', { ascending: false });
    setVagas(listaVagas || []);

    const { data: listaCands } = await supabase
      .from('candidaturas')
      .select('*, vagas(titulo, categoria)');
    setTodasCandidaturas(listaCands || []);

    const { data: listaExternas } = await supabase
      .from('vagas_externas')
      .select('*')
      .order('criado_em', { ascending: false });
    setVagasExternas(listaExternas || []);
  };

  useEffect(() => {
    const verificarAdmin = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push('/login');
          return;
        }

        const { data: perfil, error: perfilError } = await supabase
          .from('perfis')
          .select('role')
          .eq('id', user.id)
          .single();

        if (perfilError || perfil?.role !== 'admin') {
          alert('Acesso negado.');
          router.push('/painel');
          return;
        }

        await carregarCategorias();
        await carregarDadosGlobais();
        setLoading(false);
      } catch (err) {
        console.error('Erro na autenticação:', err);
        router.push('/login');
      }
    };

    verificarAdmin();
  }, [router]);

  const handleAdicionarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCategoriaNome.trim()) return;
    setSalvandoCategoria(true);

    try {
      const { error } = await supabase
        .from('categorias')
        .insert({ nome: novaCategoriaNome.trim() });

      if (error) throw error;

      alert('Categoria adicionada com sucesso!');
      setNovaCategoriaNome('');
      await carregarCategorias();
    } catch (err: any) {
      alert('Erro ao adicionar categoria: ' + err.message);
    } finally {
      setSalvandoCategoria(false);
    }
  };

  const handleExcluirCategoria = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta categoria? Vagas vinculadas continuarão exibindo o texto original até serem editadas.')) return;

    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Categoria removida com sucesso!');
      await carregarCategorias();
    } catch (err: any) {
      alert('Erro ao excluir categoria: ' + err.message);
    }
  };

  const handleSalvarVaga = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoVaga(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const totaisNum = parseInt(vagasTotais) || 1;

      if (editingId && vagaOriginal) {
        const cadidaturasConsumidas = vagaOriginal.vagas_totais - vagaOriginal.vagas_disponiveis;
        const novasDisponiveis = Math.max(0, totaisNum - cadidaturasConsumidas);

        const { error } = await supabase
          .from('vagas')
          .update({
            titulo,
            empresa,
            descricao,
            localizacao,
            salario,
            categoria,
            vagas_totais: totaisNum,
            vagas_disponiveis: novasDisponiveis,
            status: novasDisponiveis === 0 && status === 'disponivel' ? 'esgotada' : status
          })
          .eq('id', editingId);

        if (error) throw error;

        alert('Vaga updated com sucesso!');
        limparFormulario();
        await carregarDadosGlobais();
      } else {
        const { error } = await supabase.from('vagas').insert({
          titulo,
          empresa,
          descricao,
          localizacao,
          salario,
          categoria,
          vagas_totais: totaisNum,
          vagas_disponiveis: totaisNum,
          status,
          criado_by: user?.id
        });

        if (error) throw error;

        alert('Vaga cadastrada com sucesso!');
        limparFormulario();
        await carregarDadosGlobais();
      }
    } catch (error: any) {
      alert('Erro ao processar requisição: ' + error.message);
    } finally {
      setSalvandoVaga(false);
    }
  };

  const handleAprovarSolicitacao = async (solicitacao: any) => {
    if (!confirm(`Deseja aprovar a vaga "${solicitacao.titulo}" da empresa ${solicitacao.empresa}? Ela ficará disponível no painel dos candidatos.`)) return;
    setProcessandoAprovacao(solicitacao.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: errorInsercao } = await supabase.from('vagas').insert({
        titulo: solicitacao.titulo,
        empresa: solicitacao.empresa,
        categoria: solicitacao.categoria,
        localizacao: solicitacao.localizacao,
        salario: solicitacao.salario,
        vagas_totais: solicitacao.quantidade_vagas || 1,
        vagas_disponiveis: solicitacao.quantidade_vagas || 1,
        descricao: solicitacao.descricao,
        status: 'disponivel',
        criado_by: user?.id
      });

      if (errorInsercao) throw errorInsercao;

      const { error: errorUpdate } = await supabase
        .from('vagas_externas')
        .update({ status: 'aprovada' })
        .eq('id', solicitacao.id);

      if (errorUpdate) throw errorUpdate;

      alert('Sucesso! Vaga aprovada e publicada no painel de triagem!');
      await carregarDadosGlobais();
    } catch (err: any) {
      alert('Erro ao aprovar: ' + err.message);
    } finally {
      setProcessandoAprovacao(null);
    }
  };

  const handleMudarStatusSolicitacao = async (id: number, novoStatus: 'rejeitada' | 'arquivada') => {
    if (!confirm(`Deseja mudar o status desta solicitação para "${novoStatus}"?`)) return;

    try {
      const { error } = await supabase
        .from('vagas_externas')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;
      alert(`Solicitação marcada como ${novoStatus}!`);
      await carregarDadosGlobais();
    } catch (err: any) {
      alert('Erro ao alterar status: ' + err.message);
    }
  };

  const iniciarEdicao = (vaga: any) => {
    setEditingId(vaga.id);
    setVagaOriginal(vaga);
    setTitulo(vaga.titulo || '');
    setEmpresa(vaga.empresa || '');
    setDescricao(vaga.descricao || '');
    setLocalizacao(vaga.localizacao || '');
    setSalario(vaga.salario || '');
    setCategoria(vaga.categoria || 'Tecnologia');
    setVagasTotais(String(vaga.vagas_totais || 1));
    setStatus(vaga.status || 'disponivel');
  };

  const limparFormulario = () => {
    setEditingId(null);
    setVagaOriginal(null);
    setTitulo('');
    setEmpresa('');
    setDescricao('');
    setLocalizacao('');
    setSalario('');
    setCategoria('Tecnologia');
    setVagasTotais('1');
    setStatus('disponivel');
  };

  const abrirCandidatos = async (vaga: any) => {
    setVagaSelecionada(vaga);
    setLoadingCandidatos(true);

    try {
      const { data, error } = await supabase
        .from('candidaturas')
        .select(`id, criado_em, candidato_id, status`)
        .eq('vaga_id', vaga.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const idsCandidatos = data.map((c: any) => c.candidato_id);
        const { data: perfis, error: errorPerfim } = await supabase
          .from('perfis')
          .select('*')
          .in('id', idsCandidatos);

        if (errorPerfim) throw errorPerfim;

        const listaCompleta = data.map((cand: any) => ({
          ...cand,
          perfis: perfis?.find((p: any) => p.id === cand.candidato_id)
        }));

        setCandidatosDaVaga(listaCompleta);
      } else {
        setCandidatosDaVaga([]);
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao carregar candidatos: ' + err.message);
    } finally {
      setLoadingCandidatos(false);
    }
  };

  const alterarStatusCandidato = async (candidaturaId: number, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from('candidaturas')
        .update({ status: novoStatus })
        .eq('id', candidaturaId);

      if (error) throw error;

      setCandidatosDaVaga(prev => prev.map(c => c.id === candidaturaId ? { ...c, status: novoStatus } : c));
      await carregarDadosGlobais();
    } catch (err: any) {
      alert('Erro ao alterar status: ' + err.message);
    }
  };

  // 🔥 NOVA FUNÇÃO: Exporta Relatório Mensal baseado no Mês Selecionado (Filtro por criado_em)
  const exportarRelatorioMensal = () => {
    if (vagas.length === 0) return alert('Sem dados para exportar!');

    const vagasFiltradasPorMes = vagas.filter(v => v.criado_em && v.criado_em.startsWith(mesRelatorio));

    if (vagasFiltradasPorMes.length === 0) {
      return alert(`Nenhuma vaga encontrada para o período selecionado (${mesRelatorio}).`);
    }

    let csvContent = '\uFEFF';
    csvContent += 'Código Vaga;Título;Empresa;Categoria;Localização;Vagas Totais;Vagas Disponíveis;Status Vaga;Total Candidatos;Data Criação\n';

    vagasFiltradasPorMes.forEach(v => {
      const tituloSanitizado = (v.titulo || '').replace(/;/g, ',');
      const empresaSanitizada = (v.empresa || '').replace(/;/g, ',');
      const categoriaSanitizada = (v.categoria || '').replace(/;/g, ',');
      const localizacaoSanitizada = (v.localizacao || '').replace(/;/g, ',');
      const dataCriacaoFormated = v.criado_em ? new Date(v.criado_em).toLocaleDateString('pt-BR') : '';

      csvContent += `${v.codigo_vaga || v.id};${tituloSanitizado};${empresaSanitizada};${categoriaSanitizada};${localizacaoSanitizada};${v.vagas_totais};${v.vagas_disponiveis};${v.status};${v.candidaturas?.length || 0};${dataCriacaoFormated}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_mensal_${mesRelatorio}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 🔥 NOVA FUNÇÃO: Baixa os currículos do banco em formato de lista (Substituta do Relatório Anual)
  const baixarTodosCurriculos = async () => {
    try {
      const { data: perfisComCurriculo, error } = await supabase
        .from('perfis')
        .select('nome, linkedin, curriculo')
        .not('curriculo', 'is', null);

      if (error) throw error;

      const listaFiltrada = perfisComCurriculo?.filter(p => p.curriculo && p.curriculo.trim() !== '') || [];

      if (listaFiltrada.length === 0) {
        return alert('Nenhum currículo salvo foi localizado na base de dados.');
      }

      let csvContent = '\uFEFF';
      csvContent += 'Nome Candidato;LinkedIn;URL Currículo Supabase\n';

      listaFiltrada.forEach(p => {
        const nomeSanitizado = (p.nome || 'Não Informado').replace(/;/g, ',');
        const linkedinSanitizado = (p.linkedin || 'Não Informado').replace(/;/g, ',');
        const linkCurriculo = p.curriculo;

        csvContent += `${nomeSanitizado};${linkedinSanitizado};${linkCurriculo}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `lista_todos_curriculos.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert('Erro ao buscar currículos: ' + err.message);
    }
  };

  const totalVagasAtivas = vagas.filter(v => v.status === 'disponivel').length;
  const totalCandidaturasRealizadas = todasCandidaturas.length;
  const candsEmAnalise = todasCandidaturas.filter(c => c.status === 'analise').length;

  const categoriesContagem: { [key: string]: number } = {};
  vagas.forEach(v => {
    categoriesContagem[v.categoria] = (categoriesContagem[v.categoria] || 0) + 1;
  });

  // FILTRAGEM DINÂMICA DA LISTAGEM PRINCIPAL
  const vagasFiltradas = vagas.filter(vaga => {
    const texto = buscaTexto.toLowerCase().trim();
    const correspondeTexto =
      !texto ||
      vaga.titulo?.toLowerCase().includes(texto) ||
      vaga.empresa?.toLowerCase().includes(texto) ||
      vaga.codigo_vaga?.toLowerCase().includes(texto) ||
      String(vaga.id).includes(texto);

    let correspondeStatus = true;
    if (filtroStatus === 'disponivel') {
      correspondeStatus = vaga.status === 'disponivel' && vaga.vagas_disponiveis > 0;
    } else if (filtroStatus === 'pendente') {
      correspondeStatus = vaga.status === 'pendente';
    } else if (filtroStatus === 'esgotada') {
      correspondeStatus = vaga.status === 'esgotada' || vaga.vagas_disponiveis <= 0;
    }

    return correspondeTexto && correspondeStatus;
  });

  // FILTRAGEM DAS SOLICITAÇÕES EXTERNAS
  const solicitacoesFiltradas = vagasExternas.filter(sol => {
    const texto = buscaTexto.toLowerCase().trim();
    const correspondeTexto =
      !texto ||
      sol.titulo?.toLowerCase().includes(texto) ||
      sol.empresa?.toLowerCase().includes(texto) ||
      sol.responsavel_nome?.toLowerCase().includes(texto);

    let correspondeStatus = true;
    if (filtroStatus !== 'todos') {
      correspondeStatus = sol.status === filtroStatus;
    }

    return correspondeTexto && correspondeStatus;
  });

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Arial', color: '#333' }}>Validando credenciais...</div>;
  }

  return (
    <>
      <div className={`${styles.container} ${theme === 'dark' ? '' : styles.lightMode}`}>
        <div className={styles.wrapper}>

          {/* Header Expandido */}
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <h1>⚙️ Painel de Administração Geral</h1>
              <p>Controle completo de processos seletivos, triagem de candidatos e dashboards</p>
            </div>
            
            <div className={styles.headerActions}>
              <button onClick={toggleTheme} className={styles.btnThemeToggle}>
                {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
              </button>

              <div className={styles.relatorioMensalContainer} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <input 
                  type="month" 
                  value={mesRelatorio} 
                  onChange={(e) => setMesRelatorio(e.target.value)} 
                  className={styles.inputMesFiltro}
                  style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
                />
                <button onClick={exportarRelatorioMensal} className={styles.btnRelatorioMensal}>
                  📊 Relatório Mensal
                </button>
              </div>

              <button onClick={baixarTodosCurriculos} className={styles.btnRelatorioAnual}>
                📁 Baixar Currículos
              </button>

              <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className={styles.btnSair}>
                Sair do Sistema
              </button>
            </div>
          </div>

          {/* Dashboard de Métricas */}
          <div className={styles.dashboardGrid}>
            <div className={styles.card}>
              <span className={styles.cardLabel}>Vagas Ativas (Disponíveis)</span>
              <h2 className={`${styles.cardValue} ${styles.colorBlue}`}>{totalVagasAtivas}</h2>
            </div>
            <div className={styles.card}>
              <span className={styles.cardLabel}>Candidaturas Recebidas</span>
              <h2 className={`${styles.cardValue} ${styles.colorGreen}`}>{totalCandidaturasRealizadas}</h2>
            </div>
            <div className={styles.card}>
              <span className={styles.cardLabel}>Candidatos em Análise</span>
              <h2 className={`${styles.cardValue} ${styles.colorYellow}`}>{candsEmAnalise}</h2>
            </div>
            <div className={styles.card}>
              <span className={styles.cardLabel}>Solicitações de Empresas</span>
              <h2 className={`${styles.cardValue} ${styles.colorRed}`}>{vagasExternas.filter(v => v.status === 'pendente').length} Pnd</h2>
            </div>
          </div>

          {/* Gráfico de Barras com Acordeão Funcional */}
          <div className={`${styles.chartContainer} ${isChartExpanded ? styles.expanded : ''}`}>
            <div className={styles.chartHeaderToggle} onClick={() => setIsChartExpanded(!isChartExpanded)}>
              <h4>Distribuição Quantitativa de Vagas por Categoria</h4>
              <span className={styles.chartToggleIcon}>{isChartExpanded ? '▲' : '▼'}</span>
            </div>

            <div className={styles.chartCollapseWrapper}>
              <div className={styles.chartList}>
                {Object.keys(categoriesContagem).length === 0 ? (
                  <p className={styles.chartNoData}>Ainda sem dados para renderização do gráfico.</p>
                ) : (
                  Object.entries(categoriesContagem).map(([cat, total]) => {
                    const percentual = Math.min(100, (total / vagas.length) * 100);
                    return (
                      <div key={cat} className={styles.chartRow}>
                        <div className={styles.chartLabel}>{cat}</div>
                        <div className={styles.chartTrack}>
                          <div className={styles.chartBar} style={{ width: `${percentual}%` }}></div>
                        </div>
                        <div className={styles.chartValue}>{total}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Layout Principal Lado a Lado */}
          <div className={styles.mainLayout}>

            {/* Formulário (Coluna Esquerda Fixada) */}
            <div className={styles.formContainer}>
              <div className={styles.formHeader}>
                <h3>
                  {editingId ? '📝 Editar Vaga' : 'Publicar Vaga'}
                </h3>
                {editingId && (
                  <button onClick={limparFormulario} className={styles.btnCancelarForm}>
                    Cancelar
                  </button>
                )}
              </div>

              <form onSubmit={handleSalvarVaga} className={styles.mainForm}>
                <div className={styles.formGroup}>
                  <label>Título da Vaga</label>
                  <input type="text" placeholder="ex: Analista de Sistemas" value={titulo} onChange={(e) => setTitulo(e.target.value)} required className={styles.formInput} />
                </div>

                <div className={styles.formGroup}>
                  <label>Empresa Contratante</label>
                  <input type="text" placeholder="ex: Sant'Anna Corp ou Confidencial" value={empresa} onChange={(e) => setEmpresa(e.target.value)} required className={styles.formInput} />
                </div>

                <div className={styles.formGroup}>
                  <label>Categoria</label>
                  <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={styles.formInput}>
                    {categoriasDB.length === 0 ? (
                      <option value="Tecnologia">Tecnologia (Padrão)</option>
                    ) : (
                      categoriasDB.map((cat) => (
                        <option key={cat.id} value={cat.nome}>
                          {cat.nome}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Qtd de Vagas Totais</label>
                  <input type="number" min="1" value={vagasTotais} onChange={(e) => setVagasTotais(e.target.value)} required className={styles.formInput} />
                </div>

                <div className={styles.formGroup}>
                  <label>Salário</label>
                  <input type="text" placeholder="R$ 0,00" value={salario} onChange={(e) => setSalario(formatarMoeda(e.target.value))} className={styles.formInput} />
                </div>

                <div className={styles.formGroup}>
                  <label>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className={styles.formInput}>
                    <option value="disponivel">🟢 Disponível</option>
                    <option value="pendente">🟠 Pendente</option>
                    <option value="esgotada">🔴 0 Vagas (Esgotada)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Localização</label>
                  <input type="text" placeholder="Porto Alegre - RS" value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} required className={styles.formInput} />
                </div>

                <div className={styles.formGroup}>
                  <label>Requisitos</label>
                  <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} required rows={4} className={styles.formTextarea} />
                </div>

                <button
                  type="submit"
                  disabled={salvandoVaga}
                  className={styles.btnSubmitForm}
                  style={{
                    backgroundColor: editingId ? '#0070f3' : '#10b981',
                    opacity: salvandoVaga ? 0.6 : 1
                  }}
                >
                  {salvandoVaga ? 'Processando...' : editingId ? 'Atualizar Dados' : 'Anunciar Oportunidade'}
                </button>
              </form>

              {/* Gerenciador de Categorias */}
              <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                <button
                  onClick={() => setMostrarGerenciadorCategorias(!mostrarGerenciadorCategorias)}
                  style={{
                    width: '100%', padding: '10px', background: '#f3f4f6', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '14px', fontWeight: 600, color: '#374151', cursor: 'pointer'
                  }}
                >
                  {mostrarGerenciadorCategorias ? '📁 Ocultar Categorias' : '📁 Gerenciar Categorias Banco'}
                </button>

                {mostrarGerenciadorCategorias && (
                  <div style={{ marginTop: '15px', background: '#f9fafb', padding: '15px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                    <form onSubmit={handleAdicionarCategoria} style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                      <input
                        type="text"
                        placeholder="Nova categoria..."
                        value={novaCategoriaNome}
                        onChange={(e) => setNovaCategoriaNome(e.target.value)}
                        style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
                      />
                      <button
                        type="submit"
                        disabled={salvandoCategoria}
                        style={{ padding: '8px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                      >
                        +
                      </button>
                    </form>

                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {categoriasDB.map(cat => (
                        <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <span style={{ fontSize: '13px', color: '#4b5563' }}>{cat.nome}</span>
                          <button
                            onClick={() => handleExcluirCategoria(cat.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ❌
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabela de Monitoramento */}
            <div className={styles.tableContainer}>

              {/* NAVEGAÇÃO ENTRE ABAS DINÂMICAS */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
                <button
                  onClick={() => { setAbaAtiva('internas'); setFiltroStatus('todos'); }}
                  style={{
                    padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
                    background: abaAtiva === 'internas' ? '#0070f3' : 'transparent',
                    color: abaAtiva === 'internas' ? 'white' : '#4b5563'
                  }}
                >
                  📋 Vagas Ativas na Vitrine ({vagas.length})
                </button>
                <button
                  onClick={() => { setAbaAtiva('solicitacoes'); setFiltroStatus('pendente'); }}
                  style={{
                    padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
                    background: abaAtiva === 'solicitacoes' ? '#0070f3' : 'transparent',
                    color: abaAtiva === 'solicitacoes' ? 'white' : '#4b5563'
                  }}
                >
                  📥 Solicitações de Empresas ({vagasExternas.filter(v => v.status === 'pendente').length} Pendentes)
                </button>
              </div>

              {/* BARRA DE FERRAMENTAS DE BUSCA E FILTROS */}
              <div className={styles.filterBar}>
                <div className={styles.filterSearch}>
                  <label>Pesquisar</label>
                  <input
                    type="text"
                    placeholder="Buscar por termo chave..."
                    value={buscaTexto}
                    onChange={(e) => setBuscaTexto(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.filterStatus}>
                  <label>Filtrar Status</label>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className={styles.formInput}
                  >
                    {abaAtiva === 'internas' ? (
                      <>
                        <option value="todos">✨ Todos os Status</option>
                        <option value="disponivel">🟢 Disponíveis</option>
                        <option value="pendente">🟠 Pendentes</option>
                        <option value="esgotada">🔴 Esgotadas</option>
                      </>
                    ) : (
                      <>
                        <option value="pendente">🟠 Pendentes (Aguardando)</option>
                        <option value="aprovada">🟢 Já Aprovadas</option>
                        <option value="rejeitada">🔴 Rejeitadas</option>
                        <option value="arquivada">📁 Arquivadas</option>
                        <option value="todos">✨ Todos os Históricos</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* RENDERIZAÇÃO ABA 1: VAGAS INTERNAS DA VITRINE */}
              {abaAtiva === 'internas' && (
                vagasFiltradas.length === 0 ? (
                  <p className={styles.noDataText}>Nenhuma vaga ativa encontrada.</p>
                ) : (
                  <table className={styles.wideTable}>
                    <thead>
                      <tr className={styles.tableHeadRow}>
                        <th>Código/ID</th>
                        <th>Título Profissional</th>
                        <th>Empresa</th>
                        <th>Categoria</th>
                        <th>Localidade</th>
                        <th>Status Atual</th>
                        <th>Volumetria</th>
                        <th style={{ textAlign: 'right' }}>Ações de Controle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vagasFiltradas.map((vaga) => {
                        const badgeColorStyle =
                          vaga.status === 'pendente' ? { backgroundColor: '#ffedd5', color: '#b45309', label: 'Pendente' } :
                            vaga.status === 'esgotada' || vaga.vagas_disponiveis <= 0 ? { backgroundColor: '#fee2e2', color: '#991b1b', label: '0 Vagas' } :
                              { backgroundColor: '#d1fae5', color: '#065f46', label: 'Disponível' };

                        return (
                          <tr key={vaga.id} className={styles.tableBodyRow}>
                            <td className={styles.codigoVaga}>
                              {vaga.codigo_vaga} <span className={styles.idVaga}>#{vaga.id}</span>
                            </td>
                            <td className={styles.tituloVaga}>{vaga.titulo}</td>
                            <td className={styles.empresaVaga} style={{ fontWeight: 500, color: '#4b5563' }}>
                              🏢 {vaga.empresa || 'Não informada'}
                            </td>
                            <td className={styles.categoriaVaga}>📁 {vaga.categoria}</td>
                            <td className={styles.localidadeVaga}>{vaga.localizacao}</td>
                            <td>
                              <span className={styles.badgeStatus} style={badgeColorStyle}>
                                {badgeColorStyle.label}
                              </span>
                            </td>
                            <td>
                              <span className={styles.badgeVolumetria}>
                                {vaga.candidaturas?.length || 0} candidatos
                              </span>
                            </td>
                            <td className={styles.tableActions}>
                              <button onClick={() => iniciarEdicao(vaga)} className={styles.btnEditar}>
                                Editar
                              </button>
                              <button onClick={() => abrirCandidatos(vaga)} className={styles.btnVerCandidatos}>
                                Ver Candidatos &rarr;
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              )}

              {/* RENDERIZAÇÃO ABA 2: CENTRAL DE MODERAÇÃO DE SOLICITAÇÕES EXTERNAS */}
              {abaAtiva === 'solicitacoes' && (
                solicitacoesFiltradas.length === 0 ? (
                  <p className={styles.noDataText}>Nenhuma solicitação comercial com esse status.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {solicitacoesFiltradas.map((sol) => (
                      <div key={sol.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                          <div>
                            <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                              {sol.codigo_vaga || `SOL-#${sol.id}`}
                            </span>
                            <h4 style={{ fontSize: '18px', margin: '4px 0 2px 0', color: '#111827' }}>{sol.titulo}</h4>
                            <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', fontWeight: 600 }}>🏢 Empresa: {sol.empresa}</p>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {sol.status === 'pendente' ? (
                              <>
                                <button
                                  onClick={() => handleAprovarSolicitacao(sol)}
                                  disabled={processandoAprovacao === sol.id}
                                  style={{ padding: '8px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                                >
                                  {processandoAprovacao === sol.id ? 'Aprovando...' : '✅ Aprovar & Publicar'}
                                </button>
                                <button
                                  onClick={() => handleMudarStatusSolicitacao(sol.id, 'rejeitada')}
                                  style={{ padding: '8px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                                >
                                  ❌ Rejeitar
                                </button>
                              </>
                            ) : (
                              <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '4px', background: sol.status === 'aprovada' ? '#d1fae5' : '#f3f4f6', color: sol.status === 'aprovada' ? '#065f46' : '#374151' }}>
                                Status: {sol.status.toUpperCase()}
                              </span>
                            )}
                            {sol.status !== 'arquivada' && (
                              <button
                                onClick={() => handleMudarStatusSolicitacao(sol.id, 'arquivada')}
                                style={{ padding: '8px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                                title="Arquivar Registro"
                              >
                                📁
                              </button>
                            )}
                          </div>
                        </div>

                        <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#4b5563', marginBottom: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                          <div><strong>📁 Categoria:</strong> {sol.categoria}</div>
                          <div><strong>📍 Local:</strong> {sol.localizacao}</div>
                          <div><strong>💰 Salário:</strong> {sol.salario}</div>
                          <div><strong>🔢 Vagas Oferecidas:</strong> {sol.quantidade_vagas || 1} posições</div>
                        </div>

                        <div style={{ fontSize: '13px', color: '#374151', marginBottom: '15px', whiteSpace: 'pre-line', borderLeft: '3px solid #e5e7eb', paddingLeft: '10px' }}>
                          <strong>Requisitos Informados:</strong><br />
                          {sol.descricao}
                        </div>

                        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', padding: '12px' }}>
                          <h5 style={{ margin: '0 0 6px 0', color: '#92400e', fontSize: '13px', fontWeight: 700 }}>📞 Dados Privados de Contato com o Parceiro (Exclusivo Admin)</h5>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '13px', color: '#78350f' }}>
                            <div>👤 <strong>Responsável:</strong> {sol.responsavel_nome}</div>
                            <div>✉️ <strong>E-mail:</strong> {sol.responsavel_email}</div>
                            <div>
                              📱 <strong>WhatsApp:</strong>{' '}
                              <a
                                href={`https://wa.me/55${sol.responsavel_telefone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#059669', fontWeight: 700, textDecoration: 'underline' }}
                              >
                                {sol.responsavel_telefone}
                              </a>
                            </div>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )
              )}

            </div>

          </div>
        </div>

        {/* Modal de Candidatos */}
        {vagaSelecionada && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>

              <div className={styles.modalHeader}>
                <div className={styles.modalHeaderTitle}>
                  <h2>Gestão Integrada de Candidatos</h2>
                  <p>[{vagaSelecionada.codigo_vaga}] {vagaSelecionada.titulo} - <strong>{vagaSelecionada.empresa}</strong></p>
                </div>
                <button onClick={() => setVagaSelecionada(null)} className={styles.btnCloseModal}>&times;</button>
              </div>

              {loadingCandidatos ? (
                <p className={styles.modalLoading}>Buscando perfis...</p>
              ) : candidatosDaVaga.length === 0 ? (
                <p className={styles.modalNoCandidatos}>Nenhum candidato se inscreveu nesta vaga ainda.</p>
              ) : (
                <div className={styles.candidatosList}>
                  {candidatosDaVaga.map((c: any) => {
                    const perfil = c.perfis;
                    const currentStatus = c.status || 'novo';

                    return (
                      <div key={c.id} className={styles.candidatoCard}>
                        <div className={styles.candidatoCardHeader}>
                          <div className={styles.candidatoInfo}>
                            <div className={styles.candidatoInfoMeta}>
                              <h4>{perfil?.nome || 'Nome não preenchido'}</h4>
                              {currentStatus === 'novo' && <span className={`${styles.badgeCandidato} ${styles.badgeNovo}`}>Novo</span>}
                              {currentStatus === 'analise' && <span className={`${styles.badgeCandidato} ${styles.badgeAnalise}`}>Em Análise</span>}
                              {currentStatus === 'recusado' && <span className={`${styles.badgeCandidato} ${styles.badgeRecusado}`}>Recusado</span>}
                            </div>
                            <p>📞 {perfil?.telefone || 'Não informado'}</p>
                          </div>

                          <div className={styles.candidatoActions}>
                            <select
                              value={currentStatus}
                              onChange={(e) => alterarStatusCandidato(c.id, e.target.value)}
                              className={styles.selectStatusCandidato}
                            >
                              <option value="novo">🟢 Marcar como Novo</option>
                              <option value="analise">🟡 Marcar em Análise</option>
                              <option value="recusado">🔴 Recusar Candidato</option>
                            </select>

                            {perfil?.curriculo && (
                              <a href={perfil.curriculo} target="_blank" rel="noreferrer" className={styles.btnLinkCurriculo}>
                                📄 Abrir Currículo
                              </a>
                            )}
                            {perfil?.linkedin && (
                              <a href={perfil.linkedin} target="_blank" rel="noreferrer" className={styles.btnLinkLinkedin}>
                                LinkedIn
                              </a>
                            )}
                            {perfil?.telefone && (
                              <a href={`https://wa.me/55${perfil.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className={styles.btnLinkWhatsapp}>
                                WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                        <div className={styles.candidatoResumoBox}>
                          <span>RESUMO / EXPERIÊNCIA:</span>
                          <p className={styles.candidatoResumoText}>
                            {perfil?.resumo || 'O candidato não preencheu o resumo profissional.'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}