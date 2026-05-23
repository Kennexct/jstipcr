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
  async getSettings() {
    if (isSupabaseConfigured()) {
      try {
        const rows = await postgrestRequest('jstip_settings');
        if (rows && rows.length > 0) {
          return rows[0].settings_data;
        }
      } catch (e) {
        console.error('Supabase settings load error:', e);
      }
    }
    // Fallback
    const trip = getLocal('jastip_trip_settings', { origin: 'Seoul', destination: 'Jakarta', weightLimit: 15 });
    const currency = getLocal('jastip_currency_settings', { code: 'SGD', symbol: 'S$', manualRate: 13500, realtimeRate: 13050, updatedAt: new Date().toISOString() });
    const notifs = getLocal('jastip_notification_settings', { push: true, email: false, orders: true, chat: true });
    return { trip, currency, notifs };
  },

  async saveSettings(data: { trip: any; currency: any; notifs: any }) {
    // Sync locally anyway
    setLocal('jastip_trip_settings', data.trip);
    setLocal('jastip_currency_settings', data.currency);
    setLocal('jastip_notification_settings', data.notifs);

    if (isSupabaseConfigured()) {
      try {
        // Upsert settings (using a single row with ID = 1)
        await postgrestRequest('jstip_settings', {
          method: 'POST',
          body: { id: 1, settings_data: data },
          query: 'on_conflict=id'
        });
      } catch (e) {
        console.error('Supabase settings save error:', e);
      }
    }
    return data;
  },

  // 2. Catalog Items
  async getItems(): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        return await postgrestRequest('jstip_items', { query: 'order=id.asc' });
      } catch (e) {
        console.error('Supabase get items error:', e);
      }
    }
    const defaultItems: any[] = [];
    return getLocal('jastip_items', defaultItems);
  },

  async saveItem(item: any) {
    const items = await this.getItems();
    let updated;
    const isEdit = items.some(i => i.id === item.id);
    if (isEdit) {
      updated = items.map(i => i.id === item.id ? item : i);
    } else {
      updated = [item, ...items];
    }
    setLocal('jastip_items', updated);

    if (isSupabaseConfigured()) {
      try {
        await postgrestRequest('jstip_items', {
          method: 'POST',
          body: item,
          query: 'on_conflict=id'
        });
      } catch (e) {
        console.error('Supabase save item error:', e);
      }
    }
    return item;
  },

  async removeItem(id: string) {
    const items = await this.getItems();
    const updated = items.filter(i => i.id !== id);
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
  async getWishlist(): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        const list = await postgrestRequest('jstip_wishlist', { query: 'order=id.desc' });
        return list.map((item: any) => {
          let secureStatus = item.status;
          if (secureStatus === 'searching') {
            secureStatus = 'find';
          }
          return { ...item, status: secureStatus };
        });
      } catch (e) {
        console.error('Supabase get wishlist error:', e);
      }
    }
    const defaultWishlist: any[] = [];
    return getLocal('jastip_wishlist_items', defaultWishlist);
  },

  async saveWishlist(item: any) {
    const list = await this.getWishlist();
    let updated;
    const isEdit = list.some(l => l.id === item.id);
    if (isEdit) {
      updated = list.map(l => l.id === item.id ? item : l);
    } else {
      updated = [item, ...list];
    }
    setLocal('jastip_wishlist_items', updated);

    if (isSupabaseConfigured()) {
      try {
        await postgrestRequest('jstip_wishlist', {
          method: 'POST',
          body: item,
          query: 'on_conflict=id'
        });
      } catch (e) {
        console.error('Supabase save wishlist error:', e);
      }
    }
    return item;
  },

  // 4. Sales Records
  async getSales(): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        return await postgrestRequest('jstip_sales', { query: 'order=id.desc' });
      } catch (e) {
        console.error('Supabase get sales error:', e);
      }
    }
    const defaultSales: any[] = [];
    return getLocal('jastip_sales', defaultSales);
  },

  async saveSale(sale: any) {
    const sales = await this.getSales();
    const updated = [sale, ...sales];
    setLocal('jastip_sales', updated);

    if (isSupabaseConfigured()) {
      try {
        await postgrestRequest('jstip_sales', {
          method: 'POST',
          body: sale,
          query: 'on_conflict=id'
        });
      } catch (e) {
        console.error('Supabase save sale error:', e);
      }
    }
    return sale;
  },

  // 5. Operational Expenses
  async getExpenses(): Promise<any[]> {
    if (isSupabaseConfigured()) {
      try {
        return await postgrestRequest('jstip_expenses', { query: 'order=id.desc' });
      } catch (e) {
        console.error('Supabase get expenses error:', e);
      }
    }
    const defaultExpenses: any[] = [];
    return getLocal('jastip_expenses', defaultExpenses);
  },

  async saveExpense(expense: any) {
    const expenses = await this.getExpenses();
    const updated = [expense, ...expenses];
    setLocal('jastip_expenses', updated);

    if (isSupabaseConfigured()) {
      try {
        await postgrestRequest('jstip_expenses', {
          method: 'POST',
          body: expense,
          query: 'on_conflict=id'
        });
      } catch (e) {
        console.error('Supabase save expense error:', e);
      }
    }
    return expense;
  }
};
