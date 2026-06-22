import { useState, useEffect } from 'react';
import { FileText, Map, List, HelpCircle } from 'lucide-react';
import styles from '../styles/ConfiguracionPage.module.css'; // Reutilizamos estilos

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState('ciudades');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs(activeTab);
  }, [activeTab]);

  const fetchLogs = async (tipo) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/admin/historial?tipo=${tipo}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error('Error al cargar los logs');
      setLogs(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (tipo) => {
    switch(tipo) {
      case 'ciudades': return <Map size={16} />;
      case 'secciones': return <List size={16} />;
      case 'preguntas': return <HelpCircle size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const renderTabs = () => (
    <div className={styles.tabsContainer}>
      <button className={`${styles.tabBtn} ${activeTab === 'ciudades' ? styles.activeTab : ''}`} onClick={() => setActiveTab('ciudades')}>
        {getIcon('ciudades')} Ciudades
      </button>
      <button className={`${styles.tabBtn} ${activeTab === 'secciones' ? styles.activeTab : ''}`} onClick={() => setActiveTab('secciones')}>
        {getIcon('secciones')} Secciones
      </button>
      <button className={`${styles.tabBtn} ${activeTab === 'preguntas' ? styles.activeTab : ''}`} onClick={() => setActiveTab('preguntas')}>
        {getIcon('preguntas')} Preguntas
      </button>
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}><FileText size={28} style={{marginRight:'10px', verticalAlign:'middle'}}/> Auditoría y Logs</h1>
        <p className={styles.subtitle}>Historial de cambios realizados en la plataforma.</p>
      </div>

      {renderTabs()}

      <div className={styles.tabContentWrapper}>
        {loading ? (
          <div className={styles.tabContentPlaceholder} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
            <p>Cargando historial...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div className={styles.tabContentPlaceholder} style={{ color: 'red' }}>Error: {error}</div>
        ) : (
          <div className={styles.tabContentBlock} style={{ overflowX: 'auto' }}>
            {logs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No se encontraron registros de este tipo.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.8rem' }}>Fecha y Hora</th>
                    <th style={{ padding: '0.8rem' }}>Usuario</th>
                    <th style={{ padding: '0.8rem' }}>Acción / Campo</th>
                    <th style={{ padding: '0.8rem' }}>Valor Anterior</th>
                    <th style={{ padding: '0.8rem' }}>Valor Nuevo</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.8rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.fecha_cambio).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.8rem', fontWeight: 500, color: 'var(--primary)' }}>
                        {log.usuario_email || 'Sistema'}
                      </td>
                      <td style={{ padding: '0.8rem' }}>
                        <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                          {log.campo_modificado}
                        </span>
                      </td>
                      <td style={{ padding: '0.8rem', color: '#64748b' }}>
                        {log.valor_anterior ? log.valor_anterior : '-'}
                      </td>
                      <td style={{ padding: '0.8rem', color: '#166534', fontWeight: 500 }}>
                        {log.valor_nuevo ? log.valor_nuevo : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
