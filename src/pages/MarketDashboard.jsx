import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import styles from './MarketDashboard.module.css'

const defaultStats = [
  { label: 'S&P 500',    value: '...', change: '...', abs: '...',   up: true,  icon: 'trending_up' },
  { label: 'NASDAQ',     value: '...', change: '...', abs: '...',  up: true,  icon: 'memory' },
  { label: 'BTC / USD',  value: '...', change: '...', abs: '...', up: false, icon: 'currency_bitcoin' },
  { label: 'BRENT CRUDE',value: '...',     change: '...', abs: '...',    up: true,  icon: 'oil_barrel' },
]

const defaultEquities = [
  { ticker:'NVDA', name:'NVIDIA Corp.',         price:'...', change:'...', mcap:'...', pe:'...', up:true },
  { ticker:'AAPL', name:'Apple Inc.',           price:'...', change:'...', mcap:'...', pe:'...', up:false },
  { ticker:'TSLA', name:'Tesla Motors',         price:'...', change:'...', mcap:'...', pe:'...', up:true },
  { ticker:'AMD',  name:'Advanced Micro Devices',price:'...', change:'...', mcap:'...', pe:'...', up:true },
  { ticker:'META', name:'Meta Platforms Inc.',  price:'...', change:'...', mcap:'...', pe:'...',  up:false },
]

const defaultHeatmap = [
  { sector:'TECH',    pct:'...', up:true,  span:1 },
  { sector:'SEMIS',   pct:'...', up:true,  span:1 },
  { sector:'ENERGY',  pct:'...', up:false, span:1 },
  { sector:'FINANCE', pct:'...', up:true,  span:2 },
  { sector:'HLTH',    pct:'...', up:false, span:1 },
  { sector:'RETAIL',  pct:'...',  up:null,  span:1 },
  { sector:'UTIL',    pct:'...', up:false, span:2 },
]

const defaultNews = [
  { time:'LIVE', title:'Loading news...', tags:[], featured:true },
]

// Removed mock sparkline data, now fetched from Python Backend

function heatmapBg(up) {
  if (up === true)  return 'rgba(78,222,163,0.6)'
  if (up === false) return 'rgba(255,180,171,0.55)'
  return 'var(--color-surface-container-highest)'
}

function heatmapColor(up) {
  if (up === true)  return '#003824'
  if (up === false) return '#690005'
  return 'var(--color-on-surface-variant)'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{label}</span>
      <span className={styles.tooltipVal}>{payload[0].value.toFixed(2)}</span>
    </div>
  )
}

