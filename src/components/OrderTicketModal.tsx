import React, { useRef, useEffect, useState } from 'react';
import { X, ShieldAlert, ArrowRight } from 'lucide-react';
import type { OrderSide, OrderType } from '../types/market';
import { useTrading } from '../context/TradingContext';

export const OrderTicketModal: React.FC = () => {
  const {
    isOrderModalOpen,
    orderModalPrefill,
    closeOrderModal,
    placeOrder,
    availableMargin,
    activeInstrument,
  } = useTrading();

  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Form states
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [symbol, setSymbol] = useState<string>('NVDA');
  const [name, setName] = useState<string>('NVIDIA Corp');
  const [price, setPrice] = useState<number>(128.85);
  const [quantity, setQuantity] = useState<number>(10);
  const [leverage, setLeverage] = useState<number>(1);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync prefill values when opened
  useEffect(() => {
    if (orderModalPrefill) {
      setSymbol(orderModalPrefill.symbol);
      setSide(orderModalPrefill.side);
      if (orderModalPrefill.price !== undefined) {
        setPrice(orderModalPrefill.price);
      } else if (activeInstrument) {
        setPrice(activeInstrument.ltp);
      }
      setName(orderModalPrefill.name || activeInstrument?.name || orderModalPrefill.symbol);
      setErrorMessage(null);
    }
  }, [orderModalPrefill, activeInstrument]);

  // Modal open / close synchronization using modern dialog showModal()
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOrderModalOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOrderModalOpen]);

  // Light-dismiss fallback for browsers without native `closedby` support (Modern Web Guidance requirement)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleDialogClick = (event: MouseEvent) => {
      // 1. When clicking the backdrop, event target is dialog itself
      if (event.target !== dialog) return;

      // 2. Check if click falls within dialog's content box
      const rect = dialog.getBoundingClientRect();
      const isInside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (isInside) return;

      // 3. Click was outside content area, close dialog
      closeOrderModal();
    };

    const handleCancel = (e: Event) => {
      e.preventDefault();
      closeOrderModal();
    };

    dialog.addEventListener('click', handleDialogClick);
    dialog.addEventListener('cancel', handleCancel);

    return () => {
      dialog.removeEventListener('click', handleDialogClick);
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [closeOrderModal]);

  // Financial calculations
  const totalNotional = price * quantity;
  const requiredMargin = totalNotional / leverage;
  const hasInsufficientFunds = requiredMargin > availableMargin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setErrorMessage('Quantity must be greater than 0');
      return;
    }
    if (hasInsufficientFunds) {
      setErrorMessage(`Insufficient margin! Required: $${requiredMargin.toFixed(2)}, Available: $${availableMargin.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);
    const success = await placeOrder({
      symbol,
      name,
      side,
      type: orderType,
      price,
      quantity,
      leverage,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
    });

    setIsSubmitting(false);
    if (!success) {
      setErrorMessage('Order execution failed. Please verify margin.');
    }
  };

  return (
    <dialog
      ref={dialogRef}
      {...{ closedby: 'any' }}
      aria-labelledby="orderTicketTitle"
      className="trade-dialog"
    >
      <form onSubmit={handleSubmit} className="order-ticket-form">
        {/* Ticket Header */}
        <div className={`ticket-header ${side === 'BUY' ? 'header-buy' : 'header-sell'}`}>
          <div className="header-meta">
            <h2 id="orderTicketTitle" className="ticket-title">
              {side} {symbol}
            </h2>
            <span className="ticket-subtitle">{name}</span>
          </div>

          <div className="ticket-header-actions">
            <div className="side-toggle">
              <button
                type="button"
                className={`toggle-btn buy ${side === 'BUY' ? 'active' : ''}`}
                onClick={() => setSide('BUY')}
              >
                BUY
              </button>
              <button
                type="button"
                className={`toggle-btn sell ${side === 'SELL' ? 'active' : ''}`}
                onClick={() => setSide('SELL')}
              >
                SELL
              </button>
            </div>
            <button
              type="button"
              className="ticket-close-btn"
              onClick={closeOrderModal}
              title="Dismiss Ticket (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="ticket-body">
          {errorMessage && (
            <div className="ticket-alert">
              <ShieldAlert size={14} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Order Type Tabs */}
          <div className="order-type-tabs">
            {(['MARKET', 'LIMIT', 'STOP_LOSS'] as OrderType[]).map(type => (
              <button
                key={type}
                type="button"
                className={`type-tab ${orderType === type ? 'active' : ''}`}
                onClick={() => setOrderType(type)}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Price & Quantity Grid */}
          <div className="form-grid">
            <div className="field-group">
              <label htmlFor="orderPrice">Price ($)</label>
              <div className="input-with-symbol">
                <input
                  id="orderPrice"
                  type="number"
                  step="0.01"
                  value={price}
                  disabled={orderType === 'MARKET'}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="font-mono tabular-nums"
                />
                {orderType === 'MARKET' && <span className="market-tag">MKT</span>}
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="orderQuantity">Quantity</label>
              <div className="quantity-stepper">
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                >
                  -
                </button>
                <input
                  id="orderQuantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                  className="font-mono tabular-nums"
                />
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => setQuantity(prev => prev + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Quick Quantity Presets */}
          <div className="quick-qty-pills">
            {[10, 25, 50, 100, 500].map(qty => (
              <button
                key={qty}
                type="button"
                className="qty-pill"
                onClick={() => setQuantity(qty)}
              >
                +{qty}
              </button>
            ))}
          </div>

          {/* Leverage Selector */}
          <div className="leverage-selector">
            <span className="lbl">INTRADAY LEVERAGE:</span>
            <div className="lev-pills">
              {[1, 2, 5, 10].map(lev => (
                <button
                  key={lev}
                  type="button"
                  className={`lev-pill ${leverage === lev ? 'active' : ''}`}
                  onClick={() => setLeverage(lev)}
                >
                  {lev}x
                </button>
              ))}
            </div>
          </div>

          {/* Optional Bracket SL / TP */}
          <div className="form-grid bracket-grid">
            <div className="field-group">
              <label htmlFor="orderSL">Stop Loss (Optional)</label>
              <input
                id="orderSL"
                type="number"
                step="0.01"
                placeholder="Trigger price"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="font-mono tabular-nums"
              />
            </div>
            <div className="field-group">
              <label htmlFor="orderTP">Target TP (Optional)</label>
              <input
                id="orderTP"
                type="number"
                step="0.01"
                placeholder="Exit price"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className="font-mono tabular-nums"
              />
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="ticket-summary-card">
            <div className="summary-row">
              <span className="lbl">Order Value</span>
              <span className="val tabular-nums">${totalNotional.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span className="lbl">Margin Required ({leverage}x)</span>
              <span className={`val tabular-nums ${hasInsufficientFunds ? 'text-bear font-bold' : ''}`}>
                ${requiredMargin.toFixed(2)}
              </span>
            </div>
            <div className="summary-row">
              <span className="lbl">Available Margin</span>
              <span className="val tabular-nums text-bull">
                ${availableMargin.toFixed(2)}
              </span>
            </div>
            <div className="summary-row subtle">
              <span className="lbl">Est. Slippage & Brokerage</span>
              <span className="val text-muted">$0.00 (Zero Commission)</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="ticket-footer">
          <button
            type="submit"
            disabled={isSubmitting || hasInsufficientFunds}
            className={`submit-order-btn ${side === 'BUY' ? 'btn-buy' : 'btn-sell'}`}
          >
            <span>{side} {quantity} {symbol} @ {orderType === 'MARKET' ? 'Market' : `$${price.toFixed(2)}`}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </dialog>
  );
};
