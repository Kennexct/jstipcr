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
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Weight Used</p>
                <p className="text-lg font-black">{activeTrip.weightUsed} / {activeTrip.weightLimit}kg</p>
              </div>
              <div className="pl-4 space-y-1 text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Orders</p>
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
