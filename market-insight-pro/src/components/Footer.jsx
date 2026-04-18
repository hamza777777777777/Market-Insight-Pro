import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

const footerLinks = [
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Privacy Policy',     to: '/privacy' },
  { label: 'Risk Disclosure',    to: '/risk-disclosure' },
  { label: 'Contact Support',    to: '/contact' },
]

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandName}>Market Insight Pro</span>
          <p className={styles.legal}>
            © {new Date().getFullYear()} Market Insight Pro. For educational &amp; informational purposes only.
            Not financial advice. All signals are algorithmically generated and carry inherent risk.
          </p>
        </div>
        <nav className={styles.links}>
          {footerLinks.map(l => (
            <Link key={l.to} to={l.to} className={styles.link}>{l.label}</Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
