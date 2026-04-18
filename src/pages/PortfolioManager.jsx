import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import styles from './PortfolioManager.module.css'

const INITIAL_PORTFOLIO = [
  { symbol:'AAPL',  name:'Apple Inc.',     shares:10,  avgCost:150.00, price:212.20, change:+1.85 },
  { symbol:'TSLA',  name:'Tesla Motors',   shares:5,   avgCost:220.00, price:182.40, change:-1.12 },
  { symbol:'NVDA',  name:'NVIDIA Corp.',   shares:8,   avgCost:520.00, price:894.52, change:+4.25 },
  { symbol:'MSFT',  name:'Microsoft Corp.',shares:12,  avgCost:300.00, price:414.10, change:+0.65 },
  { symbol:'META',  name:'Meta Platforms', shares:6,   avgCost:340.00, price:504.18, change:-0.45 },
]

const ALLOCATION_COLORS = ['#b9c7e4','#4edea3','#8b9dc8','#9fe8c0','#c5cfd8']

const fmt = (n, prefix='$', decimals=2) =>
  `${n < 0 ? '-' : ''}${prefix}${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits:decimals, maximumFractionDigits:decimals })}`

export default function PortfolioManager() {
  const [portfolio, setPortfolio] = useState(INITIAL_PORTFOLIO)
  const [showAdd, setShowAdd]     = useState(false)
  const [newSym,  setNewSym]      = useState('')
  const [newQty,  setNewQty]      = useState('')
  const [newCost, setNewCost]     = useState('')

  const rows = portfolio.map(p => ({
    ...p,
    mktVal: +(p.price * p.shares).toFixed(2),
    pnl:    +((p.price - p.avgCost) * p.shares).toFixed(2),
    pnlPct: +(((p.price - p.avgCost) / p.avgCost) * 100).toFixed(2),
  }))

  const totalVal  = rows.reduce((a, r) => a + r.mktVal, 0)
  const totalCost = rows.reduce((a, r) => a + r.avgCost * r.shares, 0)
  const totalPnl  = totalVal - totalCost
  const totalPct  = ((totalPnl / totalCost) * 100).toFixed(2)

  const pieData = rows.map(r => ({ name: r.symbol, value: r.mktVal }))
  const barData = rows.map(r => ({ name: r.symbol, pnl: r.pnlPct }))

  function addPosition() {
    if (!newSym || !newQty || !newCost) return
    const price = +(+newCost + (Math.random() - 0.3) * 10).toFixed(2)
    setPortfolio(p => [...p, {
      symbol: newSym.toUpperCase(),
      name: newSym.toUpperCase(),
      shares: +newQty,
      avgCost: +newCost,
      price,
      change: +(Math.random() * 4 - 1.5).toFixed(2),
    }])
    setShowAdd(false); setNewSym(''); setNewQty(''); setNewCost('')
  }

  function removePosition(sym) {
    setPortfolio(p => p.filter(x => x.symbol !== sym))
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div className={styles.tooltip}>
        <span className={styles.ttLabel}>{payload[0].payload.name}</span>
        <span className={styles.ttVal}>{fmt(payload[0].value)}</span>
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <span className={styles.eyebrow}>Position Audit</span>
            <h1 className={styles.title}>Your Portfolio</h1>
            <p className={styles.subtitle}>
              Track positions, monitor P&amp;L, and manage exposure across your holdings.
            </p>
          </div>
          <button className={styles.addBtn} onClick={() => setShowAdd(s => !s)}>
            <span className="material-symbols-outlined">add</span>
            Add Position
          </button>
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className={styles.addForm}>
            <input className={styles.formInput} placeholder="Symbol"
              value={newSym} onChange={e => setNewSym(e.target.value)} />
            <input className={styles.formInput} placeholder="Shares" type="number"
              value={newQty} onChange={e => setNewQty(e.target.value)} />
            <input className={styles.formInput} placeholder="Avg Cost ($)" type="number"
              value={newCost} onChange={e => setNewCost(e.target.value)} />
            <button className={styles.formSubmit} onClick={addPosition}>Confirm</button>
            <button className={styles.formCancel} onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        )}

        {/* KPIs */}
        <div className={styles.kpiRow}>
          {[
            { label:'Total Value',      val:fmt(totalVal),             sub:'Market Value',      up:null },
            { label:'Cost Basis',       val:fmt(totalCost),            sub:'Invested Capital',  up:null },
            { label:'Unrealized P&L',   val:fmt(totalPnl, '$'),        sub:`${totalPct}%`,      up:totalPnl>=0 },
            { label:'Positions',        val:portfolio.length.toString(),sub:'Open Positions',   up:null },
          ].map(k => (
            <div key={k.label} className={styles.kpiCard}>
              <p className={styles.kpiLabel}>{k.label}</p>
              <p className={styles.kpiValue}
                style={k.up !== null ? { color: k.up ? 'var(--color-tertiary)' : 'var(--color-error)' } : {}}>
                {k.val}
              </p>
              <p className={styles.kpiSub}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className={styles.contentGrid}>
          {/* Holdings Table */}
          <div className={styles.tableCol}>
            <h2 className={styles.colTitle}>Holdings</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.thead}>
                    <th>Symbol</th>
                    <th>Shares</th>
                    <th>Avg Cost</th>
                    <th>Price</th>
                    <th>Mkt Value</th>
                    <th>P&amp;L</th>
                    <th>P&amp;L %</th>
                    <th>Day</th>
                    <th style={{ textAlign:'center' }}>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.symbol} className={styles.trow}>
                      <td className={styles.tdSymbol}>
                        <div className={styles.symBar}
                          style={{ background: r.pnl >= 0 ? 'var(--color-tertiary)' : 'var(--color-error)' }} />
                        <div>
                          <div className={styles.sym}>{r.symbol}</div>
                          <div className={styles.symName}>{r.name}</div>
                        </div>
                      </td>
                      <td className={styles.tdNum}>{r.shares}</td>
                      <td className={`${styles.tdNum} font-mono`}>{fmt(r.avgCost)}</td>
                      <td className={`${styles.tdNum} font-mono`}>{fmt(r.price)}</td>
                      <td className={`${styles.tdNum} font-mono`}>{fmt(r.mktVal)}</td>
                      <td className={`${styles.tdNum} font-mono`}
                        style={{ color: r.pnl >= 0 ? 'var(--color-tertiary)' : 'var(--color-error)' }}>
                        {fmt(r.pnl, '$')}
                      </td>
                      <td style={{ color: r.pnlPct >= 0 ? 'var(--color-tertiary)' : 'var(--color-error)',
                                   fontWeight:700, fontSize:'0.8125rem' }}>
                        {r.pnlPct >= 0 ? '+' : ''}{r.pnlPct}%
                      </td>
                      <td style={{ color: r.change >= 0 ? 'var(--color-tertiary)' : 'var(--color-error)',
                                   fontSize:'0.75rem', fontWeight:600 }}>
                        {r.change >= 0 ? '+' : ''}{r.change}%
                      </td>
                      <td style={{ textAlign:'center' }}>
                        <button className={styles.removeBtn}
                          onClick={() => removePosition(r.symbol)}
                          aria-label={`Remove ${r.symbol}`}
                        >
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts */}
          <div className={styles.chartCol}>
            <h2 className={styles.colTitle}>Allocation</h2>
            <div className={styles.pieWrap}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90}
                    paddingAngle={3} dataKey="value"
                    stroke="rgba(4,19,41,0.4)" strokeWidth={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={ALLOCATION_COLORS[i % ALLOCATION_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.pieLegend}>
                {pieData.map((d, i) => (
                  <div key={d.name} className={styles.legendRow}>
                    <div className={styles.legendDot}
                      style={{ background: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] }} />
                    <span className={styles.legendName}>{d.name}</span>
                    <span className={styles.legendPct}>
                      {((d.value / totalVal) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <h2 className={styles.colTitle} style={{ marginTop:'1.5rem' }}>P&amp;L by Position</h2>
            <div className={styles.barWrap}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} margin={{ top:6, right:4, left:-24, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3"
                    stroke="rgba(68,71,77,0.22)" vertical={false} />
                  <XAxis dataKey="name"
                    tick={{ fill:'rgba(197,198,205,0.55)', fontSize:10 }}
                    axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill:'rgba(197,198,205,0.4)', fontSize:10 }}
                    tickFormatter={v => `${v}%`}
                    axisLine={false} tickLine={false} />
                  <Bar dataKey="pnl" radius={[2,2,0,0]}>
                    {barData.map((d, i) => (
                      <Cell key={i}
                        fill={d.pnl >= 0 ? 'rgba(78,222,163,0.65)' : 'rgba(255,180,171,0.6)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  )
}
