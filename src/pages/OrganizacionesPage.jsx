import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical, Edit, BarChart, Users, Download, Plus, Search, X } from 'lucide-react';
import styles from '../styles/OrganizacionesPage.module.css';

export default function OrganizacionesPage() {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const dropdownRef = useRef(null);

  // Datos paramétricos
  const [sectores, setSectores] = useState([]);
  const [ciudades, setCiudades] = useState([]);

  // Modal de Creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', nit: '', sector: '', ciudad: '', total_empleados: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchEmpresas = async () => {
      try {
        setLoading(true);
        const url = activeSearch 
          ? `http://127.0.0.1:8000/api/v1/admin/empresas?q=${encodeURIComponent(activeSearch)}`
          : 'http://127.0.0.1:8000/api/v1/admin/empresas';
          
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al obtener organizaciones');
        const data = await response.json();
        setEmpresas(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
  };

  const fetchParametricas = async () => {
    try {
      const [resSectores, resCiudades] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/public/sectores'),
        fetch('http://127.0.0.1:8000/api/v1/public/ciudades')
      ]);
      if (resSectores.ok) setSectores(await resSectores.json());
      if (resCiudades.ok) setCiudades(await resCiudades.json());
    } catch (err) {
      console.error('Error cargando paramétricas:', err);
    }
  };

  useEffect(() => {
    fetchEmpresas();
    fetchParametricas();
  }, [activeSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    
    // Validación NIT formato simple (ej: 900123456-1)
    if (!formData.nit.trim()) {
      errors.nit = 'El NIT es obligatorio';
    } else if (!/^[0-9]+-[0-9]$/.test(formData.nit.trim())) {
      errors.nit = 'Formato inválido. Ejemplo: 900123456-1';
    }

    if (!formData.sector.trim()) errors.sector = 'El sector es obligatorio';
    if (!formData.ciudad.trim()) errors.ciudad = 'La ciudad es obligatoria';
    
    if (!formData.total_empleados) {
      errors.total_empleados = 'Campo obligatorio';
    } else if (isNaN(formData.total_empleados) || parseInt(formData.total_empleados) < 1) {
      errors.total_empleados = 'Debe ser un número mayor a 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const response = await fetch('http://127.0.0.1:8000/api/v1/admin/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          nit: formData.nit.trim(),
          sector: formData.sector.trim(),
          ciudad: formData.ciudad.trim(),
          total_empleados: parseInt(formData.total_empleados)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear la empresa');
      }

      // Éxito: cerrar modal, limpiar form y recargar tabla
      setIsModalOpen(false);
      setFormData({ nombre: '', nit: '', sector: '', ciudad: '', total_empleados: '' });
      fetchEmpresas();
      alert('Empresa creada exitosamente');
    } catch (err) {
      setFormErrors({ ...formErrors, global: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) setFormErrors({ ...formErrors, [name]: '' });
  };

  // Cerrar el dropdown cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (id, e) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleAction = (action, id) => {
    console.log(`Acción ${action} ejecutada para la empresa ${id}`);
    setOpenDropdown(null);
    // Aquí implementaremos la lógica real de navegación o ejecución después
    alert(`Ejecutando acción: ${action} en empresa #${id}`);
  };

  if (loading) return <div>Cargando organizaciones...</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Organizaciones</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <form className={styles.searchBox} onSubmit={handleSearchSubmit}>
            <input 
              type="text" 
              placeholder="Buscar nombre, NIT, ciudad..." 
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className={styles.searchBtn} title="Buscar">
              <Search size={18} className={styles.searchIcon} />
            </button>
          </form>
          <button 
            className={`btn btn-primary ${styles.addBtn}`}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} />
            Nueva Empresa
          </button>
        </div>
      </div>

      {error && <div className={styles.errorMsg}>{error}</div>}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>NIT</th>
              <th>Sector</th>
              <th>Ciudad</th>
              <th>Empleados</th>
              <th className={styles.actionsCell}></th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((empresa) => (
              <tr key={empresa.id}>
                <td className={styles.empresaName}>
                  <Link to={`/dashboard/organizaciones/${empresa.id}`} className={styles.empresaLink}>
                    {empresa.nombre}
                  </Link>
                </td>
                <td>{empresa.nit}</td>
                <td>{empresa.sector}</td>
                <td>{empresa.ciudad}</td>
                <td>{empresa.total_empleados}</td>
                <td className={styles.actionsCell}>
                  <button 
                    className={styles.actionToggleBtn}
                    onClick={(e) => toggleDropdown(empresa.id, e)}
                  >
                    <MoreVertical size={20} />
                  </button>

                  {/* Dropdown Menu */}
                  {openDropdown === empresa.id && (
                    <div className={styles.dropdownMenu} ref={dropdownRef}>
                      <button className={styles.dropdownItem} onClick={() => handleAction('editar', empresa.id)}>
                        <Edit size={16} /> Editar Detalles
                      </button>
                      <button className={styles.dropdownItem} onClick={() => handleAction('dashboard', empresa.id)}>
                        <BarChart size={16} /> Ver Dashboard
                      </button>
                      <button className={styles.dropdownItem} onClick={() => handleAction('empleados', empresa.id)}>
                        <Users size={16} /> Gestionar Empleados
                      </button>
                      <div className={styles.dropdownDivider}></div>
                      <button className={styles.dropdownItem} onClick={() => handleAction('reporte', empresa.id)}>
                        <Download size={16} /> Descargar Reporte
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {empresas.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay empresas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Creación */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Crear Nueva Empresa</h2>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit}>
              <div className={styles.modalBody}>
                {formErrors.global && <div className={styles.errorMsg}>{formErrors.global}</div>}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nombre de la Empresa *</label>
                  <input 
                    type="text" 
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className={`${styles.formInput} ${formErrors.nombre ? styles.error : ''}`}
                    placeholder="Ej. Tech Corp S.A.S."
                  />
                  {formErrors.nombre && <span className={styles.errorText}>{formErrors.nombre}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>NIT *</label>
                  <input 
                    type="text" 
                    name="nit"
                    value={formData.nit}
                    onChange={handleChange}
                    className={`${styles.formInput} ${formErrors.nit ? styles.error : ''}`}
                    placeholder="Ej. 900123456-1"
                  />
                  {formErrors.nit && <span className={styles.errorText}>{formErrors.nit}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Sector *</label>
                  <select 
                    name="sector"
                    value={formData.sector}
                    onChange={handleChange}
                    className={`${styles.formInput} ${formErrors.sector ? styles.error : ''}`}
                  >
                    <option value="">Selecciona un sector</option>
                    {sectores.map(s => (
                      <option key={s.id} value={s.nombre}>{s.nombre}</option>
                    ))}
                  </select>
                  {formErrors.sector && <span className={styles.errorText}>{formErrors.sector}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Ciudad *</label>
                    <select 
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleChange}
                      className={`${styles.formInput} ${formErrors.ciudad ? styles.error : ''}`}
                    >
                      <option value="">Selecciona una ciudad</option>
                      {ciudades.map(c => (
                        <option key={c.id} value={c.nombre}>{c.nombre}</option>
                      ))}
                    </select>
                    {formErrors.ciudad && <span className={styles.errorText}>{formErrors.ciudad}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Nº Empleados *</label>
                    <input 
                      type="number" 
                      name="total_empleados"
                      value={formData.total_empleados}
                      onChange={handleChange}
                      className={`${styles.formInput} ${formErrors.total_empleados ? styles.error : ''}`}
                      placeholder="Ej. 50"
                      min="1"
                    />
                    {formErrors.total_empleados && <span className={styles.errorText}>{formErrors.total_empleados}</span>}
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  className={styles.cancelBtn} 
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creando...' : 'Crear Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
