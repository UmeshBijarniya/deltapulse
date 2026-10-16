import type { Candle, EngineTelemetry, Instrument, OrderBook, OrderBookLevel } from '../types/market';

// Initial instrument catalog
export const INITIAL_INSTRUMENTS: Instrument[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    category: 'EQUITY',
    ltp: 128.85,
    prevClose: 126.40,
    change: 2.45,
    changePercent: 1.94,
    open: 127.10,
    high: 129.60,
    low: 126.80,
    volume: 48920100,
    tickDirection: 'up',
    lastTickTime: Date.now(),
    sparkline: [126.4, 126.9, 127.3, 126.8, 127.8, 128.2, 127.9, 128.85],
    lotSize: 1,
    precision: 2,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    exchange: 'NASDAQ',
    category: 'EQUITY',
    ltp: 242.30,
    prevClose: 246.10,
    change: -3.80,
    changePercent: -1.54,
    open: 245.50,
    high: 247.20,
    low: 241.10,
    volume: 34105000,
    tickDirection: 'down',
    lastTickTime: Date.now(),
    sparkline: [246.1, 245.8, 244.2, 243.5, 244.1, 242.9, 243.1, 242.3],
    lotSize: 1,
    precision: 2,
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    exchange: 'CBOE',
    category: 'INDEX',
    ltp: 563.15,
    prevClose: 560.80,
    change: 2.35,
    changePercent: 0.42,
    open: 561.20,
    high: 563.90,
    low: 560.95,
    volume: 62410800,
    tickDirection: 'up',
    lastTickTime: Date.now(),
    sparkline: [560.8, 561.4, 561.9, 562.1, 562.7, 562.4, 562.9, 563.15],
    lotSize: 1,
    precision: 2,
  },
  {
    symbol: 'NIFTY50',
    name: 'NIFTY 50 Benchmark',
    exchange: 'NSE',
    category: 'INDEX',
    ltp: 24865.40,
    prevClose: 24780.20,
    change: 85.20,
    changePercent: 0.34,
    open: 24800.00,
    high: 24910.50,
    low: 24775.10,
    volume: 184500000,
    tickDirection: 'up',
    lastTickTime: Date.now(),
    sparkline: [24780, 24810, 24835, 24820, 24855, 24840, 24870, 24865.4],
    lotSize: 25,
    precision: 2,
  },
  {
    symbol: 'BANKNIFTY',
    name: 'NIFTY Bank Index',
    exchange: 'NSE',
    category: 'F&O',
    ltp: 51240.80,
    prevClose: 51420.00,
    change: -179.20,
    changePercent: -0.35,
    open: 51380.00,
    high: 51510.00,
    low: 51180.00,
    volume: 98450000,
    tickDirection: 'down',
    lastTickTime: Date.now(),
    sparkline: [51420, 51390, 51310, 51350, 51280, 51220, 51260, 51240.8],
    lotSize: 15,
    precision: 2,
  },
  {
    symbol: 'BTC-USD',
    name: 'Bitcoin / US Dollar',
    exchange: 'BINANCE',
    category: 'CRYPTO',
    ltp: 67450.00,
    prevClose: 65980.00,
    change: 1470.00,
    changePercent: 2.23,
    open: 66100.00,
    high: 67890.00,
    low: 65920.00,
    volume: 24100,
    tickDirection: 'up',
    lastTickTime: Date.now(),
    sparkline: [65980, 66300, 66750, 66400, 66900, 67200, 67150, 67450],
    lotSize: 0.001,
    precision: 2,
  },
  {
    symbol: 'ETH-USD',
    name: 'Ethereum / US Dollar',
    exchange: 'BINANCE',
    category: 'CRYPTO',
    ltp: 2642.50,
    prevClose: 2615.00,
    change: 27.50,
    changePercent: 1.05,
    open: 2618.00,
    high: 2665.00,
    low: 2608.00,
    volume: 185400,
    tickDirection: 'up',
    lastTickTime: Date.now(),
    sparkline: [2615, 2622, 2635, 2628, 2645, 2638, 2640, 2642.5],
    lotSize: 0.01,
    precision: 2,
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    category: 'EQUITY',
    ltp: 228.95,
    prevClose: 227.60,
    change: 1.35,
    changePercent: 0.59,
    open: 227.80,
    high: 229.40,
    low: 227.30,
    volume: 38200400,
    tickDirection: 'up',
    lastTickTime: Date.now(),
    sparkline: [227.6, 227.9, 228.2, 228.0, 228.5, 228.4, 228.7, 228.95],
    lotSize: 1,
    precision: 2,
  },
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    exchange: 'NSE',
    category: 'EQUITY',
    ltp: 2984.60,
    prevClose: 2955.00,
    change: 29.60,
    changePercent: 1.00,
    open: 2960.00,
    high: 2995.00,
    low: 2958.00,
    volume: 5890000,
    tickDirection: 'up',
    lastTickTime: Date.now(),
    sparkline: [2955, 2962, 2970, 2965, 2978, 2982, 2980, 2984.6],
    lotSize: 10,
    precision: 2,
  }
];

