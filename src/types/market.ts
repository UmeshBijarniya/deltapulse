export type InstrumentCategory = 'EQUITY' | 'INDEX' | 'CRYPTO' | 'F&O';

export interface Instrument {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'NASDAQ' | 'BINANCE' | 'CBOE';
  category: InstrumentCategory;
  ltp: number;
  prevClose: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  tickDirection: 'up' | 'down' | 'neutral';
  lastTickTime: number;
  sparkline: number[];
  lotSize: number;
  precision: number;
}

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
  percent: number; // For visual bar width
  count: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadPercent: number;
  microPrice: number;
  totalBidVol: number;
  totalAskVol: number;
  imbalance: number; // -1 to +1 (buyer advantage vs seller advantage)
}

export interface OptionContract {
  symbol: string;
  strike: number;
  type: 'CALL' | 'PUT';
  expiry: string;
  ltp: number;
  prevClose: number;
  change: number;
  changePercent: number;
  bid: number;
  ask: number;
  iv: number; // Implied Volatility % (e.g. 24.5)
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  openInterest: number;
  oiChange: number;
  volume: number;
}

export interface OptionChainData {
  underlyingSymbol: string;
  underlyingPrice: number;
  expiryDates: string[];
  selectedExpiry: string;
  strikes: number[];
  calls: Record<number, OptionContract>;
  puts: Record<number, OptionContract>;
}

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS';
export type OrderStatus = 'FILLED' | 'PENDING' | 'CANCELLED' | 'REJECTED';

export interface Position {
  id: string;
  symbol: string;
  name: string;
  side: OrderSide;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  realizedPnl: number;
  marginUsed: number;
  leverage: number;
  openTime: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface Order {
  id: string;
  symbol: string;
  name: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  price: number;
  triggerPrice?: number;
  quantity: number;
  filledQuantity: number;
  createdAt: number;
  executedAt?: number;
  rejectionReason?: string;
}

export type ConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'RECONNECTING' | 'DISCONNECTED';

export interface EngineTelemetry {
  ticksPerSec: number;
  fps: number;
  latencyMs: number;
  connectionStatus: ConnectionStatus;
  packetCount: number;
  speedMultiplier: number;
  lastHeartbeat: number;
}

export interface TradeLog {
  id: string;
  timestamp: number;
  type: 'INFO' | 'FILL' | 'CANCEL' | 'REJECT' | 'ALERT';
  message: string;
}
