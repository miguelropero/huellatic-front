import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Leaf, User, Briefcase, MapPin, CheckCircle } from 'lucide-react';
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
  const [empleadoId, setEmpleadoId] = useState(null);

  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(1); // Mínimo 1, crecerá dinámicamente

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    cargo: '',
    municipio: ''
  });
  const [respuestas, setRespuestas] = useState({}); // { pregunta_id: valor_o_array }
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Empresa
        const resEmpresa = await fetch(`http://127.0.0.1:8000/api/v1/public/empresa/${token}`);
        if (!resEmpresa.ok) throw new Error('El enlace es inválido o ha expirado.');
        const dataEmpresa = await resEmpresa.json();
        setEmpresaNombre(dataEmpresa.nombre);

        // Fetch Ciudades
        const resCiudades = await fetch('http://127.0.0.1:8000/api/v1/public/ciudades');
        if (resCiudades.ok) {
          setCiudades(await resCiudades.json());
        }

        // Fetch Cuestionario
        const resCuestionario = await fetch(`http://127.0.0.1:8000/api/v1/public/cuestionario`);
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
    if (currentStep === 1) {
      if (!formData.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
      if (!formData.cedula.trim()) {
        errors.cedula = 'La cédula es obligatoria';
      } else if (!/^[0-9]+$/.test(formData.cedula.trim())) {
        errors.cedula = 'La cédula debe contener solo números';
      }
      if (!formData.cargo.trim()) errors.cargo = 'El cargo es obligatorio';
      if (!formData.municipio.trim()) errors.municipio = 'El municipio es obligatorio';
    } else {
      // Validar la sección actual (currentStep - 1)
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

  const handleNext = () => {
    if (validateForm()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== totalSteps) {
      handleNext();
      return;
    }
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        empleado: {
          nombre: formData.nombre.trim(),
          cedula: formData.cedula.trim(),
          cargo: formData.cargo.trim(),
          municipio: formData.municipio.trim()
        },
        respuestas: respuestas
      };

      const response = await fetch(`http://127.0.0.1:8000/api/v1/public/registro/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Ocurrió un error al registrar los datos.');
      }

      const responseData = await response.json();
      setEmpleadoId(responseData.id);
      setSuccess(true);
    } catch (err) {
      setFormErrors({ global: err.message });
    } finally {
      setSubmitting(false);
    }
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
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/public/empleado/${empleadoId}/reporte-pdf`);
      if (!res.ok) throw new Error('Error al generar PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Huella_${formData.cedula}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert("Hubo un error al descargar el reporte: " + err.message);
    }
  };

  if (success) {
    return (
      <div className={styles.successContainer}>
        <div className={styles.successCard}>
          <CheckCircle size={60} className={styles.successIcon} />
          <h2>¡Registro Completado!</h2>
          <p style={{marginBottom: '2rem'}}>Tus datos han sido guardados exitosamente. Tu huella de carbono ha sido calculada.</p>
          <button className={`btn btn-primary`} style={{width: '100%', padding: '1rem', fontSize: '1.1rem'}} onClick={handleDownloadPDF}>
            Descargar Reporte PDF
          </button>
        </div>
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
          <h1>Calculadora de Huella de Carbono</h1>
          <p>Mide tu impacto ambiental y descubre los beneficios del teletrabajo.</p>
        </div>

        {/* Progress Bar */}
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

        <form onSubmit={handleSubmit} className={styles.wizardContainer}>
          {formErrors.global && <div className={styles.errorMsg}>{formErrors.global}</div>}

          {/* STEP 1: Context & Personal Data */}
          {currentStep === 1 && (
            <div className={styles.stepOneGrid}>
              <div className={styles.infoSection}>
                <h2><Leaf size={24} /> ¿Qué es Calculapp / Huella TIC?</h2>
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

              <div>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-dark)', fontSize: '1.1rem' }}>Tus Datos Personales</h3>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Empresa</label>
                  <input type="text" value={empresaNombre} className={styles.formInputReadOnly} readOnly disabled />
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
                  <label className={styles.formLabel}>Cédula de Ciudadanía *</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputPrefix}>CC</span>
                    <input type="text" name="cedula" value={formData.cedula} onChange={handleChangeDatos} className={`${styles.formInput} ${formErrors.cedula ? styles.inputError : ''}`} placeholder="Ej. 1020304050" style={{ paddingLeft: '3rem' }} />
                  </div>
                  {formErrors.cedula && <span className={styles.errorText}>{formErrors.cedula}</span>}
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
                  <div className={styles.inputWrapper}>
                    <MapPin size={18} className={styles.inputIcon} />
                    <select 
                      name="municipio"
                      value={formData.municipio}
                      onChange={handleChangeDatos}
                      className={`${styles.formInput} ${formErrors.municipio ? styles.inputError : ''}`}
                      style={{ paddingLeft: '2.5rem', appearance: 'none' }}
                    >
                      <option value="">Selecciona tu ciudad</option>
                      {ciudades.map(c => (
                        <option key={c.id} value={c.nombre}>{c.nombre} {c.departamento && `(${c.departamento.nombre})`}</option>
                      ))}
                    </select>
                  </div>
                  {formErrors.municipio && <span className={styles.errorText}>{formErrors.municipio}</span>}
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC STEPS (2 to N) */}
          {currentStep > 1 && (
            <div style={{ padding: '1rem 0' }}>
              <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-dark)' }}>{getStepTitle()}</h2>
              {secciones[currentStep - 2]?.preguntas.map(pregunta => renderPregunta(pregunta))}
            </div>
          )}

          <div className={styles.formActions}>
            {currentStep > 1 && (
              <button type="button" className={styles.backBtn} onClick={handlePrev} disabled={submitting}>
                Atrás
              </button>
            )}
            
            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={submitting}>
              {submitting ? 'Procesando...' : currentStep === totalSteps ? 'Finalizar y Calcular Huella' : 'Siguiente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
