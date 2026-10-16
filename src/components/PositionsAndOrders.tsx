import React, { useState } from 'react';
import {
  Briefcase,
  Clock,
  Terminal,
  TrendingUp,
  XCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';

export const PositionsAndOrders: React.FC = () => {
  const {
    positions,
    orders,
    tradeLogs,
    bottomTab,
    setBottomTab,
    squareOffPosition,
    cancelOrder,
    unrealizedPnl,
    realizedPnl,
    equity,
    accountBalance,
    usedMargin,
  } = useTrading();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Compute analytics
  const filledOrders = orders.filter(o => o.status === 'FILLED');
  const winCount = positions.filter(p => p.pnl > 0).length;
  const totalPositions = positions.length;
  const winRate = totalPositions > 0 ? Math.round((winCount / totalPositions) * 100) : 100;
  const marginUtilization = accountBalance > 0 ? Math.min(100, Math.round((usedMargin / accountBalance) * 100)) : 0;

  return (
    <div className={`bottom-dock-container ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Dock Header Tabs */}
      <div className="dock-header">
        <div className="dock-tabs">
          <button
            className={`dock-tab ${bottomTab === 'POSITIONS' ? 'active' : ''}`}
            onClick={() => { setBottomTab('POSITIONS'); setIsCollapsed(false); }}
          >
            <Briefcase size={13} />
            <span>POSITIONS</span>
            <span className={`tab-badge ${positions.length > 0 ? 'highlight' : ''}`}>
              {positions.length}
            </span>
            {positions.length > 0 && (
              <span className={`tab-pnl-chip tabular-nums ${unrealizedPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)}
              </span>
            )}
          </button>

          <button
            className={`dock-tab ${bottomTab === 'ORDERS' ? 'active' : ''}`}
            onClick={() => { setBottomTab('ORDERS'); setIsCollapsed(false); }}
          >
            <Clock size={13} />
            <span>ORDERS</span>
            <span className="tab-badge">{orders.length}</span>
          </button>

          <button
            className={`dock-tab ${bottomTab === 'LOGS' ? 'active' : ''}`}
            onClick={() => { setBottomTab('LOGS'); setIsCollapsed(false); }}
          >
            <Terminal size={13} />
            <span>TERMINAL LOGS</span>
            <span className="tab-badge">{tradeLogs.length}</span>
          </button>

          <button
            className={`dock-tab ${bottomTab === 'ANALYTICS' ? 'active' : ''}`}
            onClick={() => { setBottomTab('ANALYTICS'); setIsCollapsed(false); }}
          >
            <TrendingUp size={13} />
            <span>RISK & ANALYTICS</span>
          </button>
        </div>

        {/* Dock Controls */}
        <div className="dock-controls">
          <div className="dock-summary">
            <span className="lbl">UNREALIZED:</span>
            <span className={`val tabular-nums ${unrealizedPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
              {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)}
            </span>
            <span className="divider">|</span>
            <span className="lbl">REALIZED:</span>
            <span className={`val tabular-nums ${realizedPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
              {realizedPnl >= 0 ? '+' : ''}${realizedPnl.toFixed(2)}
            </span>
          </div>

          <button
            className="collapse-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Dock' : 'Collapse Dock'}
          >
            {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Dock Content Body */}
      {!isCollapsed && (
        <div className="dock-body">
          {/* 1. POSITIONS TAB */}
          {bottomTab === 'POSITIONS' && (
            <div className="table-responsive">
              <table className="dock-table">
                <thead>
                  <tr>
                    <th>INSTRUMENT</th>
                    <th>SIDE</th>
                    <th>QTY</th>
                    <th>ENTRY PRICE</th>
                    <th>CURRENT LTP</th>
                    <th>MARGIN USED</th>
                    <th>UNREALIZED P&L</th>
                    <th>RETURN %</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map(pos => {
                    const isProfit = pos.pnl >= 0;
                    return (
                      <tr key={pos.id} className="position-row">
                        <td className="symbol-cell">
                          <span className="font-semibold text-accent">{pos.symbol}</span>
                          <span className="inst-subname">{pos.name}</span>
                        </td>
                        <td>
                          <span className={`side-badge ${pos.side === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                            {pos.side} {pos.leverage > 1 ? `${pos.leverage}x` : ''}
                          </span>
                        </td>
                        <td className="tabular-nums font-mono">{pos.quantity}</td>
                        <td className="tabular-nums font-mono">${pos.entryPrice.toFixed(2)}</td>
                        <td className="tabular-nums font-mono">${pos.currentPrice.toFixed(2)}</td>
                        <td className="tabular-nums font-mono">${pos.marginUsed.toFixed(2)}</td>
                        <td className={`tabular-nums font-mono font-semibold ${isProfit ? 'text-bull' : 'text-bear'}`}>
                          {isProfit ? '+' : ''}${pos.pnl.toFixed(2)}
                        </td>
                        <td className={`tabular-nums font-mono ${isProfit ? 'text-bull' : 'text-bear'}`}>
                          {isProfit ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                        </td>
                        <td>
                          <button
                            className="exit-position-btn"
                            onClick={() => squareOffPosition(pos.id)}
                            title="Exit / Square-Off this position immediately at market price"
                          >
                            Square Off
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {positions.length === 0 && (
                    <tr>
                      <td colSpan={9} className="empty-table-cell">
                        No active open positions. Press <strong>[B]</strong> to Buy or <strong>[S]</strong> to Sell.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. ORDERS TAB */}
          {bottomTab === 'ORDERS' && (
            <div className="table-responsive">
              <table className="dock-table">
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>TIME</th>
                    <th>SYMBOL</th>
                    <th>SIDE</th>
                    <th>TYPE</th>
                    <th>ORDER PRICE</th>
                    <th>QTY</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="order-row">
                      <td className="tabular-nums font-mono text-muted">{order.id}</td>
                      <td className="tabular-nums text-muted">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="font-semibold text-accent">{order.symbol}</td>
                      <td>
                        <span className={`side-badge ${order.side === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                          {order.side}
                        </span>
                      </td>
                      <td className="text-muted">{order.type}</td>
                      <td className="tabular-nums font-mono">${order.price.toFixed(2)}</td>
                      <td className="tabular-nums font-mono">{order.quantity}</td>
                      <td>
                        <span className={`status-badge ${order.status.toLowerCase()}`}>
                          {order.status === 'FILLED' && <CheckCircle2 size={11} />}
                          {order.status === 'CANCELLED' && <XCircle size={11} />}
                          {order.status}
                        </span>
                      </td>
                      <td>
                        {order.status === 'PENDING' ? (
                          <button
                            className="cancel-order-btn"
                            onClick={() => cancelOrder(order.id)}
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={9} className="empty-table-cell">
                        No orders recorded during this session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. TERMINAL LOGS TAB */}
          {bottomTab === 'LOGS' && (
            <div className="terminal-logs-container font-mono">
              {tradeLogs.map(log => {
                const time = new Date(log.timestamp).toLocaleTimeString();
                return (
                  <div key={log.id} className={`log-line log-${log.type.toLowerCase()}`}>
                    <span className="log-time text-muted">[{time}]</span>
                    <span className={`log-tag tag-${log.type.toLowerCase()}`}>[{log.type}]</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. ANALYTICS & RISK TAB */}
          {bottomTab === 'ANALYTICS' && (
            <div className="analytics-grid">
              <div className="analytics-card">
                <span className="card-title">ACCOUNT EQUITY</span>
                <span className="card-value tabular-nums font-mono">${equity.toFixed(2)}</span>
                <span className="card-sub text-muted">Initial: ${accountBalance.toLocaleString()}</span>
              </div>

              <div className="analytics-card">
                <span className="card-title">WIN RATE</span>
                <span className={`card-value tabular-nums font-mono ${winRate >= 50 ? 'text-bull' : 'text-bear'}`}>
                  {winRate}%
                </span>
                <span className="card-sub text-muted">{winCount} winning / {totalPositions} open</span>
              </div>

              <div className="analytics-card">
                <span className="card-title">MARGIN UTILIZATION</span>
                <span className="card-value tabular-nums font-mono">{marginUtilization}%</span>
                <span className="card-sub text-muted">Used: ${usedMargin.toFixed(0)}</span>
              </div>

              <div className="analytics-card">
                <span className="card-title">TOTAL ORDERS EXECUTED</span>
                <span className="card-value tabular-nums font-mono">{filledOrders.length}</span>
                <span className="card-sub text-muted">Zero rejected fills</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
