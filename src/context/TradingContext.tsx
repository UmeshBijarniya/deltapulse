import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type {
  Candle,
  EngineTelemetry,
  Instrument,
  OptionChainData,
  Order,
  OrderBook,
  OrderSide,
  OrderType,
  Position,
  TradeLog,
} from '../types/market';
import { marketEngine } from '../engine/marketDataEngine';
import { generateOptionChain } from '../engine/optionsEngine';
import { soundManager } from '../utils/soundEffects';

export type CenterTab = 'CHART' | 'OPTION_CHAIN' | 'DEPTH';
export type BottomTab = 'POSITIONS' | 'ORDERS' | 'LOGS' | 'ANALYTICS';
export type TimeFrame = '1m' | '5m' | '15m' | '1D';

interface PlaceOrderParams {
  symbol: string;
  name: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  triggerPrice?: number;
  quantity: number;
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
}

interface TradingContextType {
  activeSymbol: string;
  setActiveSymbol: (symbol: string) => void;
  activeInstrument: Instrument | undefined;
  instruments: Instrument[];
  orderBooks: Record<string, OrderBook>;
  activeOrderBook: OrderBook | undefined;
  candles: Candle[];
  optionChain: OptionChainData | null;
  positions: Position[];
  orders: Order[];
  tradeLogs: TradeLog[];
  telemetry: EngineTelemetry;
  centerTab: CenterTab;
  setCenterTab: (tab: CenterTab) => void;
  bottomTab: BottomTab;
  setBottomTab: (tab: BottomTab) => void;
  timeframe: TimeFrame;
  setTimeframe: (tf: TimeFrame) => void;

  // Account & Risk
  accountBalance: number;
  usedMargin: number;
  availableMargin: number;
  unrealizedPnl: number;
  realizedPnl: number;
  dayPnl: number;
  equity: number;

  // Order modal & actions
  isOrderModalOpen: boolean;
  orderModalPrefill: {
    symbol: string;
    side: OrderSide;
    price?: number;
    name?: string;
  } | null;
  openOrderModal: (symbol: string, side: OrderSide, price?: number, name?: string) => void;
  closeOrderModal: () => void;
  placeOrder: (params: PlaceOrderParams) => Promise<boolean>;
  squareOffPosition: (positionId: string) => void;
  cancelOrder: (orderId: string) => void;
  resetAccount: () => void;

  // Audio & Engine Controls
  isAudioMuted: boolean;
  toggleAudioMute: () => void;
  setEngineSpeed: (speed: number) => void;
  setEnginePaused: (paused: boolean) => void;
  simulateDisconnect: () => void;
}

const TradingContext = createContext<TradingContextType | null>(null);

