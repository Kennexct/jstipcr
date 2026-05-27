import localforage from 'localforage';

// Live Exchange Rate Fetcher using open.er-api.com
// Falls back to cached local rates or static rates if offline or rate limit exceeded

const FALLBACK_RATES: Record<string, number> = {
  SGD: 11850,
  KRW: 11.5,
  JPY: 102,
  THB: 440,
  USD: 16000,
  EUR: 17200,
  IDR: 1
};

export async function fetchLiveExchangeRate(fromCode: string, toCode: string = 'IDR'): Promise<number> {
  if (fromCode === toCode) return 1;
  const cacheKey = `exchange_rate_${fromCode}_${toCode}`;
  
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${fromCode}`);
    if (!res.ok) throw new Error('Exchange rate API response not OK');
    const data = await res.json();
    if (data && data.rates && data.rates[toCode]) {
      const rate = Number(data.rates[toCode]);
      await localforage.setItem(cacheKey, rate);
      return rate;
    }
  } catch (e) {
    console.warn(`[Currency] Failed to fetch live rate for ${fromCode} to ${toCode}. Attempting to use cached rate...`);
    try {
      const cachedRate = await localforage.getItem<number>(cacheKey);
      if (cachedRate) {
        return cachedRate;
      }
    } catch (cacheErr) {
      console.warn(`[Currency] Failed to read from cache. Using static fallback.`);
    }
  }
  return FALLBACK_RATES[fromCode] || 1;
}
