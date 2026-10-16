import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from 'lucide-react';
import type { Candle } from '../types/market';
import { useTrading } from '../context/TradingContext';
import type { TimeFrame } from '../context/TradingContext';

export const ChartContainer: React.FC = () => {
  const {
    activeInstrument,
    candles,
    timeframe,
    setTimeframe,
    openOrderModal,
  } = useTrading();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Indicators toggle
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showVWAP, setShowVWAP] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  // Hover state for crosshair
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);

  // Zoom & Pan state
  const [visibleBars, setVisibleBars] = useState<number>(50);

  // Calculate EMA series
  const ema20 = useMemo(() => {
    if (candles.length === 0) return [];
    const k = 2 / (20 + 1);
    const result: number[] = [];
    let prev = candles[0].close;
    result.push(prev);

    for (let i = 1; i < candles.length; i++) {
      const current = candles[i].close * k + prev * (1 - k);
      result.push(current);
      prev = current;
    }
    return result;
  }, [candles]);

  const ema50 = useMemo(() => {
    if (candles.length === 0) return [];
    const k = 2 / (50 + 1);
    const result: number[] = [];
    let prev = candles[0].close;
    result.push(prev);

    for (let i = 1; i < candles.length; i++) {
      const current = candles[i].close * k + prev * (1 - k);
      result.push(current);
      prev = current;
    }
    return result;
  }, [candles]);

  // Calculate VWAP series
  const vwapSeries = useMemo(() => {
    let cumVol = 0;
    let cumVolPrice = 0;
    return candles.map(c => {
      const typical = (c.high + c.low + c.close) / 3;
      cumVol += c.volume;
      cumVolPrice += typical * c.volume;
      return cumVol > 0 ? cumVolPrice / cumVol : typical;
    });
  }, [candles]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || candles.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;

    // Layout configuration
    const paddingRight = 65; // Price scale width
    const paddingBottom = 26; // Time scale height
    const paddingTop = 32; // Top header info
    const plotWidth = width - paddingRight;
    const plotHeight = height - paddingBottom - paddingTop;

    const volumeHeight = showVolume ? Math.floor(plotHeight * 0.22) : 0;
    const pricePlotHeight = plotHeight - volumeHeight;

    // Visible window
    const startIndex = Math.max(0, candles.length - visibleBars);
    const visibleCandles = candles.slice(startIndex);
    const visibleCount = visibleCandles.length;

    // Find min and max price
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    visibleCandles.forEach(c => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVolume) maxVolume = c.volume;
    });

    // Add 4% padding to top and bottom price scale
    const priceRange = maxPrice - minPrice || 1;
    minPrice -= priceRange * 0.04;
    maxPrice += priceRange * 0.04;
    const adjustedRange = maxPrice - minPrice;

    // Helpers
    const getX = (index: number) => {
      const barWidth = plotWidth / visibleCount;
      return index * barWidth + barWidth / 2;
    };

    const getY = (price: number) => {
      return paddingTop + pricePlotHeight - ((price - minPrice) / adjustedRange) * pricePlotHeight;
    };

    const getVolY = (vol: number) => {
      return paddingTop + plotHeight - (vol / (maxVolume || 1)) * volumeHeight;
    };

    // 1. Draw Grid Lines
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#151c2c';
    ctx.lineWidth = 1;

    // Horizontal price grid lines (5 levels)
    const gridSteps = 6;
    for (let i = 0; i <= gridSteps; i++) {
      const priceVal = minPrice + (adjustedRange / gridSteps) * i;
      const y = getY(priceVal);

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(plotWidth, y);
      ctx.stroke();

      // Price labels on right scale
      ctx.fillStyle = '#64748b';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(priceVal.toFixed(2), plotWidth + 8, y + 4);
    }

    // Vertical time grid lines
    const timeSteps = Math.min(8, visibleCount);
    for (let i = 0; i < timeSteps; i++) {
      const idx = Math.floor((i / timeSteps) * visibleCount);
      const x = getX(idx);
      const c = visibleCandles[idx];

      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, paddingTop + plotHeight);
      ctx.stroke();

      // Time labels on bottom axis
      if (c) {
        const date = new Date(c.time * 1000);
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        ctx.fillStyle = '#64748b';
        ctx.font = '10px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, x, height - 8);
      }
    }

    // 2. Draw Volume Bars
    if (showVolume) {
      const barWidth = Math.max(2, (plotWidth / visibleCount) * 0.7);
      visibleCandles.forEach((c, idx) => {
        const x = getX(idx);
        const y = getVolY(c.volume);
        const isUp = c.close >= c.open;

        ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)';
        ctx.fillRect(x - barWidth / 2, y, barWidth, paddingTop + plotHeight - y);
      });
    }

    // 3. Draw Indicators (EMA 20, EMA 50, VWAP)
    const drawSeries = (series: number[], color: string, lineWidth: number = 1.5) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      let started = false;
      for (let i = 0; i < visibleCount; i++) {
        const globalIdx = startIndex + i;
        const val = series[globalIdx];
        if (val !== undefined) {
          const x = getX(i);
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    };

    if (showVWAP) drawSeries(vwapSeries, '#f59e0b', 1.5);
    if (showEMA20) drawSeries(ema20, '#06b6d4', 1.5);
    if (showEMA50) drawSeries(ema50, '#8b5cf6', 1.5);

    // 4. Draw Candlesticks (Wick & Body)
    const candleWidth = Math.max(3, (plotWidth / visibleCount) * 0.72);

    visibleCandles.forEach((c, idx) => {
      const x = getX(idx);
      const isUp = c.close >= c.open;
      const color = isUp ? '#10b981' : '#f43f5e';

      const openY = getY(c.open);
      const closeY = getY(c.close);
      const highY = getY(c.high);
      const lowY = getY(c.low);

      // Draw Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw Candle Body
      ctx.fillStyle = color;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(2, Math.abs(openY - closeY));
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // 5. Current LTP dashed line across chart
    if (activeInstrument) {
      const currentY = getY(activeInstrument.ltp);
      const isUp = activeInstrument.change >= 0;

      ctx.strokeStyle = isUp ? 'rgba(16, 185, 129, 0.65)' : 'rgba(244, 63, 94, 0.65)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(plotWidth, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Current price badge on axis
      ctx.fillStyle = isUp ? '#10b981' : '#f43f5e';
      ctx.fillRect(plotWidth, currentY - 10, paddingRight, 20);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(activeInstrument.ltp.toFixed(activeInstrument.precision), plotWidth + 6, currentY + 4);
    }

    // 6. Draw Interactive Crosshair & Cursor Labels
    if (hoverCoord && hoverCoord.x >= 0 && hoverCoord.x <= plotWidth && hoverCoord.y >= paddingTop && hoverCoord.y <= paddingTop + plotHeight) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(hoverCoord.x, paddingTop);
      ctx.lineTo(hoverCoord.x, paddingTop + plotHeight);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, hoverCoord.y);
      ctx.lineTo(plotWidth, hoverCoord.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pinned price on right axis
      const hoverPrice = minPrice + ((paddingTop + pricePlotHeight - hoverCoord.y) / pricePlotHeight) * adjustedRange;
      ctx.fillStyle = '#334155';
      ctx.fillRect(plotWidth, hoverCoord.y - 9, paddingRight, 18);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(hoverPrice.toFixed(2), plotWidth + 6, hoverCoord.y + 4);
    }

  }, [candles, visibleBars, showEMA20, showEMA50, showVWAP, showVolume, hoverCoord, activeInstrument, ema20, ema50, vwapSeries]);

  // Handle mouse move for crosshair and candle inspection
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container || candles.length === 0) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const paddingRight = 65;
    const plotWidth = rect.width - paddingRight;

    if (x >= 0 && x <= plotWidth) {
      setHoverCoord({ x, y });
      const startIndex = Math.max(0, candles.length - visibleBars);
      const visibleCandles = candles.slice(startIndex);
      const barWidth = plotWidth / visibleCandles.length;
      const index = Math.floor(x / barWidth);
      if (visibleCandles[index]) {
        setHoveredCandle(visibleCandles[index]);
      }
    } else {
      setHoverCoord(null);
      setHoveredCandle(null);
    }
  }, [candles, visibleBars]);

  const handleMouseLeave = () => {
    setHoverCoord(null);
    setHoveredCandle(null);
  };

  const displayCandle = hoveredCandle || candles[candles.length - 1];

  return (
    <div className="chart-wrapper">
      {/* Chart Top Header & Toolbar */}
      <div className="chart-toolbar">
        <div className="instrument-title-bar">
          <span className="inst-main-symbol">{activeInstrument?.symbol}</span>
          <span className="inst-main-name">{activeInstrument?.name}</span>
          <span className="inst-badge">{activeInstrument?.exchange}</span>

          {/* Quick Buy/Sell in Chart Header */}
          <div className="chart-quick-trade">
            <button
              className="quick-chart-buy"
              onClick={() => activeInstrument && openOrderModal(activeInstrument.symbol, 'BUY', activeInstrument.ltp, activeInstrument.name)}
            >
              BUY ${activeInstrument?.ltp.toFixed(2)}
            </button>
            <button
              className="quick-chart-sell"
              onClick={() => activeInstrument && openOrderModal(activeInstrument.symbol, 'SELL', activeInstrument.ltp, activeInstrument.name)}
            >
              SELL ${activeInstrument?.ltp.toFixed(2)}
            </button>
          </div>
        </div>

        {/* Timeframe Selectors */}
        <div className="timeframe-group">
          {(['1m', '5m', '15m', '1D'] as TimeFrame[]).map(tf => (
            <button
              key={tf}
              className={`tf-btn ${timeframe === tf ? 'active' : ''}`}
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Indicator Toggles */}
        <div className="indicator-group">
          <button
            className={`ind-pill ${showEMA20 ? 'active cyan' : ''}`}
            onClick={() => setShowEMA20(!showEMA20)}
            title="Toggle 20-period Exponential Moving Average"
          >
            EMA 20
          </button>
          <button
            className={`ind-pill ${showEMA50 ? 'active purple' : ''}`}
            onClick={() => setShowEMA50(!showEMA50)}
            title="Toggle 50-period Exponential Moving Average"
          >
            EMA 50
          </button>
          <button
            className={`ind-pill ${showVWAP ? 'active amber' : ''}`}
            onClick={() => setShowVWAP(!showVWAP)}
            title="Toggle Volume Weighted Average Price"
          >
            VWAP
          </button>
          <button
            className={`ind-pill ${showVolume ? 'active' : ''}`}
            onClick={() => setShowVolume(!showVolume)}
            title="Toggle Volume Histogram"
          >
            VOL
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="chart-zoom-tools">
          <button
            className="tool-icon-btn"
            onClick={() => setVisibleBars(prev => Math.max(20, prev - 10))}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            className="tool-icon-btn"
            onClick={() => setVisibleBars(prev => Math.min(100, prev + 10))}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            className="tool-icon-btn"
            onClick={() => setVisibleBars(50)}
            title="Reset Zoom"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Floating Candle Metrics Strip (Open, High, Low, Close, Volume) */}
      {displayCandle && (
        <div className="candle-metrics-strip">
          <div className="metric-chip">
            <span className="lbl">O:</span>
            <span className="val tabular-nums">${displayCandle.open.toFixed(2)}</span>
          </div>
          <div className="metric-chip">
            <span className="lbl">H:</span>
            <span className="val tabular-nums text-bull">${displayCandle.high.toFixed(2)}</span>
          </div>
          <div className="metric-chip">
            <span className="lbl">L:</span>
            <span className="val tabular-nums text-bear">${displayCandle.low.toFixed(2)}</span>
          </div>
          <div className="metric-chip">
            <span className="lbl">C:</span>
            <span className="val tabular-nums">${displayCandle.close.toFixed(2)}</span>
          </div>
          <div className="metric-chip">
            <span className="lbl">VOL:</span>
            <span className="val tabular-nums">{(displayCandle.volume / 1000).toFixed(1)}k</span>
          </div>
          <div className="metric-chip change">
            {displayCandle.close >= displayCandle.open ? (
              <span className="text-bull tabular-nums">
                +{(displayCandle.close - displayCandle.open).toFixed(2)} (+{(((displayCandle.close - displayCandle.open) / displayCandle.open) * 100).toFixed(2)}%)
              </span>
            ) : (
              <span className="text-bear tabular-nums">
                -{(displayCandle.open - displayCandle.close).toFixed(2)} ({(((displayCandle.close - displayCandle.open) / displayCandle.open) * 100).toFixed(2)}%)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Canvas Mount */}
      <div
        className="canvas-container"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <canvas ref={canvasRef} className="trading-canvas" />
      </div>
    </div>
  );
};
