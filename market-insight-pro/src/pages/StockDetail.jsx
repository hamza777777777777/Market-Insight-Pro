import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import styles from './StockDetail.module.css'

// Mock candlestick-ish data
function genStock() {
  let price = 212
  return Array.from({ length: 60 }, (_, i) => {
    const open  = price
    const close = price + (Math.random() - 0.48) * 6
    const high  = Math.max(open, close) + Math.random() * 3
    const low   = Math.min(open, close) - Math.random() * 3
    const vol   = Math.floor(20 + Math.random() * 80) * 1e6
    price = close
    return {
      day: i + 1,
      open: +open.toFixed(2),
      close: +close.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      vol,
      dma20: price - 3 + Math.sin(i / 8) * 4,
      dma50: price - 6 + Math.cos(i / 14) * 5,
    }
  })
}

const data  = genStock()
const last  = data[data.length - 1]
const prev  = data[data.length - 2]
const pctCh = (((last.close - prev.close) / prev.close) * 100).toFixed(2)
const isUp  = last.close >= prev.close
const high52 = Math.max(...data.map(d => d.high)).toFixed(2)
const low52  = Math.min(...data.map(d => d.low)).toFixed(2)

const patterns = [
  { date: '2024-03-04', pattern:'Bull Engulfing', signal:'BUY',  price:'$208.40' },
  { date: '2024-03-18', pattern:'Shooting Star',  signal:'SELL', price:'$219.20' },
  { date: '2024-04-02', pattern:'Morning Star',   signal:'BUY',  price:'$205.60' },
]

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className={styles.tooltip}>
      <div className={styles.ttRow}><span>Open</span><span>${d.open}</span></div>
      <div className={styles.ttRow}><span>Close</span>
        <span style={{ color: d.close >= d.open ? 'var(--color-tertiary)' : 'var(--color-error)' }}>
          ${d.close}
        </span>
      </div>
      <div className={styles.ttRow}><span>High</span><span>${d.high}</span></div>
      <div className={styles.ttRow}><span>Low</span><span>${d.low}</span></div>
    </div>
  )
}

const TABS = ['Chart & Signals', 'Technicals', 'Signal Log']

export default function StockDetail() {
  const [tab, setTab] = useState(0)
  const [ticker, setTicker] = useState('AAPL')

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <span className={styles.eyebrow}>Stock Detail</span>
            <div className={styles.titleRow}>
              <h1 className={styles.stockTicker}>{ticker}</h1>
              <div className={styles.priceRow}>
                <span className={styles.price}>${last.close.toFixed(2)}</span>
                <span
                  className={styles.change}
                  style={{ color: isUp ? 'var(--color-tertiary)' : 'var(--color-error)' }}
                >
                  {isUp ? '+' : ''}{pctCh}%
                </span>
                <span
                  className={styles.trendPill}
                  style={{
                    background: isUp ? 'rgba(78,222,163,0.12)' : 'rgba(255,180,171,0.1)',
                    color: isUp ? 'var(--color-tertiary)' : 'var(--color-error)',
                    borderColor: isUp ? 'rgba(78,222,163,0.3)' : 'rgba(255,180,171,0.25)',
                  }}
                >
                  {isUp ? 'Bullish' : 'Bearish'}
                </span>
              </div>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.searchWrap}>
              <input
                className={styles.tickerInput}
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                placeholder="Symbol"
                aria-label="Stock symbol"
              />
            </div>
            <div className={styles.meta}>
              <span className={styles.metaLabel}>Period</span>
              <span className={styles.metaVal}>3 months · DMA 20/50</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map((t, i) => (
            <button
              key={t}
              className={`${styles.tab} ${tab === i ? styles.tabActive : ''}`}
              onClick={() => setTab(i)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab: Chart */}
        {tab === 0 && (
          <div className={styles.chartSection}>
            <div className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={420}>
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3"
                    stroke="rgba(68,71,77,0.2)" vertical={false} />
                  <XAxis dataKey="day" hide />
                  <YAxis
                    orientation="right"
                    domain={['auto', 'auto']}
                    tick={{ fill: 'rgba(197,198,205,0.4)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `$${v.toFixed(0)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="dma20"
                    stroke="#b9c7e4" strokeWidth={1.5} dot={false}
                    name="DMA 20" />
                  <Line type="monotone" dataKey="dma50"
                    stroke="#f59e0b" strokeWidth={1.5} dot={false}
                    name="DMA 50" strokeDasharray="4 2" />
                  <Bar dataKey="close"
                    fill="rgba(185,199,228,0.12)"
                    stroke="rgba(185,199,228,0.25)"
                    strokeWidth={0.5}
                    radius={[1,1,0,0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Volume */}
            <div className={styles.volCard}>
              <p className={styles.volLabel}>Volume</p>
              <ResponsiveContainer width="100%" height={80}>
                <Bar data={data} dataKey="vol" fill="rgba(185,199,228,0.2)" />
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab: Technicals */}
        {tab === 1 && (
          <div className={styles.techGrid}>
            <div className={styles.techCard}>
              <h3 className={styles.techTitle}>Price Statistics</h3>
              {[
                ['52-Week High', `$${high52}`],
                ['52-Week Low',  `$${low52}`],
                ['Prev Close',   `$${prev.close.toFixed(2)}`],
                ['Day High',     `$${last.high.toFixed(2)}`],
                ['Day Low',      `$${last.low.toFixed(2)}`],
                ['Avg Volume',   `${(data.reduce((a,d)=>a+d.vol,0)/data.length/1e6).toFixed(1)}M`],
              ].map(([k, v]) => (
                <div key={k} className={styles.statRow}>
                  <span className={styles.statKey}>{k}</span>
                  <span className={styles.statVal}>{v}</span>
                </div>
              ))}
            </div>
            <div className={styles.techCard}>
              <h3 className={styles.techTitle}>DMA Analysis</h3>
              {[
                ['Fast DMA (20)',  `$${(last.dma20).toFixed(2)}`],
                ['Slow DMA (50)',  `$${(last.dma50).toFixed(2)}`],
                ['DMA Gap',        `${(((last.dma20-last.dma50)/last.dma50)*100).toFixed(2)}%`],
                ['Current Trend',  isUp ? 'Bullish' : 'Bearish'],
              ].map(([k, v]) => (
                <div key={k} className={styles.statRow}>
                  <span className={styles.statKey}>{k}</span>
                  <span className={styles.statVal}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Signal Log */}
        {tab === 2 && (
          <div className={styles.logWrap}>
            <table className={styles.logTable}>
              <thead>
                <tr className={styles.logHead}>
                  <th>Date</th>
                  <th>Pattern</th>
                  <th>Signal</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {patterns.map((p, i) => (
                  <tr key={i} className={styles.logRow}>
                    <td className={styles.logMuted}>{p.date}</td>
                    <td className={styles.logBold}>{p.pattern}</td>
                    <td>
                      <span
                        className={styles.signalBadge}
                        style={{
                          background: p.signal==='BUY' ? 'rgba(78,222,163,0.12)' : 'rgba(255,180,171,0.1)',
                          color: p.signal==='BUY' ? 'var(--color-tertiary)' : 'var(--color-error)',
                          borderColor: p.signal==='BUY' ? 'rgba(78,222,163,0.25)' : 'rgba(255,180,171,0.2)',
                        }}
                      >
                        {p.signal}
                      </span>
                    </td>
                    <td className={`${styles.logBold} font-mono`}>{p.price}</td>
                    <td className={styles.logMuted}>
                      {p.signal === 'BUY' ? 'Enter Long' : 'Exit / Short'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Footer />
      </main>
    </div>
  )
}
