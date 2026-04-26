from flask import Flask, jsonify, request
from flask_cors import CORS
from data_processor import fetch_data, calculate_indicators
import numpy as np
import pandas as pd
import yfinance as yf
import concurrent.futures

app = Flask(__name__)
CORS(app) # Allow React frontend to fetch data from localhost:5173

@app.route('/api/stock/<symbol>')
def get_stock_data(symbol):
    period = request.args.get('period', '1y')
    dma_fast = int(request.args.get('dma_fast', 20))
    dma_slow = int(request.args.get('dma_slow', 50))
    
    # Extract data using the user's data process logic
    raw_data = fetch_data(symbol, period)
    if raw_data.empty:
        return jsonify({"error": "No data found for symbol"}), 404
        
    df, buy_signal, sell_signal = calculate_indicators(raw_data, dma_fast, dma_slow)
    
    # Replace NaN with None for valid JSON serialization
    df_clean = df.replace({np.nan: None})
    
    recharts_data = []
    patterns_log = []
    
    for i, (date, row) in enumerate(df_clean.iterrows()):
        open_p = row['Open']
        close_p = row['Close']
        high_p = row['High']
        low_p = row['Low']
        
        data_point = {
            "day": i + 1,
            "date": date.strftime('%Y-%m-%d'),
            "open": round(open_p, 2) if open_p is not None else None,
            "close": round(close_p, 2) if close_p is not None else None,
            "high": round(high_p, 2) if high_p is not None else None,
            "low": round(low_p, 2) if low_p is not None else None,
            "vol": row['Volume'],
            "dma20": round(row[f'DMA_{dma_fast}'], 2) if row.get(f'DMA_{dma_fast}') is not None else None,
            "dma50": round(row[f'DMA_{dma_slow}'], 2) if row.get(f'DMA_{dma_slow}') is not None else None,
            "pattern": row.get('Pattern_Name', "")
        }
        recharts_data.append(data_point)
        
        # Build patterns log
        if row.get('Final_Buy'):
             patterns_log.append({
                 "date": date.strftime('%Y-%m-%d'),
                 "pattern": row.get('Pattern_Name', 'Buy Signal'),
                 "signal": "BUY",
                 "price": f"${round(close_p, 2)}" if close_p is not None else "N/A"
             })
        elif row.get('Final_Sell'):
             patterns_log.append({
                 "date": date.strftime('%Y-%m-%d'),
                 "pattern": row.get('Pattern_Name', 'Sell Signal'),
                 "signal": "SELL",
                 "price": f"${round(close_p, 2)}" if close_p is not None else "N/A"
             })
             
    # Ensure patterns log matches the format the React components expect
    return jsonify({
        "ticker": symbol.upper(),
        "data": recharts_data,
        "patterns": patterns_log
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)

def format_mcap(mcap):
    if not mcap: return "N/A"
    if mcap >= 1e12: return f"{mcap/1e12:.2f}T"
    if mcap >= 1e9: return f"{mcap/1e9:.2f}B"
    if mcap >= 1e6: return f"{mcap/1e6:.2f}M"
    return str(mcap)

@app.route('/api/market-dashboard')
def get_market_dashboard():
    stats_config = [
        {'label': 'S&P 500', 'ticker': '^GSPC', 'icon': 'trending_up'},
        {'label': 'NASDAQ', 'ticker': '^IXIC', 'icon': 'memory'},
        {'label': 'BTC / USD', 'ticker': 'BTC-USD', 'icon': 'currency_bitcoin'},
        {'label': 'BRENT CRUDE', 'ticker': 'BZ=F', 'icon': 'oil_barrel'},
    ]
    equities_config = [
        {'ticker': 'NVDA', 'name': 'NVIDIA Corp.'},
        {'ticker': 'AAPL', 'name': 'Apple Inc.'},
        {'ticker': 'TSLA', 'name': 'Tesla Motors'},
        {'ticker': 'AMD', 'name': 'Advanced Micro Devices'},
        {'ticker': 'META', 'name': 'Meta Platforms Inc.'},
    ]

    all_tickers = [item['ticker'] for item in stats_config + equities_config]
    
    # Download recent prices
    df = yf.download(all_tickers, period='5d', progress=False)
    if isinstance(df.columns, pd.MultiIndex):
        close_df = df['Close']
    else:
        close_df = df  # single ticker edge case, shouldn't happen here
        
    stats_data = []
    for item in stats_config:
        ticker = item['ticker']
        try:
            prices = close_df[ticker].dropna()
            if len(prices) >= 2:
                last_price = float(prices.iloc[-1])
                prev_price = float(prices.iloc[-2])
            elif len(prices) == 1:
                last_price = float(prices.iloc[-1])
                prev_price = last_price
            else:
                last_price = prev_price = 0

            diff = last_price - prev_price
            pct_change = (diff / prev_price * 100) if prev_price > 0 else 0
            is_up = diff >= 0
            
            val_str = f"{last_price:,.2f}"
            change_str = f"{'+' if is_up else ''}{pct_change:.2f}%"
            abs_str = f"{'+' if is_up else ''}{diff:,.2f} Today"
            
            stats_data.append({
                'label': item['label'],
                'value': val_str,
                'change': change_str,
                'abs': abs_str,
                'up': is_up,
                'icon': item['icon']
            })
        except Exception:
            pass

    equities_data = []
    
    def fetch_equity_info(item):
        ticker = item['ticker']
        try:
            info = yf.Ticker(ticker).info
            mcap = format_mcap(info.get('marketCap'))
            pe = info.get('trailingPE')
            pe_str = f"{pe:.1f}x" if pe else "N/A"
            
            prices = close_df[ticker].dropna()
            if len(prices) >= 2:
                last_price = float(prices.iloc[-1])
                prev_price = float(prices.iloc[-2])
            elif len(prices) == 1:
                last_price = float(prices.iloc[-1])
                prev_price = last_price
            else:
                last_price = prev_price = 0
                
            diff = last_price - prev_price
            pct_change = (diff / prev_price * 100) if prev_price > 0 else 0
            is_up = diff >= 0
            
            return {
                'ticker': ticker,
                'name': item['name'],
                'price': f"${last_price:,.2f}",
                'change': f"{'+' if is_up else ''}{pct_change:.2f}%",
                'mcap': mcap,
                'pe': pe_str,
                'up': is_up
            }
        except Exception:
            return None

    with concurrent.futures.ThreadPoolExecutor() as executor:
        results = executor.map(fetch_equity_info, equities_config)
        for res in results:
            if res:
                equities_data.append(res)
                
    heatmap_data = [
        {'sector': 'TECH', 'pct': '+1.5%', 'up': True, 'span': 1},
        {'sector': 'SEMIS', 'pct': '+2.1%', 'up': True, 'span': 1},
        {'sector': 'ENERGY', 'pct': '-0.5%', 'up': False, 'span': 1},
        {'sector': 'FINANCE', 'pct': '+0.8%', 'up': True, 'span': 2},
        {'sector': 'HLTH', 'pct': '-1.2%', 'up': False, 'span': 1},
        {'sector': 'RETAIL', 'pct': '+0.1%', 'up': True, 'span': 1},
        {'sector': 'UTIL', 'pct': '-0.3%', 'up': False, 'span': 2},
    ]
    
    news_data = [
        {'time': 'LIVE', 'title': 'Market opens with tech rally leading the indices', 'tags': ['MARKETS', 'TECH'], 'featured': True},
        {'time': '1H AGO', 'title': 'Fed hints at maintaining current interest rates', 'tags': ['MACRO', 'RATES'], 'featured': False},
        {'time': '2H AGO', 'title': 'Energy sector dips as oil prices stabilize', 'tags': ['COMMODITIES'], 'featured': False},
    ]

    return jsonify({
        'stats': stats_data,
        'equities': equities_data,
        'heatmap': heatmap_data,
        'news': news_data
    })
