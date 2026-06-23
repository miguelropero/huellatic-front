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
      
      if (data.rol === 'ROOT') {
        navigate('/dashboard');
      } else {
        showSnackbar('¡Bienvenido! Pronto verás el panel de tu empresa.', 'success');
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      {/* Panel Izquierdo: Información */}
      <div className={styles.infoPanel}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}><Leaf size={28} /></div>
          <div className={styles.logoText}>HuellaTic</div>
        </div>
        
        <div className={styles.infoContent}>
          <h1 className={styles.infoTitle}>Mide y reduce tu impacto ambiental.</h1>
          <p className={styles.infoDescription}>
            HuellaTic es la plataforma corporativa del Ministerio TIC para calcular, analizar y compensar la huella de carbono generada por las actividades tecnológicas y operativas de tu empresa.
          </p>
          
          <ul className={styles.featuresList}>
            <li className={styles.featureItem}>
              <span className={styles.featureIcon}>✓</span>
              Cálculo automatizado de emisiones
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureIcon}>✓</span>
              Reportes detallados por empleado
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureIcon}>✓</span>
              Dashboard global de sostenibilidad
            </li>
          </ul>
        </div>
      </div>

      {/* Panel Derecho: Formulario */}
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
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
