import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Leaf, User, Briefcase, MapPin, CheckCircle, Loader2 } from 'lucide-react';
import styles from '../styles/RegistroEmpleadoPage.module.css';

export default function RegistroEmpleadoPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [secciones, setSecciones] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [empleadoId, setEmpleadoId] = useState(null);
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });
  const [isDownloading, setIsDownloading] = useState(false);

  // Wizard State
  // 0: Verificación, 1: Datos Personales, 2+: Cuestionario
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(1);

  // Form State
  const [cedulaVerificacion, setCedulaVerificacion] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    cargo: '',
    municipio: ''
  });
  const [respuestas, setRespuestas] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [ciudadSearch, setCiudadSearch] = useState('');

  const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const ciudadesFiltradas = ciudades.filter(c => {
    const label = c.departamento ? `${c.nombre} (${c.departamento.nombre})` : c.nombre;
    return removeAccents(label.toLowerCase()).includes(removeAccents(ciudadSearch.toLowerCase()));
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resEmpresa, resCiudades, resCuestionario] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/public/empresa/${token}`),
          fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/public/ciudades`),
          fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/public/cuestionario`)
        ]);

        if (!resEmpresa.ok) throw new Error('El enlace es inválido o ha expirado.');
        const dataEmpresa = await resEmpresa.json();
        setEmpresaNombre(dataEmpresa.nombre);

        if (resCiudades.ok) {
          setCiudades(await resCiudades.json());
        }

        if (!resCuestionario.ok) throw new Error('Error al cargar el cuestionario.');
        const dataCuestionario = await resCuestionario.json();
        setSecciones(dataCuestionario);
        setTotalSteps(1 + dataCuestionario.length);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const validateForm = () => {
    const errors = {};
    if (currentStep === 0) {
      if (!cedulaVerificacion.trim()) errors.cedula = 'La cédula es obligatoria para iniciar';
    } else if (currentStep === 1) {
      if (!formData.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
      if (!formData.cedula.trim()) {
        errors.cedula = 'La cédula es obligatoria';
      } else if (!/^[0-9]+$/.test(formData.cedula.trim())) {
        errors.cedula = 'La cédula debe contener solo números';
      }
      if (!formData.cargo.trim()) errors.cargo = 'El cargo es obligatorio';
      if (!formData.municipio.trim()) errors.municipio = 'El municipio es obligatorio';
    } else {
      const seccionIndex = currentStep - 2;
      const seccion = secciones[seccionIndex];
      if (seccion) {
        seccion.preguntas.forEach(pregunta => {
          if (pregunta.requerida) {
            const valor = respuestas[pregunta.id];
            if (valor === undefined || valor === null || valor === '' || (Array.isArray(valor) && valor.length === 0)) {
              errors[`pregunta_${pregunta.id}`] = 'Esta pregunta es obligatoria';
            }
          }
        });
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleVerificar = async (e) => {
    e.preventDefault();
    setSnackbar({ show: false, message: '', type: 'success' });
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/public/registro/iniciar/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: cedulaVerificacion.trim() })
      });
      if (!response.ok) throw new Error('Error al verificar cédula');
      
      const data = await response.json();
      if (!data.estado_encuesta) {
        // Nuevo usuario
        setFormData(prev => ({ ...prev, cedula: cedulaVerificacion.trim() }));
        setCurrentStep(1);
      } else if (data.estado_encuesta === 'COMPLETADO') {
        // Ya terminó
        setEmpleadoId(data.empleado_id);
        setIsCompleted(true);
      } else if (data.estado_encuesta === 'EN_PROGRESO') {
        // Retomar
        setEmpleadoId(data.empleado_id);
        if (data.respuestas) {
          setRespuestas(data.respuestas);
        }
        setCurrentStep(2); // Inicia en la primera sección del cuestionario
      }
    } catch (err) {
      setFormErrors({ global: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSiguiente = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      if (currentStep === 1) {
        // Crear empleado
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/public/empleado/${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Error al registrar datos personales');
        }
        const data = await response.json();
        setEmpleadoId(data.id);
        setCurrentStep(2);
        window.scrollTo(0, 0);
      } else if (currentStep > 1 && currentStep < totalSteps) {
        // Guardar respuestas parciales
        await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/public/empleado/${empleadoId}/respuestas`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ respuestas })
        });
        setCurrentStep(prev => prev + 1);
        window.scrollTo(0, 0);
      } else if (currentStep === totalSteps) {
        // Finalizar
        await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/public/empleado/${empleadoId}/respuestas`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ respuestas })
        });
        await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/public/empleado/${empleadoId}/finalizar`, {
          method: 'POST'
        });
        setSuccess(true);
      }
    } catch (err) {
      setFormErrors({ global: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 2) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleChangeDatos = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) setFormErrors({ ...formErrors, [name]: '' });
  };

  const handleChangeRespuesta = (preguntaId, valor, tipo, isChecked = false) => {
    setRespuestas(prev => {
      const current = prev[preguntaId];
      let nuevoValor;

      if (tipo === 'SELECCION_MULTIPLE') {
        let arr = Array.isArray(current) ? [...current] : [];
        if (isChecked) {
          if (!arr.includes(valor)) arr.push(valor);
        } else {
          arr = arr.filter(v => v !== valor);
        }
        nuevoValor = arr;
      } else {
        nuevoValor = valor;
      }

      const newState = { ...prev, [preguntaId]: nuevoValor };
      if (formErrors[`pregunta_${preguntaId}`]) {
        setFormErrors({ ...formErrors, [`pregunta_${preguntaId}`]: '' });
      }
      return newState;
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Leaf className={styles.loadingIcon} size={40} />
        <h2>Cargando formulario...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/public/empleado/${empleadoId}/reporte-pdf`);
      if (!res.ok) throw new Error('Error al generar PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cedulaParaReporte = formData.cedula || cedulaVerificacion || 'Empleado';
      a.download = `Reporte_Huella_${cedulaParaReporte}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setSnackbar({ show: true, message: 'Reporte descargado exitosamente', type: 'success' });
    } catch (err) {
      setSnackbar({ show: true, message: "Hubo un error al descargar el reporte: " + err.message, type: 'error' });
    } finally {
      setIsDownloading(false);
    }
  };

  if (success || isCompleted) {
    return (
      <div className={styles.successContainer}>
        <div className={styles.successCard}>
          <CheckCircle size={60} className={styles.successIcon} />
          <h2>{isCompleted ? '¡Encuesta ya completada!' : '¡Registro Completado!'}</h2>
          <p style={{marginBottom: '2rem'}}>
            {isCompleted 
              ? 'Tus datos ya están registrados en nuestro sistema. Puedes descargar tu reporte nuevamente.' 
              : 'Tus datos han sido guardados exitosamente. Tu huella de carbono ha sido calculada.'}
          </p>
          <button 
            className={`btn btn-primary`} 
            style={{width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem'}} 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            {isDownloading ? <Loader2 size={20} className={styles.spinner} /> : 'Descargar Reporte PDF'}
          </button>
          
          <button 
            type="button" 
            className={styles.backBtn} 
            style={{width: '100%', display: 'block', textAlign: 'center'}}
            onClick={() => {
              setIsCompleted(false);
              setSuccess(false);
              setCurrentStep(0);
              setCedulaVerificacion('');
              setSnackbar({ show: false, message: '', type: 'success' });
            }}
          >
            Volver al inicio
          </button>
        </div>
        
        {snackbar.show && (
          <div className={`snackbar ${snackbar.type}`}>
            {snackbar.message}
            <button onClick={() => setSnackbar({ show: false, message: '', type: 'success' })}>×</button>
          </div>
        )}
      </div>
    );
  }

  const getStepTitle = () => {
    if (currentStep === 1) return 'Datos Personales';
    const secIndex = currentStep - 2;
    return secciones[secIndex]?.titulo || 'Cuestionario';
  };

  const renderPregunta = (pregunta) => {
    const errorMsg = formErrors[`pregunta_${pregunta.id}`];
    const valorActual = respuestas[pregunta.id] !== undefined ? respuestas[pregunta.id] : (pregunta.tipo_respuesta === 'SELECCION_MULTIPLE' ? [] : '');

    return (
      <div key={pregunta.id} className={styles.formGroup} style={{ marginBottom: '2rem' }}>
        <label className={styles.formLabel} style={{ fontSize: '1.05rem', marginBottom: '0.8rem' }}>
          {pregunta.texto} {pregunta.requerida && '*'}
        </label>
        
        {pregunta.tipo_respuesta === 'NUMERICA' && (
          <input 
            type="number" 
            className={`${styles.formInput} ${errorMsg ? styles.inputError : ''}`}
            value={valorActual}
            onChange={(e) => handleChangeRespuesta(pregunta.id, e.target.value, 'NUMERICA')}
            min="0"
            step="any"
          />
        )}

        {pregunta.tipo_respuesta === 'OPCION_MULTIPLE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pregunta.opciones.map(opt => (
              <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name={`pregunta_${pregunta.id}`}
                  value={opt.texto}
                  checked={valorActual === opt.texto}
                  onChange={(e) => handleChangeRespuesta(pregunta.id, e.target.value, 'OPCION_MULTIPLE')}
                />
                <span style={{ color: 'var(--text-color)' }}>{opt.texto}</span>
              </label>
            ))}
          </div>
        )}

        {pregunta.tipo_respuesta === 'SELECCION_MULTIPLE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pregunta.opciones.map(opt => (
              <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  value={opt.texto}
                  checked={Array.isArray(valorActual) && valorActual.includes(opt.texto)}
                  onChange={(e) => handleChangeRespuesta(pregunta.id, e.target.value, 'SELECCION_MULTIPLE', e.target.checked)}
                />
                <span style={{ color: 'var(--text-color)' }}>{opt.texto}</span>
              </label>
            ))}
          </div>
        )}

        {pregunta.tipo_respuesta === 'ESCALA' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pregunta.opciones.map(opt => (
              <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name={`pregunta_${pregunta.id}`}
                  value={opt.texto}
                  checked={valorActual === opt.texto}
                  onChange={(e) => handleChangeRespuesta(pregunta.id, e.target.value, 'ESCALA')}
                />
                <span style={{ color: 'var(--text-color)' }}>{opt.texto}</span>
              </label>
            ))}
          </div>
        )}

        {errorMsg && <span className={styles.errorText} style={{ marginTop: '0.5rem', display: 'block' }}>{errorMsg}</span>}
      </div>
    );
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formCard}>
        <div className={styles.header}>
          <Leaf className={styles.logoIcon} size={32} />
          <h1>HuellaTic - Calculadora de huella de carbono</h1>
        </div>

        {currentStep === 0 ? (
          <div className={styles.stepOneGrid} style={{ marginTop: '2rem' }}>
            <div className={styles.infoSection}>
              <h2><Leaf size={24} /> ¿Qué es HuellaTIC?</h2>
              <p>
                El Ministerio TIC promueve la medición de los beneficios del teletrabajo. 
                Con esta herramienta podrás cuantificar cómo tu modalidad de trabajo impacta positivamente al medio ambiente.
              </p>
              <p><strong>¿Qué vas a obtener al finalizar?</strong></p>
              <ul>
                <li>Tu ahorro estimado de emisiones de CO2 al evitar desplazamientos.</li>
                <li>Cálculo de ahorros en tiempo y dinero.</li>
                <li>Un reporte PDF personalizado con tu desempeño ambiental.</li>
              </ul>
            </div>

            <form onSubmit={handleVerificar} className={styles.wizardContainer} style={{ marginTop: 0 }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: 'var(--text-dark)', fontSize: '1.5rem', marginBottom: '0.2rem' }}>Bienvenido</h3>
                <h2 style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '500' }}>Cuestionario de {empresaNombre}</h2>
                <p>Por favor ingresa tu número de cédula para iniciar la encuesta, retomar tu progreso, o <strong>descargar tu reporte de huella de carbono</strong> si ya la completaste anteriormente.</p>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cédula de Ciudadanía</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputPrefix}>CC</span>
                  <input 
                    type="text" 
                    value={cedulaVerificacion} 
                    onChange={(e) => {
                      setCedulaVerificacion(e.target.value);
                      if (formErrors.cedula) setFormErrors({});
                    }} 
                    className={`${styles.formInput} ${formErrors.cedula ? styles.inputError : ''}`} 
                    placeholder="Ej. 1020304050" 
                    style={{ paddingLeft: '3rem' }} 
                  />
                </div>
                {formErrors.cedula && <span className={styles.errorText}>{formErrors.cedula}</span>}
                {formErrors.global && <span className={styles.errorText}>{formErrors.global}</span>}
              </div>
              
              <div className={styles.formActions} style={{ justifyContent: 'center', marginTop: '2rem' }}>
                <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={submitting}>
                  {submitting ? 'Verificando...' : 'Continuar / Descargar'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className={styles.progressContainer}>
              <div className={styles.progressInfo}>
                <span>Paso {currentStep}: {getStepTitle()}</span>
                <span>Paso {currentStep} de {totalSteps}</span>
              </div>
              <div className={styles.progressBarTrack}>
                <div 
                  className={styles.progressBarFill} 
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>

            <form onSubmit={handleSiguiente} className={styles.wizardContainer}>
              {formErrors.global && <div className={styles.errorMsg}>{formErrors.global}</div>}

              {currentStep === 1 && (
                <div>
                  <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-dark)', fontSize: '1.1rem' }}>Tus Datos Personales</h3>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Empresa</label>
                    <input type="text" value={empresaNombre} className={styles.formInputReadOnly} readOnly disabled />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Cédula</label>
                    <input type="text" value={formData.cedula} className={styles.formInputReadOnly} readOnly disabled />
                  </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Nombre Completo *</label>
                      <div className={styles.inputWrapper}>
                        <User size={18} className={styles.inputIcon} />
                        <input type="text" name="nombre" value={formData.nombre} onChange={handleChangeDatos} className={`${styles.formInput} ${formErrors.nombre ? styles.inputError : ''}`} placeholder="Ej. Juan Pérez" />
                      </div>
                      {formErrors.nombre && <span className={styles.errorText}>{formErrors.nombre}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Cargo *</label>
                      <div className={styles.inputWrapper}>
                        <Briefcase size={18} className={styles.inputIcon} />
                        <input type="text" name="cargo" value={formData.cargo} onChange={handleChangeDatos} className={`${styles.formInput} ${formErrors.cargo ? styles.inputError : ''}`} placeholder="Ej. Desarrollador Frontend" />
                      </div>
                      {formErrors.cargo && <span className={styles.errorText}>{formErrors.cargo}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Ciudad / Municipio de Residencia *</label>
                      <div className={styles.inputWrapper} style={{ position: 'relative' }}>
                        <MapPin size={18} className={styles.inputIcon} />
                        <input 
                          type="text"
                          placeholder="Escribe o selecciona tu ciudad"
                          value={ciudadSearch || formData.municipio}
                          onChange={(e) => {
                            setCiudadSearch(e.target.value);
                            setFormData({ ...formData, municipio: e.target.value });
                            setShowDropdown(true);
                            if (formErrors.municipio) setFormErrors({ ...formErrors, municipio: '' });
                          }}
                          onFocus={() => setShowDropdown(true)}
                          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                          className={`${styles.formInput} ${formErrors.municipio ? styles.inputError : ''}`}
                          style={{ paddingLeft: '2.5rem', width: '100%' }}
                          autoComplete="off"
                        />
                        {showDropdown && (
                          <ul style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            backgroundColor: 'white',
                            border: '1px solid var(--border-color)',
                            borderRadius: '0.5rem',
                            marginTop: '4px',
                            zIndex: 50,
                            listStyle: 'none',
                            padding: 0,
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}>
                            {ciudadesFiltradas.length > 0 ? ciudadesFiltradas.map(c => {
                              const label = c.departamento ? `${c.nombre} (${c.departamento.nombre})` : c.nombre;
                              return (
                                <li 
                                  key={c.id} 
                                  onClick={() => {
                                    setFormData({ ...formData, municipio: label });
                                    setCiudadSearch(label);
                                    setShowDropdown(false);
                                  }}
                                  style={{
                                    padding: '0.75rem 1rem',
                                    cursor: 'pointer',
                                    color: 'var(--text-dark)',
                                    borderBottom: '1px solid #f1f5f9'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                  {label}
                                </li>
                              );
                            }) : (
                              <li style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>No se encontraron ciudades</li>
                            )}
                          </ul>
                        )}
                      </div>
                      {formErrors.municipio && <span className={styles.errorText}>{formErrors.municipio}</span>}
                    </div>
                </div>
              )}

              {currentStep > 1 && (
                <div style={{ padding: '1rem 0' }}>
                  <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-dark)' }}>{getStepTitle()}</h2>
                  {secciones[currentStep - 2]?.preguntas.map(pregunta => renderPregunta(pregunta))}
                </div>
              )}

              <div className={styles.formActions}>
                {currentStep > 2 && (
                  <button type="button" className={styles.backBtn} onClick={handlePrev} disabled={submitting}>
                    Atrás
                  </button>
                )}
                
                <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={submitting}>
                  {submitting ? 'Procesando...' : currentStep === totalSteps ? 'Finalizar y Calcular Huella' : 'Siguiente'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
