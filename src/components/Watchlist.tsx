import React, { useState, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Plus, Minus } from 'lucide-react';
import type { InstrumentCategory } from '../types/market';
import { useTrading } from '../context/TradingContext';

export const Watchlist: React.FC = () => {
  const {
    instruments,
    activeSymbol,
    setActiveSymbol,
    openOrderModal,
  } = useTrading();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | InstrumentCategory>('ALL');

  const filteredInstruments = useMemo(() => {
    return instruments.filter(inst => {
      const matchesSearch =
        inst.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'ALL' || inst.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [instruments, searchQuery, selectedCategory]);

  return (
    <aside className="watchlist-container">
      {/* Watchlist Header & Search */}
      <div className="watchlist-header">
        <div className="search-box">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search symbol, index, crypto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>
              ×
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="category-tabs">
          {(['ALL', 'EQUITY', 'INDEX', 'CRYPTO', 'F&O'] as const).map(cat => (
            <button
              key={cat}
              className={`cat-tab ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Instruments List */}
      <div className="watchlist-items">
        {filteredInstruments.map(inst => {
          const isSelected = inst.symbol === activeSymbol;
          const isBull = inst.change >= 0;
          const flashClass = inst.tickDirection === 'up' ? 'flash-up' : 'flash-down';

          // Generate sparkline path
          const min = Math.min(...inst.sparkline);
          const max = Math.max(...inst.sparkline);
          const range = max - min || 1;
          const width = 64;
          const height = 24;
          const points = inst.sparkline.map((val, idx) => {
            const x = (idx / (inst.sparkline.length - 1)) * width;
            const y = height - ((val - min) / range) * (height - 4) - 2;
            return `${x},${y}`;
          }).join(' ');

          return (
            <div
              key={inst.symbol}
              className={`watchlist-row ${isSelected ? 'active' : ''}`}
              onClick={() => setActiveSymbol(inst.symbol)}
            >
              <div className="row-left">
                <div className="symbol-meta">
                  <span className="inst-symbol">{inst.symbol}</span>
                  <span className="inst-exchange">{inst.exchange}</span>
                </div>
                <div className="inst-name">{inst.name}</div>
              </div>

              {/* Sparkline */}
              <div className="row-sparkline">
                <svg width={width} height={height} className="sparkline-svg">
                  <polyline
                    fill="none"
                    stroke={isBull ? 'var(--color-bull)' : 'var(--color-bear)'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                </svg>
              </div>

              {/* Price & Change */}
              <div className="row-right">
                <div className={`inst-price tabular-nums ${flashClass}`}>
                  ${inst.ltp.toFixed(inst.precision)}
                </div>
                <div className={`inst-change tabular-nums ${isBull ? 'bull' : 'bear'}`}>
                  {isBull ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  <span>
                    {isBull ? '+' : ''}{inst.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Quick Hover Action Buttons */}
              <div className="row-quick-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="quick-action-btn buy"
                  onClick={() => openOrderModal(inst.symbol, 'BUY', inst.ltp, inst.name)}
                  title={`Quick Buy ${inst.symbol}`}
                >
                  <Plus size={12} /> B
                </button>
                <button
                  className="quick-action-btn sell"
                  onClick={() => openOrderModal(inst.symbol, 'SELL', inst.ltp, inst.name)}
                  title={`Quick Sell ${inst.symbol}`}
                >
                  <Minus size={12} /> S
                </button>
              </div>
            </div>
          );
        })}

        {filteredInstruments.length === 0 && (
          <div className="empty-search">
            No instruments match "{searchQuery}"
          </div>
        )}
      </div>

      {/* Watchlist Footer Status */}
      <div className="watchlist-footer">
        <span className="item-count">{filteredInstruments.length} Instruments</span>
        <span className="status-label">Stream active</span>
      </div>
    </aside>
  );
};