// Generates synthetic historical candles
export function generateInitialCandles(basePrice: number, count: number = 80, intervalMinutes: number = 5): Candle[] {
  const candles: Candle[] = [];
  const now = Math.floor(Date.now() / 1000);
  const intervalSeconds = intervalMinutes * 60;
  let currentPrice = basePrice * (1 - (count * 0.001));

  for (let i = count; i >= 0; i--) {
    const time = now - (i * intervalSeconds);
    const volatility = currentPrice * 0.004;
    const delta = (Math.random() - 0.48) * volatility;
    const open = currentPrice;
    const close = +(open + delta).toFixed(2);
    const high = +(Math.max(open, close) + Math.random() * volatility * 0.7).toFixed(2);
    const low = +(Math.min(open, close) - Math.random() * volatility * 0.7).toFixed(2);
    const volume = Math.floor(Math.random() * 50000 + 8000);

    candles.push({ time, open, high, low, close, volume });
    currentPrice = close;
  }

  return candles;
}

// Generate realistic L2 Order Book Depth
export function generateOrderBook(symbol: string, ltp: number, precision: number = 2): OrderBook {
  const levelsCount = 10;
  const spreadBasis = ltp > 10000 ? 2.5 : ltp > 1000 ? 0.5 : 0.05;
  const halfSpread = spreadBasis / 2;

  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];

  let cumBid = 0;
  let cumAsk = 0;

  // Step sizes
  const step = spreadBasis * (0.8 + Math.random() * 0.4);

  // Generate 10 ask levels (above LTP)
  for (let i = 0; i < levelsCount; i++) {
    const price = +(ltp + halfSpread + (i * step)).toFixed(precision);
    const size = Math.floor((15 + Math.random() * 85) * (1 + (levelsCount - i) * 0.15));
    cumAsk += size;
    asks.push({
      price,
      size,
      total: cumAsk,
      percent: 0,
      count: Math.floor(1 + Math.random() * 7),
    });
  }

  // Generate 10 bid levels (below LTP)
  for (let i = 0; i < levelsCount; i++) {
    const price = +(ltp - halfSpread - (i * step)).toFixed(precision);
    const size = Math.floor((15 + Math.random() * 85) * (1 + (levelsCount - i) * 0.15));
    cumBid += size;
    bids.push({
      price,
      size,
      total: cumBid,
      percent: 0,
      count: Math.floor(1 + Math.random() * 7),
    });
  }

  const maxTotal = Math.max(cumBid, cumAsk);
  bids.forEach(b => b.percent = Math.min(100, Math.round((b.total / maxTotal) * 100)));
  asks.forEach(a => a.percent = Math.min(100, Math.round((a.total / maxTotal) * 100)));

  const bestBid = bids[0].price;
  const bestAsk = asks[0].price;
  const spread = +(bestAsk - bestBid).toFixed(precision);
  const spreadPercent = +((spread / ltp) * 100).toFixed(3);
  const microPrice = +(((bestBid * cumAsk) + (bestAsk * cumBid)) / (cumBid + cumAsk)).toFixed(precision);
  const imbalance = +((cumBid - cumAsk) / (cumBid + cumAsk)).toFixed(3);

  return {
    symbol,
    bids,
    asks,
    spread,
    spreadPercent,
    microPrice,
    totalBidVol: cumBid,
    totalAskVol: cumAsk,
    imbalance,
  };
}

