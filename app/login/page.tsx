'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nome: nome },
          },
        });

        if (error) throw error;

        if (data?.user?.identities && data.user.identities.length === 0) {
          setMessage('Este e-mail já está cadastrado. Tente fazer login.');
        } else {
          setMessage('Cadastro realizado com sucesso! Redirecionando...');
          await supabase.auth.signInWithPassword({ email, password });
          router.push('/painel');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const { data: perfil, error: perfilError } = await supabase
          .from('perfis')
          .select('role')
          .eq('id', data.user?.id)
          .single();

        if (perfilError) throw perfilError;

        if (perfil?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/painel');
        }
      }
    } catch (err: any) {
      setMessage(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  // Nova função para recuperação de senha usando Supabase Auth
  const handleForgotPassword = async () => {
    if (!email) {
      setMessage('Por favor, insira seu e-mail no campo acima para recuperar a senha.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/recuperar-senha`,
      });

      if (error) throw error;

      setMessage('sucesso: Link de recuperação enviado para o seu e-mail!');
    } catch (err: any) {
      setMessage(err.message || 'Erro ao tentar enviar e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const isSuccessMessage = message.includes('sucesso');

  return (
    <div className={styles.container}>
      
      {/* O Logo agora fica FORA da caixa do formulário */}
      <div className={styles.logoContainer}>
        <span className={styles.logoMain}>💼 Sant'Anna</span>
        <span className={styles.logoSubtitle}>Agência de Empregos</span>
      </div>

      <div className={styles.card}>
        <h2 className={styles.title}>
          {isRegister ? 'Criar Conta' : 'Acessar Sistema'}
        </h2>
        <p className={styles.subtitle}>
          {isRegister ? 'Preencha os campos para se registrar no portal' : 'Insira suas credenciais para continuar'}
        </p>

        {message && (
          <div className={`${styles.message} ${isSuccessMessage ? styles.messageSucesso : styles.messageErro}`}>
            {message.replace('sucesso: ', '')}
          </div>
        )}

        <form onSubmit={handleAuth} className={styles.form}>
          {isRegister && (
            <div className={styles.formGroup}>
              <label>Nome Completo</label>
              <input 
                type="text" 
                value={nome} 
                onChange={(e) => setNome(e.target.value)} 
                required 
                placeholder="Seu nome completo" 
                className={styles.input} 
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label>E-mail</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="seu@email.com" 
              className={styles.input} 
            />
          </div>

          <div className={styles.formGroup}>
            {/* Linha da label modificada para incluir o botão de esqueci a senha alinhado */}
            <div className={styles.labelPasswordRow}>
              <label>Senha</label>
              {!isRegister && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className={styles.btnForgotPassword}
                  disabled={loading}
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required={!loading} 
              placeholder="••••••••" 
              className={styles.input} 
            />
          </div>

          <button type="submit" disabled={loading} className={styles.btnSubmit}>
            {loading ? 'Processando...' : isRegister ? 'Cadastrar e Entrar' : 'Entrar no Portal'}
          </button>
        </form>

        <div className={styles.footer}>
          <span className={styles.footerText}>
            {isRegister ? 'Já tem uma conta?' : 'Não tem uma conta ainda?'}
          </span>
          <button 
            type="button" 
            onClick={() => { setIsRegister(!isRegister); setMessage(''); }} 
            className={styles.btnToggle}
          >
            {isRegister ? 'Faça Login' : 'Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}