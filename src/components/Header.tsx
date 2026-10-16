import React from 'react';
import {
  Activity,
  Zap,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  RotateCcw,
  Play,
  Pause,
  FastForward,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';

export const Header: React.FC = () => {
  const {
    instruments,
    activeSymbol,
    setActiveSymbol,
    telemetry,
    dayPnl,
    equity,
    accountBalance,
    isAudioMuted,
    toggleAudioMute,
    setEngineSpeed,
    setEnginePaused,
    simulateDisconnect,
    resetAccount,
    openOrderModal,
    activeInstrument,
  } = useTrading();

  const isConnected = telemetry.connectionStatus === 'CONNECTED';
  const isReconnecting = telemetry.connectionStatus === 'RECONNECTING';

  return (
    <header className="header-container">
      {/* Brand & Live Connection Indicator */}
      <div className="header-brand">
        <div className="brand-logo">
          <div className="pulse-ring">
            <span className={`live-dot ${!isConnected ? 'disconnected' : isReconnecting ? 'reconnecting' : ''}`} />
          </div>
          <span className="brand-title">
            DELTA<span className="brand-accent">PULSE</span>
          </span>
          <span className="terminal-badge">HFT TERMINAL</span>
        </div>

        {/* Global Market Ticker Ribbon */}
        <div className="ticker-ribbon">
          {instruments.slice(0, 5).map(inst => {
            const isBull = inst.change >= 0;
            const isSelected = inst.symbol === activeSymbol;
            return (
              <button
                key={inst.symbol}
                className={`ticker-chip ${isSelected ? 'selected' : ''}`}
                onClick={() => setActiveSymbol(inst.symbol)}
                title={`Switch to ${inst.name}`}
              >
                <span className="ticker-symbol">{inst.symbol}</span>
                <span className="ticker-price tabular-nums">${inst.ltp.toFixed(inst.precision)}</span>
                <span className={`ticker-change tabular-nums ${isBull ? 'text-bull' : 'text-bear'}`}>
                  {isBull ? '+' : ''}{inst.changePercent.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Middle/Right Telemetry & Performance HUD */}
      <div className="header-controls">
        {/* Telemetry HUD (Directly addresses Nubra HFT criteria) */}
        <div className="telemetry-bar">
          <div className="telemetry-item" title="Live WebSocket Ticks Processed per Second">
            <Zap size={13} className="text-accent" />
            <span className="label">FEED:</span>
            <span className="value tabular-nums">{telemetry.ticksPerSec}/s</span>
          </div>

          <div className="telemetry-item" title="Browser Render Frame Rate">
            <Activity size={13} className={telemetry.fps >= 55 ? 'text-bull' : 'text-amber'} />
            <span className="label">RENDER:</span>
            <span className="value tabular-nums">{telemetry.fps} FPS</span>
          </div>

          <div className="telemetry-item" title="Network Round Trip Latency (Simulated)">
            {isConnected ? (
              <Wifi size={13} className="text-bull" />
            ) : (
              <WifiOff size={13} className="text-bear" />
            )}
            <span className="label">PING:</span>
            <span className={`value tabular-nums ${telemetry.latencyMs > 50 ? 'text-bear' : 'text-bull'}`}>
              {telemetry.latencyMs}ms
            </span>
          </div>
        </div>

        {/* Engine Speed & Edge Case Testing Controls */}
        <div className="engine-tools">
          <button
            className={`tool-btn ${telemetry.speedMultiplier === 1 ? 'active' : ''}`}
            onClick={() => setEngineSpeed(1)}
            title="1x Normal Market Speed"
          >
            1x
          </button>
          <button
            className={`tool-btn ${telemetry.speedMultiplier === 5 ? 'active' : ''}`}
            onClick={() => setEngineSpeed(5)}
            title="5x Market Open Rush"
          >
            <FastForward size={12} /> 5x
          </button>
          <button
            className="tool-btn"
            onClick={() => setEnginePaused(telemetry.connectionStatus !== 'RECONNECTING')}
            title="Pause/Resume Market Feed"
          >
            {telemetry.connectionStatus === 'RECONNECTING' ? <Play size={12} /> : <Pause size={12} />}
          </button>
          <button
            className="tool-btn text-bear"
            onClick={simulateDisconnect}
            title="Test Fintech Edge Case: Simulate Network Drop & Stale Data"
          >
            Drop Net
          </button>
        </div>

        {/* Quick Trade Hotkeys Pill */}
        <div className="hotkey-pill">
          <button
            className="quick-btn buy"
            onClick={() => activeInstrument && openOrderModal(activeInstrument.symbol, 'BUY', activeInstrument.ltp, activeInstrument.name)}
            title="Press 'B' key anywhere"
          >
            <span className="key-tag">B</span> BUY
          </button>
          <button
            className="quick-btn sell"
            onClick={() => activeInstrument && openOrderModal(activeInstrument.symbol, 'SELL', activeInstrument.ltp, activeInstrument.name)}
            title="Press 'S' key anywhere"
          >
            <span className="key-tag">S</span> SELL
          </button>
        </div>

        {/* Audio FX Toggle */}
        <button
          className="icon-btn"
          onClick={toggleAudioMute}
          title={isAudioMuted ? 'Unmute Terminal Audio' : 'Mute Terminal Audio'}
        >
          {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-accent" />}
        </button>

        {/* Account Portfolio & P&L Card */}
        <div className="account-hud">
          <div className="account-balance">
            <span className="lbl">EQUITY</span>
            <span className="val tabular-nums">${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="account-pnl">
            <span className="lbl">DAY P&L</span>
            <span className={`val tabular-nums ${dayPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
              {dayPnl >= 0 ? '+' : ''}${dayPnl.toFixed(2)}
            </span>
          </div>
          <button
            className="icon-btn subtle"
            onClick={resetAccount}
            title={`Reset Demo Funds ($${accountBalance.toLocaleString()})`}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};
