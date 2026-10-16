import React from 'react';
import { Layers, ArrowUpDown } from 'lucide-react';
import { useTrading } from '../context/TradingContext';

export const OrderBook: React.FC = () => {
  const {
    activeInstrument,
    activeOrderBook,
    openOrderModal,
  } = useTrading();

  if (!activeOrderBook || !activeInstrument) {
    return (
      <div className="orderbook-empty">
        <Layers size={20} className="text-muted" />
        <span>Loading Market Depth...</span>
      </div>
    );
  }

  const {
    bids,
    asks,
    spread,
    spreadPercent,
    microPrice,
    totalBidVol,
    totalAskVol,
    imbalance,
  } = activeOrderBook;

  // Imbalance percent calculation for visual bar
  const totalVol = totalBidVol + totalAskVol || 1;
  const bidRatio = Math.round((totalBidVol / totalVol) * 100);
  const askRatio = 100 - bidRatio;

  return (
    <div className="orderbook-container">
      {/* Top Header */}
      <div className="orderbook-header">
        <div className="header-title">
          <Layers size={14} className="text-accent" />
          <span>L2 MARKET DEPTH</span>
        </div>
        <div className="spread-badge">
          <span className="lbl">SPREAD</span>
          <span className="val tabular-nums">${spread.toFixed(activeInstrument.precision)}</span>
          <span className="pct tabular-nums">({spreadPercent.toFixed(2)}%)</span>
        </div>
      </div>

      {/* Micro-Price & Imbalance Bar */}
      <div className="orderbook-metrics">
        <div className="microprice-chip" title="Volume-weighted fair value micro-price">
          <span className="lbl">MICRO-PRICE:</span>
          <span className="val tabular-nums text-accent">${microPrice.toFixed(activeInstrument.precision)}</span>
        </div>

        {/* Order Book Imbalance Gauge */}
        <div className="imbalance-meter" title={`Order Book Imbalance: ${imbalance > 0 ? '+' : ''}${imbalance}`}>
          <div className="ratio-label">
            <span className="text-bull tabular-nums">{bidRatio}% BUY</span>
            <span className="text-bear tabular-nums">{askRatio}% SELL</span>
          </div>
          <div className="ratio-bar">
            <div className="bar-bid" style={{ width: `${bidRatio}%` }} />
            <div className="bar-ask" style={{ width: `${askRatio}%` }} />
          </div>
        </div>
      </div>

      {/* Table Columns Header */}
      <div className="depth-table-header">
        <span className="col-price">PRICE ($)</span>
        <span className="col-size">SIZE</span>
        <span className="col-total">TOTAL</span>
      </div>

      {/* ASKS (Sellers) - Rendered in descending order */}
      <div className="depth-list asks-list">
        {asks.slice(0, 8).reverse().map((ask, idx) => (
          <div
            key={`ask-${idx}-${ask.price}`}
            className="depth-row ask-row"
            onClick={() => openOrderModal(activeInstrument.symbol, 'BUY', ask.price, activeInstrument.name)}
            title={`Click to Buy at ${ask.price}`}
          >
            <div className="depth-bar ask-depth" style={{ width: `${ask.percent}%` }} />
            <span className="col-price text-bear tabular-nums font-mono">{ask.price.toFixed(activeInstrument.precision)}</span>
            <span className="col-size tabular-nums">{ask.size}</span>
            <span className="col-total tabular-nums">{ask.total}</span>
          </div>
        ))}
      </div>

      {/* Mid Market Price Divider */}
      <div className="mid-market-divider">
        <div className="mid-price-tag">
          <span className={`ltp-text tabular-nums ${activeInstrument.tickDirection === 'up' ? 'text-bull' : 'text-bear'}`}>
            ${activeInstrument.ltp.toFixed(activeInstrument.precision)}
          </span>
          <span className="mid-label">LTP</span>
        </div>
        <div className="mid-spread">
          <ArrowUpDown size={12} className="text-muted" />
          <span>Spread: ${spread.toFixed(activeInstrument.precision)}</span>
        </div>
      </div>

      {/* BIDS (Buyers) - Rendered in descending order */}
      <div className="depth-list bids-list">
        {bids.slice(0, 8).map((bid, idx) => (
          <div
            key={`bid-${idx}-${bid.price}`}
            className="depth-row bid-row"
            onClick={() => openOrderModal(activeInstrument.symbol, 'SELL', bid.price, activeInstrument.name)}
            title={`Click to Sell at ${bid.price}`}
          >
            <div className="depth-bar bid-depth" style={{ width: `${bid.percent}%` }} />
            <span className="col-price text-bull tabular-nums font-mono">{bid.price.toFixed(activeInstrument.precision)}</span>
            <span className="col-size tabular-nums">{bid.size}</span>
            <span className="col-total tabular-nums">{bid.total}</span>
          </div>
        ))}
      </div>

      {/* Orderbook Footer Summary */}
      <div className="orderbook-footer">
        <div className="vol-summary">
          <span className="lbl">TOTAL BIDS:</span>
          <span className="val text-bull tabular-nums">{totalBidVol.toLocaleString()}</span>
        </div>
        <div className="vol-summary">
          <span className="lbl">TOTAL ASKS:</span>
          <span className="val text-bear tabular-nums">{totalAskVol.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
