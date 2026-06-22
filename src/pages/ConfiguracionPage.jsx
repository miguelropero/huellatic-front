import { useEffect, useState } from 'react';
import { Edit, Save, X, Settings, Users, Building, Map, Sliders, List, HelpCircle, Plus, Trash2 } from 'lucide-react';
import PreguntasTab from '../components/PreguntasTab';
import SeccionesTab from '../components/SeccionesTab';
import styles from '../styles/ConfiguracionPage.module.css';

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState('usuarios');
  const [secciones, setSecciones] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [variables, setVariables] = useState([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState({
    usuarios: false,
    sectores: false,
    ciudades: false,
    variables: false,
    secciones: false,
    preguntas: false
  });
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  
  const [filtroDepartamento, setFiltroDepartamento] = useState('');
  
  // Estado para edición de preguntas
  const [editingPreguntaId, setEditingPreguntaId] = useState(null);
  const [editForm, setEditForm] = useState({ texto: '', tipo_respuesta: '', opciones: [] });

  // Estado para CRUD de Sectores
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [editingSectorId, setEditingSectorId] = useState(null);
  const [sectorForm, setSectorForm] = useState({ nombre: '', activo: true });

  // Estado para edición de secciones
  const [editingSeccionId, setEditingSeccionId] = useState(null);
  const [seccionForm, setSeccionForm] = useState({ titulo: '', orden: 0 });

  // Estado para Snackbar
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'success' });

  const showSnackbar = (message, type = 'success') => {
    setSnackbar({ visible: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  useEffect(() => {
    fetchDataForTab(activeTab);
  }, [activeTab]);

  const fetchDataForTab = async (tab, force = false) => {
    // Si ya cargamos esta pestaña y no estamos forzando recarga, no hacemos nada
    if (loadedTabs[tab] && !force) return;

    setLoadingTab(true);
    setError('');

    try {
      if (tab === 'preguntas' || tab === 'secciones') {
        const res = await fetch('http://127.0.0.1:8000/api/v1/admin/cuestionario');
        if (!res.ok) throw new Error('Error al cargar cuestionario');
        setSecciones(await res.json());
      } else if (tab === 'sectores') {
        const res = await fetch('http://127.0.0.1:8000/api/v1/admin/sectores');
        if (!res.ok) throw new Error('Error al cargar sectores');
        setSectores(await res.json());
      } else if (tab === 'ciudades') {
        const [resC, resD] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/v1/admin/ciudades'),
          fetch('http://127.0.0.1:8000/api/v1/public/departamentos')
        ]);
        if (!resC.ok || !resD.ok) throw new Error('Error al cargar ciudades/departamentos');
        setCiudades(await resC.json());
        setDepartamentos(await resD.json());
      } else if (tab === 'variables') {
        const res = await fetch('http://127.0.0.1:8000/api/v1/admin/variables');
        if (!res.ok) throw new Error('Error al cargar variables');
        setVariables(await res.json());
      }
      
      setLoadedTabs(prev => ({ ...prev, [tab]: true }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingTab(false);
    }
  };

  const startEditingPregunta = (pregunta) => {
    setEditingPreguntaId(pregunta.id);
    setEditForm({ 
      texto: pregunta.texto, 
      tipo_respuesta: pregunta.tipo_respuesta,
      opciones: pregunta.opciones ? pregunta.opciones.map(opt => ({ texto: opt.texto, valor_calculo: opt.valor_calculo || '' })) : []
    });
  };

  const handleOpcionChange = (index, value) => {
    const nuevasOpciones = [...editForm.opciones];
    nuevasOpciones[index].texto = value;
    setEditForm({ ...editForm, opciones: nuevasOpciones });
  };

  const addOpcion = () => {
    setEditForm({ ...editForm, opciones: [...editForm.opciones, { texto: '', valor_calculo: '' }] });
  };

  const removeOpcion = (index) => {
    const nuevasOpciones = [...editForm.opciones];
    nuevasOpciones.splice(index, 1);
    setEditForm({ ...editForm, opciones: nuevasOpciones });
  };

  const cancelEditing = () => {
    setEditingPreguntaId(null);
  };

  const savePregunta = async (preguntaId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/admin/cuestionario/preguntas/${preguntaId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editForm)
      });
      
      if (!res.ok) throw new Error('Error al actualizar la pregunta');
      
      setSecciones(prev => prev.map(sec => ({
        ...sec,
        preguntas: sec.preguntas.map(p => p.id === preguntaId ? { ...p, ...editForm } : p)
      })));
      
      setEditingPreguntaId(null);
      alert('Pregunta actualizada. El historial de cambios se ha guardado.');
      fetchDataForTab('preguntas', true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateOrUpdateSector = async (e) => {
    // ... logic unchanged ...
    e.preventDefault();
    try {
      const url = editingSectorId 
        ? `http://127.0.0.1:8000/api/v1/admin/sectores/${editingSectorId}`
        : 'http://127.0.0.1:8000/api/v1/admin/sectores';
        
      const method = editingSectorId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectorForm)
      });
      
      if (!res.ok) throw new Error('Error al guardar el sector');
      
      setIsSectorModalOpen(false);
      setEditingSectorId(null);
      fetchDataForTab('sectores', true); // Recargar datos de esta pestaña
    } catch(err) {
      alert(err.message);
    }
  };

  const saveSeccion = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/admin/cuestionario/secciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seccionForm)
      });
      if (!res.ok) throw new Error('Error al actualizar sección');
      setEditingSeccionId(null);
      fetchDataForTab('secciones', true);
    } catch (err) {
      alert(err.message);
    }
  };

  const syncDivipola = async () => {
    if (!window.confirm("¿Deseas descargar y sincronizar todos los departamentos y ciudades desde el portal de datos.gov.co? Esto puede tomar unos segundos.")) return;
    
    setSyncing(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/admin/sincronizar-divipola', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Error al sincronizar');
      
      alert(data.mensaje);
      fetchDataForTab('ciudades', true);
    } catch(err) {
      alert(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const deleteSector = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este sector?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/admin/sectores/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      fetchDataForTab('sectores', true);
    } catch(err) {
      alert(err.message);
    }
  };

  const openSectorModal = (sector = null) => {
    if (sector) {
      setEditingSectorId(sector.id);
      setSectorForm({ nombre: sector.nombre, activo: sector.activo });
    } else {
      setEditingSectorId(null);
      setSectorForm({ nombre: '', activo: true });
    }
    setIsSectorModalOpen(true);
  };

  const renderTabs = () => (
    <div className={styles.tabsContainer}>
      <button className={`${styles.tabBtn} ${activeTab === 'usuarios' ? styles.activeTab : ''}`} onClick={() => setActiveTab('usuarios')}>
        <Users size={16} /> Usuarios
      </button>
      <button className={`${styles.tabBtn} ${activeTab === 'sectores' ? styles.activeTab : ''}`} onClick={() => setActiveTab('sectores')}>
        <Building size={16} /> Sectores
      </button>
      <button className={`${styles.tabBtn} ${activeTab === 'ciudades' ? styles.activeTab : ''}`} onClick={() => setActiveTab('ciudades')}>
        <Map size={16} /> Ciudades
      </button>
      <button className={`${styles.tabBtn} ${activeTab === 'variables' ? styles.activeTab : ''}`} onClick={() => setActiveTab('variables')}>
        <Sliders size={16} /> Variables
      </button>
      <button className={`${styles.tabBtn} ${activeTab === 'secciones' ? styles.activeTab : ''}`} onClick={() => setActiveTab('secciones')}>
        <List size={16} /> Secciones
      </button>
      <button className={`${styles.tabBtn} ${activeTab === 'preguntas' ? styles.activeTab : ''}`} onClick={() => setActiveTab('preguntas')}>
        <HelpCircle size={16} /> Preguntas
      </button>
    </div>
  );

  const renderTabContent = () => {
    if (loadingTab) {
      return <div className={styles.tabContentPlaceholder} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
        <p>Cargando información...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>;
    }
    
    if (error) {
      return <div className={styles.tabContentPlaceholder} style={{ color: 'red' }}>Error: {error}</div>;
    }

    switch (activeTab) {
      case 'usuarios':
        return <div className={styles.tabContentPlaceholder}><h2>Gestión de Usuarios</h2><p>Módulo en construcción...</p></div>;
      
      case 'sectores':
        return (
          <div className={styles.tabContentBlock}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h2 style={{ borderBottom: 'none', margin: 0, padding: 0 }}>Gestión de Sectores Económicos</h2>
              <button className="btn btn-primary" onClick={() => openSectorModal()}>
                <Plus size={16} /> Nuevo Sector
              </button>
            </div>
            <div className={styles.listContainer}>
              {sectores.map(s => (
                <div key={s.id} className={styles.listItem}>
                  <span>{s.nombre}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className={styles.badge} style={{ backgroundColor: s.activo ? '#dcfce7' : '#f1f5f9', color: s.activo ? '#166534' : '#64748b' }}>
                      {s.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <button className="btn" style={{ padding: '0.3rem' }} onClick={() => openSectorModal(s)} title="Editar"><Edit size={16} /></button>
                    <button className="btn" style={{ padding: '0.3rem', color: '#ef4444' }} onClick={() => deleteSector(s.id)} title="Eliminar"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            {sectores.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No hay sectores registrados.</p>}
          </div>
        );

      case 'ciudades':
        const ciudadesFiltradas = filtroDepartamento 
          ? ciudades.filter(c => c.departamento && c.departamento.id.toString() === filtroDepartamento)
          : ciudades;

        return (
          <div className={styles.tabContentBlock}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h2 style={{ borderBottom: 'none', margin: 0, padding: 0 }}>Gestión de Ciudades y Departamentos</h2>
              <button className="btn btn-primary" onClick={syncDivipola} disabled={syncing}>
                {syncing ? 'Sincronizando...' : 'Sincronizar DIVIPOLA (datos.gov.co)'}
              </button>
            </div>
            
            {ciudades.length > 0 && (
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontWeight: 500 }}>Filtrar por Departamento:</label>
                <select 
                  className={styles.formInput} 
                  style={{ width: 'auto', minWidth: '250px' }}
                  value={filtroDepartamento} 
                  onChange={(e) => setFiltroDepartamento(e.target.value)}
                >
                  <option value="">Todos los departamentos</option>
                  {departamentos.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Mostrando {ciudadesFiltradas.length} ciudades
                </span>
              </div>
            )}

            {ciudades.length > 0 ? (
              <div className={styles.listContainer} style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {ciudadesFiltradas.map(c => (
                  <div key={c.id} className={styles.listItem}>
                    <span>{c.nombre} {c.departamento && <small style={{color: '#64748b', marginLeft: '0.5rem'}}>({c.departamento.nombre})</small>}</span>
                    <span className={styles.badge}>{c.activo ? 'Activo' : 'Inactivo'}</span>
                  </div>
                ))}
                {ciudadesFiltradas.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', padding: '1rem' }}>No hay ciudades en este departamento.</p>
                )}
              </div>
            ) : (
              <div className={styles.tabContentPlaceholder}>
                <p>No hay ciudades registradas. Haz clic en "Sincronizar DIVIPOLA" para descargar los datos oficiales.</p>
              </div>
            )}
          </div>
        );

      case 'variables':
        return (
          <div className={styles.tabContentBlock}>
            <h2>Variables de Cálculo</h2>
            <div className={styles.listContainer}>
              {variables.map(v => (
                <div key={v.id} className={styles.listItem}>
                  <div>
                    <strong>{v.nombre}</strong> <br/>
                    <small>{v.descripcion}</small>
                  </div>
                  <span className={styles.badge}>{v.valor_numerico} {v.unidad_medida}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'secciones':
        return (
          <SeccionesTab 
            secciones={secciones} 
            setSecciones={setSecciones} 
            fetchDataForTab={fetchDataForTab} 
            showSnackbar={showSnackbar}
          />
        );

      case 'preguntas':
        return (
          <PreguntasTab 
            secciones={secciones} 
            setSecciones={setSecciones} 
            onEditPregunta={startEditingPregunta} 
            showSnackbar={showSnackbar}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}><Settings size={28} style={{marginRight:'10px', verticalAlign:'middle'}}/> Configuración General</h1>
        <p className={styles.subtitle}>Gestiona todos los parámetros, tablas maestras y el motor de preguntas de la plataforma.</p>
      </div>

      {renderTabs()}
      
      <div className={styles.tabContentWrapper}>
        {renderTabContent()}
      </div>

      {/* Snackbar */}
      {snackbar.visible && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: snackbar.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 500,
          animation: 'slideUp 0.3s ease-out'
        }}>
          {snackbar.message}
          <style>{`
            @keyframes slideUp {
              from { transform: translate(-50%, 100%); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Modal Sector */}
      {isSectorModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>{editingSectorId ? 'Editar Sector' : 'Nuevo Sector'}</h2>
            <form onSubmit={handleCreateOrUpdateSector} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre del Sector</label>
                <input 
                  type="text" 
                  value={sectorForm.nombre}
                  onChange={(e) => setSectorForm({...sectorForm, nombre: e.target.value})}
                  className={styles.formInput}
                  required
                />
              </div>
              <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  checked={sectorForm.activo}
                  onChange={(e) => setSectorForm({...sectorForm, activo: e.target.checked})}
                  id="activoCheckbox"
                />
                <label htmlFor="activoCheckbox" style={{ margin: 0, fontWeight: 500 }}>Sector Activo</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn" onClick={() => setIsSectorModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pregunta */}
      {editingPreguntaId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Editar Pregunta</h2>
            <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
              <label className={styles.formLabel}>Texto de la pregunta</label>
              <input 
                type="text" 
                value={editForm.texto} 
                onChange={(e) => setEditForm({...editForm, texto: e.target.value})}
                className={styles.formInput}
              />
            </div>
            <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
              <label className={styles.formLabel}>Tipo de Respuesta</label>
              <select 
                value={editForm.tipo_respuesta}
                onChange={(e) => setEditForm({...editForm, tipo_respuesta: e.target.value})}
                className={styles.formInput}
              >
                <option value="NUMERICA">Numérica</option>
                <option value="OPCION_MULTIPLE">Opción Múltiple (Radio)</option>
                <option value="SELECCION_MULTIPLE">Selección Múltiple (Checkbox)</option>
                <option value="ESCALA">Escala</option>
              </select>
            </div>
            
            {['OPCION_MULTIPLE', 'SELECCION_MULTIPLE', 'ESCALA'].includes(editForm.tipo_respuesta) && (
              <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  Opciones de Respuesta
                  <button 
                    type="button" 
                    onClick={addOpcion} 
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    <Plus size={14} style={{ marginRight: '0.4rem' }}/> Agregar Opción
                  </button>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {editForm.opciones.map((opcion, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        value={opcion.texto}
                        onChange={(e) => handleOpcionChange(index, e.target.value)}
                        className={styles.formInput}
                        placeholder={`Opción ${index + 1}`}
                      />
                      <button type="button" onClick={() => removeOpcion(index)} className="btn" style={{ padding: '0.4rem', color: 'red' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {editForm.opciones.length === 0 && <small style={{ color: 'var(--text-muted)' }}>No hay opciones agregadas.</small>}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={cancelEditing} className="btn">
                Cancelar
              </button>
              <button onClick={() => savePregunta(editingPreguntaId)} className="btn btn-primary">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
