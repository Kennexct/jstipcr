import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  Settings, 
  TrendingUp, 
  Package, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  Wallet,
  MoreVertical,
  ChevronRight,
  Sparkles,
  MapPin,
  Receipt,
  ShoppingCart,
  X,
  Trash2,
  DollarSign,
  PlusCircle,
  PackageCheck,
  Search,
  LogOut
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useMaster } from '../context/MasterContext';

const EXPENSE_CURRENCIES = [
  { code: 'KRW', symbol: '₩', rate: 11.7 },
  { code: 'IDR', symbol: 'Rp', rate: 1.0 },
  { code: 'SGD', symbol: 'S$', rate: 13500 },
  { code: 'USD', symbol: '$', rate: 16000 },
];

export function OwnerDashboard() {
  const navigate = useNavigate();

  const {
    loading,
    currentUser,
    expenses,
    sales,
    catalogItems,
    wishlistItems,
    tripSettings,
    saveExpense,
    saveSale,
    saveWishlist,
    saveItem,
    logout
  } = useMaster();

  // Form States for Expense Dialog
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseCurrency, setExpenseCurrency] = useState('KRW');
  const [expenseCategory, setExpenseCategory] = useState('Transport');
  const [expenseCategories, setExpenseCategories] = useState<string[]>([
    'Transport', 'Accommodation', 'Tax/Duty', 'Food', 'Others'
  ]);
  const [showNewCatField, setShowNewCatField] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);

  // Form States for Sale Dialog
  const [customerName, setCustomerName] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [productSearchText, setProductSearchText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tempItemCost, setTempItemCost] = useState('0');
  const [tempItemPrice, setTempItemPrice] = useState('0');
  const [tempItemLocation, setTempItemLocation] = useState('Seoul');
  const [selectedQty, setSelectedQty] = useState(1);
  const [draftSaleItems, setDraftSaleItems] = useState<any[]>([]);
  const [isSaleOpen, setIsSaleOpen] = useState(false);


  // Sync default selected item when catalog items are loaded
  useEffect(() => {
    if (catalogItems.length > 0 && !selectedItemId) {
      setSelectedItemId(catalogItems[0].id);
      setProductSearchText(catalogItems[0].name);
    }
  }, [catalogItems, selectedItemId]);

  const currencySettings = tripSettings?.currency || {
    code: 'SGD',
    symbol: 'S$',
    manualRate: 13500,
    realtimeRate: 13050,
    updatedAt: new Date().toISOString()
  };

  const shoppingCurrencyCode = tripSettings?.currency?.code || 'SGD';
  const payoutCurrencyCode = tripSettings?.currency?.payout || 'IDR';

  useEffect(() => {
    if (shoppingCurrencyCode) {
      setExpenseCurrency(shoppingCurrencyCode);
    }
  }, [shoppingCurrencyCode]);

  const handleCycleExpenseCurrency = () => {
    const nextCurrency = expenseCurrency === shoppingCurrencyCode ? payoutCurrencyCode : shoppingCurrencyCode;
    setExpenseCurrency(nextCurrency);
    toast.info(`Switched operational expense currency to ${nextCurrency}`);
  };

  const getCurrencySymbol = (code: string) => {
    if (code === 'IDR') return 'Rp';
    if (code === 'SGD') return 'S$';
    if (code === 'KRW') return '₩';
    if (code === 'JPY') return '¥';
    if (code === 'THB') return '฿';
    if (code === 'USD') return '$';
    if (code === 'EUR') return '€';
    return '$';
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }
    const cleanCat = newCatName.trim();
    if (expenseCategories.map(c => c.toLowerCase()).includes(cleanCat.toLowerCase())) {
      toast.error('Category already exists');
      return;
    }
    if (!window.confirm(`Are you sure you want to add the expense category "${cleanCat}"?`)) {
      return;
    }
    setExpenseCategories([...expenseCategories, cleanCat]);
    setExpenseCategory(cleanCat);
    setNewCatName('');
    setShowNewCatField(false);
    toast.success(`Category "${cleanCat}" added!`);
  };

  const handleSaveExpense = async () => {
    if (!expenseDesc.trim()) {
      toast.error('Please enter a description for the expense');
      return;
    }
    const enteredAmount = parseInt(expenseAmount.replace(/[^0-9]/g, '')) || 0;
    if (enteredAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amountInIdr = expenseCurrency === shoppingCurrencyCode
      ? Math.round(enteredAmount * (tripSettings?.currency?.manualRate || 13500))
      : enteredAmount;

    const newExpense = {
      id: 'exp_' + Date.now(),
      description: expenseDesc.trim(),
      amount: amountInIdr,
      category: expenseCategory,
      notes: expenseNotes.trim() || undefined,
      originalAmount: expenseCurrency !== 'IDR' ? enteredAmount : undefined,
      originalSymbol: expenseCurrency !== 'IDR' ? (expenseCurrency === shoppingCurrencyCode ? (tripSettings?.currency?.symbol || 'S$') : getCurrencySymbol(payoutCurrencyCode)) : undefined,
      originalCurrency: expenseCurrency,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (!window.confirm(`Are you sure you want to record this expense of ${expenseCurrency} ${enteredAmount.toLocaleString()} (${amountInIdr.toLocaleString()} IDR) under "${expenseCategory}"?`)) {
      return;
    }

    try {
      await saveExpense(newExpense);
      toast.success(`Recorded ${expenseCurrency} ${enteredAmount.toLocaleString()} (${amountInIdr.toLocaleString()} IDR) under ${expenseCategory}`);
      
      // Reset
      setExpenseDesc('');
      setExpenseAmount('');
      setExpenseNotes('');
      setExpenseCategory('Transport');
      setIsExpenseOpen(false);
    } catch (e) {
      toast.error('Failed to save expense. Please try again.');
    }
  };

  const handleAddDraftItem = () => {
    const matchedProduct = catalogItems.find(p => p.id === selectedItemId);
    if (!matchedProduct) return;

    if (selectedQty <= 0) {
      toast.error('Quantity must be at least 1');
      return;
    }

    const itemCurrency = matchedProduct.currency || currencySettings.code;
    const rate = currencySettings.code === itemCurrency ? (currencySettings.manualRate || 13500) : 1;
    const costInIdr = Math.round((matchedProduct.cost || 0) * rate);

    const alreadyInDraftIdx = draftSaleItems.findIndex(i => i.productId === selectedItemId);
    if (alreadyInDraftIdx > -1) {
      const updated = [...draftSaleItems];
      updated[alreadyInDraftIdx].qty += selectedQty;
      setDraftSaleItems(updated);
    } else {
      setDraftSaleItems([
        ...draftSaleItems,
        {
          productId: selectedItemId,
          name: matchedProduct.name,
          price: matchedProduct.price,
          cost: costInIdr,
          qty: selectedQty
        }
      ]);
    }
    toast.success(`Added ${selectedQty}x ${matchedProduct.name} to sale draft`);
    setSelectedQty(1);
  };

  const handleRemoveDraftItem = (index: number) => {
    const item = draftSaleItems[index];
    const updated = draftSaleItems.filter((_, i) => i !== index);
    setDraftSaleItems(updated);
    toast.info(`Removed ${item.name} from receipt draft`);
  };

  const handleSaveSale = async () => {
    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    let finalDraft = [...draftSaleItems];
    if (finalDraft.length === 0) {
      // If draft is empty, try to auto-add current selection
      const matchedProduct = catalogItems.find(p => p.id === selectedItemId);
      if (matchedProduct) {
        finalDraft.push({
          productId: selectedItemId,
          name: matchedProduct.name,
          price: matchedProduct.price,
          qty: selectedQty
        });
      } else {
        toast.error('Please add at least one item to record the sale');
        return;
      }
    }

    const totalRevenue = finalDraft.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const newSale = {
      id: 'sale_' + Date.now(),
      customerName: customerName.trim(),
      items: finalDraft,
      total: totalRevenue,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (!window.confirm(`Are you sure you want to record this sale of Rp ${totalRevenue.toLocaleString()} for customer "${customerName.trim()}"?`)) {
      return;
    }

    try {
      await saveSale(newSale);
      toast.success('Sale successfully logged!', {
        description: `Recorded Rp ${totalRevenue.toLocaleString()} total for customer ${customerName}`
      });

      // Reset
      setCustomerName('');
      setDraftSaleItems([]);
      if (catalogItems.length > 0) {
        setSelectedItemId(catalogItems[0].id);
        setProductSearchText(catalogItems[0].name);
      } else {
        setSelectedItemId('');
        setProductSearchText('');
      }
      setSelectedQty(1);
      setIsSaleOpen(false);
    } catch (e) {
      toast.error('Failed to log sale. Please try again.');
    }
  };

  // Compute stats dynamically
  const totalSales = sales.reduce((acc, sale) => acc + (sale.total || 0), 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
  const netEarnings = totalSales - totalExpenses;
  const expectedRevenue = wishlistItems.reduce((acc, item) => acc + (item.price || 0), 0);

  const activeTrip = {
    origin: tripSettings?.trip?.origin || 'Seoul',
    destination: tripSettings?.trip?.destination || 'Jakarta',
    date: tripSettings?.trip?.date || '22 May 2026',
    weightUsed: 5.2,
    weightLimit: tripSettings?.trip?.weightLimit || 15,
    requests: wishlistItems.length,
    revenue: expectedRevenue,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/5">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Hub Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/5 pb-20">
      <header className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Dialog>
            <DialogTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all select-none">
                <Avatar className="h-10 w-10 border ring-2 ring-primary/5">
                  <AvatarFallback className="font-bold bg-primary/10 text-primary">
                    {(currentUser?.businessName || currentUser?.username || 'JF').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-0.5 text-left">
                  <h2 className="text-sm font-black text-slate-800 leading-none">
                    {currentUser?.businessName || currentUser?.username}
                  </h2>
                  <div className="flex items-center gap-1">
                    <Badge variant="ghost" className="h-4 text-[7px] font-black uppercase bg-primary/10 text-primary border-none px-1 rounded-md">
                      Star Traveler
                    </Badge>
                    <span className="text-[9px] text-muted-foreground">• Active</span>
                  </div>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-none max-w-[90%] md:max-w-md bg-white p-6">
              <DialogHeader className="text-left pb-2">
                <DialogTitle className="text-lg font-black tracking-tight uppercase italic text-primary">
                  Merchant Profile
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-semibold">
                  Detailed information about your traveler business account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border">
                  <Avatar className="h-14 w-14 border ring-4 ring-primary/10">
                    <AvatarFallback className="font-black text-lg bg-primary/15 text-primary">
                      {(currentUser?.businessName || currentUser?.username || 'JF').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-800 leading-none">
                      {currentUser?.businessName || currentUser?.username}
                    </h3>
                    <p className="text-xs font-bold text-muted-foreground">Username: @{currentUser?.username}</p>
                    <div className="flex gap-1.5 items-center mt-1">
                      <Badge className="h-4 text-[7px] bg-primary text-white border-none px-1.5 uppercase font-bold tracking-wider">
                        Star Traveler
                      </Badge>
                      <span className="text-[10px] text-emerald-600 font-bold">• Subscription Active</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs p-2.5 bg-muted/20 rounded-xl">
                    <span className="font-bold text-slate-500">Account Type</span>
                    <span className="font-black text-slate-800 uppercase tracking-tight">Traveler Merchant</span>
                  </div>
                  <div className="flex justify-between items-center text-xs p-2.5 bg-muted/20 rounded-xl">
                    <span className="font-bold text-slate-500">Member Since</span>
                    <span className="font-black text-slate-800">
                      {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : '2026'}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button 
                    onClick={() => {
                      if (window.confirm("Are you sure you want to log out from your merchant console?")) {
                        logout();
                        navigate('/login');
                      }
                    }} 
                    variant="outline"
                    className="w-full h-12 rounded-2xl font-black uppercase text-xs gap-2 text-red-500 border-red-100 hover:bg-red-50"
                  >
                    <LogOut className="h-4.5 w-4.5" /> Sign Out
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="rounded-full h-9 w-9" onClick={() => navigate('/trip-settings')} title="Trip Settings">
              <Settings className="h-4.5 w-4.5 text-slate-650 text-slate-650 text-slate-600" />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground">
            <CardContent className="p-4 space-y-2">
              <Wallet className="h-5 w-5 opacity-80" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Net Earnings</p>
                <p className="text-xl font-bold">
                  {netEarnings < 0 ? '-' : ''}Rp {Math.abs(netEarnings).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-4 space-y-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Orders</p>
                <p className="text-xl font-bold">{wishlistItems.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </header>

      <main className="px-6 space-y-8">
        {/* Active Trip Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Active Trip</h3>
          </div>
          <Card className="border-none shadow-lg shadow-primary/5 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  <span className="text-sm font-bold">{activeTrip.origin} → {activeTrip.destination}</span>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-none text-[10px]">
                  {activeTrip.date}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[10px] opacity-80 font-bold uppercase tracking-widest">
                <Sparkles className="h-3 w-3" />
                Live in {activeTrip.origin}
              </div>
            </div>
            <CardContent className="p-4 grid grid-cols-2 divide-x">
              <div className="pr-4 space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Expected Revenue</p>
                <p className="text-lg font-black">Rp {activeTrip.revenue.toLocaleString()}</p>
              </div>
              <div className="pl-4 space-y-1 text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Requests</p>
                <p className="text-lg font-black">{activeTrip.requests}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Active Wishlist items */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Active Wishlist Items</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-[10px] font-bold opacity-60"
              onClick={() => navigate('/explore')}
            >
              VIEW ALL
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3">
             {wishlistItems.map((item) => (
               <Card 
                 key={item.id}
                 className="border-none shadow-sm bg-white cursor-pointer active:scale-95 transition-all overflow-hidden"
                 onClick={() => navigate('/explore')}
               >
                 <CardContent className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 bg-muted/30 border relative">
                        {item.image ? (
                          <img src={item.image} className="h-full w-full object-cover" alt={item.name} referrerPolicy="no-referrer" />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                        {item.status === 'found' && (
                          <div className="absolute inset-0 bg-emerald-600/20 flex items-center justify-center text-white backdrop-blur-[0.5px]">
                            <CheckCircle2 className="h-5 w-5 drop-shadow" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                         <h4 className="text-xs font-bold leading-tight truncate uppercase italic tracking-tighter">{item.name}</h4>
                         <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5">
                           <span>👤 {item.requester}</span>
                           <span className="opacity-40">•</span>
                           <span className="flex items-center gap-0.5">
                             <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                             {item.location}
                           </span>
                         </p>
                         <p className="text-xs font-black text-primary">Rp {item.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[8px] font-bold h-5 px-2 leading-none uppercase border rounded-full",
                          item.status === 'found' 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 animate-pulse" 
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        )}
                      >
                        {item.status}
                      </Badge>
                    </div>
                 </CardContent>
               </Card>
             ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={() => navigate('/owner/list-item')}
              className="flex flex-col items-center justify-center gap-2 p-2 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 border"
            >
              <div className="h-9 w-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tight text-slate-700">Sell Item</span>
            </button>
            
            <button 
              onClick={() => setIsExpenseOpen(true)}
              className="flex flex-col items-center justify-center gap-2 p-2 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 border"
            >
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tight text-slate-700">Expenses</span>
            </button>
            
            <button 
              onClick={() => setIsSaleOpen(true)}
              className="flex flex-col items-center justify-center gap-2 p-2 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 border text-primary"
            >
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tight">Record Sale</span>
            </button>

            <button 
              onClick={() => navigate('/reports')}
              className="flex flex-col items-center justify-center gap-2 p-2 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 border text-[#0f62fe]"
            >
              <div className="h-9 w-9 rounded-xl bg-blue-50/70 text-[#0f62fe] flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tight text-slate-700">Reports</span>
            </button>
          </div>
        </section>

        {/* Expenses Dialog */}
        <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
          <DialogContent className="rounded-3xl border-none max-w-[95%] md:max-w-md bg-white p-6">
            <DialogHeader className="text-left pb-2">
              <DialogTitle className="text-lg font-black tracking-tight uppercase italic text-primary flex items-center gap-2">
                <Receipt className="h-5 w-5" /> Record Operational Expense
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-semibold">
                Keep track of actual spend (e.g. Grab rides, hotel, duty taxes) during your travel trip.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description / Expense Name *</label>
                <Input 
                  placeholder="e.g. Grab Ride to Seoul Station" 
                  value={expenseDesc}
                  onChange={e => setExpenseDesc(e.target.value)}
                  className="h-11 rounded-xl bg-muted/30 border-none font-bold text-sm text-slate-800" 
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount *</label>
                  <span className="text-[8px] font-bold text-slate-400">Click currency to convert</span>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleCycleExpenseCurrency}
                    className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-xs text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 active:scale-90"
                    title="Click to switch currency"
                  >
                    <span>{expenseCurrency === shoppingCurrencyCode ? (tripSettings?.currency?.symbol || 'S$') : (payoutCurrencyCode === 'IDR' ? 'Rp' : getCurrencySymbol(payoutCurrencyCode))}</span>
                    <span className="text-[9px] font-bold opacity-80">{expenseCurrency}</span>
                  </button>
                  <Input 
                    placeholder={`e.g. ${expenseCurrency === 'KRW' ? '12000' : '150000'}`} 
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(e.target.value)}
                    inputMode="numeric"
                    className="h-11 pl-20 rounded-xl bg-muted/30 border-none font-bold text-sm text-slate-800" 
                  />
                </div>
                {expenseCurrency !== 'IDR' && (() => {
                  const rate = expenseCurrency === shoppingCurrencyCode 
                    ? (tripSettings?.currency?.manualRate || 13500) 
                    : 1;
                  const parsedAmount = parseInt(expenseAmount.replace(/[^0-9]/g, '')) || 0;
                  return (
                    <p className="text-[9px] text-slate-500 font-semibold px-1 text-left">
                      Approx. <span className="font-bold text-indigo-600">Rp {Math.round(parsedAmount * rate).toLocaleString()}</span> IDR (1 {expenseCurrency} = Rp {rate.toLocaleString()})
                    </p>
                  );
                })()}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notes / Extra Remarks</label>
                <Input 
                  placeholder="e.g. Receipt copy included, high surcharge peak hours" 
                  value={expenseNotes}
                  onChange={e => setExpenseNotes(e.target.value)}
                  className="h-11 rounded-xl bg-muted/30 border-none font-bold text-sm text-slate-800" 
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category *</label>
                  <button 
                    type="button" 
                    onClick={() => setShowNewCatField(!showNewCatField)}
                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    {showNewCatField ? 'Cancel' : '+ Add Category'}
                  </button>
                </div>
                
                {showNewCatField ? (
                  <div className="flex gap-2">
                    <Input 
                      placeholder="e.g. Baggage, Souvenir"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      className="h-10 bg-muted/30 border-none font-bold text-xs"
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={handleAddCategory} 
                      className="rounded-xl px-4 font-black text-xs h-10"
                    >
                      Add
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {expenseCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setExpenseCategory(cat)}
                        className={cn(
                          "h-9 rounded-xl border text-[10px] font-bold uppercase transition-all tracking-tight",
                          expenseCategory === cat 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-muted/10 border-slate-100 text-slate-705 text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button className="w-full h-12 rounded-2xl font-black uppercase italic shadow-lg shadow-primary/10" onClick={handleSaveExpense}>
                  Save Expense
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Record Sale Dialog */}
        <Dialog open={isSaleOpen} onOpenChange={setIsSaleOpen}>
          <DialogContent className="rounded-3xl border-none max-w-[95%] md:max-w-md bg-white p-6 max-h-[85vh] overflow-y-auto">
            <DialogHeader className="text-left pb-2">
              <DialogTitle className="text-lg font-black tracking-tight uppercase italic text-primary flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Record Customer Sale
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-semibold">
                Pre-fetch published catalog rates to instantly issue invoices & record sales activity.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer Identifier *</label>
                <Input 
                  placeholder="e.g. Jane Andrews" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="h-11 rounded-xl bg-muted/30 border-none font-bold text-sm text-slate-800" 
                />
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/20 border-2 border-dashed border-amber-100 space-y-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-800 flex items-center gap-1">
                  <PackageCheck className="h-3.5 w-3.5" /> Select Catalog Product Line
                </p>
                
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Choose/Type Product name</label>
                  <div className="relative">
                    <Input 
                      placeholder="Type name to select or register..." 
                      value={productSearchText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProductSearchText(val);
                        setShowSuggestions(true);
                        const match = catalogItems.find(p => p.name.toLowerCase() === val.trim().toLowerCase());
                        if (match) {
                          setSelectedItemId(match.id);
                        } else {
                          setSelectedItemId('');
                        }
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="h-10 rounded-xl bg-white border font-bold text-xs text-slate-800 pr-9" 
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  </div>

                  {/* HTML Suggestions overlay */}
                  {showSuggestions && productSearchText.trim() !== "" && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowSuggestions(false)} />
                      <div className="absolute left-0 right-0 top-16 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-40 max-h-[140px] overflow-y-auto space-y-0.5">
                        {(() => {
                          const filtered = catalogItems.filter(item => 
                            item.name.toLowerCase().includes(productSearchText.toLowerCase())
                          );
                          if (filtered.length === 0) {
                            return (
                              <p className="text-[9px] text-muted-foreground p-2.5 text-center font-bold">
                                No matching catalog item.
                              </p>
                            );
                          }
                          return filtered.map(item => (
                            <button
                              type="button"
                              key={item.id}
                              onClick={() => {
                                setSelectedItemId(item.id);
                                setProductSearchText(item.name);
                                setShowSuggestions(false);
                              }}
                              className={cn(
                                "w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-between hover:bg-slate-50",
                                selectedItemId === item.id ? "bg-primary/5 text-primary" : "text-slate-700"
                              )}
                            >
                              <span>{item.name}</span>
                              <span className="font-mono text-[9px] text-slate-500">Rp {item.price.toLocaleString()}</span>
                            </button>
                          ));
                        })()}
                      </div>
                    </>
                  )}

                  {selectedItemId && (
                    (() => {
                      const activeItem = catalogItems.find(p => p.id === selectedItemId);
                      if (!activeItem) return null;
                      return (
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-[10px] text-emerald-800 font-bold">
                          <span className="truncate">Selected: {activeItem.name}</span>
                          <span className="font-mono shrink-0">Rp {activeItem.price.toLocaleString()}</span>
                        </div>
                      );
                    })()
                  )}

                  {!selectedItemId && productSearchText.trim() !== "" && (
                    <div className="p-3 bg-indigo-50/70 border border-indigo-150 border-indigo-100 rounded-xl space-y-1.5 mt-1.5">
                      <p className="text-[9px] font-black text-indigo-900 uppercase tracking-wide">
                        ✨ Product not in current catalog
                      </p>
                      <p className="text-[9px] text-slate-600 leading-normal">
                        Optionally add "{productSearchText}" directly to the travel Wishlist board so traveler can acquire it:
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div className="space-y-0.5">
                          <label className="text-[8px] font-bold text-slate-500 uppercase">Cost ({currencySettings.code})</label>
                          <Input 
                            type="number"
                            placeholder="0"
                            value={tempItemCost}
                            onChange={e => setTempItemCost(e.target.value)}
                            inputMode="numeric"
                            className="h-8 text-[11px] font-bold bg-white"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[8px] font-bold text-slate-500 uppercase">Est Price (Rp)</label>
                          <Input 
                            type="number"
                            placeholder="0"
                            value={tempItemPrice}
                            onChange={e => setTempItemPrice(e.target.value)}
                            inputMode="numeric"
                            className="h-8 text-[11px] font-bold bg-white"
                          />
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={async () => {
                          const priceNum = parseInt(tempItemPrice) || 0;
                          if (priceNum <= 0) {
                            toast.error('Please enter a target price budget');
                            return;
                          }
                          
                          if (!window.confirm(`Are you sure you want to add "${productSearchText.trim()}" to the wishlist and select it for this sale?`)) {
                            return;
                          }
                          
                          const newId = 'wish_' + Date.now();
                          const newWish = {
                            id: newId,
                            name: productSearchText.trim(),
                            requester: customerName.trim() || 'Alya Putri',
                            status: 'find',
                            price: priceNum,
                            location: tripSettings?.trip?.destination || 'Seoul',
                            image: ''
                          };
                          
                          try {
                             await saveWishlist(newWish);
                            
                             const newCatItem = {
                               id: newId,
                               name: productSearchText.trim(),
                               price: priceNum,
                               cost: Number(tempItemCost) || 0,
                               currency: currencySettings.code,
                               image: '',
                               status: 'active'
                             };
                             await saveItem(newCatItem);
                             setSelectedItemId(newId);
                             
                             toast.success(`"${productSearchText}" added to Wishlist and selected!`);
                           } catch (e) {
                             console.error('Failed to save wishlist item:', e);
                             toast.error('Failed to save item to wishlist');
                           }
                        }}
                        className="w-full h-8 text-[9px] font-black uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-700 mt-1"
                      >
                        ➕ Save to Wishlist list
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <label className="text-[9px] font-bold text-slate-500">Order Quantity</label>
                    <div className="flex items-center gap-1.5">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg"
                        onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                      >
                        <X className="h-3 w-3 rotate-45" />
                      </Button>
                      <Input 
                        type="number" 
                        min="1"
                        value={selectedQty}
                        onChange={e => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                        inputMode="numeric"
                        className="h-9 text-center bg-white border font-black text-xs w-12 text-slate-800" 
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg"
                        onClick={() => setSelectedQty(selectedQty + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAddDraftItem}
                    className="h-9 rounded-xl font-bold text-xs gap-1.5 border-amber-200 hover:bg-amber-100 text-amber-900 shadow-sm"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Add Item Line
                  </Button>
                </div>
              </div>

              {/* Show Draft Receipt Lines */}
              {draftSaleItems.length > 0 && (
                <div className="space-y-1.5 bg-slate-50/50 p-2.5 rounded-2xl border">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Current Order Invoice Draft</label>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {draftSaleItems.map((draft, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white border text-xs shadow-sm">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-bold text-slate-800 truncate">{draft.name}</p>
                          <p className="text-[10px] font-medium text-slate-500">
                            {draft.qty}x • Rp {draft.price.toLocaleString()} = <span className="font-bold text-primary">Rp {(draft.price * draft.qty).toLocaleString()}</span>
                          </p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveDraftItem(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-1">
                    <span className="text-[10px] font-black text-slate-650 uppercase">Total Draft Invoice:</span>
                    <span className="text-xs font-black text-slate-900 border-b-2 border-primary pb-px font-mono">
                      Rp {draftSaleItems.reduce((acc, current) => acc + (current.price * current.qty), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-1">
                <Button className="w-full h-12 rounded-2xl font-black uppercase italic shadow-lg shadow-primary/10" onClick={handleSaveSale}>
                  Submit Sale Record
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Currency Display */}
        <section className="space-y-4">
          <Card className="bg-slate-900 text-slate-100 border-none overflow-hidden relative">
            <CardHeader className="p-4 pb-0">
               <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">Currency Setup</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex items-end justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-2xl font-black">1 {currencySettings.code} = {currencySettings.manualRate.toLocaleString()} IDR</p>
                <p className="text-[10px] opacity-60 font-medium tracking-tight">Manual override active • Updated just now</p>
              </div>
              <Button 
                size="sm" 
                variant="secondary" 
                className="h-8 rounded-lg font-bold text-xs bg-white/10 hover:bg-white/20 text-white border-white/10"
                onClick={() => navigate('/trip-settings')}
              >
                Adjust Rate
              </Button>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
          </Card>
        </section>

        {/* Trip Ledger Activity */}
        <section className="space-y-4 pb-12">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Trip Ledger</h3>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase">Real-Time Sync</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Show Sales */}
            {sales.map((sale) => (
              <Card key={sale.id} className="border-none shadow-sm bg-white hover:shadow transition-all">
                <CardContent className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-tight leading-none mb-1">Sale: {sale.customerName}</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight truncate">
                        {sale.items.map((it: any) => `${it.qty}x ${it.name}`).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-emerald-600 font-mono">+ Rp {sale.total.toLocaleString()}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase">{sale.date}</p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Show Expenses */}
            {expenses.map((expense) => (
              <Card key={expense.id} className="border-none shadow-sm bg-white hover:shadow transition-all">
                <CardContent className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-tight leading-none mb-1 truncate">{expense.description}</h4>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[8px] font-bold h-4 px-1.5 leading-none uppercase bg-red-50 text-red-600 border-none shrink-0">
                          {expense.category}
                        </Badge>
                        {expense.notes && (
                          <span className="text-[9px] text-slate-400 font-semibold truncate italic max-w-[180px] block">
                            &ldquo;{expense.notes}&rdquo;
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-red-600 font-mono">- Rp {expense.amount.toLocaleString()}</p>
                    {expense.originalAmount && (
                      <p className="text-[9px] text-muted-foreground font-semibold">
                        {expense.originalSymbol} {expense.originalAmount.toLocaleString()}
                      </p>
                    )}
                    <p className="text-[8px] text-slate-400 font-bold uppercase">{expense.date}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
