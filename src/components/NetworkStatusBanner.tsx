import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTrading } from '../context/TradingContext';

export const NetworkStatusBanner: React.FC = () => {
  const { telemetry, setEnginePaused } = useTrading();

  if (telemetry.connectionStatus === 'CONNECTED') {
    return null;
  }

  const isReconnecting = telemetry.connectionStatus === 'RECONNECTING';

  return (
    <div className={`network-banner ${isReconnecting ? 'reconnecting' : 'disconnected'}`}>
      <div className="banner-content">
        <AlertTriangle size={15} className="banner-icon" />
        <span className="banner-text">
          {isReconnecting
            ? 'STREAM PAUSED / RECONNECTING: Real-time price updates paused by user.'
            : 'NETWORK DISCONNECTED: Market tick stream severed. Price ticks may be stale! New orders gated to protect capital.'}
        </span>
      </div>
      <button
        className="reconnect-banner-btn"
        onClick={() => setEnginePaused(false)}
      >
        <RefreshCw size={13} />
        <span>RECONNECT NOW</span>
      </button>
    </div>
  );
};
