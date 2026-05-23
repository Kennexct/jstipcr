// Live Exchange Rate Fetcher using open.er-api.com
// Falls back to static rates if offline or rate limit exceeded

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
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${fromCode}`);
    if (!res.ok) throw new Error('Exchange rate API response not OK');
    const data = await res.json();
    if (data && data.rates && data.rates[toCode]) {
      return Number(data.rates[toCode]);
    }
  } catch (e) {
    console.warn(`[Currency] Failed to fetch live rate for ${fromCode} to ${toCode}. Using local fallback.`, e);
  }
  return FALLBACK_RATES[fromCode] || 1;
}
