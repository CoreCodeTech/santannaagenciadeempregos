'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './vagasempresas.module.css';

export default function CadastroVagaExternaPage() {
  const [categoriasDB, setCategoriasDB] = useState<any[]>([]);
  const [carregandoCategorias, setCarregandoCategorias] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Estados do Formulário da Empresa
  const [titulo, setTitulo] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [categoria, setCategoria] = useState('Tecnologia');
  const [localizacao, setLocalizacao] = useState('Remoto');
  const [salario, setSalario] = useState('');
  const [quantidadeVagas, setQuantidadeVagas] = useState('1'); // 🔥 Novo estado
  const [descricao, setDescricao] = useState('');

  // Campos de contato interno (só o Admin vê)
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [telefoneContato, setTelefoneContato] = useState('');
  const [emailContato, setEmailContato] = useState('');

  // Formata o telefone dinamicamente enquanto digita: (51) 99999-9999
  const formatarTelefone = (value: string) => {
    const apenasNumeros = value.replace(/\D/g, '');
    if (apenasNumeros.length <= 10) {
      return apenasNumeros.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3').trim();
    }
    return apenasNumeros.replace(/^(\d{2})(\d{5})(\d{0,4})$/, '($1) $2-$3').substring(0, 15);
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

  useEffect(() => {
    const carregarCategorias = async () => {
      try {
        const { data, error } = await supabase
          .from('categorias')
          .select('*')
          .order('nome', { ascending: true });
        
        if (!error && data) {
          setCategoriasDB(data);
          if (data.length > 0) setCategoria(data[0].nome);
        }
      } catch (err) {
        console.error('Erro ao buscar categorias:', err);
      } finally {
        setCarregandoCategorias(false);
      }
    };

    carregarCategorias();
  }, []);

  const handleCadastrarVagaExterna = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !empresa || !localizacao || !descricao || !nomeResponsavel || !telefoneContato || !emailContato || !quantidadeVagas) {
      alert('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    setEnviando(true);

    try {
      // Insere na tabela incluindo a quantidade de vagas e os dados de contato
      const { error } = await supabase.from('vagas_externas').insert({
        titulo,
        empresa,
        categoria,
        localizacao,
        salario: salario || 'A combinar',
        quantidade_vagas: parseInt(quantidadeVagas, 10) || 1, // 🔥 Enviando como número inteiro
        descricao,
        status: 'pendente',
        fonte_integracao: 'Formulario_Externo',
        responsavel_nome: nomeResponsavel,
        responsavel_telefone: telefoneContato,
        responsavel_email: emailContato
      });

      if (error) throw error;

      alert("Sucesso! A proposta da sua vaga foi recebida pela equipe da Sant'Anna. Analisaremos as informações e entraremos em contato para ativação do anúncio!");
      
      // Redireciona o cliente diretamente para a landing page externa
      window.location.href = 'https://santannaagenciadeempregos.com.br/';
      
    } catch (err: any) {
      console.error(err);
      alert('Erro ao enviar vaga: ' + err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.cardForm}>
        <div className={styles.headerForm}>
          <h1 className={styles.brandTitle}>Sant'Anna Agência de Empregos</h1>
          <h2>💼 Cadastro de Vagas Governamentais & Parceiras</h2>
          <p>Disponibilize suas vagas em nossa plataforma principal de triagem e recrutamento</p>
        </div>

        <form onSubmit={handleCadastrarVagaExterna} className={styles.form}>
          
          {/* 🔥 Wrapper das duas colunas laterais */}
          <div className={styles.columnsContainer}>
            
            {/* COLUNA DA ESQUERDA: Dados do Emprego */}
            <div className={styles.column}>
              <h3 className={styles.sectionTitle}>🏢 Dados Corporativos da Vaga</h3>
              
              <div className={styles.group}>
                <label>Nome da Empresa Contratante *</label>
                <input 
                  type="text" 
                  placeholder="ex: MKS Tech Solutions" 
                  value={empresa} 
                  onChange={(e) => setEmpresa(e.target.value)} 
                  required 
                />
              </div>

              <div className={styles.group}>
                <label>Título Profissional da Vaga *</label>
                <input 
                  type="text" 
                  placeholder="ex: Desenvolvedor React Front-End" 
                  value={titulo} 
                  onChange={(e) => setTitulo(e.target.value)} 
                  required 
                />
              </div>

              <div className={styles.row}>
                <div className={styles.group}>
                  <label>Categoria de Atuação</label>
                  <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                    {carregandoCategorias ? (
                      <option value="Tecnologia">Carregando categorias...</option>
                    ) : (
                      categoriasDB.map((cat) => (
                        <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                      ))
                    )}
                  </select>
                </div>
                
                <div className={styles.group}>
                  <label>Localização / Cidade *</label>
                  <input 
                    type="text" 
                    placeholder="ex: Remoto, Porto Alegre - RS" 
                    value={localizacao} 
                    onChange={(e) => setLocalizacao(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.group}>
                  <label>Faixa Salarial Oferecida (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Deixe em branco para 'A combinar'" 
                    value={salario} 
                    onChange={(e) => setSalario(formatarMoeda(e.target.value))} 
                  />
                </div>
                
                <div className={styles.group}>
                  <label>Quantidade de Vagas *</label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="ex: 1" 
                    value={quantidadeVagas} 
                    onChange={(e) => setQuantidadeVagas(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className={styles.group}>
                <label>Descrição Detalhada & Pré-requisitos *</label>
                <textarea 
                  rows={6} 
                  placeholder="Descreva as atribuições diárias, competências obrigatórias e os benefícios da vaga..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Linha vertical que divide os lados no desktop */}
            <div className={styles.verticalDivider}></div>

            {/* COLUNA DA DIREITA: Dados do Responsável de RH */}
            <div className={styles.column}>
              <h3 className={styles.sectionTitle}>📞 Informações de Contato Interno (Admin)</h3>
              <p className={styles.sectionSubtitle}>Estes dados não serão publicados. São usados apenas pela Sant'Anna para validar a vaga e enviar candidatos.</p>

              <div className={styles.group}>
                <label>Nome Completo do Responsável pelo RH/Vaga *</label>
                <input 
                  type="text" 
                  placeholder="ex: João Silva" 
                  value={nomeResponsavel} 
                  onChange={(e) => setNomeResponsavel(e.target.value)} 
                  required 
                />
              </div>

              <div className={styles.group}>
                <label>Celular / WhatsApp Comercial *</label>
                <input 
                  type="text" 
                  placeholder="(51) 99999-9999" 
                  value={telefoneContato} 
                  onChange={(e) => setTelefoneContato(formatarTelefone(e.target.value))} 
                  required 
                />
              </div>

              <div className={styles.group}>
                <label>E-mail Corporativo de Contato *</label>
                <input 
                  type="email" 
                  placeholder="rh@suaempresa.com" 
                  value={emailContato} 
                  onChange={(e) => setEmailContato(e.target.value)} 
                  required 
                />
              </div>

              {/* O botão fica fixado no fim da coluna direita no desktop */}
              <div className={styles.submitContainer}>
                <button type="submit" disabled={enviando} className={styles.btnSubmit}>
                  {enviando ? 'Enviando Proposta Comercial...' : '🚀 Solicitar Cadastro na Plataforma'}
                </button>
              </div>

            </div>
          </div>

        </form>
      </div>
    </div>
  );
}