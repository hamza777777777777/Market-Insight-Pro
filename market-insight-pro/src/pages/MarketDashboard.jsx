import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import styles from './MarketDashboard.module.css'

const stats = [
  { label: 'S&P 500',    value: '5,432.12', change: '+1.24%', abs: '+67.45 Today',   up: true,  icon: 'trending_up' },
  { label: 'NASDAQ',     value: '18,239.90', change: '+0.88%', abs: '+158.20 Today',  up: true,  icon: 'memory' },
  { label: 'BTC / USD',  value: '67,422.00', change: '-2.11%', abs: '-1,450.30 Today', up: false, icon: 'currency_bitcoin' },
  { label: 'BRENT CRUDE',value: '84.15',     change: '+0.45%', abs: '+0.38 Today',    up: true,  icon: 'oil_barrel' },
]

const equities = [
  { ticker:'NVDA', name:'NVIDIA Corp.',         price:'$124.58', change:'+4.25%', mcap:'3.05T', pe:'72.4x', up:true },
  { ticker:'AAPL', name:'Apple Inc.',           price:'$212.10', change:'-1.12%', mcap:'3.24T', pe:'31.2x', up:false },
  { ticker:'TSLA', name:'Tesla Motors',         price:'$182.40', change:'+2.88%', mcap:'582.4B', pe:'44.8x', up:true },
  { ticker:'AMD',  name:'Advanced Micro Devices',price:'$161.22', change:'+3.12%', mcap:'258.9B', pe:'192.4x', up:true },
  { ticker:'META', name:'Meta Platforms Inc.',  price:'$504.18', change:'-0.45%', mcap:'1.28T', pe:'28.5x',  up:false },
]

const heatmap = [
  { sector:'TECH',    pct:'+2.4%', up:true,  span:1 },
  { sector:'SEMIS',   pct:'+1.1%', up:true,  span:1 },
  { sector:'ENERGY',  pct:'-0.4%', up:false, span:1 },
  { sector:'FINANCE', pct:'+0.2%', up:true,  span:2 },
  { sector:'HLTH',    pct:'-1.8%', up:false, span:1 },
  { sector:'RETAIL',  pct:'FLAT',  up:null,  span:1 },
  { sector:'UTIL',    pct:'-0.9%', up:false, span:2 },
]

const news = [
  { time:'12 MIN AGO', title:'Fed Chair Signals Potential Rate Cut in Q4 Amid Cooling Inflation Data', tags:['MACRO','RATES'], featured:true },
  { time:'45 MIN AGO', title:'NVIDIA Expands Partnership with Sovereign Cloud Providers in EMEA Region', tags:['TECH','PARTNERSHIP'], featured:false },
  { time:'1 HOUR AGO', title:'Crude Oil Stabilizes as Middle East Tensions Fade into Macro Headwinds', tags:['COMMODITIES'], featured:false },
]

// Generate mock sparkline data
function genArea() {
  return Array.from({length:30}, (_,i) => ({
    i,
    v: 100 + Math.sin(i/4)*12 + Math.random()*8 + i*0.5,
  }))
}

const areaData = genArea()

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