const INITIAL_CAPITAL = 100000; // $100,000 USD Demo Trading Capital

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSymbol, setActiveSymbol] = useState<string>('NVDA');
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [orderBooks, setOrderBooks] = useState<Record<string, OrderBook>>({});
  const [telemetry, setTelemetry] = useState<EngineTelemetry>(marketEngine.getTelemetry());

  const [centerTab, setCenterTab] = useState<CenterTab>('CHART');
  const [bottomTab, setBottomTab] = useState<BottomTab>('POSITIONS');
  const [timeframe, setTimeframe] = useState<TimeFrame>('5m');

  // Account State
  const [accountBalance, setAccountBalance] = useState<number>(INITIAL_CAPITAL);
  const [realizedPnl, setRealizedPnl] = useState<number>(0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([
    {
      id: 'log-0',
      timestamp: Date.now(),
      type: 'INFO',
      message: 'DeltaPulse Engine v2.4 initialized. WebSocket stream online (60 FPS batched).',
    },
  ]);

  // Order Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [orderModalPrefill, setOrderModalPrefill] = useState<{
    symbol: string;
    side: OrderSide;
    price?: number;
    name?: string;
  } | null>(null);

  // Audio State
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(soundManager.isMuted());

  // Initialize sound manager
  useEffect(() => {
    soundManager.init();
    setIsAudioMuted(soundManager.isMuted());
  }, []);

  const toggleAudioMute = useCallback(() => {
    const next = !isAudioMuted;
    soundManager.setMuted(next);
    setIsAudioMuted(next);
  }, [isAudioMuted]);

  // Subscribe to High Frequency Engine
  useEffect(() => {
    marketEngine.start();

    const unsubscribe = marketEngine.subscribe((updatedInstruments, updatedBooks, updatedTelemetry) => {
      setInstruments(updatedInstruments);
      setOrderBooks(updatedBooks);
      setTelemetry(updatedTelemetry);
    });

    return () => {
      unsubscribe();
      marketEngine.stop();
    };
  }, []);

  // Compute Active Instrument
  const activeInstrument = useMemo(() => {
    return instruments.find(i => i.symbol === activeSymbol) || instruments[0];
  }, [instruments, activeSymbol]);

  // Active Order Book
  const activeOrderBook = useMemo(() => {
    return orderBooks[activeSymbol];
  }, [orderBooks, activeSymbol]);

  // Real-time Candles for active symbol
  const candles = useMemo(() => {
    return marketEngine.getCandles(activeSymbol);
  }, [activeSymbol, instruments]);

  // Real-time Option Chain for active symbol
  const optionChain = useMemo(() => {
    if (!activeInstrument) return null;
    return generateOptionChain(activeInstrument.symbol, activeInstrument.ltp);
  }, [activeInstrument?.symbol, activeInstrument?.ltp]);

  // Real-time Position P&L updater
  useEffect(() => {
    if (positions.length === 0 || instruments.length === 0) return;

    setPositions(prevPositions => {
      let changed = false;
      const nextPositions = prevPositions.map(pos => {
        const inst = instruments.find(i => i.symbol === pos.symbol);
        const currentLtp = inst ? inst.ltp : pos.currentPrice;

        if (currentLtp !== pos.currentPrice) {
          changed = true;
          const diff = pos.side === 'BUY' ? (currentLtp - pos.entryPrice) : (pos.entryPrice - currentLtp);
          const pnl = +(diff * pos.quantity).toFixed(2);
          const pnlPercent = +((diff / pos.entryPrice) * 100 * pos.leverage).toFixed(2);

          return {
            ...pos,
            currentPrice: currentLtp,
            pnl,
            pnlPercent,
          };
        }
        return pos;
      });

      return changed ? nextPositions : prevPositions;
    });
  }, [instruments]);

  // Margin and Equity Calculations
  const usedMargin = useMemo(() => {
    return positions.reduce((acc, pos) => acc + pos.marginUsed, 0);
  }, [positions]);

  const unrealizedPnl = useMemo(() => {
    return positions.reduce((acc, pos) => acc + pos.pnl, 0);
  }, [positions]);

  const availableMargin = Math.max(0, accountBalance - usedMargin + unrealizedPnl);
  const dayPnl = realizedPnl + unrealizedPnl;
  const equity = accountBalance + unrealizedPnl;

  // Open Order Modal handler
  const openOrderModal = useCallback((symbol: string, side: OrderSide, price?: number, name?: string) => {
    setOrderModalPrefill({ symbol, side, price, name });
    setIsOrderModalOpen(true);
  }, []);

  const closeOrderModal = useCallback(() => {
    setIsOrderModalOpen(false);
    setOrderModalPrefill(null);
  }, []);

  const addTradeLog = useCallback((type: TradeLog['type'], message: string) => {
    setTradeLogs(prev => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
        type,
        message,
      },
      ...prev.slice(0, 99),
    ]);
  }, []);

  // Order Placement
  const placeOrder = useCallback(async (params: PlaceOrderParams): Promise<boolean> => {
    const { symbol, name, side, type, price, quantity, leverage = 1, stopLoss, takeProfit } = params;
    const inst = instruments.find(i => i.symbol === symbol);
    const executionPrice = type === 'MARKET' ? (inst ? inst.ltp : price) : price;

    const notionalValue = executionPrice * quantity;
    const requiredMargin = notionalValue / leverage;

    if (requiredMargin > availableMargin) {
      soundManager.playOrderCancelled();
      addTradeLog('REJECT', `Order REJECTED for ${quantity}x ${symbol}: Insufficient Margin (Required: $${requiredMargin.toFixed(2)}, Available: $${availableMargin.toFixed(2)})`);
      return false;
    }

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder: Order = {
      id: orderId,
      symbol,
      name,
      side,
      type,
      status: type === 'MARKET' ? 'FILLED' : 'PENDING',
      price: executionPrice,
      quantity,
      filledQuantity: type === 'MARKET' ? quantity : 0,
      createdAt: Date.now(),
      executedAt: type === 'MARKET' ? Date.now() : undefined,
    };

    setOrders(prev => [newOrder, ...prev]);

    if (type === 'MARKET') {
      soundManager.playOrderFilled();
      addTradeLog('FILL', `FILLED ${side} ${quantity} ${symbol} @ $${executionPrice.toFixed(2)} (Val: $${notionalValue.toFixed(2)})`);

      // Add to positions
      const newPosition: Position = {
        id: `POS-${Date.now().toString().slice(-6)}`,
        symbol,
        name,
        side,
        quantity,
        entryPrice: executionPrice,
        currentPrice: executionPrice,
        pnl: 0,
        pnlPercent: 0,
        realizedPnl: 0,
        marginUsed: requiredMargin,
        leverage,
        openTime: Date.now(),
        stopLoss,
        takeProfit,
      };

      setPositions(prev => [newPosition, ...prev]);
    } else {
      soundManager.playClick();
      addTradeLog('INFO', `SUBMITTED ${type} ${side} order ${orderId} for ${quantity} ${symbol} @ $${executionPrice.toFixed(2)}`);
    }

    closeOrderModal();
    return true;
  }, [availableMargin, instruments, closeOrderModal, addTradeLog]);

  // Square off position
  const squareOffPosition = useCallback((positionId: string) => {
    const pos = positions.find(p => p.id === positionId);
    if (!pos) return;

    soundManager.playOrderFilled();
    const finalPnl = pos.pnl;
    setRealizedPnl(prev => prev + finalPnl);
    setAccountBalance(prev => prev + finalPnl);

    setPositions(prev => prev.filter(p => p.id !== positionId));

    // Record closing order
    const closingSide: OrderSide = pos.side === 'BUY' ? 'SELL' : 'BUY';
    const closeOrder: Order = {
      id: `CLS-${Date.now().toString().slice(-6)}`,
      symbol: pos.symbol,
      name: pos.name,
      side: closingSide,
      type: 'MARKET',
      status: 'FILLED',
      price: pos.currentPrice,
      quantity: pos.quantity,
      filledQuantity: pos.quantity,
      createdAt: Date.now(),
      executedAt: Date.now(),
    };
    setOrders(prev => [closeOrder, ...prev]);

    const pnlPrefix = finalPnl >= 0 ? '+' : '';
    addTradeLog('FILL', `SQUARED OFF ${pos.quantity}x ${pos.symbol} @ $${pos.currentPrice.toFixed(2)}. P&L: ${pnlPrefix}$${finalPnl.toFixed(2)} (${pos.pnlPercent}%)`);
  }, [positions, addTradeLog]);

  // Cancel Pending Order
  const cancelOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId && o.status === 'PENDING') {
        soundManager.playOrderCancelled();
        addTradeLog('CANCEL', `Order ${orderId} CANCELLED by user.`);
        return { ...o, status: 'CANCELLED' };
      }
      return o;
    }));
  }, [addTradeLog]);

  // Reset Account
  const resetAccount = useCallback(() => {
    setAccountBalance(INITIAL_CAPITAL);
    setRealizedPnl(0);
    setPositions([]);
    setOrders([]);
    addTradeLog('ALERT', `Account reset to initial demo funds ($${INITIAL_CAPITAL.toLocaleString()}).`);
  }, [addTradeLog]);

  // Engine controls
  const setEngineSpeed = useCallback((speed: number) => {
    marketEngine.setSpeed(speed);
    setTelemetry(marketEngine.getTelemetry());
    addTradeLog('INFO', `Engine tick frequency adjusted to ${speed}x.`);
  }, [addTradeLog]);

  const setEnginePaused = useCallback((paused: boolean) => {
    marketEngine.setPaused(paused);
    setTelemetry(marketEngine.getTelemetry());
    addTradeLog(paused ? 'ALERT' : 'INFO', paused ? 'WebSocket data stream PAUSED.' : 'WebSocket data stream RESUMED.');
  }, [addTradeLog]);

  const simulateDisconnect = useCallback(() => {
    marketEngine.simulateDisconnect(4500);
    addTradeLog('ALERT', 'Network Disconnect simulated! Triggering auto-reconnect backoff...');
  }, [addTradeLog]);

  // Global hotkeys (B for Buy, S for Sell, Esc to close modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or select
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        if (activeInstrument) {
          openOrderModal(activeInstrument.symbol, 'BUY', activeInstrument.ltp, activeInstrument.name);
        }
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (activeInstrument) {
          openOrderModal(activeInstrument.symbol, 'SELL', activeInstrument.ltp, activeInstrument.name);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeInstrument, openOrderModal]);

  const value = {
    activeSymbol,
    setActiveSymbol,
    activeInstrument,
    instruments,
    orderBooks,
    activeOrderBook,
    candles,
    optionChain,
    positions,
    orders,
    tradeLogs,
    telemetry,
    centerTab,
    setCenterTab,
    bottomTab,
    setBottomTab,
    timeframe,
    setTimeframe,
    accountBalance,
    usedMargin,
    availableMargin,
    unrealizedPnl,
    realizedPnl,
    dayPnl,
    equity,
    isOrderModalOpen,
    orderModalPrefill,
    openOrderModal,
    closeOrderModal,
    placeOrder,
    squareOffPosition,
    cancelOrder,
    resetAccount,
    isAudioMuted,
    toggleAudioMute,
    setEngineSpeed,
    setEnginePaused,
    simulateDisconnect,
  };

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
};

export const useTrading = (): TradingContextType => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
