import { Link } from 'react-router-dom';
import { Leaf, ArrowRight, Building, CheckCircle } from 'lucide-react';
import styles from '../styles/HomePage.module.css';

export default function HomePage() {
  return (
    <div className={styles.homeContainer}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}><Leaf size={24} /></div>
          <div className={styles.logoText}>HuellaTic</div>
        </div>
        <div className={styles.headerActions}>
          <Link to="/login" className={styles.loginLink}>Iniciar Sesión</Link>
          <Link to="/registro-empresa" className={`btn btn-primary ${styles.registerBtn}`}>
            Registrar Empresa
          </Link>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.heroSection}>
          <h1 className={styles.heroTitle}>
            Calcula, reduce y compensa el impacto ambiental de tu empresa.
          </h1>
          <p className={styles.heroDescription}>
            HuellaTic es la plataforma del Ministerio TIC diseñada para ayudar a las organizaciones a medir su huella de carbono a partir de las actividades tecnológicas, de transporte y operativas de sus colaboradores.
          </p>
          <div className={styles.heroActions}>
            <Link to="/registro-empresa" className={`btn btn-primary ${styles.ctaButton}`}>
              Comenzar ahora <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        <div className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>¿Cómo funciona HuellaTic?</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Building size={32} className={styles.featureIcon} />
              </div>
              <h3>1. Registra tu Organización</h3>
              <p>Crea el perfil de tu empresa y designa al administrador responsable de gestionar la sostenibilidad corporativa.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <CheckCircle size={32} className={styles.featureIcon} />
              </div>
              <h3>2. Recopila Datos</h3>
              <p>Genera un enlace único para que tus colaboradores completen una encuesta sencilla sobre sus prácticas tecnológicas y de transporte.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Leaf size={32} className={styles.featureIcon} />
              </div>
              <h3>3. Mide y Compensa</h3>
              <p>Accede a reportes detallados en tiempo real. Entiende dónde están las mayores emisiones y toma decisiones para compensarlas.</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} HuellaTic - Ministerio TIC. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
