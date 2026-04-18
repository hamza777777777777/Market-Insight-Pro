import { useState, useEffect, useCallback } from 'react'
import Plotly from 'plotly.js-dist-min'
import _createPlotlyComponent from 'react-plotly.js/factory'
import styles from './SignalPage.module.css'

const createPlotlyComponent = _createPlotlyComponent.default ?? _createPlotlyComponent
const Plot = createPlotlyComponent(Plotly)

// ─── Indicator calculation (mirrors data_processor.py) ─────────────────────

function rollingMean(arr, window) {
  return arr.map((_, i) => {
    if (i < window - 1) return null
    const slice = arr.slice(i - window + 1, i + 1)
    return slice.reduce((a, b) => a + b, 0) / window
  })
}

function calcIndicators(ohlcv, dmaFast, dmaSlow, safetyWindow, crossoverWindow) {
  const n = ohlcv.length
  const close  = ohlcv.map(d => d.close)
  const open_  = ohlcv.map(d => d.open)
  const high   = ohlcv.map(d => d.high)
  const low    = ohlcv.map(d => d.low)

  const fast = rollingMean(close, dmaFast)
  const slow = rollingMean(close, dmaSlow)

  // ─ Pattern detection ─
  const bullPat  = new Array(n).fill(false)
  const bearPat  = new Array(n).fill(false)
  const patName  = new Array(n).fill('')

  for (let i = 2; i < n; i++) {
    const inDown = fast[i] !== null && slow[i] !== null && fast[i] < slow[i]
    const inUp   = fast[i] !== null && slow[i] !== null && fast[i] > slow[i]
    const pO = open_[i - 1], pC = close[i - 1]
    const cO = open_[i],     cC = close[i]
    const body = Math.abs(cC - cO)
    const minBody = cC * 0.001

    // Bullish Engulfing
    if (inDown && pO > pC && cC > cO &&
        cO <= pC && cC >= pO && (cC - cO) > (pO - pC) && body > minBody) {
      bullPat[i] = true; patName[i] = 'Bull Engulfing'
    }
    // Bearish Engulfing
    if (!bullPat[i] && inUp && pC > pO && cO > cC &&
        cO >= pC && cC <= pO && (cO - cC) > (pC - pO) && body > minBody) {
      bearPat[i] = true; patName[i] = 'Bear Engulfing'
    }

    const bodyBot   = Math.min(cO, cC)
    const bodyTop   = Math.max(cO, cC)
    const lowerShadow = bodyBot - low[i]
    const upperShadow = high[i] - bodyTop

    // Hammer
    if (!bullPat[i] && inDown && body > minBody && lowerShadow >= 2 * body && upperShadow <= 0.5 * body) {
      bullPat[i] = true; patName[i] = 'Hammer'
    }
    // Inv Hammer
    if (!bullPat[i] && inDown && body > minBody && upperShadow >= 2 * body && lowerShadow <= 0.5 * body) {
      bullPat[i] = true; patName[i] = 'Inv Hammer'
    }
    // Hanging Man
    if (!bearPat[i] && inUp && body > minBody && lowerShadow >= 2 * body && upperShadow <= 0.5 * body) {
      bearPat[i] = true; patName[i] = 'Hanging Man'
    }
    // Shooting Star
    if (!bearPat[i] && inUp && body > minBody && upperShadow >= 2 * body && lowerShadow <= 0.5 * body) {
      bearPat[i] = true; patName[i] = 'Shooting Star'
    }

    // Morning Star (3-candle)
    if (i >= 2) {
      const d1Red  = open_[i - 2] > close[i - 2]
      const d1Body = Math.abs(open_[i - 2] - close[i - 2])
      const d2Body = Math.abs(open_[i - 1] - close[i - 1])
      const d3Body = cC - cO
      if (!bullPat[i] && inDown && d1Red && d2Body < 0.5 * d1Body && cC > cO &&
          d3Body > 0.5 * d1Body && cC > (open_[i - 2] + close[i - 2]) / 2) {
        bullPat[i] = true; patName[i] = 'Morning Star'
      }
      // Evening Star
      const d1Green = close[i - 2] > open_[i - 2]
      const d1BodyEs = Math.abs(close[i - 2] - open_[i - 2])
      const d2BodyEs = Math.abs(open_[i - 1] - close[i - 1])
      const d3BodyEs = cO - cC
      if (!bearPat[i] && inUp && d1Green && d2BodyEs < 0.5 * d1BodyEs && cO > cC &&
          d3BodyEs > 0.5 * d1BodyEs && cC < (open_[i - 2] + close[i - 2]) / 2) {
        bearPat[i] = true; patName[i] = 'Evening Star'
      }
    }
  }

  // ─ 3-layer signal confirmation ─
  const finalBuy  = new Array(n).fill(false)
  const finalSell = new Array(n).fill(false)

  for (let i = 0; i < n; i++) {
    // BUY: bullish pattern while fast < slow
    if (bullPat[i] && fast[i] !== null && slow[i] !== null && fast[i] < slow[i]) {
      let crossoverBar = -1
      for (let j = i; j < Math.min(i + crossoverWindow + 1, n); j++) {
        if (j === 0) continue
        const fj = fast[j], sj = slow[j], fjp = fast[j - 1], sjp = slow[j - 1]
        if (fj !== null && sj !== null && fjp !== null && sjp !== null) {
          if (fj > sj && fjp <= sjp) { crossoverBar = j; break }
        }
      }
      if (crossoverBar !== -1) {
        for (let k = crossoverBar; k < Math.min(crossoverBar + safetyWindow + 1, n); k++) {
          if (fast[k] !== null && close[k] > fast[k]) { finalBuy[k] = true; break }
        }
      }
    }
    // SELL: bearish pattern while fast > slow
    if (bearPat[i] && fast[i] !== null && slow[i] !== null && fast[i] > slow[i]) {
      let crossoverBar = -1
      for (let j = i; j < Math.min(i + crossoverWindow + 1, n); j++) {
        if (j === 0) continue
        const fj = fast[j], sj = slow[j], fjp = fast[j - 1], sjp = slow[j - 1]
        if (fj !== null && sj !== null && fjp !== null && sjp !== null) {
          if (fj < sj && fjp >= sjp) { crossoverBar = j; break }
        }
      }
      if (crossoverBar !== -1) {
        for (let k = crossoverBar; k < Math.min(crossoverBar + safetyWindow + 1, n); k++) {
          if (fast[k] !== null && close[k] < fast[k]) { finalSell[k] = true; break }
        }
      }
    }
  }

  return { fast, slow, finalBuy, finalSell, patName, bullPat, bearPat }
}

