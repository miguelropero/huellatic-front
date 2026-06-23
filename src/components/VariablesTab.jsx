import { fetchWithAuth } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import styles from '../styles/ConfiguracionPage.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function VariablesTab({ showSnackbar }) {
  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingVar, setEditingVar] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    valor_numerico: '',
    unidad_medida: '',
    descripcion: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVariables();
  }, []);

  const fetchVariables = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetchWithAuth(`${API_URL}/api/v1/admin/variables`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Error al obtener variables');
      const data = await res.json();
      setVariables(data);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (variable = null) => {
    if (variable) {
      setEditingVar(variable);
      setFormData({
        nombre: variable.nombre,
        valor_numerico: variable.valor_numerico,
        unidad_medida: variable.unidad_medida,
        descripcion: variable.descripcion || ''
      });
    } else {
      setEditingVar(null);
      setFormData({
        nombre: '',
        valor_numerico: '',
        unidad_medida: '',
        descripcion: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVar(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const url = editingVar 
        ? `${API_URL}/api/v1/admin/variables/${editingVar.id}`
        : `${API_URL}/api/v1/admin/variables`;
        
      const method = editingVar ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        valor_numerico: parseFloat(formData.valor_numerico)
      };

      const res = await fetchWithAuth(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Error al guardar variable');
      }

      await fetchVariables();
      handleCloseModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta variable? Podría afectar los cálculos matemáticos.')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetchWithAuth(`${API_URL}/api/v1/admin/variables/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error('Error al eliminar variable');
      await fetchVariables();
      showSnackbar('Variable eliminada correctamente', 'success');
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  };

  if (loading) return <div>Cargando variables...</div>;

  return (
    <div className={styles.tabContentBlock}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <h2 style={{ borderBottom: 'none', margin: 0, padding: 0 }}>Gestión de Variables de Cálculo</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Nueva Variable
        </button>
      </div>

      {error && !showModal && <div className="alert alert-error">{error}</div>}

      <div className={styles.listContainer}>
        {variables.map(v => (
          <div key={v.id} className={styles.listItem}>
            <div>
              <strong style={{ fontSize: '1rem', color: 'var(--text-color)' }}>{v.nombre}</strong> <br/>
              {v.descripcion && <small style={{ color: 'var(--text-muted)' }}>{v.descripcion}</small>}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className={styles.badge} style={{ backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: '600', fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
                {v.valor_numerico} <span style={{ fontWeight: '400', fontSize: '0.8rem', color: '#64748b' }}>{v.unidad_medida}</span>
              </span>
              
              <button className="btn" style={{ padding: '0.3rem' }} onClick={() => handleOpenModal(v)} title="Editar">
                <Edit size={16} />
              </button>
              <button className="btn" style={{ padding: '0.3rem', color: '#ef4444' }} onClick={() => handleDelete(v.id)} title="Eliminar">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {variables.length === 0 && (
          <p style={{ color: 'var(--text-muted)', padding: '1rem' }}>No hay variables registradas.</p>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>{editingVar ? 'Editar Variable' : 'Nueva Variable'}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {error && showModal && <div className="alert alert-error">{error}</div>}
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre de la Variable</label>
                <input 
                  type="text" 
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className={styles.formInput}
                  required 
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.formLabel}>Valor Numérico</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    value={formData.valor_numerico} 
                    onChange={e => setFormData({...formData, valor_numerico: e.target.value})}
                    className={styles.formInput}
                    required 
                  />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.formLabel}>Unidad de Medida</label>
                  <input 
                    type="text" 
                    value={formData.unidad_medida} 
                    onChange={e => setFormData({...formData, unidad_medida: e.target.value})}
                    className={styles.formInput}
                    placeholder="ej. COP, Litros"
                    required 
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Descripción (Opcional)</label>
                <input 
                  type="text" 
                  value={formData.descripcion} 
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  className={styles.formInput}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
