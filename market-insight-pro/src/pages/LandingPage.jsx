import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import styles from './LandingPage.module.css'

const features = [
  {
    name: 'S&P 500',
    tag: 'US Markets',
    path: 'M0,45 Q30,40 60,50 T120,30 T180,45 T240,15 T300,5',
    up: true,
  },
  {
    name: 'NSE / BSE',
    tag: 'Indian Markets',
    path: 'M0,50 Q40,30 80,45 T160,20 T240,35 T300,10',
    up: true,
  },
  {
    name: 'Crypto & Forex',
    tag: 'Global Assets',
    path: 'M0,20 Q50,40 100,30 T200,55 T300,45',
    up: false,
  },
]

const patterns = [
  { ticker: 'RELIANCE.NS', name: 'Reliance Industries', signal: 'BUY',  pattern: 'Bull Engulfing',  up: true  },
  { ticker: 'TCS.NS',      name: 'Tata Consultancy',   signal: 'SELL', pattern: 'Shooting Star',  up: false },
  { ticker: 'AAPL',        name: 'Apple Inc.',          signal: 'BUY',  pattern: 'Morning Star',   up: true  },
]

export default function LandingPage() {
  return (
    <div className={styles.page}>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>Algorithmic Signal Engine</span>
            <h1 className={styles.heroTitle}>
              Smart Trading<br />
              <span className={styles.heroAccent}>Signal Detection</span>
            </h1>
            <p className={styles.heroDesc}>
              Detect high-probability BUY &amp; SELL signals using a three-layer confirmation system —
              candlestick patterns, DMA crossovers, and a price-cross safety filter. Works on any
              global stock, index, or crypto ticker.
            </p>
            <div className={styles.heroBtns}>
              <Link to="/signals" className={styles.btnPrimary}>Analyze Signals →</Link>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroCard}>
              <div className={styles.heroCardInner}>
                <div className={styles.miniChart}>
                  <svg viewBox="0 0 300 100" className={styles.miniSvg}>
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%"   stopColor="#b9c7e4" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#4edea3" stopOpacity="0.9" />
                      </linearGradient>
                    </defs>
                    <path d="M0,80 Q40,60 80,70 T160,35 T240,50 T300,10"
                      fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" />
                    <path d="M0,80 Q40,60 80,70 T160,35 T240,50 T300,10 L300,100 L0,100 Z"
                      fill="rgba(78,222,163,0.04)" />
                    {/* BUY marker */}
                    <polygon points="160,26 154,36 166,36" fill="#4edea3" opacity="0.9" />
                    {/* SELL marker */}
                    <polygon points="240,58 234,48 246,48" fill="#ffb4ab" opacity="0.9" />
                  </svg>
                </div>
                <div className={styles.miniStats}>
                  <div className={styles.miniStat}>
                    <span className={styles.miniLabel}>Signal Accuracy</span>
                    <span className={styles.miniValue}>3-Layer</span>
                  </div>
                  <div className={styles.miniStat}>
                    <span className={styles.miniLabel}>Status</span>
                    <span className={styles.miniValueGreen}>● LIVE</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.heroBgBlob} />
          </div>
        </div>
      </section>

      {/* ── Market Coverage ───────────────────────────── */}
      <section className={styles.indices}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <div>
              <h2 className={styles.sectionTitle}>Market Coverage</h2>
              <div className={styles.liveRow}>
                <span className={styles.liveDot} />
                <span className={styles.liveLabel}>Supports Any Yahoo Finance Ticker</span>
              </div>
            </div>
            <Link to="/signals" className={styles.sectionLink}>
              Start Analyzing
              <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>north_east</span>
            </Link>
          </div>
          <div className={styles.indicesGrid}>
            {features.map(f => (
              <div key={f.name} className={styles.indexCard}>
                <div className={styles.indexTop}>
                  <div>
                    <h3 className={styles.indexName}>{f.name}</h3>
                    <div className={styles.indexValue}>{f.tag}</div>
                  </div>
                  <span className={styles.indexChange} style={{ color: f.up ? 'var(--color-tertiary)' : 'var(--color-error)' }}>
                    {f.up ? 'SUPPORTED' : 'SUPPORTED'}
                  </span>
                </div>
                <div className={styles.sparkWrap}>
                  <svg viewBox="0 0 300 60" className={styles.sparkSvg}>
                    <path d={f.path} fill="none"
                      stroke={f.up ? '#4edea3' : '#ffb4ab'}
                      strokeWidth="2" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────── */}
      <section className={styles.analytics}>
        <div className={styles.container}>
          <div className={styles.bentoGrid}>
            <div className={styles.bentoMain}>
              <span className={styles.eyebrowSm}>Three-Layer Confirmation</span>
              <h2 className={styles.bentoTitle}>How Signals Are Generated</h2>
              <p className={styles.bentoDesc}>
                Every signal passes through three sequential filters before being shown.
                This eliminates the majority of false entries that single-indicator systems produce.
              </p>
              <div className={styles.bentoStats}>
                {[
                  { val: 'Step 1', label: 'Candlestick Pattern Detected' },
                  { val: 'Step 2', label: 'DMA Crossover Confirmed' },
                  { val: 'Step 3', label: 'Price Crosses Safety Filter' },
                ].map(s => (
                  <div key={s.label} className={styles.bentoStat}>
                    <div className={styles.bentoStatVal}>{s.val}</div>
                    <div className={styles.bentoStatLabel}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.bentoCols}>
              <div className={styles.bentoCard}>
                <span className={`material-symbols-outlined ${styles.bentoIcon}`}>candlestick_chart</span>
                <h3 className={styles.bentoCardTitle}>8 Candlestick Patterns</h3>
                <p className={styles.bentoCardDesc}>
                  Detects Engulfing, Hammer, Inverted Hammer, Hanging Man,
                  Shooting Star, Morning Star, and Evening Star automatically.
                </p>
              </div>
              <div className={styles.bentoCardPrimary}>
                <span className={`material-symbols-outlined ${styles.bentoIconDark}`}>tune</span>
                <h3 className={styles.bentoCardTitleDark}>Fully Configurable</h3>
                <p className={styles.bentoCardDescDark}>
                  Adjust Fast DMA, Slow DMA, crossover window, and safety window live —
                  the chart and signals update instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sample Signal Table ───────────────────────── */}
      <section className={styles.watchlistSec}>
        <div className={styles.container}>
          <div className={styles.tableWrap}>
            <div className={styles.tableHead}>
              <h2 className={styles.tableTitle}>Example Signals</h2>
              <div className={styles.tableSort}>
                <span className={styles.tableSortLabel}>3-layer confirmed</span>
                <span className="material-symbols-outlined">verified</span>
              </div>
            </div>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.thead}>
                    <th>Ticker</th>
                    <th>Signal</th>
                    <th>Pattern Trigger</th>
                    <th>Confirmation</th>
                  </tr>
                </thead>
                <tbody>
                  {patterns.map(row => (
                    <tr key={row.ticker} className={styles.trow}>
                      <td className={styles.tdAsset}>
                        <div className={styles.assetBar}
                          style={{ background: row.up ? 'var(--color-tertiary)' : 'var(--color-error)' }} />
                        <div>
                          <div className={styles.ticker}>{row.ticker}</div>
                          <div className={styles.company}>{row.name}</div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.15rem 0.6rem',
                          borderRadius: '99px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          background: row.up ? 'rgba(78,222,163,0.1)' : 'rgba(255,180,171,0.1)',
                          color: row.up ? '#4edea3' : '#ffb4ab',
                          border: `1px solid ${row.up ? 'rgba(78,222,163,0.3)' : 'rgba(255,180,171,0.3)'}`,
                        }}>
                          {row.up ? '▲' : '▼'} {row.signal}
                        </span>
                      </td>
                      <td className={`${styles.tdMono} font-mono`}>{row.pattern}</td>
                      <td style={{ color: 'var(--color-tertiary)', fontSize: '0.8rem' }}>
                        ✓ DMA Crossover &amp; Price Filter
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