// ─── Currency detection ────────────────────────────────────────────────────

const CURRENCY_SYMBOLS = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥',
  CNY: '¥', HKD: 'HK$', CAD: 'CA$', AUD: 'A$', SGD: 'S$',
}

function getCurrencySymbol(currencyCode) {
  return CURRENCY_SYMBOLS[currencyCode?.toUpperCase()] ?? (currencyCode ? `${currencyCode} ` : '$')
}

// ─── Yahoo Finance data fetch ──────────────────────────────────────────────

async function fetchOHLCV(symbol, period) {
  const rangeMap = {
    '1mo': { range: '1mo', interval: '1d' },
    '3mo': { range: '3mo', interval: '1d' },
    '6mo': { range: '6mo', interval: '1d' },
    '1y':  { range: '1y',  interval: '1d' },
    '2y':  { range: '2y',  interval: '1wk' },
  }
  const { range, interval } = rangeMap[period] || rangeMap['6mo']
  const url = `/yf/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch data for "${symbol}" (${res.status})`)
  const json = await res.json()
  const result = json?.chart?.result?.[0]
  if (!result) throw new Error(`No data found for symbol "${symbol}". Check the ticker.`)
  const currency = result.meta?.currency ?? 'USD'
  const timestamps = result.timestamp
  const q = result.indicators.quote[0]
  const data = []
  for (let i = 0; i < timestamps.length; i++) {
    if (q.open[i] == null) continue
    data.push({
      date:  new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
      open:  q.open[i],
      high:  q.high[i],
      low:   q.low[i],
      close: q.close[i],
      volume:q.volume[i],
    })
  }
  return { data, currency }
}

