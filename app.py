import streamlit as st
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
import pandas as pd
from data_processor import fetch_data, calculate_indicators

st.set_page_config(
    page_title="Market Insight Pro",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');

    /* ── Global Reset & Base ── */
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    .stDeployButton { display: none !important; }
    #MainMenu { visibility: hidden; }
    footer { visibility: hidden; }
    header { visibility: hidden; }

    /* ── App Background ── */
    .stApp {
        background: #080c14;
    }
    .block-container {
        padding-top: 1rem;
        padding-bottom: 2rem;
        max-width: 1400px;
    }

    /* ── Sidebar ── */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #0d1321 0%, #0a1020 100%);
        border-right: 1px solid rgba(99, 102, 241, 0.15);
    }
    [data-testid="stSidebar"] .stMarkdown h1,
    [data-testid="stSidebar"] .stMarkdown h2,
    [data-testid="stSidebar"] .stMarkdown h3 {
        color: #a5b4fc;
    }
    [data-testid="stSidebar"] label {
        color: #94a3b8 !important;
        font-size: 0.8rem !important;
        font-weight: 500 !important;
        letter-spacing: 0.05em;
        text-transform: uppercase;
    }

    /* ── Sidebar nav pills ── */
    .nav-pill {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border-radius: 10px;
        cursor: pointer;
        margin-bottom: 4px;
        color: #94a3b8;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.2s ease;
        text-decoration: none;
    }
    .nav-pill:hover { background: rgba(99,102,241,0.12); color: #c7d2fe; }
    .nav-pill.active { background: rgba(99,102,241,0.25); color: #a5b4fc; border-left: 3px solid #6366f1; }
    .nav-pill .icon { font-size: 1.1rem; width: 22px; text-align: center; }

    /* ── Glass Card ── */
    .glass-card {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        padding: 20px 24px;
        backdrop-filter: blur(8px);
        margin-bottom: 16px;
        position: relative;
        overflow: hidden;
    }
    .glass-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent);
    }

    /* ── Metric Cards ── */
    .metric-card {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 14px;
        padding: 18px 20px;
        position: relative;
        overflow: hidden;
        transition: all 0.25s ease;
    }
    .metric-card:hover {
        border-color: rgba(99,102,241,0.3);
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(99,102,241,0.12);
    }
    .metric-card .metric-label {
        color: #64748b;
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 6px;
    }
    .metric-card .metric-value {
        color: #f1f5f9;
        font-size: 1.6rem;
        font-weight: 700;
        font-family: 'Space Grotesk', sans-serif;
        line-height: 1;
        margin-bottom: 6px;
    }
    .metric-card .metric-delta-pos {
        color: #10b981;
        font-size: 0.8rem;
        font-weight: 600;
    }
    .metric-card .metric-delta-neg {
        color: #ef4444;
        font-size: 0.8rem;
        font-weight: 600;
    }
    .metric-card .metric-glow-green {
        position: absolute;
        top: -20px; right: -20px;
        width: 80px; height: 80px;
        border-radius: 50%;
        background: rgba(16, 185, 129, 0.1);
        filter: blur(20px);
    }
    .metric-card .metric-glow-red {
        position: absolute;
        top: -20px; right: -20px;
        width: 80px; height: 80px;
        border-radius: 50%;
        background: rgba(239, 68, 68, 0.1);
        filter: blur(20px);
    }
    .metric-card .metric-glow-blue {
        position: absolute;
        top: -20px; right: -20px;
        width: 80px; height: 80px;
        border-radius: 50%;
        background: rgba(99, 102, 241, 0.12);
        filter: blur(20px);
    }

    /* ── Header / Hero ── */
    .page-hero {
        background: linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 50%, rgba(6,182,212,0.08) 100%);
        border: 1px solid rgba(99,102,241,0.2);
        border-radius: 20px;
        padding: 32px 36px;
        margin-bottom: 24px;
        position: relative;
        overflow: hidden;
    }
    .page-hero::after {
        content: '';
        position: absolute;
        bottom: -40px; right: -40px;
        width: 200px; height: 200px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
    }
    .page-hero h1 {
        color: #f1f5f9;
        font-size: 1.9rem;
        font-weight: 800;
        font-family: 'Space Grotesk', sans-serif;
        margin: 0 0 6px 0;
        letter-spacing: -0.02em;
    }
    .page-hero p {
        color: #94a3b8;
        font-size: 0.95rem;
        margin: 0;
    }
    .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(99,102,241,0.2);
        border: 1px solid rgba(99,102,241,0.35);
        color: #a5b4fc;
        font-size: 0.72rem;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 20px;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }

    /* ── Section Headers ── */
    .section-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
        margin-top: 8px;
    }
    .section-header h3 {
        color: #e2e8f0;
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
        font-family: 'Space Grotesk', sans-serif;
        letter-spacing: -0.01em;
    }
    .section-line {
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, rgba(99,102,241,0.3), transparent);
    }

    /* ── Signal Badge ── */
    .signal-buy {
        display: inline-flex; align-items: center; gap: 5px;
        background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3);
        color: #10b981; font-size: 0.72rem; font-weight: 700;
        padding: 3px 10px; border-radius: 20px;
        text-transform: uppercase; letter-spacing: 0.05em;
    }
    .signal-sell {
        display: inline-flex; align-items: center; gap: 5px;
        background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25);
        color: #ef4444; font-size: 0.72rem; font-weight: 700;
        padding: 3px 10px; border-radius: 20px;
        text-transform: uppercase; letter-spacing: 0.05em;
    }

    /* ── Table styling ── */
    .stDataFrame { border-radius: 12px !important; overflow: hidden; }
    .stDataFrame thead tr th {
        background: rgba(99,102,241,0.12) !important;
        color: #a5b4fc !important;
        font-size: 0.72rem !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.06em !important;
        border-bottom: 1px solid rgba(99,102,241,0.2) !important;
    }
    .stDataFrame tbody tr td {
        color: #cbd5e1 !important;
        font-size: 0.85rem !important;
        background: rgba(255,255,255,0.02) !important;
    }
    .stDataFrame tbody tr:hover td {
        background: rgba(99,102,241,0.07) !important;
    }

    /* ── Inputs ── */
    .stTextInput input, .stSelectbox select, .stNumberInput input {
        background: rgba(255,255,255,0.05) !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
        border-radius: 10px !important;
        color: #f1f5f9 !important;
        font-size: 0.9rem !important;
    }
    .stTextInput input:focus, .stSelectbox select:focus {
        border-color: rgba(99,102,241,0.5) !important;
        box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important;
    }
    .stSlider [data-baseweb="slider"] { padding: 4px 0; }

    /* ── Buttons ── */
    .stButton button {
        background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
        color: white !important;
        border: none !important;
        border-radius: 10px !important;
        font-weight: 600 !important;
        font-size: 0.85rem !important;
        padding: 8px 20px !important;
        transition: all 0.2s ease !important;
        letter-spacing: 0.02em !important;
    }
    .stButton button:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 6px 20px rgba(99,102,241,0.4) !important;
    }

    /* ── Tabs ── */
    .stTabs [data-baseweb="tab-list"] {
        background: rgba(255,255,255,0.03);
        border-radius: 12px;
        padding: 4px;
        gap: 2px;
        border: 1px solid rgba(255,255,255,0.06);
    }
    .stTabs [data-baseweb="tab"] {
        border-radius: 8px !important;
        color: #64748b !important;
        font-weight: 500 !important;
        font-size: 0.85rem !important;
        padding: 6px 16px !important;
    }
    .stTabs [aria-selected="true"] {
        background: rgba(99,102,241,0.25) !important;
        color: #a5b4fc !important;
    }

    /* ── Divider ── */
    hr { border-color: rgba(255,255,255,0.06) !important; }

    /* ── Info/Warning boxes ── */
    .stAlert {
        background: rgba(99,102,241,0.08) !important;
        border: 1px solid rgba(99,102,241,0.2) !important;
        border-radius: 10px !important;
        color: #c7d2fe !important;
    }

    /* ── Portfolio table row coloring ── */
    .port-row-gain { color: #10b981 !important; }
    .port-row-loss { color: #ef4444 !important; }

    /* ── Spinner ── */
    .stSpinner > div { border-top-color: #6366f1 !important; }

    /* ── Logo text ── */
    .logo-text {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1.2rem;
        font-weight: 700;
        background: linear-gradient(135deg, #a5b4fc, #c4b5fd, #67e8f9);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -0.02em;
    }
    .logo-sub {
        color: #475569;
        font-size: 0.65rem;
        font-weight: 500;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    /* ── Trend pill ── */
    .trend-bull {
        background: rgba(16,185,129,0.15);
        border: 1px solid rgba(16,185,129,0.3);
        color: #10b981;
        font-size: 0.78rem;
        font-weight: 600;
        padding: 3px 12px;
        border-radius: 20px;
    }
    .trend-bear {
        background: rgba(239,68,68,0.12);
        border: 1px solid rgba(239,68,68,0.25);
        color: #ef4444;
        font-size: 0.78rem;
        font-weight: 600;
        padding: 3px 12px;
        border-radius: 20px;
    }

    /* ── Portfolio card ── */
    .port-card {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 12px;
        padding: 14px 16px;
        margin-bottom: 10px;
        transition: all 0.2s ease;
    }
    .port-card:hover {
        border-color: rgba(99,102,241,0.25);
        background: rgba(99,102,241,0.05);
    }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.5); }
</style>
""", unsafe_allow_html=True)


# ── Sidebar ──────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div style="padding: 10px 0 20px 0; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 20px;">
        <div class="logo-text">📊 Market Insight</div>
        <div class="logo-sub">Pro Analytics Platform</div>
    </div>
    """, unsafe_allow_html=True)

    page = st.radio(
        "Navigation",
        ["🏠  Landing Page", "📊  Market Dashboard", "📈  Stock Detail", "💼  Portfolio Manager"],
        label_visibility="collapsed"
    )

    st.markdown("<div style='height:16px'></div>", unsafe_allow_html=True)

    if page in ["📊  Market Dashboard", "📈  Stock Detail"]:
        st.markdown("### ⚙️ Parameters")
        ticker = st.text_input("Symbol", value="AAPL", placeholder="AAPL, TSLA, RELIANCE.NS…")
        period = st.selectbox("Time Period", ["3mo", "6mo", "1y", "2y", "5y"], index=2)
        dma_fast = st.number_input("Fast DMA (days)", min_value=5, max_value=200, value=20)
        dma_slow = st.number_input("Slow DMA (days)", min_value=10, max_value=250, value=50)

        st.markdown("### 🎛️ Signal Settings")
        crossover_window = st.slider("Crossover Lookback", 1, 20, 5,
            help="Bars forward to look for DMA crossover after pattern")
        safety_window = st.slider("Safety Window", 1, 30, 10,
            help="Max bars to wait after crossover for price confirmation")

        show_dma    = st.checkbox("Show DMA Lines", value=True)
        show_volume = st.checkbox("Show Volume Panel", value=True)
    else:
        ticker = "AAPL"
        period = "1y"
        dma_fast = 20
        dma_slow = 50
        crossover_window = 5
        safety_window = 10
        show_dma = True
        show_volume = True

    st.markdown("<div style='height:16px'></div>", unsafe_allow_html=True)
    st.markdown("""
    <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; color: #334155; font-size: 0.72rem; text-align: center;">
        Market Insight Pro v2.0<br>Real-time · Three-Layer Signals
    </div>
    """, unsafe_allow_html=True)


# ── Helper: build chart ───────────────────────────────────────────────────────
def build_chart(data, buy_signal, sell_signal, ticker, currency_symbol,
                dma_fast, dma_slow, show_dma, show_volume, height=680):
    row_heights = [0.72, 0.28] if show_volume else [1.0]
    rows = 2 if show_volume else 1

    fig = make_subplots(
        rows=rows, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.015,
        row_heights=row_heights,
        subplot_titles=(None, "Volume" if show_volume else None),
    )

    fig.add_trace(go.Candlestick(
        x=data.index,
        open=data['Open'], high=data['High'],
        low=data['Low'],   close=data['Close'],
        name=ticker,
        increasing=dict(line=dict(color='#00d18c', width=1), fillcolor='#00d18c'),
        decreasing=dict(line=dict(color='#ef4444', width=1), fillcolor='#ef4444'),
        hoverinfo='x+y',
    ), row=1, col=1)

    if show_dma:
        fig.add_trace(go.Scatter(
            x=data.index, y=data[f'DMA_{dma_fast}'],
            name=f'Fast DMA {dma_fast}',
            line=dict(color='#6366f1', width=1.8, dash='solid'),
            hovertemplate=f'Fast DMA: %{{y:.2f}}<extra></extra>',
        ), row=1, col=1)
        fig.add_trace(go.Scatter(
            x=data.index, y=data[f'DMA_{dma_slow}'],
            name=f'Slow DMA {dma_slow}',
            line=dict(color='#f59e0b', width=1.8, dash='solid'),
            hovertemplate=f'Slow DMA: %{{y:.2f}}<extra></extra>',
        ), row=1, col=1)

    buy_dates  = data.index[data['Final_Buy']]
    buy_prices = buy_signal.dropna()
    if len(buy_dates) > 0:
        buy_patterns = data.loc[data['Final_Buy'], 'Pattern_Name']
        fig.add_trace(go.Scatter(
            x=buy_dates, y=buy_prices.values,
            mode='markers+text', name='BUY',
            marker=dict(symbol='triangle-up', size=14, color='#00d18c',
                        line=dict(color='#ffffff', width=1)),
            text=['▲'] * len(buy_dates),
            textposition='bottom center',
            textfont=dict(color='#00d18c', size=9, family='Arial Black'),
            customdata=buy_patterns.values,
            hovertemplate=(
                '<b>✅ BUY Signal</b><br>'
                'Date: %{x|%Y-%m-%d}<br>'
                'Price: ' + currency_symbol + '%{y:.2f}<br>'
                'Pattern: %{customdata}<extra></extra>'
            ),
        ), row=1, col=1)

    sell_dates  = data.index[data['Final_Sell']]
    sell_prices = sell_signal.dropna()
    if len(sell_dates) > 0:
        sell_patterns = data.loc[data['Final_Sell'], 'Pattern_Name']
        fig.add_trace(go.Scatter(
            x=sell_dates, y=sell_prices.values,
            mode='markers+text', name='SELL',
            marker=dict(symbol='triangle-down', size=14, color='#ef4444',
                        line=dict(color='#ffffff', width=1)),
            text=['▼'] * len(sell_dates),
            textposition='top center',
            textfont=dict(color='#ef4444', size=9, family='Arial Black'),
            customdata=sell_patterns.values,
            hovertemplate=(
                '<b>🔴 SELL Signal</b><br>'
                'Date: %{x|%Y-%m-%d}<br>'
                'Price: ' + currency_symbol + '%{y:.2f}<br>'
                'Pattern: %{customdata}<extra></extra>'
            ),
        ), row=1, col=1)

    if show_volume:
        vol_colors = np.where(data['Close'] >= data['Open'], 'rgba(0,209,140,0.5)', 'rgba(239,68,68,0.5)')
        fig.add_trace(go.Bar(
            x=data.index, y=data['Volume'], name='Volume',
            marker=dict(color=vol_colors),
            hovertemplate='Volume: %{y:,.0f}<extra></extra>',
            showlegend=False,
        ), row=2, col=1)

    axis_style = dict(
        gridcolor='rgba(255,255,255,0.04)', gridwidth=1,
        showgrid=True, zeroline=False,
        tickfont=dict(color='#475569', size=11),
        linecolor='rgba(255,255,255,0.06)',
    )

    fig.update_layout(
        height=height,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(family='Inter, Arial', color='#94a3b8', size=12),
        margin=dict(l=0, r=60, t=36, b=0),
        legend=dict(
            orientation='h', yanchor='bottom', y=1.01,
            xanchor='left', x=0,
            bgcolor='rgba(8,12,20,0.85)',
            bordercolor='rgba(99,102,241,0.2)', borderwidth=1,
            font=dict(color='#94a3b8', size=11),
        ),
        hovermode='x unified',
        hoverlabel=dict(bgcolor='#0d1321', bordercolor='rgba(99,102,241,0.3)',
                        font=dict(color='#e2e8f0', size=12)),
        xaxis_rangeslider_visible=False,
        xaxis=dict(
            **axis_style,
            showspikes=True, spikecolor='rgba(99,102,241,0.4)',
            spikethickness=1, spikedash='dot', spikemode='across',
            rangeselector=dict(
                buttons=[
                    dict(count=1,  label='1M',  step='month', stepmode='backward'),
                    dict(count=3,  label='3M',  step='month', stepmode='backward'),
                    dict(count=6,  label='6M',  step='month', stepmode='backward'),
                    dict(count=1,  label='YTD', step='year',  stepmode='todate'),
                    dict(count=1,  label='1Y',  step='year',  stepmode='backward'),
                    dict(step='all', label='All'),
                ],
                bgcolor='rgba(13,19,33,0.95)',
                activecolor='rgba(99,102,241,0.5)',
                bordercolor='rgba(99,102,241,0.2)', borderwidth=1,
                font=dict(color='#94a3b8', size=11), x=0, y=1.04,
            ),
            type='date',
        ),
        yaxis=dict(
            **axis_style,
            side='right',
            showspikes=True, spikecolor='rgba(99,102,241,0.4)',
            spikethickness=1, spikedash='dot', spikemode='across',
            tickprefix=currency_symbol,
        ),
    )

    if show_volume:
        fig.update_yaxes(**axis_style, row=2, col=1)
        fig.update_xaxes(**axis_style, row=2, col=1)

    return fig


def metric_card_html(label, value, delta=None, glow="blue", icon=""):
    delta_html = ""
    if delta is not None:
        cls = "metric-delta-pos" if delta >= 0 else "metric-delta-neg"
        arrow = "▲" if delta >= 0 else "▼"
        delta_html = f'<div class="{cls}">{arrow} {abs(delta):.2f}%</div>'
    return f"""
    <div class="metric-card">
        <div class="metric-glow-{glow}"></div>
        <div class="metric-label">{icon} {label}</div>
        <div class="metric-value">{value}</div>
        {delta_html}
    </div>
    """


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE 1 — LANDING PAGE
# ═══════════════════════════════════════════════════════════════════════════════
if page == "🏠  Landing Page":
    st.markdown("""
    <div style="text-align: center; padding: 60px 20px 40px 20px;">
        <div class="hero-badge">✦ Professional Trading Analytics</div>
        <h1 style="font-family: 'Space Grotesk', sans-serif; font-size: 3rem; font-weight: 800;
                   background: linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 50%, #67e8f9 100%);
                   -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                   letter-spacing: -0.03em; margin: 0 0 16px 0; line-height: 1.1;">
            Market Insight Pro
        </h1>
        <p style="color: #64748b; font-size: 1.1rem; max-width: 520px; margin: 0 auto 32px auto; line-height: 1.6;">
            Three-layer signal confirmation — candlestick patterns, DMA crossover, and price safety filter.
            Built for serious traders.
        </p>
        <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin-bottom: 60px;">
            <div style="background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3);
                        border-radius: 10px; padding: 10px 20px; color: #a5b4fc; font-size: 0.85rem; font-weight: 600;">
                📡 Real-time Data
            </div>
            <div style="background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.25);
                        border-radius: 10px; padding: 10px 20px; color: #c4b5fd; font-size: 0.85rem; font-weight: 600;">
                🧠 AI Signal Engine
            </div>
            <div style="background: rgba(6,182,212,0.1); border: 1px solid rgba(6,182,212,0.22);
                        border-radius: 10px; padding: 10px 20px; color: #67e8f9; font-size: 0.85rem; font-weight: 600;">
                📊 Interactive Charts
            </div>
            <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.22);
                        border-radius: 10px; padding: 10px 20px; color: #6ee7b7; font-size: 0.85rem; font-weight: 600;">
                💼 Portfolio Tracker
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("""
        <div class="glass-card" style="text-align:center; padding: 32px 24px;">
            <div style="font-size: 2.5rem; margin-bottom: 12px;">🕯️</div>
            <h3 style="color: #e2e8f0; font-family: 'Space Grotesk', sans-serif; margin: 0 0 10px 0; font-size: 1rem; font-weight: 700;">
                Candlestick Patterns
            </h3>
            <p style="color: #64748b; font-size: 0.82rem; line-height: 1.6; margin: 0;">
                Detects 8 classic patterns — Engulfing, Hammer, Inverted Hammer, Morning Star, Shooting Star, and more.
            </p>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown("""
        <div class="glass-card" style="text-align:center; padding: 32px 24px; border-color: rgba(139,92,246,0.2);">
            <div style="font-size: 2.5rem; margin-bottom: 12px;">📐</div>
            <h3 style="color: #e2e8f0; font-family: 'Space Grotesk', sans-serif; margin: 0 0 10px 0; font-size: 1rem; font-weight: 700;">
                DMA Crossover Engine
            </h3>
            <p style="color: #64748b; font-size: 0.82rem; line-height: 1.6; margin: 0;">
                Fast & Slow Dual Moving Average crossover confirmation within configurable lookback window.
            </p>
        </div>
        """, unsafe_allow_html=True)

    with col3:
        st.markdown("""
        <div class="glass-card" style="text-align:center; padding: 32px 24px; border-color: rgba(6,182,212,0.18);">
            <div style="font-size: 2.5rem; margin-bottom: 12px;">🛡️</div>
            <h3 style="color: #e2e8f0; font-family: 'Space Grotesk', sans-serif; margin: 0 0 10px 0; font-size: 1rem; font-weight: 700;">
                Safety Filter
            </h3>
            <p style="color: #64748b; font-size: 0.82rem; line-height: 1.6; margin: 0;">
                Price-cross safety confirmation reduces false signals — trade only when all three layers align.
            </p>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<div style='height: 24px'></div>", unsafe_allow_html=True)

    st.markdown("""
    <div class="glass-card" style="background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05));">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 18px;">
            <div style="color: #a5b4fc; font-size: 1rem; font-weight: 700; font-family: 'Space Grotesk', sans-serif;">
                📖 How the Signal Engine Works
            </div>
        </div>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
                <div style="color: #6366f1; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">
                    Layer 1 — Pattern
                </div>
                <div style="color: #94a3b8; font-size: 0.82rem; line-height: 1.6;">
                    A bullish or bearish candlestick pattern fires in the correct trend context.
                </div>
            </div>
            <div style="width: 1px; background: rgba(255,255,255,0.06);"></div>
            <div style="flex: 1; min-width: 200px;">
                <div style="color: #8b5cf6; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">
                    Layer 2 — Crossover
                </div>
                <div style="color: #94a3b8; font-size: 0.82rem; line-height: 1.6;">
                    A DMA crossover occurs in the expected direction within the configurable window.
                </div>
            </div>
            <div style="width: 1px; background: rgba(255,255,255,0.06);"></div>
            <div style="flex: 1; min-width: 200px;">
                <div style="color: #06b6d4; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">
                    Layer 3 — Safety
                </div>
                <div style="color: #94a3b8; font-size: 0.82rem; line-height: 1.6;">
                    Price closes above/below the Fast DMA to confirm commitment. Signal is marked.
                </div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div style="text-align:center; padding: 20px 0 10px 0; color: #475569; font-size: 0.78rem;">
        Use the sidebar to navigate to Market Dashboard, Stock Detail, or Portfolio Manager →
    </div>
    """, unsafe_allow_html=True)


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE 2 — MARKET DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════════
elif page == "📊  Market Dashboard":
    st.markdown(f"""
    <div class="page-hero">
        <div class="hero-badge">📊 Market Dashboard</div>
        <h1>{ticker.upper()} — Market Analysis</h1>
        <p>Three-layer signal confirmation · Candlestick + DMA + Safety Filter</p>
    </div>
    """, unsafe_allow_html=True)

    with st.spinner("Fetching market data…"):
        raw_data = fetch_data(ticker, period)

    if raw_data.empty:
        st.error(f"❌ Could not fetch data for **{ticker}**. Check the symbol and try again.")
        st.stop()

    data, buy_signal, sell_signal = calculate_indicators(
        raw_data, dma_fast, dma_slow, int(safety_window), int(crossover_window)
    )

    currency_symbol = "₹" if ticker.upper().endswith((".NS", ".BO")) else "$"

    last_close     = data['Close'].iloc[-1]
    prev_close_val = data['Close'].iloc[-2]
    pct_change     = ((last_close - prev_close_val) / prev_close_val) * 100
    buy_count      = int(data['Final_Buy'].sum())
    sell_count     = int(data['Final_Sell'].sum())
    curr_trend     = "Bullish 🐂" if data[f'DMA_{dma_fast}'].iloc[-1] > data[f'DMA_{dma_slow}'].iloc[-1] else "Bearish 🐻"
    is_bull        = "Bullish" in curr_trend
    vol_today      = data['Volume'].iloc[-1]
    vol_avg        = data['Volume'].tail(20).mean()
    vol_rel        = vol_today / vol_avg if vol_avg > 0 else 1.0

    c1, c2, c3, c4, c5 = st.columns(5)
    glow1 = "green" if pct_change >= 0 else "red"
    with c1:
        st.markdown(metric_card_html("Last Price", f"{currency_symbol}{last_close:.2f}", pct_change, glow1, "💲"), unsafe_allow_html=True)
    with c2:
        trend_glow = "green" if is_bull else "red"
        st.markdown(metric_card_html(f"Trend DMA{dma_fast}/{dma_slow}", curr_trend, glow=trend_glow, icon="📈"), unsafe_allow_html=True)
    with c3:
        st.markdown(metric_card_html("BUY Signals", str(buy_count), glow="green", icon="✅"), unsafe_allow_html=True)
    with c4:
        st.markdown(metric_card_html("SELL Signals", str(sell_count), glow="red", icon="🔴"), unsafe_allow_html=True)
    with c5:
        vol_str = f"{vol_today/1e6:.1f}M" if vol_today > 1e6 else f"{vol_today:,.0f}"
        vol_vs = f"({vol_rel:.1f}× avg)"
        st.markdown(metric_card_html("Volume Today", vol_str, glow="blue", icon="📦"), unsafe_allow_html=True)

    st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)

    st.markdown("""
    <div class="section-header">
        <h3>Interactive Price Chart</h3>
        <div class="section-line"></div>
    </div>
    """, unsafe_allow_html=True)

    chart_container = st.container()
    with chart_container:
        fig = build_chart(data, buy_signal, sell_signal, ticker, currency_symbol,
                          dma_fast, dma_slow, show_dma, show_volume, height=680)
        st.plotly_chart(fig, use_container_width=True, config={
            'displayModeBar': True,
            'modeBarButtonsToRemove': ['lasso2d', 'select2d', 'autoScale2d'],
            'displaylogo': False,
            'scrollZoom': True,
            'toImageButtonOptions': {'format': 'png', 'filename': f'{ticker}_chart', 'scale': 2},
        })

    st.markdown("""
    <div class="section-header">
        <h3>Confirmed Signal Log</h3>
        <div class="section-line"></div>
    </div>
    """, unsafe_allow_html=True)

    confirmed = data[data['Final_Buy'] | data['Final_Sell']].copy()
    if not confirmed.empty:
        confirmed['Signal'] = np.where(confirmed['Final_Buy'], "✅ BUY", "🔴 SELL")
        confirmed['Action'] = np.where(confirmed['Final_Buy'], "Enter Long", "Exit / Short")
        display_df = confirmed[['Close', f'DMA_{dma_fast}', f'DMA_{dma_slow}',
                                'Pattern_Name', 'Signal', 'Action']].rename(columns={
            'Close': 'Price',
            f'DMA_{dma_fast}': f'Fast DMA',
            f'DMA_{dma_slow}': f'Slow DMA',
            'Pattern_Name': 'Pattern',
        })
        display_df['Price'] = display_df['Price'].map(lambda x: f"{currency_symbol}{x:.2f}")
        st.dataframe(display_df, use_container_width=True)
    else:
        st.info("No confirmed signals in this period. Try increasing crossover lookback / safety window or use a longer timeframe.")


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE 3 — STOCK DETAIL PAGE
# ═══════════════════════════════════════════════════════════════════════════════
elif page == "📈  Stock Detail":
    with st.spinner("Loading stock data…"):
        raw_data = fetch_data(ticker, period)

    if raw_data.empty:
        st.error(f"❌ No data for **{ticker}**.")
        st.stop()

    data, buy_signal, sell_signal = calculate_indicators(
        raw_data, dma_fast, dma_slow, int(safety_window), int(crossover_window)
    )

    currency_symbol = "₹" if ticker.upper().endswith((".NS", ".BO")) else "$"
    last_close  = data['Close'].iloc[-1]
    prev_close  = data['Close'].iloc[-2]
    pct_change  = ((last_close - prev_close) / prev_close) * 100
    high_52w    = data['High'].max()
    low_52w     = data['Low'].min()
    avg_volume  = data['Volume'].mean()
    buy_count   = int(data['Final_Buy'].sum())
    sell_count  = int(data['Final_Sell'].sum())
    is_bull     = data[f'DMA_{dma_fast}'].iloc[-1] > data[f'DMA_{dma_slow}'].iloc[-1]
    trend_label = "Bullish" if is_bull else "Bearish"
    trend_cls   = "trend-bull" if is_bull else "trend-bear"
    up_arrow    = "▲" if pct_change >= 0 else "▼"
    price_color = "#10b981" if pct_change >= 0 else "#ef4444"

    st.markdown(f"""
    <div class="page-hero">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div>
                <div class="hero-badge">📈 Stock Detail</div>
                <h1 style="margin-bottom: 4px;">{ticker.upper()}</h1>
                <p style="margin: 0; display: flex; align-items: center; gap: 10px;">
                    <span style="color: {price_color}; font-size: 1.4rem; font-weight: 700; font-family: 'Space Grotesk', sans-serif;">
                        {currency_symbol}{last_close:.2f}
                    </span>
                    <span style="color: {price_color}; font-size: 0.9rem; font-weight: 600;">
                        {up_arrow} {abs(pct_change):.2f}%
                    </span>
                    <span class="{trend_cls}">{trend_label}</span>
                </p>
            </div>
            <div style="text-align:right;">
                <div style="color: #475569; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">Period</div>
                <div style="color: #94a3b8; font-size: 0.9rem; font-weight: 600;">{period} · DMA {dma_fast}/{dma_slow}</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    tab1, tab2, tab3 = st.tabs(["📊 Chart & Signals", "📋 Technicals", "🔔 Signal Log"])

    with tab1:
        fig = build_chart(data, buy_signal, sell_signal, ticker, currency_symbol,
                          dma_fast, dma_slow, show_dma, show_volume, height=620)
        st.plotly_chart(fig, use_container_width=True, config={
            'displayModeBar': True,
            'modeBarButtonsToRemove': ['lasso2d', 'select2d', 'autoScale2d'],
            'displaylogo': False,
            'scrollZoom': True,
        })

    with tab2:
        c1, c2 = st.columns(2)
        with c1:
            st.markdown(f"""
            <div class="glass-card">
                <div style="color: #64748b; font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
                            letter-spacing: 0.08em; margin-bottom: 16px;">Price Statistics</div>
                {''.join([
                    f'<div style="display:flex; justify-content:space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04);">'
                    f'<span style="color: #64748b; font-size: 0.82rem;">{k}</span>'
                    f'<span style="color: #e2e8f0; font-size: 0.82rem; font-weight: 600;">{v}</span></div>'
                    for k, v in [
                        ("52-Week High", f"{currency_symbol}{high_52w:.2f}"),
                        ("52-Week Low",  f"{currency_symbol}{low_52w:.2f}"),
                        ("Prev Close",   f"{currency_symbol}{prev_close:.2f}"),
                        ("Day Range",    f"{currency_symbol}{data['Low'].iloc[-1]:.2f} – {currency_symbol}{data['High'].iloc[-1]:.2f}"),
                        ("Avg Volume",   f"{avg_volume/1e6:.2f}M"),
                    ]
                ])}
            </div>
            """, unsafe_allow_html=True)

        with c2:
            fast_val = data[f'DMA_{dma_fast}'].iloc[-1]
            slow_val = data[f'DMA_{dma_slow}'].iloc[-1]
            gap_pct  = ((fast_val - slow_val) / slow_val) * 100
            st.markdown(f"""
            <div class="glass-card">
                <div style="color: #64748b; font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
                            letter-spacing: 0.08em; margin-bottom: 16px;">DMA Analysis</div>
                {''.join([
                    f'<div style="display:flex; justify-content:space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04);">'
                    f'<span style="color: #64748b; font-size: 0.82rem;">{k}</span>'
                    f'<span style="color: #e2e8f0; font-size: 0.82rem; font-weight: 600;">{v}</span></div>'
                    for k, v in [
                        (f"Fast DMA ({dma_fast})", f"{currency_symbol}{fast_val:.2f}"),
                        (f"Slow DMA ({dma_slow})", f"{currency_symbol}{slow_val:.2f}"),
                        ("DMA Gap %",              f"{'▲' if gap_pct>=0 else '▼'} {abs(gap_pct):.2f}%"),
                        ("Current Trend",          trend_label),
                        ("BUY Signals",            str(buy_count)),
                        ("SELL Signals",           str(sell_count)),
                    ]
                ])}
            </div>
            """, unsafe_allow_html=True)

        # Pattern Frequency Chart
        pattern_cols = ['Pat_Bull_Engulfing', 'Pat_Hammer', 'Pat_Inv_Hammer', 'Pat_Morning_Star',
                        'Pat_Bear_Engulfing', 'Pat_Hanging_Man', 'Pat_Shooting_Star', 'Pat_Evening_Star']
        pat_counts = {col.replace('Pat_', '').replace('_', ' '): int(data[col].sum())
                      for col in pattern_cols if col in data.columns}
        pat_colors = (['rgba(0,209,140,0.7)'] * 4 + ['rgba(239,68,68,0.7)'] * 4)
        pat_fig = go.Figure(go.Bar(
            x=list(pat_counts.values()),
            y=list(pat_counts.keys()),
            orientation='h',
            marker=dict(color=pat_colors, line=dict(width=0)),
        ))
        pat_fig.update_layout(
            paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)',
            height=260, margin=dict(l=0, r=16, t=16, b=0),
            font=dict(family='Inter', color='#94a3b8', size=11),
            xaxis=dict(gridcolor='rgba(255,255,255,0.05)', zeroline=False,
                       tickfont=dict(color='#475569')),
            yaxis=dict(gridcolor='rgba(0,0,0,0)', tickfont=dict(color='#94a3b8', size=11)),
            title=dict(text="Pattern Frequency", font=dict(color='#e2e8f0', size=13, family='Space Grotesk')),
        )
        st.plotly_chart(pat_fig, use_container_width=True, config={'displayModeBar': False})

    with tab3:
        confirmed = data[data['Final_Buy'] | data['Final_Sell']].copy()
        if not confirmed.empty:
            confirmed['Signal']  = np.where(confirmed['Final_Buy'], "✅ BUY", "🔴 SELL")
            confirmed['Action']  = np.where(confirmed['Final_Buy'], "Enter Long", "Exit / Short")
            display_df = confirmed[['Close', f'DMA_{dma_fast}', f'DMA_{dma_slow}',
                                    'Pattern_Name', 'Signal', 'Action']].rename(columns={
                'Close': 'Price',
                f'DMA_{dma_fast}': 'Fast DMA',
                f'DMA_{dma_slow}': 'Slow DMA',
                'Pattern_Name': 'Pattern',
            })
            display_df['Price']    = display_df['Price'].map(lambda x: f"{currency_symbol}{x:.2f}")
            display_df['Fast DMA'] = display_df['Fast DMA'].map(lambda x: f"{currency_symbol}{x:.2f}")
            display_df['Slow DMA'] = display_df['Slow DMA'].map(lambda x: f"{currency_symbol}{x:.2f}")
            st.dataframe(display_df, use_container_width=True)
        else:
            st.info("No confirmed signals yet. Adjust parameters in the sidebar.")


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE 4 — PORTFOLIO MANAGER
# ═══════════════════════════════════════════════════════════════════════════════
elif page == "💼  Portfolio Manager":
    st.markdown("""
    <div class="page-hero">
        <div class="hero-badge">💼 Portfolio Manager</div>
        <h1>Your Portfolio</h1>
        <p>Track positions, monitor P&L, and get signal alerts across all your holdings.</p>
    </div>
    """, unsafe_allow_html=True)

    if "portfolio" not in st.session_state:
        st.session_state.portfolio = [
            {"symbol": "AAPL",  "shares": 10, "avg_cost": 150.0},
            {"symbol": "TSLA",  "shares": 5,  "avg_cost": 220.0},
            {"symbol": "MSFT",  "shares": 8,  "avg_cost": 300.0},
        ]

    with st.expander("➕ Add Position", expanded=False):
        ec1, ec2, ec3, ec4 = st.columns([2, 1, 1, 1])
        new_sym   = ec1.text_input("Symbol", key="new_sym", placeholder="e.g. NVDA")
        new_shares = ec2.number_input("Shares", min_value=0.01, value=1.0, key="new_shares")
        new_cost   = ec3.number_input("Avg Cost ($)", min_value=0.01, value=100.0, key="new_cost")
        ec4.markdown("<div style='height:28px'></div>", unsafe_allow_html=True)
        if ec4.button("Add", key="add_pos"):
            if new_sym:
                st.session_state.portfolio.append({
                    "symbol": new_sym.upper().strip(),
                    "shares": new_shares,
                    "avg_cost": new_cost,
                })
                st.success(f"Added {new_sym.upper()} to portfolio.")
                st.rerun()

    portfolio = st.session_state.portfolio
    if not portfolio:
        st.info("No positions yet. Add a position above.")
        st.stop()

    rows = []
    total_cost  = 0.0
    total_value = 0.0

    progress_placeholder = st.empty()

    with progress_placeholder.container():
        prog_bar = st.progress(0, text="Loading portfolio data…")
        for idx, pos in enumerate(portfolio):
            sym = pos["symbol"]
            prog_bar.progress((idx + 1) / len(portfolio), text=f"Fetching {sym}…")
            df = fetch_data(sym, "3mo")
            if not df.empty:
                price   = float(df['Close'].iloc[-1])
                cost    = pos["avg_cost"]
                shares  = pos["shares"]
                mkt_val = price * shares
                pnl     = (price - cost) * shares
                pnl_pct = ((price - cost) / cost) * 100
                prev_p  = float(df['Close'].iloc[-2])
                day_chg = ((price - prev_p) / prev_p) * 100
                total_cost  += cost * shares
                total_value += mkt_val
                rows.append({
                    "Symbol": sym,
                    "Shares": shares,
                    "Avg Cost": cost,
                    "Price": price,
                    "Mkt Value": mkt_val,
                    "P&L": pnl,
                    "P&L %": pnl_pct,
                    "Day Chg %": day_chg,
                })
        prog_bar.empty()

    progress_placeholder.empty()

    total_pnl     = total_value - total_cost
    total_pnl_pct = ((total_value - total_cost) / total_cost * 100) if total_cost > 0 else 0.0

    hc1, hc2, hc3, hc4 = st.columns(4)
    with hc1:
        st.markdown(metric_card_html("Total Value", f"${total_value:,.2f}", glow="blue", icon="💰"), unsafe_allow_html=True)
    with hc2:
        st.markdown(metric_card_html("Total Cost Basis", f"${total_cost:,.2f}", glow="blue", icon="📋"), unsafe_allow_html=True)
    with hc3:
        g3 = "green" if total_pnl >= 0 else "red"
        st.markdown(metric_card_html("Total P&L", f"${total_pnl:+,.2f}", total_pnl_pct, g3, "📊"), unsafe_allow_html=True)
    with hc4:
        st.markdown(metric_card_html("Positions", str(len(portfolio)), glow="blue", icon="📁"), unsafe_allow_html=True)

    st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)

    cv1, cv2 = st.columns([3, 2])

    with cv1:
        st.markdown("""
        <div class="section-header">
            <h3>Holdings</h3>
            <div class="section-line"></div>
        </div>
        """, unsafe_allow_html=True)

        df_port = pd.DataFrame(rows)
        if not df_port.empty:
            styled_data = df_port.copy()
            styled_data['Avg Cost']   = styled_data['Avg Cost'].map(lambda x: f"${x:.2f}")
            styled_data['Price']      = styled_data['Price'].map(lambda x: f"${x:.2f}")
            styled_data['Mkt Value']  = styled_data['Mkt Value'].map(lambda x: f"${x:,.2f}")
            styled_data['P&L']        = styled_data['P&L'].map(lambda x: f"${x:+,.2f}")
            styled_data['P&L %']      = styled_data['P&L %'].map(lambda x: f"{x:+.2f}%")
            styled_data['Day Chg %']  = styled_data['Day Chg %'].map(lambda x: f"{x:+.2f}%")
            st.dataframe(styled_data, use_container_width=True, hide_index=True)

        remove_options = ["—"] + [p["symbol"] for p in portfolio]
        to_remove = st.selectbox("Remove position", remove_options, key="rm_sel")
        if to_remove != "—":
            if st.button(f"Remove {to_remove}", key="rm_btn"):
                st.session_state.portfolio = [p for p in st.session_state.portfolio if p["symbol"] != to_remove]
                st.rerun()

    with cv2:
        st.markdown("""
        <div class="section-header">
            <h3>Allocation</h3>
            <div class="section-line"></div>
        </div>
        """, unsafe_allow_html=True)

        if rows:
            pie_labels = [r["Symbol"] for r in rows]
            pie_values = [r["Mkt Value"] for r in rows]
            pie_colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
                          '#ef4444', '#ec4899', '#14b8a6'][:len(pie_labels)]

            pie_fig = go.Figure(go.Pie(
                labels=pie_labels,
                values=pie_values,
                hole=0.62,
                marker=dict(colors=pie_colors, line=dict(color='#0d1321', width=2)),
                textinfo='label+percent',
                textfont=dict(color='#e2e8f0', size=12),
                hovertemplate='%{label}<br>$%{value:,.2f}<br>%{percent}<extra></extra>',
            ))
            pie_fig.update_layout(
                paper_bgcolor='rgba(0,0,0,0)',
                height=320, margin=dict(l=0, r=0, t=10, b=0),
                font=dict(family='Inter', color='#94a3b8'),
                showlegend=False,
                annotations=[dict(
                    text=f"<b>${total_value/1e3:.1f}K</b>",
                    x=0.5, y=0.5, font_size=18, font_color='#e2e8f0',
                    font_family='Space Grotesk', showarrow=False,
                )],
            )
            st.plotly_chart(pie_fig, use_container_width=True, config={'displayModeBar': False})

        st.markdown("""
        <div class="section-header">
            <h3>P&L by Position</h3>
            <div class="section-line"></div>
        </div>
        """, unsafe_allow_html=True)

        if rows:
            bar_colors = ['rgba(0,209,140,0.75)' if r['P&L %'] >= 0 else 'rgba(239,68,68,0.7)'
                          for r in rows]
            pnl_fig = go.Figure(go.Bar(
                x=[r['Symbol'] for r in rows],
                y=[r['P&L %'] for r in rows],
                marker=dict(color=bar_colors, line=dict(width=0)),
                hovertemplate='%{x}: %{y:+.2f}%<extra></extra>',
            ))
            pnl_fig.update_layout(
                paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)',
                height=200, margin=dict(l=0, r=0, t=8, b=0),
                font=dict(family='Inter', color='#94a3b8', size=11),
                xaxis=dict(gridcolor='rgba(0,0,0,0)', tickfont=dict(color='#94a3b8')),
                yaxis=dict(gridcolor='rgba(255,255,255,0.05)', zeroline=True,
                           zerolinecolor='rgba(255,255,255,0.1)', zerolinewidth=1,
                           ticksuffix='%', tickfont=dict(color='#475569')),
            )
            st.plotly_chart(pnl_fig, use_container_width=True, config={'displayModeBar': False})
