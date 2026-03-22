import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        alert('As senhas não coincidem');
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert('Confirme seu e-mail para ativar a conta.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="card glass-panel flex-column gap-3" style={{ width: '400px' }}>
        <div className="flex items-center gap-2">
          <div className="logo-icon">C</div>
          <h1>ChocoFlow</h1>
        </div>
        <p className="text-muted">
          {isSignUp ? 'Crie sua conta para começar.' : 'Acesse sua engenharia de chocolate.'}
        </p>
        
        <form onSubmit={handleSubmit} className="flex-column gap-2">
          <div className="input-group">
            <label>E-mail</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Senha</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {isSignUp && (
            <div className="input-group">
              <label>Confirmar Senha</label>
              <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </button>
          
          {!isSignUp && (
            <>
              <div className="flex items-center gap-1 my-2">
                <div style={{ flex: 1, height: '1px', background: '#e1e1e1' }} />
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>ou</span>
                <div style={{ flex: 1, height: '1px', background: '#e1e1e1' }} />
              </div>

              <button 
                type="button" 
                className="btn-google flex items-center justify-center gap-2"
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({ 
                    provider: 'google',
                    options: { redirectTo: window.location.origin }
                  });
                  if (error) alert(error.message);
                }}
              >
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" width="18" alt="G" />
                Entrar com Google
              </button>
            </>
          )}

          <button type="button" className="btn-ghost" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Já tenho uma conta' : 'Criar nova conta'}
          </button>
        </form>
      </div>


      <style dangerouslySetInnerHTML={{ __html: `
        .login-container {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-cream);
        }
        .logo-icon {
          width: 40px; height: 40px;
          background: var(--secondary);
          color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          border-radius: 10px; font-weight: 800; font-size: 1.5rem;
        }
        .btn-google {
          background: white;
          border: 1px solid #e1e1e1;
          padding: 10px;
          border-radius: 8px;
          font-weight: 500;
          color: #333;
        }
        .btn-google:hover {
          background: #f9f9f9;
        }
        .my-2 { margin: 8px 0; }
      `}} />
    </div>
  );
};

export default Login;
