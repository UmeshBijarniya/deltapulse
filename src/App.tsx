import React from 'react';
import './App.css';
import { TradingProvider, useTrading } from './context/TradingContext';
import { Header } from './components/Header';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { Watchlist } from './components/Watchlist';
import { ChartContainer } from './components/ChartContainer';
import { OrderBook } from './components/OrderBook';
import { OptionChain } from './components/OptionChain';
import { PositionsAndOrders } from './components/PositionsAndOrders';
import { OrderTicketModal } from './components/OrderTicketModal';
import { BarChart3, Layers, Target } from 'lucide-react';

const MainWorkspace: React.FC = () => {
  const { centerTab, setCenterTab, activeInstrument } = useTrading();

  return (
    <div className="app-root">
      {/* Top Fixed Header with Telemetry & Global Ribbon */}
      <Header />

      {/* Network Edge Case Alert Banner */}
      <NetworkStatusBanner />

      {/* 3-Column Core Trading Grid */}
      <div className="workspace-layout">
        {/* Left: Watchlist */}
        <Watchlist />

        {/* Center: Main Viewport (Chart or Option Chain) */}
        <main className="center-viewport">
          <nav className="viewport-nav-bar" aria-label="Center Workspace Tabs">
            <div className="viewport-tabs">
              <button
                className={`v-tab ${centerTab === 'CHART' ? 'active' : ''}`}
                onClick={() => setCenterTab('CHART')}
              >
                <BarChart3 size={13} />
                <span>CANDLESTICK CHART</span>
              </button>
              <button
                className={`v-tab ${centerTab === 'OPTION_CHAIN' ? 'active' : ''}`}
                onClick={() => setCenterTab('OPTION_CHAIN')}
              >
                <Target size={13} />
                <span>OPTION CHAIN (GREEKS)</span>
              </button>
              <button
                className={`v-tab ${centerTab === 'DEPTH' ? 'active' : ''}`}
                onClick={() => setCenterTab('DEPTH')}
              >
                <Layers size={13} />
                <span>ORDER BOOK FOCUS</span>
              </button>
            </div>

            <div className="viewport-meta text-muted text-xs">
              {activeInstrument?.symbol} &bull; {activeInstrument?.exchange} &bull; Real-time Tick Feed Active
            </div>
          </nav>

          <div className="viewport-content">
            {centerTab === 'CHART' && <ChartContainer />}
            {centerTab === 'OPTION_CHAIN' && <OptionChain />}
            {centerTab === 'DEPTH' && <OrderBook />}
          </div>
        </main>

        {/* Right: Real-time L2 Market Depth Order Book */}
        <aside className="right-dock">
          <OrderBook />
        </aside>
      </div>

      {/* Bottom Dock: Positions, Orders, Terminal Logs & Risk Analytics */}
      <PositionsAndOrders />

      {/* Accessible Trade Dialog Modal */}
      <OrderTicketModal />
    </div>
  );
};

export function App() {
  return (
    <TradingProvider>
      <MainWorkspace />
    </TradingProvider>
  );
}

export default App;
