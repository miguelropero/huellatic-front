import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api';
import { useLocation } from 'react-router-dom';
import { Download, FileText, Droplets, Zap, Building, Briefcase, Users, CheckCircle, Leaf, Clock, Coins, Copy, Check, ChevronDown, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import styles from '../styles/DashboardPage.module.css';

export default function ReportesPage() {
  const [empresas, setEmpresas] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMetricas, setLoadingMetricas] = useState(false);
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [empresaSearch, setEmpresaSearch] = useState('');
  
  const location = useLocation();
  const preselectEmpresaId = location.state?.preselectEmpresaId;

  const empresasFiltradas = empresas.filter(emp => 
    emp.nombre.toLowerCase().includes(empresaSearch.toLowerCase()) || 
    emp.nit.includes(empresaSearch)
  );

  useEffect(() => {
    fetchEmpresas();
  }, []);

  useEffect(() => {
    if (selectedEmpresa) {
      fetchMetricas(selectedEmpresa);
    } else {
      setMetricas(null);
    }
  }, [selectedEmpresa]);

  const fetchEmpresas = async () => {
    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/admin/empresas`);
      if (!response.ok) throw new Error('Error al cargar empresas');
      const data = await response.json();
      setEmpresas(data);
      if (preselectEmpresaId) {
        setSelectedEmpresa(preselectEmpresaId.toString());
        const preEmp = data.find(e => e.id.toString() === preselectEmpresaId.toString());
        if (preEmp) setEmpresaSearch(`${preEmp.nombre} (NIT: ${preEmp.nit})`);
      } else if (data.length === 1) {
        setSelectedEmpresa(data[0].id.toString());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetricas = async (empresaId) => {
    setLoadingMetricas(true);
    setError('');
    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/admin/empresas/${empresaId}/metricas`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al cargar métricas o no hay datos suficientes');
      }
      const data = await response.json();
      setMetricas(data);
    } catch (err) {
      setError(err.message);
      setMetricas(null);
    } finally {
      setLoadingMetricas(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!selectedEmpresa) return;
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/admin/empresas/${selectedEmpresa}/reporte-general`);
      if (!res.ok) throw new Error('Error al generar el reporte');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_HuellaTic_${selectedEmpresa}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error al descargar: " + err.message);
    }
  };

  if (loading) return <div>Cargando módulo de reportes...</div>;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className={styles.title} style={{ margin: 0 }}>Reportes</h1>
        
        {empresas.length > 1 && (
          <div style={{ position: 'relative', width: '350px' }}>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'white',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <Search size={18} style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }} />
              <input 
                type="text"
                placeholder="Buscar empresa por nombre o NIT..."
                value={empresaSearch}
                onChange={(e) => {
                  setEmpresaSearch(e.target.value);
                  setShowDropdown(true);
                  if (e.target.value === '') {
                    setSelectedEmpresa('');
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '0.95rem',
                  color: 'var(--text-dark)',
                  backgroundColor: 'transparent'
                }}
              />
              <ChevronDown size={18} style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }} />
            </div>

            {showDropdown && (
              <ul style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: 'white',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                marginTop: '4px',
                zIndex: 50,
                listStyle: 'none',
                padding: 0,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}>
                {empresasFiltradas.length > 0 ? empresasFiltradas.map(emp => (
                  <li 
                    key={emp.id} 
                    onClick={() => {
                      setSelectedEmpresa(emp.id);
                      setEmpresaSearch(`${emp.nombre} (NIT: ${emp.nit})`);
                      setShowDropdown(false);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      color: 'var(--text-dark)',
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: selectedEmpresa === emp.id ? '#f8fafc' : 'white',
                      fontWeight: selectedEmpresa === emp.id ? '500' : 'normal'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedEmpresa !== emp.id) e.target.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedEmpresa !== emp.id) e.target.style.backgroundColor = 'white';
                    }}
                  >
                    {emp.nombre} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>(NIT: {emp.nit})</span>
                  </li>
                )) : (
                  <li style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>No se encontraron empresas</li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', marginTop: '2rem' }}>
          <img src="/src/assets/empty_data.png" alt="No hay datos" style={{ width: '250px', marginBottom: '1.5rem', opacity: 0.9, mixBlendMode: 'multiply' }} />
          <div className={styles.errorMsg} style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px' }}>
            {error}
          </div>
          <p style={{ marginTop: '1.5rem', color: 'var(--text-dark)', fontWeight: 500 }}>
            Comparte el siguiente enlace con tus empleados para que completen la encuesta:
          </p>
          {selectedEmpresa && (() => {
            const link = `${window.location.origin}/registro/${empresas.find(e => e.id.toString() === selectedEmpresa)?.enlace_unico}`;
            return (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '1rem', border: '1px dashed #cbd5e1' }}>
                <a 
                  href={link} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}
                >
                  {link}
                </a>
                <button 
                  onClick={() => handleCopy(link)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: isCopied ? '#10b981' : 'var(--text-muted)' }}
                  title="Copiar enlace"
                >
                  {isCopied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {!selectedEmpresa && !error && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <FileText size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>Selecciona una organización</h3>
          <p>Elige una empresa del listado superior para visualizar sus métricas corporativas.</p>
        </div>
      )}

      {loadingMetricas && <div style={{ textAlign: 'center', padding: '2rem' }}>Calculando indicadores de impacto...</div>}

      {metricas && !loadingMetricas && (
        <>
          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
            <button onClick={handleDownload} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Download size={18} />
              Descargar Reporte PDF
            </button>
          </div>

          {/* Estadísticas Empleados */}
          <div className={styles.chartCard} style={{ marginBottom: '2rem' }}>
            <h3 className={styles.chartTitle}>Participación de Empleados</h3>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 500 }}>Progreso de Encuestas</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{metricas.estadisticas_empleados.porcentaje_respuesta}%</span>
                </div>
                <div style={{ width: '100%', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${metricas.estadisticas_empleados.porcentaje_respuesta}%`, height: '100%', backgroundColor: 'var(--primary)' }}></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <Users size={24} color="#64748b" style={{ marginBottom: '0.2rem' }} />
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{metricas.estadisticas_empleados.registrados}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registrados</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <CheckCircle size={24} color="#10b981" style={{ marginBottom: '0.2rem' }} />
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{metricas.estadisticas_empleados.respondieron}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Respondieron</div>
                </div>
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-dark)' }}>Impacto Global (Promedios y Totales)</h2>
          
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}><Leaf size={24} /></div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{metricas.impacto_global.co2_toneladas} <span style={{fontSize:'1rem'}}>Ton</span></span>
                <span className={styles.kpiLabel}>CO2 Evitado Total</span>
              </div>
            </div>
            
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}><Zap size={24} /></div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{metricas.impacto_global.galones_combustible} <span style={{fontSize:'1rem'}}>Gal</span></span>
                <span className={styles.kpiLabel}>Combustible Ahorrado</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ backgroundColor: '#fdf2f8', color: '#ec4899' }}><Clock size={24} /></div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{metricas.impacto_global.horas_recuperadas} <span style={{fontSize:'1rem'}}>Hrs</span></span>
                <span className={styles.kpiLabel}>Horas Recuperadas (Prom)</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}><Coins size={24} /></div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue} style={{ fontSize: '1.4rem' }}>$ {metricas.impacto_global.dinero_ahorrado.toLocaleString('es-CO')}</span>
                <span className={styles.kpiLabel}>Dinero Ahorrado (Prom)</span>
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: '1.5rem', marginTop: '3rem', marginBottom: '1.5rem', color: 'var(--text-dark)' }}>ROI Corporativo Anualizado</h2>

          <div className={styles.chartsGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Droplets size={20} color="#3b82f6"/> Ahorro de Recursos (Físicos)</h3>
              <div className={styles.chartWrapper} style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Agua (M3)', valor: metricas.roi_corporativo.agua_m3 },
                    { name: 'Energía (Kw/H)', valor: metricas.roi_corporativo.energia_kwh },
                    { name: 'Arriendo (M2)', valor: metricas.roi_corporativo.arriendo_m2 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="valor" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building size={20} color="#10b981"/> Ahorro Financiero (Mobiliario)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '300px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                <Briefcase size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Depreciación evitada estimada</span>
                <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#0f172a' }}>$ {metricas.roi_corporativo.amoblamiento_cop.toLocaleString('es-CO')}</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>COP Anuales</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