export type TickListener = (instruments: Instrument[], orderBooks: Record<string, OrderBook>, telemetry: EngineTelemetry) => void;

/**
 * High-Frequency Market Data Engine with RAF double-buffering
 */
export class MarketDataEngine {
  private instruments: Map<string, Instrument> = new Map();
  private orderBooks: Map<string, OrderBook> = new Map();
  private candles: Map<string, Candle[]> = new Map();
  private listeners: Set<TickListener> = new Set();

  private isRunning: boolean = false;
  private intervalTimer: number | null = null;
  private rafId: number | null = null;

  private speedMultiplier: number = 1;
  private isConnected: boolean = true;
  private isPaused: boolean = false;

  // Telemetry metrics
  private packetCount: number = 0;
  private ticksInCurrentSec: number = 0;
  private lastSecTimestamp: number = performance.now();
  private currentTicksPerSec: number = 42;
  private frameCount: number = 0;
  private currentFPS: number = 60;
  private latencyMs: number = 14;

  private pendingInstrumentsToDispatch: Instrument[] | null = null;

  constructor() {
    INITIAL_INSTRUMENTS.forEach(inst => {
      this.instruments.set(inst.symbol, { ...inst });
      this.orderBooks.set(inst.symbol, generateOrderBook(inst.symbol, inst.ltp, inst.precision));
      this.candles.set(inst.symbol, generateInitialCandles(inst.ltp));
    });
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNextTickBatch();
    this.startRafLoop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.intervalTimer) {
      clearTimeout(this.intervalTimer);
      this.intervalTimer = null;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public subscribe(listener: TickListener): () => void {
    this.listeners.add(listener);
    // Initial emission
    listener(
      Array.from(this.instruments.values()),
      Object.fromEntries(this.orderBooks),
      this.getTelemetry()
    );
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setSpeed(multiplier: number): void {
    this.speedMultiplier = Math.max(0.1, Math.min(20, multiplier));
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  public simulateDisconnect(durationMs: number = 4000): void {
    this.isConnected = false;
    this.notifyTelemetryChange();

    setTimeout(() => {
      this.isConnected = true;
      this.notifyTelemetryChange();
    }, durationMs);
  }

  public getCandles(symbol: string): Candle[] {
    return this.candles.get(symbol) || [];
  }

  public getInstrument(symbol: string): Instrument | undefined {
    return this.instruments.get(symbol);
  }

  public getOrderBook(symbol: string): OrderBook | undefined {
    return this.orderBooks.get(symbol);
  }

  private scheduleNextTickBatch(): void {
    if (!this.isRunning) return;

    // Normal tick rate: 25-50ms intervals (~30-50 ticks/second) scaled by speedMultiplier
    const baseDelay = Math.max(10, Math.floor(35 / this.speedMultiplier));
    const jitter = Math.floor(Math.random() * 15);

    this.intervalTimer = window.setTimeout(() => {
      if (this.isConnected && !this.isPaused) {
        this.processMarketTicks();
      }
      this.scheduleNextTickBatch();
    }, baseDelay + jitter);
  }

  private processMarketTicks(): void {
    const symbols = Array.from(this.instruments.keys());
    // Pick 1 to 3 random instruments to tick in this packet
    const ticksCount = Math.floor(Math.random() * 2) + 1;

    for (let i = 0; i < ticksCount; i++) {
      const targetSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      const inst = this.instruments.get(targetSymbol);
      if (!inst) continue;

      // Realistic tick step
      const tickVol = inst.ltp * (0.0003 + Math.random() * 0.0007);
      const isUp = Math.random() > 0.49;
      const tickDelta = isUp ? tickVol : -tickVol;
      const newLtp = +(inst.ltp + tickDelta).toFixed(inst.precision);

      const change = +(newLtp - inst.prevClose).toFixed(inst.precision);
      const changePercent = +((change / inst.prevClose) * 100).toFixed(2);
      const high = Math.max(inst.high, newLtp);
      const low = Math.min(inst.low, newLtp);
      const volume = inst.volume + Math.floor(Math.random() * 120 + 10);

      // Sparkline update
      const newSparkline = [...inst.sparkline.slice(1), newLtp];

      const updatedInst: Instrument = {
        ...inst,
        ltp: newLtp,
        change,
        changePercent,
        high,
        low,
        volume,
        tickDirection: isUp ? 'up' : 'down',
        lastTickTime: Date.now(),
        sparkline: newSparkline,
      };

      this.instruments.set(targetSymbol, updatedInst);

      // Update Order Book
      const updatedBook = generateOrderBook(targetSymbol, newLtp, inst.precision);
      this.orderBooks.set(targetSymbol, updatedBook);

      // Update dynamic candle for active symbol
      this.updateActiveCandle(targetSymbol, newLtp);

      this.packetCount++;
      this.ticksInCurrentSec++;
    }

    // Queue for RAF flush
    this.pendingInstrumentsToDispatch = Array.from(this.instruments.values());
  }

  private updateActiveCandle(symbol: string, newPrice: number): void {
    const list = this.candles.get(symbol);
    if (!list || list.length === 0) return;

    const lastCandle = list[list.length - 1];
    const nowSec = Math.floor(Date.now() / 1000);
    const candleInterval = 60; // 1-minute candle timeframe

    if (nowSec - lastCandle.time >= candleInterval) {
      // Close old candle and open new one
      list.push({
        time: nowSec,
        open: newPrice,
        high: newPrice,
        low: newPrice,
        close: newPrice,
        volume: 10,
      });
      if (list.length > 120) list.shift();
    } else {
      // Update high, low, close, volume of active candle
      lastCandle.high = Math.max(lastCandle.high, newPrice);
      lastCandle.low = Math.min(lastCandle.low, newPrice);
      lastCandle.close = newPrice;
      lastCandle.volume += Math.floor(Math.random() * 15 + 1);
    }
  }

  private startRafLoop(): void {
    const onFrame = (now: number) => {
      this.frameCount++;

      // Compute FPS and Ticks per second once every 1000ms
      if (now - this.lastSecTimestamp >= 1000) {
        this.currentFPS = Math.min(60, Math.round((this.frameCount * 1000) / (now - this.lastSecTimestamp)));
        this.currentTicksPerSec = this.ticksInCurrentSec;
        this.latencyMs = Math.round(10 + Math.random() * 8);

        this.frameCount = 0;
        this.ticksInCurrentSec = 0;
        this.lastSecTimestamp = now;

        // Heartbeat update
        this.notifyTelemetryChange();
      }

      // If pending tick data exists, flush once per animation frame (60 FPS dispatch)
      if (this.pendingInstrumentsToDispatch && this.listeners.size > 0) {
        const books = Object.fromEntries(this.orderBooks);
        const telemetry = this.getTelemetry();

        this.listeners.forEach(listener => {
          listener(this.pendingInstrumentsToDispatch!, books, telemetry);
        });

        this.pendingInstrumentsToDispatch = null;
      }

      if (this.isRunning) {
        this.rafId = requestAnimationFrame(onFrame);
      }
    };

    this.rafId = requestAnimationFrame(onFrame);
  }

  private notifyTelemetryChange(): void {
    if (this.listeners.size === 0) return;
    const instruments = Array.from(this.instruments.values());
    const books = Object.fromEntries(this.orderBooks);
    const telemetry = this.getTelemetry();

    this.listeners.forEach(listener => {
      listener(instruments, books, telemetry);
    });
  }

  public getTelemetry(): EngineTelemetry {
    return {
      ticksPerSec: this.isConnected && !this.isPaused ? this.currentTicksPerSec : 0,
      fps: this.currentFPS,
      latencyMs: this.isConnected ? this.latencyMs : 999,
      connectionStatus: !this.isConnected ? 'DISCONNECTED' : this.isPaused ? 'RECONNECTING' : 'CONNECTED',
      packetCount: this.packetCount,
      speedMultiplier: this.speedMultiplier,
      lastHeartbeat: Date.now(),
    };
  }
}

// Global Singleton Engine instance
export const marketEngine = new MarketDataEngine();
