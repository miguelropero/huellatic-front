import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Building, MapPin, Users, Target, ArrowLeft, Search, Copy, Check, Download } from 'lucide-react';
import styles from '../styles/EmpresaDetallePage.module.css';

export default function EmpresaDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [searchEmpleado, setSearchEmpleado] = useState('');
  const [showAllEmpleados, setShowAllEmpleados] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchEmpresaDetalle = async () => {
      try {
        // Fetch empresa info
        const resEmpresa = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/admin/empresas/${id}`);
        if (!resEmpresa.ok) throw new Error('Empresa no encontrada');
        const dataEmpresa = await resEmpresa.json();
        setEmpresa(dataEmpresa);

        // Fetch empleados de la empresa
        const resEmpleados = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/admin/empresas/${id}/empleados`);
        if (resEmpleados.ok) {
          const dataEmpleados = await resEmpleados.json();
          setEmpleados(dataEmpleados);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmpresaDetalle();
  }, [id]);

  const empleadosFiltrados = useMemo(() => {
    let result = empleados;
    if (searchEmpleado) {
      const term = searchEmpleado.toLowerCase();
      result = result.filter(e => 
        (e.nombre && e.nombre.toLowerCase().includes(term)) ||
        (e.cedula && e.cedula.toLowerCase().includes(term)) ||
        (e.cargo && e.cargo.toLowerCase().includes(term))
      );
    }
    
    // Devolver un nuevo arreglo ordenado para no mutar el original
    return [...result].sort((a, b) => {
      if (!a.nombre) return 1;
      if (!b.nombre) return -1;
      return a.nombre.localeCompare(b.nombre);
    });
  }, [empleados, searchEmpleado]);

  if (loading) return <div>Cargando detalles de la empresa...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!empresa) return <div>No se encontró la información.</div>;

  const encuestasCompletadas = empleados.filter(e => e.fecha_respuesta).length;
  const showReportButton = empleados.length > 0 && encuestasCompletadas > 0;

  const handleDownloadPDF = async (empleadoId, cedula) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/public/empleado/${empleadoId}/reporte-pdf`);
      if (!res.ok) throw new Error('Error al generar PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Huella_${cedula}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert("Hubo un error al descargar el reporte: " + err.message);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <RouterLink to="/dashboard/organizaciones" className={`btn ${styles.backBtn}`}>
        <ArrowLeft size={16} /> Volver a Organizaciones
      </RouterLink>

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>{empresa.nombre}</h1>
          <p className={styles.subtitle}>NIT: {empresa.nit}</p>
        </div>
        {showReportButton && (
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={18} />
            Reporte General
          </button>
        )}
      </div>

      <div className={styles.grid}>
        {/* Panel Información */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}><Building size={18} /> Información General</h2>
          <ul className={styles.infoList}>
            <li className={styles.infoItem}>
              <span className={styles.infoLabel}>Sector</span>
              <span className={styles.infoValue}>{empresa.sector}</span>
            </li>
            <li className={styles.infoItem}>
              <span className={styles.infoLabel}>Ciudad Principal</span>
              <span className={styles.infoValue}>{empresa.ciudad}</span>
            </li>
            <li className={styles.infoItem}>
              <span className={styles.infoLabel}>Empleados</span>
              <span className={styles.infoValue}>{empresa.total_empleados || 0}</span>
            </li>
            <li className={styles.infoItem}>
              <span className={styles.infoLabel}>Empleados registrados</span>
              <span className={styles.infoValue}>{empleados.length}</span>
            </li>
            <li className={styles.infoItem}>
              <span className={styles.infoLabel}>Fecha de Registro</span>
              <span className={styles.infoValue}>
                {empresa.fecha_registro ? new Date(empresa.fecha_registro).toLocaleDateString() : 'N/A'}
              </span>
            </li>
            <li className={styles.infoItem} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span className={styles.infoLabel}>Link Único de Registro para Empleados</span>
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/registro/${empresa.enlace_unico}`}
                  style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: '#f8fafc' }}
                />
                <button 
                  className="btn"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/registro/${empresa.enlace_unico}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: copied ? '#10b981' : 'var(--primary)', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', transition: 'var(--transition)' }}
                  title="Copiar Link"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </li>
          </ul>
        </div>

        {/* Panel Empleados (Preview) */}
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}><Users size={18} /> Directorio de Empleados</h2>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
              <Search size={14} style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }} />
              <input 
                type="text" 
                placeholder="Buscar empleado..." 
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '150px' }}
                value={searchEmpleado}
                onChange={(e) => setSearchEmpleado(e.target.value)}
              />
            </div>
          </div>
          
          {empleados.length === 0 ? (
            <div className={styles.emptyState}>No hay empleados registrados en esta empresa todavía.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nombre</th>
                    <th style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cargo</th>
                    <th style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cédula</th>
                    <th style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Encuesta</th>
                    <th style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {empleadosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron empleados que coincidan con la búsqueda.</td>
                    </tr>
                  ) : (
                    (showAllEmpleados ? empleadosFiltrados : empleadosFiltrados.slice(0, 10)).map(emp => (
                      <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>{emp.nombre}</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem' }}>{emp.cargo}</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{emp.cedula}</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem' }}>
                          {emp.fecha_respuesta ? (
                            <span style={{ color: 'green', background: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem' }}>Completada</span>
                          ) : (
                            <span style={{ color: '#f59e0b', background: '#fef3c7', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem' }}>Pendiente</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem' }}>
                          {emp.fecha_respuesta && (
                            <button 
                              onClick={() => handleDownloadPDF(emp.id, emp.cedula)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.6rem', border: '1px solid var(--primary)', backgroundColor: 'transparent', color: 'var(--primary)', borderRadius: '0.3rem', cursor: 'pointer', fontSize: '0.8rem', transition: 'var(--transition)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary)'; e.currentTarget.style.color = 'white'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--primary)'; }}
                              title="Descargar Reporte"
                            >
                              <Download size={14} /> PDF
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {empleadosFiltrados.length > 10 && (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button 
                    className="btn" 
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: '#f1f5f9', border: '1px solid var(--border-color)', borderRadius: '0.5rem', cursor: 'pointer', transition: 'var(--transition)' }}
                    onClick={() => setShowAllEmpleados(!showAllEmpleados)}
                  >
                    {showAllEmpleados ? 'Ver menos' : `Ver todos los empleados (${empleadosFiltrados.length})`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
