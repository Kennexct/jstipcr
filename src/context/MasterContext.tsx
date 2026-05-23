import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../lib/supabase';
import { toast } from 'sonner';

export interface MasterContextType {
  loading: boolean;
  currentUser: any | null;
  expenses: any[];
  sales: any[];
  catalogItems: any[];
  wishlistItems: any[];
  tripSettings: any;
  boughtIds: string[];
  login: (username: string, password: string) => Promise<any>;
  signUp: (username: string, password: string, businessName: string) => Promise<any>;
  logout: () => void;
  refreshData: () => Promise<void>;
  saveSettings: (settings: any) => Promise<void>;
  saveItem: (item: any) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  saveWishlist: (item: any) => Promise<void>;
  saveSale: (sale: any) => Promise<void>;
  saveExpense: (expense: any) => Promise<void>;
  toggleBoughtId: (id: string) => void;
}

const MasterContext = createContext<MasterContextType | undefined>(undefined);

export function MasterProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    const saved = localStorage.getItem('jastip_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [tripSettings, setTripSettings] = useState<any>({
    trip: { origin: 'Seoul', destination: 'Jakarta', weightLimit: 15, date: '22 May 2026' },
    currency: { code: 'SGD', symbol: 'S$', manualRate: 13500 }
  });
  const [boughtIds, setBoughtIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('jastip_checklist_bought_states');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // ignore
      }
    }
    return [];
  });

  const toggleBoughtId = (id: string) => {
    setBoughtIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem('jastip_checklist_bought_states', JSON.stringify(updated));
      return updated;
    });
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const user = await db.getMerchantByUsername(username);
      if (!user || user.password !== password) {
        throw new Error('Invalid username or password');
      }
      setCurrentUser(user);
      localStorage.setItem('jastip_session', JSON.stringify(user));
      toast.success(`Welcome back, ${user.businessName || user.username}!`);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (username: string, password: string, businessName: string) => {
    setLoading(true);
    try {
      const existing = await db.getMerchantByUsername(username);
      if (existing) {
        throw new Error('Username already taken');
      }
      const newMerchant = {
        id: 'merchant_' + Date.now(),
        username,
        password,
        businessName,
        role: 'merchant' as const,
        paid: true,
        createdAt: new Date().toISOString()
      };
      await db.saveMerchant(newMerchant);
      setCurrentUser(newMerchant);
      localStorage.setItem('jastip_session', JSON.stringify(newMerchant));
      toast.success(`Account created successfully! Welcome, ${businessName || username}!`);
      return newMerchant;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('jastip_session');
    setExpenses([]);
    setSales([]);
    setCatalogItems([]);
    setWishlistItems([]);
    toast.success('Logged out successfully');
  };

  const refreshData = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [loadedExpenses, loadedSales, loadedItems, loadedWishlist, loadedSettings] = await Promise.all([
        db.getExpenses(currentUser.id),
        db.getSales(currentUser.id),
        db.getItems(currentUser.id),
        db.getWishlist(currentUser.id),
        db.getSettings(currentUser.id)
      ]);
      setExpenses(loadedExpenses || []);
      setSales(loadedSales || []);
      setCatalogItems(loadedItems || []);
      setWishlistItems(loadedWishlist || []);
      if (loadedSettings) {
        setTripSettings(loadedSettings);
      }
    } catch (e) {
      console.error('Failed to reload master dashboard data:', e);
      toast.error('Failed to sync live data with database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentUser]);

  const saveSettings = async (data: any) => {
    try {
      await db.saveSettings(data, currentUser?.id);
      setTripSettings(data);
    } catch (e) {
      toast.error('Failed to save settings');
      throw e;
    }
  };

  const saveItem = async (item: any) => {
    try {
      await db.saveItem(item, currentUser?.id);
      const isEdit = catalogItems.some(i => i?.id === item.id);
      if (isEdit) {
        setCatalogItems(catalogItems.map(i => i?.id === item.id ? item : i));
      } else {
        setCatalogItems([item, ...catalogItems]);
      }
    } catch (e) {
      toast.error('Failed to save catalog item');
      throw e;
    }
  };

  const removeItem = async (id: string) => {
    try {
      await db.removeItem(id);
      setCatalogItems(catalogItems.filter(i => i?.id !== id));
    } catch (e) {
      toast.error('Failed to delete catalog item');
      throw e;
    }
  };

  const saveWishlist = async (item: any) => {
    try {
      await db.saveWishlist(item, currentUser?.id);
      const isEdit = wishlistItems.some(w => w?.id === item.id);
      if (isEdit) {
        setWishlistItems(wishlistItems.map(w => w?.id === item.id ? item : w));
      } else {
        setWishlistItems([item, ...wishlistItems]);
      }
    } catch (e) {
      toast.error('Failed to save wishlist item');
      throw e;
    }
  };

  const saveSale = async (sale: any) => {
    try {
      await db.saveSale(sale, currentUser?.id);
      setSales([sale, ...sales]);

      if (sale.items && Array.isArray(sale.items)) {
        let updatedWishlist = [...wishlistItems];
        const newlyBoughtWishlistIds: string[] = [];

        for (const item of sale.items) {
          const matchedWishlist = updatedWishlist.filter(
            w => w.name.toLowerCase() === item.name.toLowerCase() && w.status !== 'found'
          );

          for (const wishItem of matchedWishlist) {
            const updatedWishItem = { ...wishItem, status: 'found' as const };
            await db.saveWishlist(updatedWishItem, currentUser?.id);
            
            updatedWishlist = updatedWishlist.map(w => w.id === wishItem.id ? updatedWishItem : w);
            newlyBoughtWishlistIds.push(`chk_wishlist_${wishItem.id}`);
            
            toast.success(`Wishlist item "${wishItem.name}" automatically marked as FOUND & BOUGHT!`);
          }
        }

        if (newlyBoughtWishlistIds.length > 0) {
          setWishlistItems(updatedWishlist);
          setBoughtIds(prev => {
            const updated = Array.from(new Set([...prev, ...newlyBoughtWishlistIds]));
            localStorage.setItem('jastip_checklist_bought_states', JSON.stringify(updated));
            return updated;
          });
        }
      }
    } catch (e) {
      toast.error('Failed to log sale');
      throw e;
    }
  };

  const saveExpense = async (expense: any) => {
    try {
      await db.saveExpense(expense, currentUser?.id);
      setExpenses([expense, ...expenses]);
    } catch (e) {
      toast.error('Failed to save expense');
      throw e;
    }
  };

  return (
    <MasterContext.Provider
      value={{
        loading,
        currentUser,
        expenses,
        sales,
        catalogItems,
        wishlistItems,
        tripSettings,
        boughtIds,
        login,
        signUp,
        logout,
        refreshData,
        saveSettings,
        saveItem,
        removeItem,
        saveWishlist,
        saveSale,
        saveExpense,
        toggleBoughtId
      }}
    >
      {children}
    </MasterContext.Provider>
  );
}

export function useMaster() {
  const context = useContext(MasterContext);
  if (!context) {
    throw new Error('useMaster must be used within a MasterProvider');
  }
  return context;
}
