// Custom Zero-Dependency Supabase client that uses PostgREST REST API.
// Falls back to LocalStorage if SUPABASE_URL and SUPABASE_ANON_KEY are not configured.

const getEnvValue = (key: string): string => {
  // Vite injects env variables under import.meta.env
  const value = import.meta.env[key];
  if (value && value !== 'MY_SUPABASE_URL' && value !== 'MY_SUPABASE_ANON_KEY' && value !== '') {
    return value;
  }
  return '';
};

// Replace these placeholders with your actual Supabase URL & Anon Key or set them in .env.local
const SUPABASE_URL = getEnvValue('VITE_SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = getEnvValue('VITE_SUPABASE_ANON_KEY') || '';

export const isSupabaseConfigured = () => {
  return SUPABASE_URL.trim() !== '' && SUPABASE_ANON_KEY.trim() !== '';
};

console.log(
  isSupabaseConfigured()
    ? `[Supabase] Live Sync Active targeting: ${SUPABASE_URL}`
    : '[Supabase] Credentials missing. Running in LocalStorage fallback mode.'
);

// Generic fetch wrapper for Supabase PostgREST API
async function postgrestRequest(
  table: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    query?: string;
    body?: any;
    preferSingle?: boolean;
  } = {}
) {
  const method = options.method || 'GET';
  const query = options.query ? `?${options.query}` : '';
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;

  const headers: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };

  if (method === 'POST' || method === 'PATCH') {
    headers['Prefer'] = options.preferSingle ? 'return=representation,holding=none' : 'return=representation';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Supabase request failed: ${res.status} - ${errorText}`);
  }

  if (method === 'DELETE') {
    return true;
  }

  return res.json();
}

// ----------------------------------------------------
// LOCAL STORAGE FALLBACK HELPERS
// ----------------------------------------------------
const getLocal = (key: string, fallback: any) => {
  const data = localStorage.getItem(key);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      // ignore
    }
  }
  return fallback;
};

const setLocal = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ----------------------------------------------------
// PUBLIC API INTERFACE
// ----------------------------------------------------
export const db = {
  // 1. Settings (Trip and Currency)
  async getSettings(merchantId?: string) {
    if (isSupabaseConfigured() && merchantId) {
      try {
        const rows = await postgrestRequest('jstip_settings', { query: `merchant_id=eq.${merchantId}` });
        if (rows && rows.length > 0) {
          return rows[0].settings_data;
        }
      } catch (e) {
        console.error('Supabase settings load error:', e);
      }
    }
    // Fallback
    const suffix = merchantId ? `_${merchantId}` : '';
    const trip = getLocal(`jastip_trip_settings${suffix}`, { origin: 'Seoul', destination: 'Jakarta', weightLimit: 15 });
    const currency = getLocal(`jastip_currency_settings${suffix}`, { code: 'SGD', symbol: 'S$', manualRate: 13500, realtimeRate: 13050, updatedAt: new Date().toISOString() });
    const notifs = getLocal(`jastip_notification_settings${suffix}`, { push: true, email: false, orders: true, chat: true });
    return { trip, currency, notifs };
  },

  async saveSettings(data: { trip: any; currency: any; notifs: any }, merchantId?: string) {
    const suffix = merchantId ? `_${merchantId}` : '';
    setLocal(`jastip_trip_settings${suffix}`, data.trip);
    setLocal(`jastip_currency_settings${suffix}`, data.currency);
    setLocal(`jastip_notification_settings${suffix}`, data.notifs);

    if (isSupabaseConfigured() && merchantId) {
      try {
        await postgrestRequest('jstip_settings', {
          method: 'POST',
          body: { id: `settings_${merchantId}`, merchant_id: merchantId, settings_data: data },
          query: 'on_conflict=id'
        });
      } catch (e) {
        console.error('Supabase settings save error:', e);
      }
    }
    return data;
  },

  // 2. Catalog Items
  async getItems(merchantId?: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        const query = merchantId ? `merchant_id=eq.${merchantId}&order=id.asc` : 'order=id.asc';
        const rows = await postgrestRequest('jstip_items', { query });
        if (Array.isArray(rows)) return rows;
      } catch (e) {
        console.error('Supabase get items error:', e);
      }
    }
    const allItems = getLocal('jastip_items', []);
    return merchantId ? allItems.filter((i: any) => i.merchantId === merchantId) : allItems;
  },

  async saveItem(item: any, merchantId?: string) {
    if (merchantId) {
      item.merchantId = merchantId;
      item.merchant_id = merchantId;
    }
    const items = await getLocal('jastip_items', []);
    let updated;
    const isEdit = items.some((i: any) => i.id === item.id);
    if (isEdit) {
      updated = items.map((i: any) => i.id === item.id ? item : i);
    } else {
      updated = [item, ...items];
    }
    setLocal('jastip_items', updated);

    if (isSupabaseConfigured()) {
      try {
        const dbPayload = {
          id: item.id,
          name: item.name,
          price: item.price || 0,
          cost: item.cost || 0,
          currency: item.currency || 'SGD',
          image: item.image || '',
          status: item.status || 'active',
          rawImage: item.rawImage || '',
          merchant_id: merchantId || null
        };
        await postgrestRequest('jstip_items', {
          method: 'POST',
          body: dbPayload,
          query: 'on_conflict=id'
        });
      } catch (e) {
        console.error('Supabase save item error:', e);
      }
    }
    return item;
  },

  async removeItem(id: string) {
    const items = await getLocal('jastip_items', []);
    const updated = items.filter((i: any) => i.id !== id);
    setLocal('jastip_items', updated);

    if (isSupabaseConfigured()) {
      try {
        await postgrestRequest('jstip_items', {
          method: 'DELETE',
          query: `id=eq.${id}`
        });
      } catch (e) {
        console.error('Supabase remove item error:', e);
      }
    }
    return true;
  },

  // 3. Wishlist / Sourced Tasks
  async getWishlist(merchantId?: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        const query = merchantId ? `merchant_id=eq.${merchantId}&order=id.desc` : 'order=id.desc';
        const list = await postgrestRequest('jstip_wishlist', { query });
        if (Array.isArray(list)) {
          return list.map((item: any) => {
            let secureStatus = item.status;
            if (secureStatus === 'searching') {
              secureStatus = 'find';
            }
            return { ...item, status: secureStatus };
          });
        }
      } catch (e) {
        console.error('Supabase get wishlist error:', e);
      }
    }
    const allList = getLocal('jastip_wishlist_items', []);
    return merchantId ? allList.filter((i: any) => i.merchantId === merchantId) : allList;
  },

  async saveWishlist(item: any, merchantId?: string) {
    if (merchantId) {
      item.merchantId = merchantId;
      item.merchant_id = merchantId;
    }
    const list = await getLocal('jastip_wishlist_items', []);
    let updated;
    const isEdit = list.some((l: any) => l.id === item.id);
    if (isEdit) {
      updated = list.map((l: any) => l.id === item.id ? item : l);
    } else {
      updated = [item, ...list];
    }
    setLocal('jastip_wishlist_items', updated);

    if (isSupabaseConfigured()) {
      try {
        const dbPayload = {
          id: item.id,
          name: item.name,
          requester: item.requester,
          price: item.price || 0,
          location: item.location || 'External Chat',
          image: item.image || '',
          status: item.status || 'find',
          note: item.note || '',
          merchant_id: merchantId || null
        };
        await postgrestRequest('jstip_wishlist', {
          method: 'POST',
          body: dbPayload,
          query: 'on_conflict=id'
        });
      } catch (e) {
        console.error('Supabase save wishlist error:', e);
      }
    }
    return item;
  },

  // 4. Sales Records
  async getSales(merchantId?: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        const query = merchantId ? `merchant_id=eq.${merchantId}&order=id.desc` : 'order=id.desc';
        const rows = await postgrestRequest('jstip_sales', { query });
        if (Array.isArray(rows)) return rows;
      } catch (e) {
        console.error('Supabase get sales error:', e);
      }
    }
    const allSales = getLocal('jastip_sales', []);
    return merchantId ? allSales.filter((s: any) => s.merchantId === merchantId) : allSales;
  },

  async saveSale(sale: any, merchantId?: string) {
    if (merchantId) {
      sale.merchantId = merchantId;
      sale.merchant_id = merchantId;
    }
    const sales = await getLocal('jastip_sales', []);
    const updated = [sale, ...sales];
    setLocal('jastip_sales', updated);

    if (isSupabaseConfigured()) {
      try {
        const dbPayload = {
          id: sale.id,
          customerName: sale.customerName,
          total: sale.total || 0,
          date: sale.date || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          items: sale.items || [],
          merchant_id: merchantId || null
        };
        await postgrestRequest('jstip_sales', {
          method: 'POST',
          body: dbPayload,
          query: 'on_conflict=id'
        });
      } catch (e) {
        console.error('Supabase save sale error:', e);
      }
    }
    return sale;
  },

  // 5. Operational Expenses
  async getExpenses(merchantId?: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        const query = merchantId ? `merchant_id=eq.${merchantId}&order=id.desc` : 'order=id.desc';
        const rows = await postgrestRequest('jstip_expenses', { query });
        if (Array.isArray(rows)) return rows;
      } catch (e) {
        console.error('Supabase get expenses error:', e);
      }
    }
    const allExpenses = getLocal('jastip_expenses', []);
    return merchantId ? allExpenses.filter((e: any) => e.merchantId === merchantId) : allExpenses;
  },

  async saveExpense(expense: any, merchantId?: string) {
    if (merchantId) {
      expense.merchantId = merchantId;
      expense.merchant_id = merchantId;
    }
    const expenses = await getLocal('jastip_expenses', []);
    const updated = [expense, ...expenses];
    setLocal('jastip_expenses', updated);

    if (isSupabaseConfigured()) {
      try {
        const dbPayload = {
          id: expense.id,
          description: expense.description,
          amount: expense.amount || 0,
          category: expense.category || 'Others',
          notes: expense.notes || '',
          originalAmount: expense.originalAmount || null,
          originalSymbol: expense.originalSymbol || null,
          originalCurrency: expense.originalCurrency || null,
          merchant_id: merchantId || null,
          date: expense.date || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        await postgrestRequest('jstip_expenses', {
          method: 'POST',
          body: dbPayload,
          query: 'on_conflict=id'
        });
      } catch (e) {
        console.error('Supabase save expense error:', e);
      }
    }
    return expense;
  },

  // 6. Merchants (Auth)
  async getMerchants(): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        const rows = await postgrestRequest('jstip_merchants', { query: 'order=id.asc' });
        if (Array.isArray(rows)) {
          return rows;
        }
      } catch (e) {
        console.error('Supabase get merchants error:', e);
      }
    }
    return getLocal('jastip_merchants', []);
  },

  async saveMerchant(merchant: any) {
    const merchants = await this.getMerchants();
    let updated;
    const isEdit = merchants.some((m: any) => m.id === merchant.id);
    if (isEdit) {
      updated = merchants.map((m: any) => m.id === merchant.id ? merchant : m);
    } else {
      updated = [merchant, ...merchants];
    }
    setLocal('jastip_merchants', updated);

    if (isSupabaseConfigured()) {
      try {
        await postgrestRequest('jstip_merchants', {
          method: 'POST',
          body: merchant,
          query: 'on_conflict=id'
        });
      } catch (e) {
        console.error('Supabase save merchant error:', e);
      }
    }
    return merchant;
  },

  async getMerchantByUsername(username: string): Promise<any | null> {
    const merchants = await this.getMerchants();
    return merchants.find((m: any) => m.username.toLowerCase() === username.toLowerCase()) || null;
  }
};
