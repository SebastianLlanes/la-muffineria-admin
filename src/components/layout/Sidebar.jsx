import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import styles from './Sidebar.module.css'

const links = [
  { to: '/',             label: 'Dashboard',    icon: '📊' },
  { to: '/ingredientes', label: 'Ingredientes', icon: '🧂' },
  { to: '/recetas',      label: 'Recetas',      icon: '📋' },
  { to: '/partidas',     label: 'Partidas',     icon: '🏭' },
  { to: '/calculador',   label: 'Calculador',   icon: '🧮' },
  { to: '/pedidos',      label: 'Pedidos',      icon: '📦' },
  { to: '/reportes',     label: 'Reportes',     icon: '📈' },
  { to: '/config', label: 'Configuración', icon: '⚙️' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>🧁</span>
        <span className={styles.brandName}>Muffinería</span>
      </div>

      <nav className={styles.nav}>
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <span className={styles.userName}>{user?.displayName}</span>
        <button className={styles.logout} onClick={logout}>Salir</button>
      </div>
    </aside>
  )
}