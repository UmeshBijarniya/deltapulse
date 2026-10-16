import type { OptionChainData, OptionContract } from '../types/market';

// Standard normal cumulative distribution function (Abramowitz & Stegun approximation)
function normalCDF(x: number): number {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  if (x >= 0) {
    const t = 1.0 / (1.0 + p * x);
    return (1.0 - c * Math.exp(-x * x / 2.0) * t *
      (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1));
  } else {
    const t = 1.0 / (1.0 - p * x);
    return (c * Math.exp(-x * x / 2.0) * t *
      (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1));
  }
}

// Standard normal probability density function
function normalPDF(x: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

export interface GreeksResult {
  callPrice: number;
  putPrice: number;
  callDelta: number;
  putDelta: number;
  gamma: number;
  callTheta: number;
  putTheta: number;
  vega: number;
}

/**
 * Computes Black-Scholes pricing and Greeks
 * S = Spot price
 * K = Strike price
 * T = Time to expiry in years (e.g. 7 days / 365)
 * r = Risk-free rate (e.g. 0.05 for 5%)
 * v = Volatility (e.g. 0.25 for 25% IV)
 */
export function calculateBlackScholes(S: number, K: number, T: number, r: number, v: number): GreeksResult {
  if (T <= 0.0001) T = 0.0001; // Avoid division by zero
  if (v <= 0.01) v = 0.01;

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * v * v) * T) / (v * sqrtT);
  const d2 = d1 - v * sqrtT;

  const Nd1 = normalCDF(d1);
  const Nd2 = normalCDF(d2);
  const N_neg_d1 = normalCDF(-d1);
  const N_neg_d2 = normalCDF(-d2);
  const pdf_d1 = normalPDF(d1);

  const discount = Math.exp(-r * T);

  // Call & Put Prices
  const callPrice = Math.max(0.05, S * Nd1 - K * discount * Nd2);
  const putPrice = Math.max(0.05, K * discount * N_neg_d2 - S * N_neg_d1);

  // Delta
  const callDelta = Nd1;
  const putDelta = Nd1 - 1;

  // Gamma (Identical for Call & Put)
  const gamma = pdf_d1 / (S * v * sqrtT);

  // Theta (converted to 1-day decay in currency terms)
  const term1 = -(S * pdf_d1 * v) / (2 * sqrtT);
  const callTheta = (term1 - r * K * discount * Nd2) / 365;
  const putTheta = (term1 + r * K * discount * N_neg_d2) / 365;

  // Vega (Sensitivity to 1% move in IV)
  const vega = (S * sqrtT * pdf_d1) / 100;

  return {
    callPrice,
    putPrice,
    callDelta,
    putDelta,
    gamma,
    callTheta,
    putTheta,
    vega,
  };
}

/**
 * Generates an institutional options chain ladder centered around the underlying price
 */
export function generateOptionChain(
  symbol: string,
  spotPrice: number,
  expiryDays: number = 7,
  strikeStep?: number
): OptionChainData {
  // Determine realistic strike step based on spot price magnitude
  let step = strikeStep;
  if (!step) {
    if (spotPrice > 10000) step = 100; // e.g. NIFTY or BTC
    else if (spotPrice > 1000) step = 50;
    else if (spotPrice > 200) step = 5;
    else if (spotPrice > 50) step = 2.5;
    else step = 1;
  }

  const baseStrike = Math.round(spotPrice / step) * step;
  const numStrikesEachSide = 8;
  const strikes: number[] = [];

  for (let i = -numStrikesEachSide; i <= numStrikesEachSide; i++) {
    strikes.push(+(baseStrike + i * step).toFixed(2));
  }

  const T = expiryDays / 365;
  const r = 0.0525; // 5.25% treasury yield baseline
  const baseIV = 0.22; // 22% baseline IV

  const calls: Record<number, OptionContract> = {};
  const puts: Record<number, OptionContract> = {};

  const expiryString = `EXP-${new Date(Date.now() + expiryDays * 86400000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }).toUpperCase()}`;

  strikes.forEach((strike) => {
    // Volatility smile: OTM puts and calls have slightly higher IV skew
    const moneyness = Math.log(strike / spotPrice);
    const ivSkew = baseIV + 0.12 * (moneyness * moneyness) - 0.04 * moneyness;
    const clampedIV = Math.max(0.12, Math.min(0.85, ivSkew));

    const greeks = calculateBlackScholes(spotPrice, strike, T, r, clampedIV);

    // Call contract
    const callSpread = Math.max(0.05, +(greeks.callPrice * 0.015).toFixed(2));
    const callBid = Math.max(0.05, +(greeks.callPrice - callSpread / 2).toFixed(2));
    const callAsk = +(greeks.callPrice + callSpread / 2).toFixed(2);
    const callOI = Math.floor(Math.max(500, (1 - Math.abs(strike - spotPrice) / (spotPrice * 0.15)) * 45000 + Math.random() * 8000));

    calls[strike] = {
      symbol: `${symbol} ${strike} CE`,
      strike,
      type: 'CALL',
      expiry: expiryString,
      ltp: +greeks.callPrice.toFixed(2),
      prevClose: +(greeks.callPrice * (1 + (Math.random() * 0.04 - 0.02))).toFixed(2),
      change: +(greeks.callPrice * 0.03).toFixed(2),
      changePercent: +(3.2 + Math.random() * 2).toFixed(2),
      bid: callBid,
      ask: callAsk,
      iv: +(clampedIV * 100).toFixed(1),
      delta: +greeks.callDelta.toFixed(3),
      gamma: +greeks.gamma.toFixed(4),
      theta: +greeks.callTheta.toFixed(2),
      vega: +greeks.vega.toFixed(2),
      openInterest: callOI,
      oiChange: Math.floor((Math.random() * 0.2 - 0.05) * callOI),
      volume: Math.floor(callOI * (0.3 + Math.random() * 0.4)),
    };

    // Put contract
    const putSpread = Math.max(0.05, +(greeks.putPrice * 0.015).toFixed(2));
    const putBid = Math.max(0.05, +(greeks.putPrice - putSpread / 2).toFixed(2));
    const putAsk = +(greeks.putPrice + putSpread / 2).toFixed(2);
    const putOI = Math.floor(Math.max(500, (1 - Math.abs(strike - spotPrice) / (spotPrice * 0.15)) * 48000 + Math.random() * 8000));

    puts[strike] = {
      symbol: `${symbol} ${strike} PE`,
      strike,
      type: 'PUT',
      expiry: expiryString,
      ltp: +greeks.putPrice.toFixed(2),
      prevClose: +(greeks.putPrice * (1 + (Math.random() * 0.04 - 0.02))).toFixed(2),
      change: -(+(greeks.putPrice * 0.025).toFixed(2)),
      changePercent: -(+(2.8 + Math.random() * 1.5).toFixed(2)),
      bid: putBid,
      ask: putAsk,
      iv: +(clampedIV * 100).toFixed(1),
      delta: +greeks.putDelta.toFixed(3),
      gamma: +greeks.gamma.toFixed(4),
      theta: +greeks.putTheta.toFixed(2),
      vega: +greeks.vega.toFixed(2),
      openInterest: putOI,
      oiChange: Math.floor((Math.random() * 0.2 - 0.05) * putOI),
      volume: Math.floor(putOI * (0.35 + Math.random() * 0.4)),
    };
  });

  return {
    underlyingSymbol: symbol,
    underlyingPrice: spotPrice,
    expiryDates: ['Current Weekly', 'Next Weekly', 'Monthly'],
    selectedExpiry: 'Current Weekly',
    strikes,
    calls,
    puts,
  };
}