export default function MarketDashboard() {
  const [tab, setTab] = useState('Gainers')
  const [areaData, setAreaData] = useState([])
  const [dashboardData, setDashboardData] = useState({
    stats: defaultStats,
    equities: defaultEquities,
    heatmap: defaultHeatmap,
    news: defaultNews
  })

  useEffect(() => {
    // Fetch real dashboard data from Python API
    fetch('http://localhost:5000/api/market-dashboard')
      .then(res => res.json())
      .then(resData => {
         setDashboardData({
           stats: resData.stats || defaultStats,
           equities: resData.equities || defaultEquities,
           heatmap: resData.heatmap || defaultHeatmap,
           news: resData.news || defaultNews
         })
      })
      .catch(err => console.error("Error fetching market dashboard data:", err))

    // Fetch mini chart data
    fetch('http://localhost:5000/api/stock/SPY?period=1mo')
      .then(res => res.json())
      .then(resData => {
         if (resData.data) {
           const mapData = resData.data.slice(-30).map((d, i) => ({ i, v: d.close || 0 }))
           setAreaData(mapData)
         }
      })
      .catch(err => console.error("Error fetching market dash chart:", err))
  }, [])

  const { stats, equities, heatmap, news } = dashboardData;

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        {/* KPI Row */}
        <div className={styles.kpiGrid}>
          {stats.map(s => (
            <div key={s.label} className={styles.kpiCard}>
              <div className={styles.kpiIcon}>
                <span className="material-symbols-outlined">{s.icon}</span>
              </div>
              <p className={styles.kpiLabel}>{s.label}</p>
              <h3 className={styles.kpiValue}>{s.value}</h3>
              <div className={styles.kpiDelta}>
                <span
                  className={styles.kpiChange}
                  style={{ color: s.up ? 'var(--color-tertiary)' : 'var(--color-error)' }}
                >
                  {s.change}
                </span>
                <span className={styles.kpiDot}
                  style={{ background: s.up ? 'var(--color-tertiary)' : 'var(--color-error)' }} />
                <span className={styles.kpiAbs}>{s.abs}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Heatmap/News */}
        <div className={styles.contentGrid}>
          {/* Equities Table */}
          <div className={styles.tableCol}>
            <div className={styles.tableHeader}>
              <h2 className={styles.tableTitle}>Trending Equities</h2>
              <div className={styles.tabRow}>
                {['Gainers','Losers','Volume'].map(t => (
                  <button
                    key={t}
                    className={`${styles.tabBtn} ${tab === t ? styles.tabBtnActive : ''}`}
                    onClick={() => setTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.thead}>
                    <th>Ticker</th>
                    <th>Last Price</th>
                    <th>Chg %</th>
                    <th>Market Cap</th>
                    <th style={{ textAlign:'right' }}>P/E Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {equities.map(eq => (
                    <tr key={eq.ticker} className={styles.trow}>
                      <td>
                        <div className={styles.tickerCell}>
                          <div className={styles.tickerBar}
                            style={{ background: eq.up ? 'var(--color-tertiary)' : 'var(--color-error)' }} />
                          <div>
                            <div className={styles.tickerName}>{eq.ticker}</div>
                            <div className={styles.tickerSub}>{eq.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className={`${styles.tdVal} font-headline`}>{eq.price}</td>
                      <td>
                        <span style={{ color: eq.up ? 'var(--color-tertiary)' : 'var(--color-error)', fontWeight:700, fontSize:'0.875rem' }}>
                          {eq.change}
                        </span>
                      </td>
                      <td className={styles.tdMuted}>{eq.mcap}</td>
                      <td className={`${styles.tdVal} font-headline`} style={{ textAlign:'right' }}>{eq.pe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mini chart below table */}
            <div className={styles.chartWrap}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>S&P 500 — 30 Day Trend</h3>
                <span className={styles.chartLive}>LIVE</span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={areaData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#b9c7e4" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#b9c7e4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3"
                    stroke="rgba(68,71,77,0.25)" vertical={false} />
                  <XAxis dataKey="i" hide />
                  <YAxis domain={['auto','auto']}
                    tick={{ fill:'rgba(197,198,205,0.4)', fontSize:10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone" dataKey="v"
                    stroke="#b9c7e4" strokeWidth={1.5}
                    fill="url(#areaGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right column: Heatmap + News */}
          <div className={styles.rightCol}>
            {/* Sector Heatmap */}
            <div>
              <h2 className={styles.colTitle}>Sector Heatmap</h2>
              <div className={styles.heatmap}>
                {heatmap.map((h, i) => (
                  <div
                    key={i}
                    className={styles.heatCell}
                    style={{
                      gridColumn: `span ${h.span}`,
                      background: heatmapBg(h.up),
                    }}
                  >
                    <span className={styles.heatSector} style={{ color: heatmapColor(h.up) }}>
                      {h.sector}
                    </span>
                    <span className={styles.heatPct} style={{ color: heatmapColor(h.up) }}>
                      {h.pct}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* News Feed */}
            <div>
              <div className={styles.newsHeader}>
                <h2 className={styles.colTitle}>Market Intelligence</h2>
                <span className={styles.newsLive}>LIVE</span>
              </div>
              <div className={styles.newsList}>
                {news.map((n, i) => (
                  <article
                    key={i}
                    className={`${styles.newsItem} ${n.featured ? styles.newsItemFeatured : ''}`}
                  >
                    <time className={styles.newsTime}>{n.time}</time>
                    <h4 className={styles.newsTitle}>{n.title}</h4>
                    <div className={styles.newsTags}>
                      {n.tags.map(tag => (
                        <span key={tag} className={styles.newsTag}>{tag}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  )
}
