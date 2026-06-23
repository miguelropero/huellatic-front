import React from 'react';
import { Hammer } from 'lucide-react';

export default function ReportesPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      color: 'var(--text-muted)'
    }}>
      <Hammer size={64} style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
      <h1 style={{ color: 'var(--text-dark)', marginBottom: '0.5rem' }}>Módulo en Construcción</h1>
      <p style={{ maxWidth: '500px', lineHeight: '1.5' }}>
        Estamos trabajando arduamente en el módulo de Reportes. Muy pronto podrás visualizar métricas detalladas y descargar informes globales.
      </p>
    </div>
  );
}
