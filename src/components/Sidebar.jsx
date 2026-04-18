import { NavLink } from 'react-router-dom'
import styles from './Sidebar.module.css'

const items = [
  { to: '/dashboard', icon: 'dashboard',               label: 'Market Overview' },
  { to: '/stock',     icon: 'analytics',               label: 'Deep Research' },
  { to: '/portfolio', icon: 'account_balance_wallet',  label: 'Position Audit' },
  { to: '/dashboard', icon: 'show_chart',              label: 'Yield Curves' },
]

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Terminal Access</span>
      </div>

      {items.map((item, i) => (
        <NavLink
          key={i}
          to={item.to}
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.itemActive : ''}`
          }
        >
          <span className={`material-symbols-outlined ${styles.icon}`}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}

      <div className={styles.statusBox}>
        <p className={styles.statusLabel}>Market Status</p>
        <div className={styles.statusRow}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>NYSE OPEN</span>
        </div>
      </div>
    </aside>
  )
}
