import { NavLink } from 'react-router-dom'
import styles from './Navbar.module.css'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/signals', label: 'Signals' },
]

export default function Navbar() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <span className={styles.logo}>
            <span className={styles.logoAccent}>Market</span> Insight Pro
          </span>
          <nav className={styles.nav}>
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={styles.right}>
          <div className={styles.livePill}>
            <span className={styles.liveDot} />
            <span>LIVE</span>
          </div>
          <div className={styles.avatar} aria-label="User profile">
            <span className={`material-symbols-outlined ${styles.avatarIcon}`}>account_circle</span>
          </div>
        </div>
      </div>
    </header>
  )
}
