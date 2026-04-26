# System Architecture: Market Insight Pro

## 1. Overview
Market Insight Pro is an advanced stock market analytics platform. It provides interactive price charts, portfolio tracking, and an automated AI-driven trading signal generator. The application is built around a **three-layer signal confirmation system** (Candlestick Patterns, DMA Crossover, and a Price Safety Filter).

The system consists of a robust Python data-processing backend, a Flask REST API, a Streamlit-based interactive dashboard, and a modern React (Vite) frontend.

---

## 2. Core Components

### 2.1. Data Processing Engine (`data_processor.py`)
This module is the mathematical and financial core of the application. It is independent of the web frameworks and handles data fetching and signal generation.
- **Data Ingestion (`fetch_data`)**: Retrieves historical market data (Open, High, Low, Close, Volume) using the `yfinance` library.
- **Signal Engine (`calculate_indicators`)**: Evaluates the data to generate precise entry and exit points using a strict 3-step verification process:
  1. **Layer 1 (Candlestick Pattern)**: Detects 8 classic candlestick structures (e.g., Bullish/Bearish Engulfing, Hammer, Morning Star, Shooting Star) contextualized by the current trend.
  2. **Layer 2 (DMA Crossover)**: Confirms the pattern by scanning for a Fast vs. Slow Dual Moving Average crossover within a configurable `crossover_window` (default 5 days).
  3. **Layer 3 (Safety Filter)**: Waits for the price to close above/below the Fast DMA within a `safety_window` (default 10 days) to filter out false breakouts and confirm the trend commitment.
- Outputs clean DataFrame structures alongside definitive `Final_Buy` and `Final_Sell` Boolean series.

### 2.2. Flask REST API (`api.py`)
Acts as the communication bridge between the React frontend and the Python data engine.
- Runs on port `5000` with `flask_cors` enabled to allow local cross-origin requests from the React dev server (port `5173`).
- **Endpoints**:
  - `GET /api/stock/<symbol>`: Parses query parameters (period, fast/slow DMA), calls the data processor, cleans NaN values, and returns a structured JSON payload containing daily price data and a log of triggered buy/sell patterns.
  - `GET /api/market-dashboard`: Aggregates top-level market stats (S&P 500, NASDAQ, BTC, Crude Oil) and specific equity performances (NVDA, AAPL, etc.). It uses `concurrent.futures.ThreadPoolExecutor` to perform concurrent external API requests, drastically improving loading times.

### 2.3. Streamlit Application (`app.py`)
A comprehensive, full-stack Python application that serves as an alternative or supplementary dashboard to the React frontend.
- **Pages**:
  - *Landing Page*: Introduces the user to the tool and the three-layer signal methodology.
  - *Market Dashboard*: Allows users to select a ticker, time period, and signal settings.
  - *Visualizations*: Uses `plotly.graph_objects` to render highly interactive, combined subplots (Candlesticks, Volume bars, DMA lines, and Signal annotations).
- **Styling**: Uses extensive injected custom CSS to create a modern, dark-themed, glass-morphism aesthetic.

### 2.4. React Frontend (`src/`, `vite.config.js`)
A modern Single Page Application (SPA) built with React.
- **Tooling**: Bundled via Vite for lightning-fast hot module replacement.
- **Role**: Communicates with the Flask API to retrieve real-time calculated signals and renders the UI (e.g., `MarketDashboard.jsx`).

---

## 3. Request Lifecycle & Data Flow

1. **User Interaction**: 
   - A user interacts with the React interface (or Streamlit sidebar) and requests analysis for a specific ticker (e.g., "AAPL") over a given time period (e.g., "1y").
2. **API Request**: 
   - The React frontend fires an HTTP GET request to `http://localhost:5000/api/stock/AAPL?period=1y&dma_fast=20&dma_slow=50`.
3. **Data Retrieval**: 
   - `api.py` receives the request and delegates it to `fetch_data` in `data_processor.py`.
   - `yfinance` connects to the Yahoo Finance API to download the raw historical data.
4. **Signal Processing**: 
   - The raw data is passed into `calculate_indicators`. Moving averages are computed, candlestick patterns are detected row-by-row, and loops scan forward for DMA crossovers and price confirmations.
5. **Data Formatting & Response**:
   - The verified DataFrame is returned to the API layer, serialized into JSON format (handling native `NaN`/`None` conversion), and sent back to the client.
6. **Client Rendering**: 
   - The React frontend (or Streamlit) maps the JSON data into a charting library to visualize the candlestick chart, highlighting the `Final_Buy` and `Final_Sell` markers.
