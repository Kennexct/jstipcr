import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/supabase';
import { useMaster } from '../context/MasterContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LogOut, RefreshCw, Layers, ShieldCheck, ToggleLeft, ToggleRight, DollarSign, Wallet } from 'lucide-react';

export function AdminDashboardScreen() {
  const navigate = useNavigate();
  const { logout } = useMaster();

  const [merchants, setMerchants] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [allMerchants, allItems, allWishlist, allSales, allExpenses] = await Promise.all([
        db.getMerchants(),
        db.getItems(),
        db.getWishlist(),
        db.getSales(),
        db.getExpenses()
      ]);
      setMerchants(allMerchants);
      setItems(allItems);
      setWishlist(allWishlist);
      setSales(allSales);
      setExpenses(allExpenses);
    } catch (e) {
      console.error(e);
      toast.error('Failed to sync master admin records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleSubscription = async (merchant: any) => {
    const nextState = !merchant.paid;
    const confirmMessage = nextState
      ? `Are you sure you want to ENABLE subscription access for "${merchant.businessName || merchant.username}"?`
      : `Are you sure you want to DISABLE subscription access for "${merchant.businessName || merchant.username}"?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const updatedMerchant = { ...merchant, paid: nextState };
      await db.saveMerchant(updatedMerchant);
      
      // Update local state list
      setMerchants(prev => prev.map(m => m.id === merchant.id ? updatedMerchant : m));
      toast.success(
        nextState 
          ? `Subscription enabled for ${merchant.businessName || merchant.username}` 
          : `Subscription disabled for ${merchant.businessName || merchant.username}`
      );
    } catch (e) {
      toast.error('Failed to update subscription status');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Compute overall summary stats
  const activeMerchantsCount = merchants.filter(m => m.role === 'merchant' && m.paid).length;
  const pendingMerchantsCount = merchants.filter(m => m.role === 'merchant' && !m.paid).length;
  const globalTotalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);
  const globalTotalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#161616] font-sans pb-16">
      {/* IBM Carbon Shell Header */}
      <header className="bg-[#161616] text-[#ffffff] h-12 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-wider text-sm uppercase">JStip Flow</span>
          <span className="text-[#e0e0e0] border-l border-[#393939] pl-3 text-xs uppercase tracking-widest font-normal">Console Manager</span>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadAdminData}
            className="text-white hover:bg-[#393939] h-8 rounded-none px-3 gap-1.5 text-xs uppercase font-normal tracking-wider"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reload
          </Button>
          <Button 
            onClick={handleLogout} 
            className="bg-[#da1e28] hover:bg-[#b21922] text-white rounded-none h-8 px-4 text-xs font-normal uppercase tracking-wider gap-1.5 border-none"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </Button>
        </div>
      </header>

      {/* Grid container */}
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-normal tracking-tight">System Subscription Manager</h2>
          <p className="text-xs text-[#525252]">Audit active merchant registers, allocate service credentials, and view transactional totals.</p>
        </div>

        {/* Audit Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e0e0e0] p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-[#525252] uppercase tracking-wider">Active Merchants</span>
            <span className="text-3xl font-light mt-2">{activeMerchantsCount}</span>
          </div>
          <div className="bg-white border border-[#e0e0e0] p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-[#525252] uppercase tracking-wider">Pending Activation</span>
            <span className="text-3xl font-light text-[#da1e28] mt-2">{pendingMerchantsCount}</span>
          </div>
          <div className="bg-white border border-[#e0e0e0] p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-[#525252] uppercase tracking-wider">System Gross Sales</span>
            <span className="text-xl font-mono font-medium text-[#24a148] mt-2">Rp {globalTotalSales.toLocaleString()}</span>
          </div>
          <div className="bg-white border border-[#e0e0e0] p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-[#525252] uppercase tracking-wider">System Net Profit</span>
            <span className="text-xl font-mono font-medium text-primary mt-2">Rp {(globalTotalSales - globalTotalExpenses).toLocaleString()}</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-[#e0e0e0]">
          <div className="p-4 border-b border-[#e0e0e0] bg-[#f4f4f4] flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider">Merchant Database Listings</span>
            <span className="text-[10px] text-[#525252] font-mono">Row Count: {merchants.filter(m => m.role !== 'admin').length}</span>
          </div>

          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-[#525252]" />
              <span className="text-xs font-mono text-[#525252]">Querying tables...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f4f4f4] border-b border-[#e0e0e0] text-[#525252] font-semibold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Username</th>
                    <th className="p-4">Business / Traveler Name</th>
                    <th className="p-4">Catalog / Wishes</th>
                    <th className="p-4">Total Sales</th>
                    <th className="p-4">Expenses</th>
                    <th className="p-4">Net Profit</th>
                    <th className="p-4 text-center">Subscription Status</th>
                    <th className="p-4 text-right">Subscription Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0]">
                  {merchants
                    .filter(m => m.role !== 'admin')
                    .map(m => {
                      const mItems = items.filter(i => i.merchant_id === m.id || i.merchantId === m.id).length;
                      const mWishes = wishlist.filter(w => w.merchant_id === m.id || w.merchantId === m.id).length;
                      const mSales = sales
                        .filter(s => s.merchant_id === m.id || s.merchantId === m.id)
                        .reduce((sum, s) => sum + (s.total || 0), 0);
                      const mExpenses = expenses
                        .filter(e => e.merchant_id === m.id || e.merchantId === m.id)
                        .reduce((sum, e) => sum + (e.amount || 0), 0);
                      const mProfit = mSales - mExpenses;

                      return (
                        <tr key={m.id} className="hover:bg-[#f4f4f4] transition-colors">
                          <td className="p-4 font-semibold text-[#161616]">{m.username}</td>
                          <td className="p-4 font-normal text-[#525252]">{m.businessName || '-'}</td>
                          <td className="p-4 font-mono text-[#525252]">
                            {mItems} items / {mWishes} wishes
                          </td>
                          <td className="p-4 font-mono font-medium text-[#24a148]">
                            Rp {mSales.toLocaleString()}
                          </td>
                          <td className="p-4 font-mono text-[#da1e28]">
                            Rp {mExpenses.toLocaleString()}
                          </td>
                          <td className={`p-4 font-mono font-bold ${mProfit >= 0 ? 'text-[#24a148]' : 'text-[#da1e28]'}`}>
                            Rp {mProfit.toLocaleString()}
                          </td>
                          <td className="p-4 text-center">
                            <Badge 
                              className={`rounded-none border-none text-[9px] uppercase tracking-wider px-2.5 py-1 ${
                                m.paid 
                                  ? 'bg-[#e2f5e9] text-[#0e622b]' 
                                  : 'bg-[#fff0f0] text-[#da1e28]'
                              }`}
                            >
                              {m.paid ? 'Active' : 'Unpaid'}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              size="sm"
                              variant={m.paid ? "outline" : "default"}
                              onClick={() => handleToggleSubscription(m)}
                              className={`rounded-none text-[10px] h-8 font-normal uppercase tracking-wider border ${
                                m.paid
                                  ? 'border-[#da1e28] text-[#da1e28] hover:bg-[#fff0f0]'
                                  : 'bg-[#24a148] hover:bg-[#198038] text-white border-none'
                              }`}
                            >
                              {m.paid ? 'Deactivate' : 'Activate'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {merchants.filter(m => m.role !== 'admin').length === 0 && (
                <div className="p-12 text-center text-[#525252] italic">
                  No merchant accounts registered in database yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
