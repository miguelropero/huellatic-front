import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, ArrowLeft, Building, User, CheckCircle } from 'lucide-react';
import styles from '../styles/RegistroEmpresaPage.module.css';

export default function RegistroEmpresaPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [sectores, setSectores] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  
  const [formData, setFormData] = useState({
    nombre: '',
    nit: '',
    sector: '',
    ciudad: '',
    total_empleados: '',
    admin_nombre: '',
    admin_email: '',
    admin_password: '',
    confirm_password: ''
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [sectorSearch, setSectorSearch] = useState('');
  const [showSectorDropdown, setShowSectorDropdown] = useState(false);
  const [ciudadSearch, setCiudadSearch] = useState('');
  const [showCiudadDropdown, setShowCiudadDropdown] = useState(false);

  const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const sectoresFiltrados = sectores.filter(s => 
    removeAccents(s.nombre.toLowerCase()).includes(removeAccents(sectorSearch.toLowerCase()))
  );

  const ciudadesFiltradas = ciudades.filter(c => {
    const label = c.departamento ? `${c.nombre} (${c.departamento.nombre})` : c.nombre;
    return removeAccents(label.toLowerCase()).includes(removeAccents(ciudadSearch.toLowerCase()));
  });

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [resSectores, resCiudades] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/public/sectores`),
          fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/public/ciudades`)
        ]);
        if (resSectores.ok) setSectores(await resSectores.json());
        if (resCiudades.ok) setCiudades(await resCiudades.json());
      } catch (err) {
        console.error("Error cargando catálogos", err);
      }
    };
    fetchCatalogos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.nit || !formData.sector || !formData.ciudad) {
      setError('Por favor completa todos los campos obligatorios de la empresa.');
      return;
    }
    setCurrentStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.admin_password !== formData.confirm_password) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (formData.admin_password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const { confirm_password, ...payload } = formData;
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/public/registro-empresa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Ocurrió un error al registrar la empresa');
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.registerContainer}>
        <div className={styles.successCard}>
          <CheckCircle size={64} className={styles.successIcon} />
          <h2 className={styles.formTitle}>¡Registro Exitoso!</h2>
          <p className={styles.formSubtitle} style={{ marginBottom: '2rem' }}>
            Tu empresa <strong>{formData.nombre}</strong> ha sido registrada. Ya puedes iniciar sesión con tu correo {formData.admin_email}.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Ir a Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.registerContainer}>
      <div className={styles.header}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}><Leaf size={24} /></div>
          <div className={styles.logoText}>HuellaTic</div>
        </div>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={18} /> Volver al inicio
        </Link>
      </div>

      <div className={styles.formWrapper}>
        <div className={styles.formCard}>
          <div className={styles.stepper}>
            <div className={`${styles.step} ${currentStep >= 1 ? styles.activeStep : ''}`}>
              <div className={styles.stepIcon}><Building size={18} /></div>
              <span>Empresa</span>
            </div>
            <div className={styles.stepLine}></div>
            <div className={`${styles.step} ${currentStep >= 2 ? styles.activeStep : ''}`}>
              <div className={styles.stepIcon}><User size={18} /></div>
              <span>Administrador</span>
            </div>
          </div>

          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              {currentStep === 1 ? 'Datos de la Organización' : 'Datos del Administrador'}
            </h2>
            <p className={styles.formSubtitle}>
              {currentStep === 1 ? 'Registra tu empresa en la plataforma' : 'Crea tu cuenta de acceso'}
            </p>
          </div>

          {error && <div className={styles.errorMsg}>{error}</div>}

          {currentStep === 1 ? (
            <form onSubmit={handleNextStep}>
              <div className={styles.formGroup}>
                <label className="label">Razón Social *</label>
                <input type="text" className="input-field" name="nombre" value={formData.nombre} onChange={handleChange} required />
              </div>
              <div className={styles.formGroup}>
                <label className="label">NIT *</label>
                <input type="text" className="input-field" name="nit" value={formData.nit} onChange={handleChange} required />
              </div>
              <div className={styles.row}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className="label">Sector *</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text"
                      className="input-field"
                      placeholder="Busca o selecciona un sector"
                      value={sectorSearch || formData.sector}
                      onChange={(e) => {
                        setSectorSearch(e.target.value);
                        setFormData({ ...formData, sector: e.target.value });
                        setShowSectorDropdown(true);
                        setError('');
                      }}
                      onFocus={() => setShowSectorDropdown(true)}
                      onBlur={() => setTimeout(() => setShowSectorDropdown(false), 200)}
                      required
                      autoComplete="off"
                    />
                    {showSectorDropdown && (
                      <ul style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: '200px', overflowY: 'auto',
                        backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '0.5rem',
                        marginTop: '4px', zIndex: 50, listStyle: 'none', padding: 0, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }}>
                        {sectoresFiltrados.length > 0 ? sectoresFiltrados.map(s => (
                          <li key={s.id}
                            onClick={() => {
                              setFormData({ ...formData, sector: s.nombre });
                              setSectorSearch(s.nombre);
                              setShowSectorDropdown(false);
                            }}
                            style={{ padding: '0.75rem 1rem', cursor: 'pointer', color: 'var(--text-dark)', borderBottom: '1px solid #f1f5f9' }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            {s.nombre}
                          </li>
                        )) : <li style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>No se encontraron sectores</li>}
                      </ul>
                    )}
                  </div>
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className="label">Ciudad Principal *</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text"
                      className="input-field"
                      placeholder="Busca o selecciona una ciudad"
                      value={ciudadSearch || formData.ciudad}
                      onChange={(e) => {
                        setCiudadSearch(e.target.value);
                        setFormData({ ...formData, ciudad: e.target.value });
                        setShowCiudadDropdown(true);
                        setError('');
                      }}
                      onFocus={() => setShowCiudadDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCiudadDropdown(false), 200)}
                      required
                      autoComplete="off"
                    />
                    {showCiudadDropdown && (
                      <ul style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: '200px', overflowY: 'auto',
                        backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '0.5rem',
                        marginTop: '4px', zIndex: 50, listStyle: 'none', padding: 0, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }}>
                        {ciudadesFiltradas.length > 0 ? ciudadesFiltradas.map(c => {
                          const label = c.departamento ? `${c.nombre} (${c.departamento.nombre})` : c.nombre;
                          return (
                            <li key={c.id}
                              onClick={() => {
                                setFormData({ ...formData, ciudad: label });
                                setCiudadSearch(label);
                                setShowCiudadDropdown(false);
                              }}
                              style={{ padding: '0.75rem 1rem', cursor: 'pointer', color: 'var(--text-dark)', borderBottom: '1px solid #f1f5f9' }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                              {label}
                            </li>
                          )
                        }) : <li style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>No se encontraron ciudades</li>}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className="label">Número Aproximado de Empleados</label>
                <input type="number" className="input-field" name="total_empleados" value={formData.total_empleados} onChange={handleChange} min="1" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Continuar
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className="label">Nombre Completo *</label>
                <input type="text" className="input-field" name="admin_nombre" value={formData.admin_nombre} onChange={handleChange} required />
              </div>
              <div className={styles.formGroup}>
                <label className="label">Correo Electrónico *</label>
                <input type="email" className="input-field" name="admin_email" value={formData.admin_email} onChange={handleChange} required />
              </div>
              <div className={styles.row}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className="label">Contraseña *</label>
                  <input type="password" className="input-field" name="admin_password" value={formData.admin_password} onChange={handleChange} required />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className="label">Confirmar Contraseña *</label>
                  <input type="password" className="input-field" name="confirm_password" value={formData.confirm_password} onChange={handleChange} required />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn" onClick={() => setCurrentStep(1)} style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
                  Atrás
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isLoading}>
                  {isLoading ? 'Registrando...' : 'Finalizar Registro'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
