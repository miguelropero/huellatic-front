import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import styles from '../styles/LoginPage.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'success' });

  const showSnackbar = (message, type = 'success') => {
    setSnackbar({ visible: true, message, type });
    setTimeout(() => setSnackbar(prev => ({ ...prev, visible: false })), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Credenciales incorrectas');
      }

      const data = await response.json();
      
      // Guardar sesión en LocalStorage (simulación básica de Contexto/Auth)
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('rol', data.rol);
      
      if (data.rol === 'ROOT' || data.rol === 'EMPRESA') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard'); // Temporarily redirect all to dashboard
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div className={styles.logoIcon}><Leaf size={28} /></div>
            </div>
            <h2 className={styles.formTitle}>Iniciar Sesión</h2>
            <p className={styles.formSubtitle}>Ingresa tus credenciales de administrador</p>
          </div>

          {error && <div className={styles.errorMsg}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className="label" htmlFor="email">Correo Electrónico</label>
              <input 
                type="email" 
                id="email"
                className="input-field" 
                placeholder="admin@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className="label" htmlFor="password">Contraseña</label>
              <input 
                type="password" 
                id="password"
                className="input-field" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <a href="#" className={styles.forgotPassword}>¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={isLoading}>
              {isLoading ? 'Iniciando...' : 'Entrar a HuellaTic'}
            </button>
            
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              ¿No tienes una cuenta? <a href="/registro-empresa" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>Registra tu empresa</a>
              <br /><br />
              <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Volver al inicio</a>
            </div>
          </form>
        </div>
      </div>
      {/* Snackbar */}
      {snackbar.visible && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: snackbar.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {snackbar.message}
          <button onClick={() => setSnackbar({ ...snackbar, visible: false })} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        </div>
      )}
    </div>
  );
}
