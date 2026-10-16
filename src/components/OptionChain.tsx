import React, { useState } from 'react';
import { Target, Calendar } from 'lucide-react';
import { useTrading } from '../context/TradingContext';

export const OptionChain: React.FC = () => {
  const {
    activeInstrument,
    optionChain,
    openOrderModal,
  } = useTrading();

  const [greekFilter, setGreekFilter] = useState<'STANDARD' | 'GREEKS'>('GREEKS');

  if (!optionChain || !activeInstrument) {
    return (
      <div className="optionchain-empty">
        <Target size={24} className="text-muted" />
        <span>Generating Black-Scholes Option Chain for {activeInstrument?.symbol}...</span>
      </div>
    );
  }

  const { underlyingPrice, strikes, calls, puts, selectedExpiry } = optionChain;

  // Find At-The-Money (ATM) strike
  const atmStrike = strikes.reduce((prev, curr) =>
    Math.abs(curr - underlyingPrice) < Math.abs(prev - underlyingPrice) ? curr : prev
  );

  return (
    <div className="optionchain-container">
      {/* Option Chain Control Bar */}
      <div className="optionchain-toolbar">
        <div className="chain-info">
          <span className="chain-title">OPTIONS MATRIX</span>
          <span className="chain-spot">
            Spot: <strong className="tabular-nums font-mono">${underlyingPrice.toFixed(2)}</strong>
          </span>
          <span className="atm-pill">ATM: ${atmStrike}</span>
        </div>

        <div className="chain-controls">
          <div className="expiry-picker">
            <Calendar size={13} className="text-muted" />
            <span>{selectedExpiry} (7D Expiry)</span>
          </div>

          <div className="view-toggle">
            <button
              className={`view-btn ${greekFilter === 'GREEKS' ? 'active' : ''}`}
              onClick={() => setGreekFilter('GREEKS')}
            >
              Greeks (Δ, θ, γ, ν)
            </button>
            <button
              className={`view-btn ${greekFilter === 'STANDARD' ? 'active' : ''}`}
              onClick={() => setGreekFilter('STANDARD')}
            >
              Market Depth (OI, Vol)
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="optionchain-table-wrapper">
        <table className="optionchain-table">
          <thead>
            <tr className="main-header">
              <th colSpan={greekFilter === 'GREEKS' ? 6 : 5} className="header-calls">
                CALLS (CE)
              </th>
              <th className="header-strike">STRIKE</th>
              <th colSpan={greekFilter === 'GREEKS' ? 6 : 5} className="header-puts">
                PUTS (PE)
              </th>
            </tr>
            <tr className="sub-header">
              {greekFilter === 'GREEKS' ? (
                <>
                  <th>OI</th>
                  <th>IV%</th>
                  <th>DELTA (Δ)</th>
                  <th>THETA (θ)</th>
                  <th>BID</th>
                  <th>ASK / LTP</th>
                </>
              ) : (
                <>
                  <th>OI (Lacs)</th>
                  <th>OI CHG</th>
                  <th>VOL</th>
                  <th>BID</th>
                  <th>ASK / LTP</th>
                </>
              )}

              <th className="strike-col">STRIKE</th>

              {greekFilter === 'GREEKS' ? (
                <>
                  <th>LTP / BID</th>
                  <th>ASK</th>
                  <th>THETA (θ)</th>
                  <th>DELTA (Δ)</th>
                  <th>IV%</th>
                  <th>OI</th>
                </>
              ) : (
                <>
                  <th>LTP / BID</th>
                  <th>ASK</th>
                  <th>VOL</th>
                  <th>OI CHG</th>
                  <th>OI (Lacs)</th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {strikes.map(strike => {
              const call = calls[strike];
              const put = puts[strike];
              const isATM = strike === atmStrike;
              const isCallITM = strike < underlyingPrice;
              const isPutITM = strike > underlyingPrice;

              return (
                <tr
                  key={`strike-${strike}`}
                  className={`option-row ${isATM ? 'atm-row' : ''}`}
                >
                  {/* CALLS (LEFT SIDE) */}
                  {greekFilter === 'GREEKS' ? (
                    <>
                      <td className={`tabular-nums ${isCallITM ? 'itm-cell' : ''}`}>
                        {(call.openInterest / 1000).toFixed(1)}k
                      </td>
                      <td className={`tabular-nums text-muted ${isCallITM ? 'itm-cell' : ''}`}>
                        {call.iv}%
                      </td>
                      <td className={`tabular-nums text-accent ${isCallITM ? 'itm-cell font-semibold' : ''}`}>
                        +{call.delta.toFixed(2)}
                      </td>
                      <td className={`tabular-nums text-bear ${isCallITM ? 'itm-cell' : ''}`}>
                        {call.theta.toFixed(2)}
                      </td>
                      <td className={`tabular-nums ${isCallITM ? 'itm-cell' : ''}`}>
                        ${call.bid.toFixed(2)}
                      </td>
                      <td
                        className={`tabular-nums price-cell call-price ${isCallITM ? 'itm-cell' : ''}`}
                        onClick={() => openOrderModal(call.symbol, 'BUY', call.ltp, `${activeInstrument.symbol} Call ${strike}`)}
                        title={`Click to trade ${call.symbol}`}
                      >
                        <span className="price-val">${call.ltp.toFixed(2)}</span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className={`tabular-nums ${isCallITM ? 'itm-cell' : ''}`}>
                        {(call.openInterest / 1000).toFixed(1)}k
                      </td>
                      <td className={`tabular-nums ${call.oiChange >= 0 ? 'text-bull' : 'text-bear'} ${isCallITM ? 'itm-cell' : ''}`}>
                        {call.oiChange > 0 ? '+' : ''}{(call.oiChange / 1000).toFixed(1)}k
                      </td>
                      <td className={`tabular-nums ${isCallITM ? 'itm-cell' : ''}`}>
                        {(call.volume / 1000).toFixed(1)}k
                      </td>
                      <td className={`tabular-nums ${isCallITM ? 'itm-cell' : ''}`}>
                        ${call.bid.toFixed(2)}
                      </td>
                      <td
                        className={`tabular-nums price-cell call-price ${isCallITM ? 'itm-cell' : ''}`}
                        onClick={() => openOrderModal(call.symbol, 'BUY', call.ltp, `${activeInstrument.symbol} Call ${strike}`)}
                        title={`Click to trade ${call.symbol}`}
                      >
                        <span className="price-val">${call.ltp.toFixed(2)}</span>
                      </td>
                    </>
                  )}

                  {/* STRIKE (CENTER) */}
                  <td className={`strike-center-cell ${isATM ? 'atm-badge-cell' : ''}`}>
                    <span className="strike-tag tabular-nums">${strike}</span>
                    {isATM && <span className="atm-label">ATM</span>}
                  </td>

                  {/* PUTS (RIGHT SIDE) */}
                  {greekFilter === 'GREEKS' ? (
                    <>
                      <td
                        className={`tabular-nums price-cell put-price ${isPutITM ? 'itm-cell' : ''}`}
                        onClick={() => openOrderModal(put.symbol, 'BUY', put.ltp, `${activeInstrument.symbol} Put ${strike}`)}
                        title={`Click to trade ${put.symbol}`}
                      >
                        <span className="price-val">${put.ltp.toFixed(2)}</span>
                      </td>
                      <td className={`tabular-nums ${isPutITM ? 'itm-cell' : ''}`}>
                        ${put.ask.toFixed(2)}
                      </td>
                      <td className={`tabular-nums text-bear ${isPutITM ? 'itm-cell' : ''}`}>
                        {put.theta.toFixed(2)}
                      </td>
                      <td className={`tabular-nums text-accent ${isPutITM ? 'itm-cell font-semibold' : ''}`}>
                        {put.delta.toFixed(2)}
                      </td>
                      <td className={`tabular-nums text-muted ${isPutITM ? 'itm-cell' : ''}`}>
                        {put.iv}%
                      </td>
                      <td className={`tabular-nums ${isPutITM ? 'itm-cell' : ''}`}>
                        {(put.openInterest / 1000).toFixed(1)}k
                      </td>
                    </>
                  ) : (
                    <>
                      <td
                        className={`tabular-nums price-cell put-price ${isPutITM ? 'itm-cell' : ''}`}
                        onClick={() => openOrderModal(put.symbol, 'BUY', put.ltp, `${activeInstrument.symbol} Put ${strike}`)}
                        title={`Click to trade ${put.symbol}`}
                      >
                        <span className="price-val">${put.ltp.toFixed(2)}</span>
                      </td>
                      <td className={`tabular-nums ${isPutITM ? 'itm-cell' : ''}`}>
                        ${put.ask.toFixed(2)}
                      </td>
                      <td className={`tabular-nums ${isPutITM ? 'itm-cell' : ''}`}>
                        {(put.volume / 1000).toFixed(1)}k
                      </td>
                      <td className={`tabular-nums ${put.oiChange >= 0 ? 'text-bull' : 'text-bear'} ${isPutITM ? 'itm-cell' : ''}`}>
                        {put.oiChange > 0 ? '+' : ''}{(put.oiChange / 1000).toFixed(1)}k
                      </td>
                      <td className={`tabular-nums ${isPutITM ? 'itm-cell' : ''}`}>
                        {(put.openInterest / 1000).toFixed(1)}k
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
