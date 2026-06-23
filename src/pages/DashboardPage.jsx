import { fetchWithAuth } from '../utils/api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Building2, Users, Leaf } from 'lucide-react';
import styles from '../styles/DashboardPage.module.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión básica
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');
    
    if (!token || rol !== 'ROOT') {
      navigate('/login');
      return;
    }

    // Fetch dashboard data
    const fetchDashboard = async () => {
      try {
        const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/admin/dashboard`);
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  if (loading) return <div>Cargando métricas...</div>;
  if (!data) return <div>Error al cargar los datos.</div>;

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className={styles.title}>Visión General de la Plataforma</h1>
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon}`}><Building2 size={24} /></div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiValue}>{data.kpis.total_empresas}</span>
            <span className={styles.kpiLabel}>Empresas Registradas</span>
          </div>
        </div>
        
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.purple}`}><Users size={24} /></div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiValue}>{data.kpis.total_empleados}</span>
            <span className={styles.kpiLabel}>Empleados Totales</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.green}`}><Leaf size={24} /></div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiValue}>{data.kpis.co2_evitado_estimado} kg</span>
            <span className={styles.kpiLabel}>CO2 Estimado Evaluado</span>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Crecimiento de Empresas (2026)</h3>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.empresas_timeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey="empresas" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Top 10 Empresas por Empleados</h3>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={[...data.empleados_por_empresa].filter(e => e.value > 0).sort((a, b) => b.value - a.value).slice(0, 10)} 
                margin={{ bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  angle={-45} 
                  textAnchor="end" 
                  interval={0} 
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="var(--secondary)" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Actividad Reciente (Empleados)</h3>
        <div className={styles.activityList}>
          {data.actividad_reciente.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No hay actividad reciente registrada.</p>
          ) : (
            data.actividad_reciente.map((act) => (
              <div key={act.id} className={styles.activityItem}>
                <div>
                  <span className={styles.activityUser}>{act.usuario}</span>
                  <span className={styles.activityCompany}>{act.empresa}</span>
                </div>
                <span className={styles.activityAction}>{act.accion}</span>
                <span className={styles.activityTime}>{act.fecha}</span>
              </div>
            ))
          )}
        </div>
      </div>

    </>
  );
}
