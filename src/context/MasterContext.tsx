import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../lib/supabase';
import { toast } from 'sonner';

export interface MasterContextType {
  loading: boolean;
  expenses: any[];
  sales: any[];
  catalogItems: any[];
  wishlistItems: any[];
  tripSettings: any;
  boughtIds: string[];
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

  const refreshData = async () => {
    try {
      const [loadedExpenses, loadedSales, loadedItems, loadedWishlist, loadedSettings] = await Promise.all([
        db.getExpenses(),
        db.getSales(),
        db.getItems(),
        db.getWishlist(),
        db.getSettings()
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
  }, []);

  const saveSettings = async (data: any) => {
    try {
      await db.saveSettings(data);
      setTripSettings(data);
    } catch (e) {
      toast.error('Failed to save settings');
      throw e;
    }
  };

  const saveItem = async (item: any) => {
    try {
      await db.saveItem(item);
      const isEdit = catalogItems.some(i => i.id === item.id);
      if (isEdit) {
        setCatalogItems(catalogItems.map(i => i.id === item.id ? item : i));
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
      setCatalogItems(catalogItems.filter(i => i.id !== id));
    } catch (e) {
      toast.error('Failed to delete catalog item');
      throw e;
    }
  };

  const saveWishlist = async (item: any) => {
    try {
      await db.saveWishlist(item);
      const isEdit = wishlistItems.some(w => w.id === item.id);
      if (isEdit) {
        setWishlistItems(wishlistItems.map(w => w.id === item.id ? item : w));
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
      await db.saveSale(sale);
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
            await db.saveWishlist(updatedWishItem);
            
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
      await db.saveExpense(expense);
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
        expenses,
        sales,
        catalogItems,
        wishlistItems,
        tripSettings,
        boughtIds,
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
