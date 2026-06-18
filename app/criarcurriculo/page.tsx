'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './criarcurriculo.module.css';

export default function CriarCurriculoPage() {
  const router = useRouter();
  const [showTip, setShowTip] = useState(true); // Estado para controlar a exibição do aviso de impressão

  // Estados do Formulário de Currículo
  const [dadosPessoais, setDadosPessoais] = useState({
    nome: '',
    cargo: '',
    email: '',
    telefone: '',
    cidade: '',
    linkedin: '',
  });

  const [resumoProfissional, setResumoProfissional] = useState('');
  
  const [experiencias, setExperiencias] = useState([
    { empresa: '', cargo: '', periodo: '', descricao: '' }
  ]);

  const [formacoes, setFormacoes] = useState([
    { instituicao: '', curso: '', periodo: '' }
  ]);

  const [habilidades, setHabilidades] = useState('');

  // Funções para gerenciar experiências dinâmicas
  const adicionarExperiencia = () => {
    setExperiencias([...experiencias, { empresa: '', cargo: '', periodo: '', descricao: '' }]);
  };

  const atualizarExperiencia = (index: number, campo: string, valor: string) => {
    const novas = [...experiencias];
    novas[index] = { ...novas[index], [campo]: valor };
    setExperiencias(novas);
  };

  const removerExperiencia = (index: number) => {
    setExperiencias(experiencias.filter((_, i) => i !== index));
  };

  // Funções para gerenciar formações dinâmicas
  const adicionarFormacao = () => {
    setFormacoes([...formacoes, { instituicao: '', curso: '', periodo: '' }]);
  };

  const atualizarFormacao = (index: number, campo: string, valor: string) => {
    const novas = [...formacoes];
    novas[index] = { ...novas[index], [campo]: valor };
    setFormacoes(novas);
  };

  const removerFormacao = (index: number) => {
    setFormacoes(formacoes.filter((_, i) => i !== index));
  };

  // Função mágica para acionar o CTRL+P / Impressão do navegador configurado para PDF
  const handleImprimir = (e: React.FormEvent) => {
    e.preventDefault();
    window.print();
  };

  return (
    <div className={styles.containerPage}>
      
      {/* HEADER DE NAVEGAÇÃO - Escondido na impressão */}
      <header className={`${styles.headerNav} no-print`}>
        <div className={styles.headerContent}>
          <Link href="/painel" className={styles.btnVoltar}>
            ← Voltar para o Painel
          </Link>
          <h2 className={styles.tituloHeader}>Assistente de Currículo Profissional</h2>
        </div>
      </header>

      <div className={styles.gridCriar}>
        
        {/* COLUNA DO FORMULÁRIO - Escondido na impressão */}
        <section className={`${styles.colunaForm} no-print`}>
          <div className={styles.cardForm}>
            <h3 className={styles.secaoTitulo}>1. Dados Pessoais</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nome Completo</label>
                <input 
                  type="text" 
                  placeholder="Ex: João Silva"
                  value={dadosPessoais.nome}
                  onChange={(e) => setDadosPessoais({...dadosPessoais, nome: e.target.value})}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Profissão / Objetivo</label>
                <input 
                  type="text" 
                  placeholder="Ex: Desenvolvedor Front-End"
                  value={dadosPessoais.cargo}
                  onChange={(e) => setDadosPessoais({...dadosPessoais, cargo: e.target.value})}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>E-mail</label>
                <input 
                  type="email" 
                  placeholder="joao@email.com"
                  value={dadosPessoais.email}
                  onChange={(e) => setDadosPessoais({...dadosPessoais, email: e.target.value})}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Telefone</label>
                <input 
                  type="text" 
                  placeholder="(51) 99999-9999"
                  value={dadosPessoais.telefone}
                  onChange={(e) => setDadosPessoais({...dadosPessoais, telefone: e.target.value})}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Cidade / Estado</label>
                <input 
                  type="text" 
                  placeholder="Porto Alegre - RS"
                  value={dadosPessoais.cidade}
                  onChange={(e) => setDadosPessoais({...dadosPessoais, cidade: e.target.value})}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>LinkedIn / Portfolio</label>
                <input 
                  type="text" 
                  placeholder="linkedin.com/in/usuario"
                  value={dadosPessoais.linkedin}
                  onChange={(e) => setDadosPessoais({...dadosPessoais, linkedin: e.target.value})}
                  className={styles.input}
                />
              </div>
            </div>

            <hr className={styles.divisor} />

            <h3 className={styles.secaoTitulo}>2. Resumo Profissional</h3>
            <div className={styles.formGroup}>
              <label className={styles.label}>Breve resumo sobre sua carreira</label>
              <textarea 
                rows={3}
                placeholder="Conte um pouco sobre suas principais experiências e pontos fortes..."
                value={resumoProfissional}
                onChange={(e) => setResumoProfissional(e.target.value)}
                className={styles.textarea}
              />
            </div>

            <hr className={styles.divisor} />

            <div className={styles.flexHeaderSecao}>
              <h3 className={styles.secaoTitulo}>3. Experiências Profissionais</h3>
              <button type="button" onClick={adicionarExperiencia} className={styles.btnAdicionar}>
                + Adicionar
              </button>
            </div>

            {experiencias.map((exp, idx) => (
              <div key={idx} className={styles.blocoDinamico}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Empresa</label>
                    <input 
                      type="text" 
                      value={exp.empresa}
                      onChange={(e) => atualizarExperiencia(idx, 'empresa', e.target.value)}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Cargo</label>
                    <input 
                      type="text" 
                      value={exp.cargo}
                      onChange={(e) => atualizarExperiencia(idx, 'cargo', e.target.value)}
                      className={styles.input}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Período (Ex: Jan/2024 - Atual)</label>
                  <input 
                    type="text" 
                    value={exp.periodo}
                    onChange={(e) => atualizarExperiencia(idx, 'periodo', e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Descrição das atividades</label>
                  <textarea 
                    rows={2}
                    value={exp.descricao}
                    onChange={(e) => atualizarExperiencia(idx, 'descricao', e.target.value)}
                    className={styles.textarea}
                  />
                </div>
                {experiencias.length > 1 && (
                  <button type="button" onClick={() => removerExperiencia(idx)} className={styles.btnRemover}>
                    Remover Experiência
                  </button>
                )}
              </div>
            ))}

            <hr className={styles.divisor} />

            <div className={styles.flexHeaderSecao}>
              <h3 className={styles.secaoTitulo}>4. Formação Acadêmica</h3>
              <button type="button" onClick={adicionarFormacao} className={styles.btnAdicionar}>
                + Adicionar
              </button>
            </div>

            {formacoes.map((form, idx) => (
              <div key={idx} className={styles.blocoDinamico}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Instituição</label>
                    <input 
                      type="text" 
                      value={form.instituicao}
                      onChange={(e) => atualizarFormacao(idx, 'instituicao', e.target.value)}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Curso / Graduação</label>
                    <input 
                      type="text" 
                      value={form.curso}
                      onChange={(e) => atualizarFormacao(idx, 'curso', e.target.value)}
                      className={styles.input}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Período (Ex: 2021 - 2025)</label>
                  <input 
                    type="text" 
                    value={form.periodo}
                    onChange={(e) => atualizarFormacao(idx, 'periodo', e.target.value)}
                    className={styles.input}
                  />
                </div>
                {formacoes.length > 1 && (
                  <button type="button" onClick={() => removerFormacao(idx)} className={styles.btnRemover}>
                    Remover Formação
                  </button>
                )}
              </div>
            ))}

            <hr className={styles.divisor} />

            <h3 className={styles.secaoTitulo}>5. Principais Habilidades</h3>
            <div className={styles.formGroup}>
              <label className={styles.label}>Habilidades (Separe por vírgulas)</label>
              <input 
                type="text" 
                placeholder="Ex: JavaScript, React, Python, Atendimento ao Cliente"
                value={habilidades}
                onChange={(e) => setHabilidades(e.target.value)}
                className={styles.input}
              />
            </div>

            {/* 🔥 Caixa Informativa de Ajuda com a Impressão (Posicionada estrategicamente antes do botão) */}
            {showTip && (
              <div className={styles.printTipBox}>
                <div className={styles.printTipHeader}>
                  <span className={styles.printTipIcon}>ℹ️</span>
                  <strong className={styles.printTipTitle}>Dica para um PDF perfeito:</strong>
                  <button 
                    type="button" 
                    className={styles.printTipClose} 
                    onClick={() => setShowTip(false)}
                  >
                    &times;
                  </button>
                </div>
                <p className={styles.printTipText}>
                  Caso apareça o rodapé com a data, links ou título do site nas bordas do papel, configure seu navegador assim:
                </p>
                <ol className={styles.printTipList}>
                  <li>Na tela de impressão, clique em <strong>Mais definições</strong> (ou <em>More settings</em>).</li>
                  <li>Procure por <strong>Cabeçalhos e rodapés</strong> e <strong>desmarque-a</strong>.</li>
                  <li>Lembre de manter <strong>Gráficos de fundo</strong> ativo para não perder o estilo visual.</li>
                </ol>
              </div>
            )}

            <button onClick={handleImprimir} className={styles.btnBaixarPDF}>
              🖨️ Baixar Currículo em PDF / Imprimir
            </button>
          </div>
        </section>

        {/* COLUNA DE PREVIEW / MODELO DO CURRÍCULO (Fica em tela cheia na impressão) */}
        <section className={styles.colunaPreview}>
          <div className={styles.folhaA4} id="curriculo-folha">
            {/* Header do Currículo */}
            <div className={styles.previewHeader}>
              <h1 className={styles.previewNome}>{dadosPessoais.nome || 'Seu Nome Completo'}</h1>
              <p className={styles.previewCargoSub}>{dadosPessoais.cargo || 'Seu Cargo ou Profissão Objetivo'}</p>
              
              <div className={styles.previewContatoGrid}>
                {dadosPessoais.email && <span>📧 {dadosPessoais.email}</span>}
                {dadosPessoais.telefone && <span>📞 {dadosPessoais.telefone}</span>}
                {dadosPessoais.cidade && <span>📍 {dadosPessoais.cidade}</span>}
                {dadosPessoais.linkedin && <span>🔗 {dadosPessoais.linkedin}</span>}
              </div>
            </div>

            {/* Conteúdo da Folha */}
            <div className={styles.previewCorpo}>
              
              {/* Resumo */}
              {resumoProfissional && (
                <div className={styles.previewSecao}>
                  <h4 className={styles.previewSecaoTitulo}>Resumo Profissional</h4>
                  <p className={styles.previewTextoTextarea}>{resumoProfissional}</p>
                </div>
              )}

              {/* Experiências */}
              {experiencias.some(e => e.empresa || e.cargo) && (
                <div className={styles.previewSecao}>
                  <h4 className={styles.previewSecaoTitulo}>Experiência Profissional</h4>
                  {experiencias.map((exp, idx) => (
                    <div key={idx} className={styles.previewItem}>
                      <div className={styles.previewItemHeader}>
                        <strong>{exp.cargo || 'Cargo'}</strong>
                        <span className={styles.previewItemPeriodo}>{exp.periodo}</span>
                      </div>
                      <p className={styles.previewEmpresaSub}>{exp.empresa || 'Nome da Empresa'}</p>
                      {exp.descricao && <p className={styles.previewTextoTextarea}>{exp.descricao}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Formação */}
              {formacoes.some(f => f.instituicao || f.curso) && (
                <div className={styles.previewSecao}>
                  <h4 className={styles.previewSecaoTitulo}>Formação Acadêmica</h4>
                  {formacoes.map((form, idx) => (
                    <div key={idx} className={styles.previewItem}>
                      <div className={styles.previewItemHeader}>
                        <strong>{form.curso || 'Curso / Graduação'}</strong>
                        <span className={styles.previewItemPeriodo}>{form.periodo}</span>
                      </div>
                      <p className={styles.previewEmpresaSub}>{form.instituicao || 'Instituição de Ensino'}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Habilidades */}
              {habilidades && (
                <div className={styles.previewSecao}>
                  <h4 className={styles.previewSecaoTitulo}>Habilidades & Competências</h4>
                  <div className={styles.previewHabilidadesGrid}>
                    {habilidades.split(',').map((hab, idx) => hab.trim() && (
                      <span key={idx} className={styles.previewHabilidadeTag}>
                        {hab.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>

      </div>
    </div>
  );
}