// ─── Control panel component ───────────────────────────────────────────────

function ControlPanel({ params, setParams, onAnalyze, loading }) {
  const periods = ['1mo', '3mo', '6mo', '1y', '2y']
  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>
        <span className="material-symbols-outlined">tune</span>
        Signal Parameters
      </div>
      <div className={styles.controls}>
        {/* Symbol */}
        <div className={styles.controlGroup}>
          <label className={styles.label}>Symbol / Ticker</label>
          <input
            id="symbol-input"
            className={styles.input}
            value={params.symbol}
            onChange={e => setParams(p => ({ ...p, symbol: e.target.value.toUpperCase() }))}
            placeholder="e.g. AAPL"
            onKeyDown={e => e.key === 'Enter' && onAnalyze()}
          />
        </div>

        {/* Period */}
        <div className={styles.controlGroup}>
          <label className={styles.label}>Time Period</label>
          <div className={styles.pillRow}>
            {periods.map(p => (
              <button
                key={p}
                id={`period-${p}`}
                className={`${styles.pill} ${params.period === p ? styles.pillActive : ''}`}
                onClick={() => setParams(prev => ({ ...prev, period: p }))}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Fast DMA */}
        <div className={styles.controlGroup}>
          <label className={styles.label}>
            Fast DMA <span className={styles.labelVal}>{params.dmaFast}</span>
          </label>
          <input
            id="fast-dma-slider"
            className={styles.slider}
            type="range"
            min={5} max={50} step={1}
            value={params.dmaFast}
            onChange={e => setParams(p => ({ ...p, dmaFast: +e.target.value }))}
          />
          <div className={styles.sliderTicks}>
            <span>5</span><span>50</span>
          </div>
        </div>

        {/* Slow DMA */}
        <div className={styles.controlGroup}>
          <label className={styles.label}>
            Slow DMA <span className={styles.labelVal}>{params.dmaSlow}</span>
          </label>
          <input
            id="slow-dma-slider"
            className={styles.slider}
            type="range"
            min={10} max={200} step={1}
            value={params.dmaSlow}
            onChange={e => setParams(p => ({ ...p, dmaSlow: +e.target.value }))}
          />
          <div className={styles.sliderTicks}>
            <span>10</span><span>200</span>
          </div>
        </div>

        {/* Rolling (Crossover) Window */}
        <div className={styles.controlGroup}>
          <label className={styles.label}>
            Crossover Window <span className={styles.labelVal}>{params.crossoverWindow}</span>
          </label>
          <input
            id="crossover-slider"
            className={styles.slider}
            type="range"
            min={1} max={20} step={1}
            value={params.crossoverWindow}
            onChange={e => setParams(p => ({ ...p, crossoverWindow: +e.target.value }))}
          />
          <div className={styles.sliderTicks}>
            <span>1</span><span>20</span>
          </div>
        </div>

        {/* Safety Window */}
        <div className={styles.controlGroup}>
          <label className={styles.label}>
            Safety Window <span className={styles.labelVal}>{params.safetyWindow}</span>
          </label>
          <input
            id="safety-slider"
            className={styles.slider}
            type="range"
            min={1} max={30} step={1}
            value={params.safetyWindow}
            onChange={e => setParams(p => ({ ...p, safetyWindow: +e.target.value }))}
          />
          <div className={styles.sliderTicks}>
            <span>1</span><span>30</span>
          </div>
        </div>

        <button
          id="analyze-btn"
          className={`${styles.analyzeBtn} ${loading ? styles.analyzeBtnLoading : ''}`}
          onClick={onAnalyze}
          disabled={loading}
        >
          {loading
            ? <><span className={styles.spinner} /> Analyzing…</>
            : <><span className="material-symbols-outlined">bolt</span> Analyze</>
          }
        </button>
      </div>
    </div>
  )
}

// ─── Signal stats bar ──────────────────────────────────────────────────────

function SignalStats({ ohlcv, finalBuy, finalSell, currencySymbol }) {
  const buys  = finalBuy.filter(Boolean).length
  const sells = finalSell.filter(Boolean).length
  const last  = ohlcv[ohlcv.length - 1]
  const prev  = ohlcv[ohlcv.length - 2]
  const chg   = last && prev ? ((last.close - prev.close) / prev.close * 100).toFixed(2) : null
  const up    = chg !== null && parseFloat(chg) >= 0
  const sym   = currencySymbol
  return (
    <div className={styles.statsBar}>
      {last && (
        <>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Last Close</span>
            <span className={styles.statVal}>{sym}{last.close.toFixed(2)}</span>
          </div>
          {chg !== null && (
            <div className={styles.statItem}>
              <span className={styles.statLabel}>1-Day Change</span>
              <span className={styles.statVal} style={{ color: up ? 'var(--color-tertiary)' : 'var(--color-error)' }}>
                {up ? '+' : ''}{chg}%
              </span>
            </div>
          )}
        </>
      )}
      <div className={styles.statItem}>
        <span className={styles.statLabel}>Buy Signals</span>
        <span className={styles.statVal} style={{ color: 'var(--color-tertiary)' }}>▲ {buys}</span>
      </div>
      <div className={styles.statItem}>
        <span className={styles.statLabel}>Sell Signals</span>
        <span className={styles.statVal} style={{ color: 'var(--color-error)' }}>▼ {sells}</span>
      </div>
      <div className={styles.statItem}>
        <span className={styles.statLabel}>Data Points</span>
        <span className={styles.statVal}>{ohlcv.length}</span>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

const DEFAULT_PARAMS = {
  symbol:          'AAPL',
  period:          '6mo',
  dmaFast:         20,
  dmaSlow:         50,
  crossoverWindow: 5,
  safetyWindow:    10,
}

export default function SignalPage() {
  const [params,         setParams]         = useState(DEFAULT_PARAMS)
  const [ohlcv,          setOhlcv]          = useState([])
  const [signals,        setSignals]        = useState(null)
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState(null)
  const [title,          setTitle]          = useState('')
  const [currencySymbol, setCurrencySymbol] = useState('$')

  const analyze = useCallback(async () => {
    if (!params.symbol.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { data, currency } = await fetchOHLCV(params.symbol.trim(), params.period)
      if (data.length < params.dmaSlow + 5) {
        throw new Error(`Not enough data for Slow DMA=${params.dmaSlow}. Increase period or reduce DMA.`)
      }
      const sym = getCurrencySymbol(currency)
      const { fast, slow, finalBuy, finalSell, patName } =
        calcIndicators(data, params.dmaFast, params.dmaSlow, params.safetyWindow, params.crossoverWindow)
      setOhlcv(data)
      setSignals({ fast, slow, finalBuy, finalSell, patName })
      setCurrencySymbol(sym)
      setTitle(`${params.symbol.toUpperCase()} — ${params.period.toUpperCase()}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [params])

  // auto-load on mount
  useEffect(() => { analyze() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // ─ Build Plotly traces ─
  const plotData = []
  const plotLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor:  'rgba(1,14,36,0.6)',
    font: { family: 'Inter, sans-serif', color: '#c5c6cd', size: 11 },
    margin: { t: 48, r: 24, b: 48, l: 64 },
    legend: {
      orientation: 'h',
      x: 0, y: 1.06,
      font: { size: 11, color: '#c5c6cd' },
      bgcolor: 'transparent',
    },
    xaxis: {
      type: 'category',
      showgrid: true,
      gridcolor: 'rgba(68,71,77,0.3)',
      tickfont: { color: 'rgba(197,198,205,0.55)', size: 10 },
      rangeslider: { visible: false },
      showspikes: true,
      spikecolor: 'rgba(185,199,228,0.3)',
      spikethickness: 1,
      spikedash: 'dot',
    },
    yaxis: {
      showgrid: true,
      gridcolor: 'rgba(68,71,77,0.3)',
      tickfont: { color: 'rgba(197,198,205,0.55)', size: 10 },
      showspikes: true,
      spikecolor: 'rgba(185,199,228,0.3)',
      spikethickness: 1,
      tickprefix: currencySymbol,
    },
    hoverlabel: {
      bgcolor: '#0d1c32',
      bordercolor: 'rgba(185,199,228,0.15)',
      font: { color: '#d6e3ff', size: 11 },
      namelength: 0,
    },
    hovermode: 'closest',
    dragmode: 'zoom',
    modebar: { bgcolor: 'transparent', color: '#8f9097', activecolor: '#4edea3' },
    title: {
      text: title,
      font: { size: 14, color: '#b9c7e4', family: 'Manrope, sans-serif', weight: 700 },
      x: 0.5,
      y: 0.99,
      xanchor: 'center',
    },
    annotations: [],
  }

  if (ohlcv.length && signals) {
    const dates = ohlcv.map(d => d.date)

    // Candlestick
    plotData.push({
      type:        'candlestick',
      name:        'Price',
      x:           dates,
      open:        ohlcv.map(d => d.open),
      high:        ohlcv.map(d => d.high),
      low:         ohlcv.map(d => d.low),
      close:       ohlcv.map(d => d.close),
      increasing:  { line: { color: '#4edea3', width: 1.5 }, fillcolor: 'rgba(78,222,163,0.7)' },
      decreasing:  { line: { color: '#ffb4ab', width: 1.5 }, fillcolor: 'rgba(255,180,171,0.7)' },
      whiskerwidth: 0.5,
      hovertemplate: `<b>%{x}</b><br>O: ${currencySymbol}%{open:.2f}  H: ${currencySymbol}%{high:.2f}<br>L: ${currencySymbol}%{low:.2f}  C: ${currencySymbol}%{close:.2f}<extra></extra>`,
    })

    // Fast DMA
    plotData.push({
      type: 'scatter',
      name: `DMA ${params.dmaFast} (Fast)`,
      x:    dates,
      y:    signals.fast,
      mode: 'lines',
      line: { color: '#b9c7e4', width: 1.5, dash: 'solid' },
      hovertemplate: `DMA${params.dmaFast}: $%{y:.2f}<extra></extra>`,
    })

    // Slow DMA
    plotData.push({
      type: 'scatter',
      name: `DMA ${params.dmaSlow} (Slow)`,
      x:    dates,
      y:    signals.slow,
      mode: 'lines',
      line: { color: '#bdc7d8', width: 1.5, dash: 'dot' },
      hovertemplate: `DMA${params.dmaSlow}: $%{y:.2f}<extra></extra>`,
    })

    // Buy signals
    const buyDates = dates.filter((_, i) => signals.finalBuy[i])
    const buyPrices = ohlcv.filter((_, i) => signals.finalBuy[i]).map(d => d.low * 0.978)
    const buyTexts  = ohlcv.filter((_, i) => signals.finalBuy[i]).map((_, j) => {
      const idx = dates.findIndex(d => d === buyDates[j])
      return signals.patName[idx] || 'Buy'
    })
    if (buyDates.length) {
      plotData.push({
        type: 'scatter',
        name: 'BUY Signal',
        x:    buyDates,
        y:    buyPrices,
        mode: 'markers+text',
        marker: {
          symbol: 'triangle-up',
          size:   14,
          color:  '#4edea3',
          line:   { width: 1.5, color: '#003824' },
        },
        text:         buyTexts,
        textposition: 'bottom center',
        textfont:     { size: 9, color: '#4edea3' },
        hoverinfo:    'skip',
      })
    }

    // Sell signals
    const sellDates  = dates.filter((_, i) => signals.finalSell[i])
    const sellPrices = ohlcv.filter((_, i) => signals.finalSell[i]).map(d => d.high * 1.022)
    const sellTexts  = ohlcv.filter((_, i) => signals.finalSell[i]).map((_, j) => {
      const idx = dates.findIndex(d => d === sellDates[j])
      return signals.patName[idx] || 'Sell'
    })
    if (sellDates.length) {
      plotData.push({
        type: 'scatter',
        name: 'SELL Signal',
        x:    sellDates,
        y:    sellPrices,
        mode: 'markers+text',
        marker: {
          symbol: 'triangle-down',
          size:   14,
          color:  '#ffb4ab',
          line:   { width: 1.5, color: '#690005' },
        },
        text:         sellTexts,
        textposition: 'top center',
        textfont:     { size: 9, color: '#ffb4ab' },
        hoverinfo:    'skip',
      })
    }
  }

  return (
    <div className={styles.page}>
      {/* Left panel */}
      <aside className={styles.sidebar}>
        <ControlPanel
          params={params}
          setParams={setParams}
          onAnalyze={analyze}
          loading={loading}
        />

        {/* Signal legend */}
        <div className={styles.legend}>
          <div className={styles.legendTitle}>Signal Key</div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#4edea3' }} />
            <div>
              <div className={styles.legendName}>BUY ▲</div>
              <div className={styles.legendDesc}>Pattern + DMA crossover + price cross above fast DMA</div>
            </div>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#ffb4ab' }} />
            <div>
              <div className={styles.legendName}>SELL ▼</div>
              <div className={styles.legendDesc}>Pattern + DMA crossover + price cross below fast DMA</div>
            </div>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendLine} style={{ background: '#b9c7e4' }} />
            <div className={styles.legendName}>Fast DMA</div>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendLineDot} />
            <div className={styles.legendName}>Slow DMA</div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {/* Stats */}
        {ohlcv.length > 0 && signals && (
          <SignalStats ohlcv={ohlcv} finalBuy={signals.finalBuy} finalSell={signals.finalSell} currencySymbol={currencySymbol} />
        )}

        {/* Error */}
        {error && (
          <div className={styles.errorBox}>
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* Chart */}
        <div className={styles.chartWrap}>
          {loading && (
            <div className={styles.chartOverlay}>
              <div className={styles.bigSpinner} />
              <p>Fetching & analyzing {params.symbol}…</p>
            </div>
          )}
          {!loading && ohlcv.length === 0 && !error && (
            <div className={styles.chartOverlay}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.3 }}>
                candlestick_chart
              </span>
              <p style={{ opacity: 0.5 }}>Enter a symbol and click Analyze</p>
            </div>
          )}
          {ohlcv.length > 0 && (
            <Plot
              data={plotData}
              layout={plotLayout}
              config={{
                responsive:    true,
                displaylogo:   false,
                scrollZoom:    false,
                modeBarButtonsToRemove: ['lasso2d', 'select2d'],
              }}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler
            />
          )}
        </div>

        {/* Signal table */}
        {signals && (signals.finalBuy.some(Boolean) || signals.finalSell.some(Boolean)) && (
          <div className={styles.tableWrap}>
            <h3 className={styles.tableTitle}>
              <span className="material-symbols-outlined">table_chart</span>
              Recent Signals
            </h3>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Close</th>
                    <th>Pattern</th>
                    <th>Fast DMA</th>
                    <th>Slow DMA</th>
                  </tr>
                </thead>
                <tbody>
                  {ohlcv
                    .map((d, i) => ({ ...d, i }))
                    .filter(d => signals.finalBuy[d.i] || signals.finalSell[d.i])
                    .slice(-20)
                    .reverse()
                    .map((d, idx) => {
                      const isBuy = signals.finalBuy[d.i]
                      return (
                        <tr key={idx} className={styles.trow}>
                          <td className={styles.tdDate}>{d.date}</td>
                          <td>
                            <span className={styles.signalBadge} style={{
                              background: isBuy ? 'rgba(78,222,163,0.12)' : 'rgba(255,180,171,0.12)',
                              color:      isBuy ? '#4edea3' : '#ffb4ab',
                              border:     `1px solid ${isBuy ? 'rgba(78,222,163,0.3)' : 'rgba(255,180,171,0.3)'}`,
                            }}>
                              {isBuy ? '▲ BUY' : '▼ SELL'}
                            </span>
                          </td>
                          <td className={styles.tdMono}>{currencySymbol}{d.close.toFixed(2)}</td>
                          <td className={styles.tdPattern}>{signals.patName[d.i] || '—'}</td>
                          <td className={styles.tdMono}>
                            {signals.fast[d.i] != null ? `${currencySymbol}${signals.fast[d.i].toFixed(2)}` : '—'}
                          </td>
                          <td className={styles.tdMono}>
                            {signals.slow[d.i] != null ? `${currencySymbol}${signals.slow[d.i].toFixed(2)}` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
