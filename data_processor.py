import yfinance as yf
import pandas as pd
import numpy as np

def fetch_data(symbol, time_period):
    df = yf.download(symbol, period=time_period, progress=False)
    if not df.empty:
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.droplevel(1)
        df = df.rename(columns={
            'Open': 'Open', 'High': 'High', 'Low': 'Low',
            'Close': 'Close', 'Volume': 'Volume'
        })
        return df
    return pd.DataFrame()


def calculate_indicators(data, dma_fast, dma_slow, safety_window=10, crossover_window=5):
    df = data.copy()

    df[f'DMA_{dma_fast}'] = df['Close'].rolling(window=dma_fast).mean()
    df[f'DMA_{dma_slow}'] = df['Close'].rolling(window=dma_slow).mean()

    fast = df[f'DMA_{dma_fast}']
    slow = df[f'DMA_{dma_slow}']

    in_downtrend = fast < slow
    in_uptrend   = fast > slow

    prev_open  = df['Open'].shift(1)
    prev_close = df['Close'].shift(1)
    curr_open  = df['Open']
    curr_close = df['Close']
    body       = (curr_close - curr_open).abs()
    min_body   = curr_close * 0.001

    is_prev_red   = prev_open > prev_close
    is_curr_green = curr_close > curr_open
    engulfs_bull  = ((curr_open <= prev_close) & (curr_close >= prev_open) &
                     ((curr_close - curr_open) > (prev_open - prev_close)))
    df['Pat_Bull_Engulfing'] = is_prev_red & is_curr_green & engulfs_bull & in_downtrend & (body > min_body)

    is_prev_green = prev_close > prev_open
    is_curr_red   = curr_open > curr_close
    engulfs_bear  = ((curr_open >= prev_close) & (curr_close <= prev_open) &
                     ((curr_open - curr_close) > (prev_close - prev_open)))
    df['Pat_Bear_Engulfing'] = is_prev_green & is_curr_red & engulfs_bear & in_uptrend & (body > min_body)

    body_bottom_h  = curr_open.where(curr_close > curr_open, curr_close)
    body_top_h     = curr_close.where(curr_close > curr_open, curr_open)
    lower_shadow_h = body_bottom_h - df['Low']
    upper_shadow_h = df['High'] - body_top_h

    df['Pat_Hammer'] = (
        in_downtrend & (body > min_body) &
        (lower_shadow_h >= 2 * body) &
        (upper_shadow_h <= 0.5 * body)
    )

    df['Pat_Inv_Hammer'] = (
        in_downtrend & (body > min_body) &
        (upper_shadow_h >= 2 * body) &
        (lower_shadow_h <= 0.5 * body)
    )

    df['Pat_Hanging_Man'] = (
        in_uptrend & (body > min_body) &
        (lower_shadow_h >= 2 * body) &
        (upper_shadow_h <= 0.5 * body)
    )

    df['Pat_Shooting_Star'] = (
        in_uptrend & (body > min_body) &
        (upper_shadow_h >= 2 * body) &
        (lower_shadow_h <= 0.5 * body)
    )

    d1_red     = df['Open'].shift(2) > df['Close'].shift(2)
    d1_body    = (df['Open'].shift(2) - df['Close'].shift(2)).abs()
    d2_body    = (df['Open'].shift(1) - df['Close'].shift(1)).abs()
    d3_green   = curr_close > curr_open
    d3_body_sz = curr_close - curr_open
    df['Pat_Morning_Star'] = (
        in_downtrend & d1_red &
        (d2_body < 0.5 * d1_body) &
        d3_green & (d3_body_sz > 0.5 * d1_body) &
        (curr_close > (df['Open'].shift(2) + df['Close'].shift(2)) / 2)
    )

    d1_green_es = df['Close'].shift(2) > df['Open'].shift(2)
    d1_body_es  = (df['Close'].shift(2) - df['Open'].shift(2)).abs()
    d2_body_es  = (df['Open'].shift(1) - df['Close'].shift(1)).abs()
    d3_red_es   = curr_open > curr_close
    d3_body_es  = curr_open - curr_close
    df['Pat_Evening_Star'] = (
        in_uptrend & d1_green_es &
        (d2_body_es < 0.5 * d1_body_es) &
        d3_red_es & (d3_body_es > 0.5 * d1_body_es) &
        (curr_close < (df['Open'].shift(2) + df['Close'].shift(2)) / 2)
    )

    bullish_pattern_cols = ['Pat_Bull_Engulfing', 'Pat_Hammer', 'Pat_Inv_Hammer', 'Pat_Morning_Star']
    bearish_pattern_cols = ['Pat_Bear_Engulfing', 'Pat_Hanging_Man', 'Pat_Shooting_Star', 'Pat_Evening_Star']

    df['Any_Bullish_Pattern'] = df[bullish_pattern_cols].any(axis=1)
    df['Any_Bearish_Pattern'] = df[bearish_pattern_cols].any(axis=1)

    def get_pattern_name(row):
        for col in bullish_pattern_cols + bearish_pattern_cols:
            if row.get(col, False):
                return col.replace('Pat_', '').replace('_', ' ')
        return ''
    df['Pattern_Name'] = df.apply(get_pattern_name, axis=1)

    n          = len(df)
    final_buy  = np.zeros(n, dtype=bool)
    final_sell = np.zeros(n, dtype=bool)

    fast_arr  = fast.values
    slow_arr  = slow.values
    close_arr = df['Close'].values
    bull_pat  = df['Any_Bullish_Pattern'].values
    bear_pat  = df['Any_Bearish_Pattern'].values

    for i in range(n):
        if (bull_pat[i] and
                not np.isnan(fast_arr[i]) and not np.isnan(slow_arr[i]) and
                fast_arr[i] < slow_arr[i]):

            crossover_bar = -1
            for j in range(i, min(i + crossover_window + 1, n)):
                if j == 0:
                    continue
                fj, sj, fjp, sjp = fast_arr[j], slow_arr[j], fast_arr[j-1], slow_arr[j-1]
                if not (np.isnan(fj) or np.isnan(sj) or np.isnan(fjp) or np.isnan(sjp)):
                    if fj > sj and fjp <= sjp:
                        crossover_bar = j
                        break

            if crossover_bar != -1:
                for k in range(crossover_bar, min(crossover_bar + safety_window + 1, n)):
                    if not np.isnan(fast_arr[k]) and close_arr[k] > fast_arr[k]:
                        final_buy[k] = True
                        break

        if (bear_pat[i] and
                not np.isnan(fast_arr[i]) and not np.isnan(slow_arr[i]) and
                fast_arr[i] > slow_arr[i]):

            crossover_bar = -1
            for j in range(i, min(i + crossover_window + 1, n)):
                if j == 0:
                    continue
                fj, sj, fjp, sjp = fast_arr[j], slow_arr[j], fast_arr[j-1], slow_arr[j-1]
                if not (np.isnan(fj) or np.isnan(sj) or np.isnan(fjp) or np.isnan(sjp)):
                    if fj < sj and fjp >= sjp:
                        crossover_bar = j
                        break

            if crossover_bar != -1:
                for k in range(crossover_bar, min(crossover_bar + safety_window + 1, n)):
                    if not np.isnan(fast_arr[k]) and close_arr[k] < fast_arr[k]:
                        final_sell[k] = True
                        break

    df['Final_Buy']  = final_buy
    df['Final_Sell'] = final_sell

    buy_signal  = pd.Series(np.where(df['Final_Buy'],  df['Low']  * 0.98, np.nan), index=df.index)
    sell_signal = pd.Series(np.where(df['Final_Sell'], df['High'] * 1.02, np.nan), index=df.index)

    return df, buy_signal, sell_signal
