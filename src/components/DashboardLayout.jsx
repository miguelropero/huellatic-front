import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, BarChart3, Settings, FileText, LogOut, Leaf } from 'lucide-react';
import styles from '../styles/DashboardLayout.module.css';

export default function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    navigate('/login');
  };

  return (
    <div className={styles.layoutContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}><Leaf size={20} /></div>
          <div className={styles.logoText}>HuellaTic</div>
        </div>

        <nav className={styles.navMenu}>
          <NavLink 
            to="/dashboard" 
            end
            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
          >
            <LayoutDashboard size={20} />
            Home
          </NavLink>
          
          <NavLink 
            to="/dashboard/organizaciones" 
            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
          >
            <Building2 size={20} />
            Organizaciones
          </NavLink>
          
          <NavLink 
            to="/dashboard/reportes" 
            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
          >
            <BarChart3 size={20} />
            Reportes
          </NavLink>
          
          <NavLink 
            to="/dashboard/configuracion" 
            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
          >
            <Settings size={20} />
            Configuración
          </NavLink>

          <NavLink 
            to="/dashboard/logs" 
            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
          >
            <FileText size={20} />
            Logs
          </NavLink>
        </nav>

        <div className={styles.footer}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={20} />
            Salir
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}
