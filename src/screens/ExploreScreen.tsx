import { useState, ChangeEvent, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  Plus, 
  Package, 
  DollarSign, 
  MapPin as MapPinIcon, 
  Clock, 
  MoreVertical, 
  CheckCircle2, 
  Users,
  Camera,
  X,
  Check,
  Ban,
  AlertCircle,
  CheckSquare,
  Square,
  ShoppingBag,
  ListTodo,
  Info,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useMaster } from '../context/MasterContext';

export interface WishlistItem {
  id: string;
  name: string;
  requester: string;
  status: 'find' | 'found' | 'out of stock' | 'cancel' | 'hold';
  price: number;
  location: string;
  image?: string;
}

export function ExploreScreen() {
  const {
    loading,
    sales,
    wishlistItems: myWishlist,
    saveWishlist,
    boughtIds,
    toggleBoughtId,
    tripSettings
  } = useMaster();

  const shoppingCurrencyCode = tripSettings?.currency?.code || 'SGD';
  const payoutCurrencyCode = tripSettings?.currency?.payout || 'IDR';

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

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'board' | 'checklist'>('board');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Track active popup elements
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<WishlistItem | null>(null);

  const [editBudgetAmount, setEditBudgetAmount] = useState('');
  const [editBudgetCurrency, setEditBudgetCurrency] = useState('IDR');

  useEffect(() => {
    if (selectedDetailItem) {
      setEditBudgetAmount(selectedDetailItem.price.toString());
      setEditBudgetCurrency('IDR');
    }
  }, [selectedDetailItem]);

  const conversionRate = tripSettings?.currency?.manualRate || 13500;
  const computedPriceInIdr = editBudgetCurrency === shoppingCurrencyCode
    ? Math.round((parseInt(editBudgetAmount.replace(/[^0-9]/g, '')) || 0) * conversionRate)
    : (parseInt(editBudgetAmount.replace(/[^0-9]/g, '')) || 0);

  const handleCycleBudgetCurrency = () => {
    const nextCurrency = editBudgetCurrency === shoppingCurrencyCode ? payoutCurrencyCode : shoppingCurrencyCode;
    setEditBudgetCurrency(nextCurrency);
  };

  // Form states for manually recording a wishlist
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formBudget, setFormBudget] = useState('');
  const [formCustomer, setFormCustomer] = useState('');
  const [formImage, setFormImage] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);


  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImage(reader.result as string);
        toast.success('Chat attachment reference added!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateWishlist = async () => {
    if (!formName) {
      toast.error('Please fill in product name');
      return;
    }
    if (!window.confirm(`Are you sure you want to create a new wishlist request for "${formName}"?`)) {
      return;
    }
    const newEntry: WishlistItem = {
      id: 'w_' + Date.now(),
      name: formName,
      location: formLocation || 'External Chat',
      price: 0,
      requester: formCustomer || 'Walk-in Client',
      status: 'find',
      image: formImage || undefined
    };

    try {
      await saveWishlist(newEntry);
      toast.success('Fulfillment task recorded successfully!');
      setIsDialogOpen(false);
      // Reset Form
      setFormName('');
      setFormLocation('');
      setFormCustomer('');
      setFormImage('');
    } catch (e) {
      toast.error('Failed to create wishlist item. Please try again.');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'find' | 'found' | 'out of stock' | 'cancel' | 'hold') => {
    const matchedItem = myWishlist.find(item => item.id === id);
    if (!matchedItem) return;
    if (!window.confirm(`Are you sure you want to change the status of "${matchedItem.name}" to ${newStatus.toUpperCase()}?`)) {
      return;
    }
    const updatedItem = { ...matchedItem, status: newStatus };

    try {
      await saveWishlist(updatedItem);
      toast.info(`Status of ${updatedItem.name} set to ${newStatus.toUpperCase()}`);
    } catch (e) {
      toast.error('Failed to update status. Please try again.');
    }
  };

  const handleToggleChecklistBoughtState = (id: string) => {
    const isCurrentlyBought = boughtIds.includes(id);
    const action = isCurrentlyBought ? 'mark this item as UNBOUGHT (pending)' : 'mark this item as BOUGHT (acquired)';
    if (!window.confirm(`Are you sure you want to ${action}?`)) {
      return;
    }
    if (isCurrentlyBought) {
      toast.info('Marked item as pending purchase');
    } else {
      toast.success('Confirmed item as acquired');
    }
    toggleBoughtId(id);
  };

  // Status Style badge coloring helper
  const getStatusStyle = (status: WishlistItem['status']) => {
    switch (status) {
      case 'found':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 border text-center';
      case 'out of stock':
        return 'bg-rose-50 text-rose-700 border-rose-100 border text-center';
      case 'cancel':
        return 'bg-red-50 text-red-600 border-red-100 border text-center';
      case 'hold':
        return 'bg-amber-50 text-amber-700 border-amber-100 border text-center';
      case 'find':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-100 border text-center';
    }
  };

  // Convert status codes to beautiful readable tags
  const getStatusLabel = (status: WishlistItem['status']) => {
    switch (status) {
      case 'found': return '✅ Found';
      case 'out of stock': return '❌ Out of Stock';
      case 'cancel': return '🚫 Cancelled';
      case 'hold': return '⏸️ On Hold';
      case 'find':
      default:
        return '⏳ Find / Searching';
    }
  };

  // Helper method to render a consistent custom styled Wishlist card item
  const renderWishlistItem = (item: WishlistItem, i: number, opacityClass: string = "") => {
    return (
      <Card 
        className={cn("border border-slate-100 shadow-sm overflow-visible bg-white hover:shadow-md transition-shadow cursor-pointer", opacityClass)}
        onClick={() => setSelectedDetailItem(item)}
      >
        <CardContent className="p-4 flex items-center justify-between gap-3 overflow-visible">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            
            {/* Image Thumbnail */}
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden bg-muted/30 border relative">
              {item.image ? (
                <img src={item.image} className="h-full w-full object-cover" alt={item.name} referrerPolicy="no-referrer" />
              ) : (
                <Package className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Specifics */}
            <div className="space-y-1 min-w-0 flex-1">
              <h4 className="text-xs font-black leading-tight uppercase italic tracking-tighter text-slate-800 truncate">
                {item.name}
              </h4>
              <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                <span className="text-primary font-black">{item.requester}</span>
                <span className="opacity-40">•</span>
                <span className="tabular-nums font-black text-slate-700">Rp {item.price.toLocaleString()}</span>
                <span className="opacity-40">•</span>
                <span className="flex items-center gap-0.5"><MapPinIcon className="h-2.5 w-2.5" />{item.location}</span>
              </div>
            </div>
          </div>

          {/* Interactive Status Badges with custom dropdown overlay */}
          <div className="relative shrink-0 flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // Stop opening details dialog
                setActiveDropdownId(activeDropdownId === item.id ? null : item.id);
              }}
              className={cn(
                "text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 active:scale-95",
                getStatusStyle(item.status)
              )}
            >
              <span>{item.status}</span>
              <span className="text-[7px] opacity-60">▼</span>
            </button>

            {/* Inline Popop Dropdown */}
            {activeDropdownId === item.id && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-transparent cursor-default" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdownId(null);
                  }} 
                />
                <div className="absolute right-0 top-10 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl p-2.5 z-55 min-w-[170px] space-y-1 text-left cursor-default" onClick={e => e.stopPropagation()}>
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest px-1.5 pb-1.5 border-b">Set Status</p>
                  {[
                    { code: 'find', label: '🔍 Find (Search)', color: 'text-blue-600 hover:bg-blue-50/70' },
                    { code: 'found', label: '✅ Found (Acquired)', color: 'text-emerald-600 hover:bg-emerald-50/70' },
                    { code: 'out of stock', label: '❌ Out of Stock', color: 'text-rose-600 hover:bg-rose-50/70' },
                    { code: 'cancel', label: '🚫 Cancel / Revoked', color: 'text-slate-500 hover:bg-slate-50' },
                    { code: 'hold', label: '⏸️ Hold / Postpone', color: 'text-amber-600 hover:bg-amber-50/70' },
                  ].map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(item.id, opt.code as any);
                        setActiveDropdownId(null);
                      }}
                      className={cn(
                        "w-full text-left px-2 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-between",
                        opt.color,
                        item.status === opt.code ? "bg-slate-50 font-black ring-1 ring-slate-100" : ""
                      )}
                    >
                      <span>{opt.label}</span>
                      {item.status === opt.code && <Check className="h-3 w-3 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

        </CardContent>
      </Card>
    );
  };

  // Query and merge product list from (1) recorded sales, and (2) customer wishlist with found status
  const getMergedChecklistItems = () => {
    // A. Sourced from Customer Wishlist with FOUND status
    const wishlistFound = myWishlist
      .filter(item => item.status === 'found')
      .map(item => ({
        id: `chk_wishlist_${item.id}`,
        name: item.name,
        qty: 1,
        price: item.price,
        requester: item.requester,
        location: item.location,
        type: 'wishlist' as const,
        sourceLabel: 'Wishlist (Found Task)'
      }));

    // B. Sourced from recorded sales in OwnerDashboard
    const salesItems: any[] = [];
    sales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((it: any, index: number) => {
          // If a wishlist task with the same product name is already in the checklist, skip duplicating it as a sale item
          const isWishlistDuplicate = wishlistFound.some(w => w.name.toLowerCase() === it.name.toLowerCase());
          if (!isWishlistDuplicate) {
            salesItems.push({
              id: `chk_sale_${sale.id}_${it.productId || index}`,
              name: it.name,
              qty: it.qty || 1,
              price: it.price,
              requester: sale.customerName,
              location: 'Checkout Desk',
              type: 'sale' as const,
              sourceLabel: 'Logged Invoice Sale'
            });
          }
        });
      }
    });

    return [...wishlistFound, ...salesItems];
  };

  const checklistItems = getMergedChecklistItems();

  const isItemChecked = (itemId: string, itemType: 'wishlist' | 'sale') => {
    return boughtIds.includes(itemId);
  };

  const handleToggleCustomChecklist = (itemId: string, itemType: 'wishlist' | 'sale') => {
    handleToggleChecklistBoughtState(itemId);
  };

  // Calculate stats for checklist completed items
  const checkedCount = checklistItems.filter(item => isItemChecked(item.id, item.type)).length;
  const totalChecklistCount = checklistItems.length;
  const completionPercentage = totalChecklistCount > 0 ? Math.round((checkedCount / totalChecklistCount) * 100) : 0;

  // Filter the standard wishlist page
  const filteredMyWishlist = myWishlist.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedStatusFilter === 'all') {
      return matchesSearch;
    }
    return matchesSearch && item.status === selectedStatusFilter;
  });

  const pendingWishlist = filteredMyWishlist.filter(item => item.status !== 'found');
  const foundWishlist = filteredMyWishlist.filter(item => item.status === 'found');

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Traveler Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">
              Wishlist & Tasks
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">
              Manage custom requests, unlock client pipelines, and audit active deal files.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className={cn(buttonVariants({ variant: 'default', size: 'sm' }), "h-9 rounded-xl font-bold text-[10px] gap-1.5 shadow-lg shadow-primary/15 shrink-0")}>
              <Plus className="h-3.5 w-3.5" /> RECORD REQUEST
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-none max-w-[95%] md:max-w-md bg-white">
              <DialogHeader className="text-left">
                <DialogTitle className="font-black uppercase italic text-2xl tracking-tighter">
                  Record External Request
                </DialogTitle>
                <DialogDescription className="text-xs font-medium">
                  Manually book requests received from private lines (WA, IG) into this audited traveler session.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-2">
                {/* Photo Upload Area */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Product Chat Photo / Reference</label>
                  {formImage ? (
                    <div className="relative h-28 w-full rounded-2xl overflow-hidden border bg-muted/20 flex items-center justify-center">
                      <img src={formImage} className="h-full w-full object-cover" alt="Uploaded reference preview" referrerPolicy="no-referrer" />
                      <button 
                        type="button"
                        onClick={() => setFormImage('')} 
                        className="absolute top-2 right-2 h-7 w-7 rounded-xl bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label 
                      htmlFor="ref-photo-upload"
                      className="flex flex-col items-center justify-center h-28 w-full rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/35 hover:border-primary/50 transition-colors cursor-pointer text-center p-4 gap-1.5 group"
                    >
                      <Camera className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      <div>
                        <p className="text-xs font-bold text-slate-700">Attach Detailed Product Photo</p>
                        <p className="text-[9px] text-muted-foreground font-semibold">Provide reference image from custom chat (Tap to choose)</p>
                      </div>
                      <input 
                        id="ref-photo-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange} 
                      />
                    </label>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Product Name *</label>
                  <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    <Input 
                      placeholder="e.g. Aesop Mouthwash 500ml" 
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="h-12 pl-12 rounded-xl bg-muted/30 border-none font-bold placeholder:font-normal text-sm" 
                    />
                  </div>
                </div>



                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer Identifier</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    <Input 
                      placeholder="e.g. WhatsApp / Jane Andrews" 
                      value={formCustomer}
                      onChange={e => setFormCustomer(e.target.value)}
                      className="h-12 pl-12 rounded-xl bg-muted/30 border-none font-bold placeholder:font-normal text-sm" 
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button className="w-full h-12 rounded-2xl font-black uppercase italic shadow-lg shadow-primary/10" onClick={handleCreateWishlist}>
                    Record to Active List
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* SUB MENU: SLIDING PILL SWITCH */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1.5">
        <button
          type="button"
          onClick={() => setViewMode('board')}
          className={cn(
            "flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2",
            viewMode === 'board'
              ? "bg-white text-primary shadow-md shadow-slate-200/50 scale-[1.01]"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
          )}
        >
          <ShoppingBag className="h-4 w-4" /> Wishlist Board
        </button>
        <button
          type="button"
          onClick={() => {
            setViewMode('checklist');
            // reset filters/search inside checklist
            setActiveDropdownId(null);
          }}
          className={cn(
            "flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2",
            viewMode === 'checklist'
              ? "bg-white text-primary shadow-md shadow-slate-200/50 scale-[1.01]"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
          )}
        >
          <ListTodo className="h-4 w-4" /> Item Checklist
        </button>
      </div>

      {/* RENDER VIEW 1: STANDALONE WISHLIST BOARD */}
      {viewMode === 'board' && (
        <>
          {/* Search Bar & Micro Filter Toolbar */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by item, location, customer..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-12 w-full rounded-2xl bg-muted/30 border-none pl-11 text-xs font-bold focus:bg-background"
                />
              </div>
              <Dialog>
                <DialogTrigger className={cn(buttonVariants({ variant: 'outline' }), "h-12 w-12 rounded-2xl border-dashed p-0 shrink-0 inline-flex items-center justify-center")}>
                  <Filter className="h-5 w-5" />
                </DialogTrigger>
                <DialogContent className="rounded-3xl border-none max-w-[90%] bg-white p-5 text-left">
                  <DialogHeader className="text-left">
                    <DialogTitle className="text-base font-black uppercase italic">Filter by Status</DialogTitle>
                    <DialogDescription className="text-xs">Narrow down tasks by search/purchase state</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-2 py-2">
                    {['all', 'find', 'found', 'out of stock', 'cancel', 'hold'].map(stat => (
                      <button
                        key={stat}
                        type="button"
                        onClick={() => {
                          setSelectedStatusFilter(stat);
                          toast.success(`Filter applied for status: ${stat.toUpperCase()}`);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                          (selectedStatusFilter === stat)
                            ? "bg-primary text-white"
                            : "bg-slate-55 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        {stat === 'all' ? '✨ Show All Items' : getStatusLabel(stat as any)}
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Selected category pill indicator */}
            {selectedStatusFilter !== 'all' && (
              <div className="flex items-center gap-2 px-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Active Filter:</span>
                <Badge className={cn("text-[9px] font-black h-5 uppercase tracking-wider rounded-full", getStatusStyle(selectedStatusFilter as any))}>
                  {selectedStatusFilter}
                </Badge>
                <button 
                  onClick={() => setSelectedStatusFilter('all')} 
                  className="text-[9px] text-primary hover:underline font-black uppercase tracking-wider"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Fulfillment List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Traveler Taskboard</p>
              <Badge variant="outline" className="text-[10px] h-5 border-dashed font-bold">{filteredMyWishlist.length} ITEMS</Badge>
            </div>

            {filteredMyWishlist.length === 0 ? (
              <div className="text-center p-10 bg-muted/20 rounded-3xl border border-dashed text-muted-foreground flex flex-col items-center gap-2">
                <Package className="h-8 w-8 opacity-40" />
                <p className="text-xs font-bold uppercase tracking-widest">No matching requests</p>
                <p className="text-[10px] max-w-xs leading-normal">Adjust search filters or use "Record Request" above to log manual entries.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Category: ITEMS STILL PENDING SOURCING */}
                {pendingWishlist.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Pending Sourcing ({pendingWishlist.length})
                      </p>
                    </div>
                    <div className="space-y-2.5">
                      {pendingWishlist.map((item, i) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="relative"
                        >
                          {renderWishlistItem(item, i)}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-3xl bg-emerald-50 text-emerald-700 text-center text-xs font-bold uppercase tracking-wide border border-emerald-100/60 shadow-sm flex items-center justify-center gap-2">
                    <span>🎉 Excellent! All active requests are successfully sourced!</span>
                  </div>
                )}

                {/* 2. Category: COMPLETED/FOUND WISHLIST ITEMS */}
                {foundWishlist.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-dashed border-slate-200">
                    <div className="flex items-center gap-2 px-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Already Found & Acquired ({foundWishlist.length})
                      </p>
                    </div>
                    <div className="space-y-2.5">
                      {foundWishlist.map((item, i) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="relative"
                        >
                          {renderWishlistItem(item, i, "opacity-75 hover:opacity-100 bg-slate-50/20 border-emerald-100/50")}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* RENDER VIEW 2: SYSTEMATIC ITEM CHECKLIST */}
      {viewMode === 'checklist' && (
        <div className="space-y-6">
          {/* Checklist header state */}
          <Card className="border-none bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl rounded-3xl overflow-hidden relative">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-6 translate-y-6">
              <ListTodo className="h-40 w-40" />
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <span className="bg-primary/20 text-primary border border-primary/30 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block leading-none">
                  Checkout Audit Docket
                </span>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">
                  End-of-Trip Checklist
                </h3>
                <p className="text-slate-300 text-[10px] font-semibold leading-relaxed">
                  Verify purchase logs before baggage packaging. Combine items from active sales invoices and found wishlists.
                </p>
              </div>

              {/* Progress visual section */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-tight">
                  <span className="text-slate-400">Checkout Audit Progress</span>
                  <span className="text-primary font-bold">{checkedCount} / {totalChecklistCount} Items Done</span>
                </div>
                <div className="h-2.5 w-full bg-slate-700/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] text-slate-500 font-black uppercase tracking-widest pt-0.5">
                  <span>Departure packing</span>
                  <span>{completionPercentage}% complete</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checklist queries list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Checkout Checklist Items</p>
              <Badge variant="outline" className="text-[10px] h-5 border-dashed font-bold">{totalChecklistCount} AUDIT LINES</Badge>
            </div>

            {checklistItems.length === 0 ? (
              <div className="text-center p-12 bg-muted/20 rounded-3xl border border-dashed text-muted-foreground flex flex-col items-center gap-2.5">
                <Info className="h-7 w-7 opacity-35" />
                <p className="text-xs font-bold uppercase tracking-widest">No items found for auditing</p>
                <p className="text-[10px] max-w-xs leading-normal">
                  Checklist matches "Found" wishlist tasks + "Record Sale" invoice entries. Update wishlist tasks to "Found" or record sales to populate.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {checklistItems.map((item, idx) => {
                  const checked = isItemChecked(item.id, item.type);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Card 
                        onClick={() => handleToggleCustomChecklist(item.id, item.type)}
                        className={cn(
                          "border border-slate-100 shadow-sm cursor-pointer hover:border-primary/20 transition-all rounded-2xl select-none",
                          checked ? "bg-emerald-50/20 border-emerald-100 opacity-80" : "bg-white"
                        )}
                      >
                        <CardContent className="p-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            
                            {/* Visual toggle checkbox */}
                            <div className="shrink-0 transition-transform active:scale-90">
                              {checked ? (
                                <CheckSquare className="h-5.5 w-5.5 text-emerald-600 fill-emerald-50" />
                              ) : (
                                <Square className="h-5.5 w-5.5 text-slate-300" />
                              )}
                            </div>

                            {/* Item name and descriptors */}
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <h4 className={cn(
                                "text-xs font-bold leading-tight uppercase italic tracking-tighter truncate text-slate-800",
                                checked ? "line-through text-slate-400" : ""
                              )}>
                                {item.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                                <Badge className="text-[7.5px] font-black h-4 px-1.2 uppercase border bg-slate-50 text-slate-500 shrink-0">
                                  {item.type === 'sale' ? '🧾 INVOICE SALE' : '💎 Wishlist found'}
                                </Badge>
                                <span className="opacity-40">•</span>
                                <span className="font-blue font-black text-rose-500">Qty {item.qty}x</span>
                                <span className="opacity-40">•</span>
                                <span className="text-slate-750 text-slate-700">Client: {item.requester}</span>
                              </div>
                            </div>

                          </div>

                          {/* Sourced status Tag */}
                          <div className="shrink-0 text-right">
                            {checked ? (
                              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none px-2 h-5.5 rounded text-[8px] font-black uppercase tracking-widest leading-none">
                                ALREADY BOUGHT
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none px-2 h-5.5 rounded text-[8px] font-black uppercase tracking-widest leading-none">
                                NOT BUY YET
                              </Badge>
                            )}
                            <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Sourced: {item.location}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL PRODUCT MODAL SCREEN */}
      <Dialog open={selectedDetailItem !== null} onOpenChange={(open) => { if (!open) setSelectedDetailItem(null); }}>
        <DialogContent className="rounded-3xl border-none max-w-[95%] sm:max-w-md bg-white p-6 text-left">
          {selectedDetailItem && (
            <div className="space-y-5 text-left">
              <DialogHeader className="text-left pb-2 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary/10 text-primary border-none px-2.5 h-5 text-[8.5px] font-black uppercase tracking-wider">
                    Product Detail File
                  </Badge>
                  <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 h-6 rounded-lg", getStatusStyle(selectedDetailItem.status))}>
                    {selectedDetailItem.status}
                  </Badge>
                </div>
                <DialogTitle className="text-lg font-black uppercase italic tracking-tighter text-slate-800 mt-2.5 leading-tight">
                  {selectedDetailItem.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mt-1">
                  Sourced for client <span className="text-primary font-bold">{selectedDetailItem.requester}</span>
                </DialogDescription>
              </DialogHeader>

              {/* Product picture rendering */}
              {selectedDetailItem.image ? (
                <div className="w-full h-44 rounded-2xl overflow-hidden border">
                  <img src={selectedDetailItem.image} className="h-full w-full object-cover" alt={selectedDetailItem.name} referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className="w-full h-28 rounded-2xl border border-dashed flex flex-col items-center justify-center p-4 bg-muted/10 text-muted-foreground gap-1 text-center">
                  <Package className="h-8 w-8 opacity-35 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-wider">No rich preview image</span>
                  <span className="text-[9px] opacity-60 font-semibold">Registered through external instant message text request channels.</span>
                </div>
              )}

              {/* Meta specifications bento board - Editable Target Budget */}
              <div className="p-4 rounded-2xl bg-slate-50 border space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black text-slate-550 text-slate-500 uppercase tracking-widest leading-none">Target Budget</label>
                  <span className="text-[8px] font-bold text-slate-400">Click currency to cycle</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <button
                      type="button"
                      onClick={handleCycleBudgetCurrency}
                      className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-[10px] text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-all flex items-center gap-0.5 active:scale-95 animate-pulse"
                      title="Click to switch currency"
                    >
                      <span>{getCurrencySymbol(editBudgetCurrency)}</span>
                      <span className="text-[8px] opacity-80">{editBudgetCurrency}</span>
                    </button>
                    <Input 
                      type="text" 
                      value={editBudgetAmount}
                      onChange={(e) => setEditBudgetAmount(e.target.value.replace(/[^0-9]/g, ''))}
                      className="h-10 pl-16 rounded-xl bg-white border-slate-200 font-bold text-xs font-mono"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="h-10 rounded-xl px-3 font-bold text-xs uppercase"
                    onClick={async () => {
                      if (!selectedDetailItem) return;
                      const parsedAmount = parseInt(editBudgetAmount.replace(/[^0-9]/g, '')) || 0;
                      const finalIdrPrice = editBudgetCurrency === shoppingCurrencyCode
                        ? Math.round(parsedAmount * conversionRate)
                        : parsedAmount;
                      
                      const updatedItem = {
                        ...selectedDetailItem,
                        price: finalIdrPrice
                      };
                      
                      try {
                        await saveWishlist(updatedItem);
                        setSelectedDetailItem(updatedItem);
                        toast.success(`Target budget updated to Rp ${finalIdrPrice.toLocaleString()}!`);
                      } catch (err) {
                        toast.error('Failed to update target budget');
                      }
                    }}
                  >
                    Save
                  </Button>
                </div>
                {editBudgetCurrency !== 'IDR' && (
                  <p className="text-[8.5px] text-slate-550 text-slate-500 font-semibold px-0.5">
                    Approx. <span className="font-bold text-indigo-600">Rp {computedPriceInIdr.toLocaleString()}</span> IDR (1 {editBudgetCurrency} = Rp {conversionRate.toLocaleString()})
                  </p>
                )}
              </div>

              {/* Detail inline quick state modifiers */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status Control Panel</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { code: 'find', label: '🔍 Find' },
                    { code: 'found', label: '✅ Found' },
                    { code: 'out of stock', label: '❌ OOS' },
                    { code: 'cancel', label: '🚫 Cancel' },
                    { code: 'hold', label: '⏸️ Hold' },
                  ].map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => {
                        handleUpdateStatus(selectedDetailItem.id, opt.code as any);
                        setSelectedDetailItem(prev => prev ? { ...prev, status: opt.code as any } : null);
                      }}
                      className={cn(
                        "py-2 px-1 rounded-xl text-[9px] font-black text-center uppercase tracking-tight transition-all border",
                        selectedDetailItem.status === opt.code
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-transparent"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3 border-t border-slate-50">
                <Button 
                  className="flex-1 h-11 rounded-2xl font-black uppercase text-xs"
                  onClick={() => setSelectedDetailItem(null)}
                >
                  Close Detail file
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
