import { useState, ChangeEvent, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  Plus, 
  Package, 
  ArrowLeft,
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
  Calendar,
  Edit2,
  Trash2,
  Minus
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
import { useConfirm } from '../context/ConfirmContext';

export interface WishlistItem {
  id: string;
  name: string;
  requester: string;
  status: 'find' | 'found' | 'out of stock' | 'cancel' | 'hold';
  price: number;
  sellPrice?: number;
  location: string;
  image?: string;
}

export function ExploreScreen() {
  const navigate = useNavigate();
  const {
    loading,
    sales,
    wishlistItems: myWishlist,
    saveWishlist,
    saveSale,
    boughtIds,
    toggleBoughtId,
    tripSettings
  } = useMaster();

  const confirm = useConfirm();

  const shoppingCurrencyCode = tripSettings?.currency?.code || 'SGD';
  const payoutCurrencyCode = tripSettings?.currency?.payout || 'IDR';



  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'board' | 'checklist'>('board');
  const [checklistViewMode, setChecklistViewMode] = useState<'transaction' | 'summary'>('transaction');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Track active popup elements
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<WishlistItem | null>(null);

  const [editBudgetAmount, setEditBudgetAmount] = useState('');
  const [editBudgetCurrency, setEditBudgetCurrency] = useState(shoppingCurrencyCode || 'SGD');
  
  const [editSellAmount, setEditSellAmount] = useState('');
  const [editSellCurrency, setEditSellCurrency] = useState('IDR');

  useEffect(() => {
    if (selectedDetailItem) {
      const rate = tripSettings?.currency?.manualRate || 13500;
      if (shoppingCurrencyCode !== 'IDR' && selectedDetailItem.price) {
        setEditBudgetAmount(Math.round(selectedDetailItem.price / rate).toString());
      } else {
        setEditBudgetAmount(selectedDetailItem.price ? selectedDetailItem.price.toString() : '');
      }
      setEditBudgetCurrency(shoppingCurrencyCode);
      setEditSellAmount(selectedDetailItem.sellPrice ? selectedDetailItem.sellPrice.toString() : '');
      setEditSellCurrency('IDR');
    }
  }, [selectedDetailItem?.id, shoppingCurrencyCode, payoutCurrencyCode]);

  const conversionRate = tripSettings?.currency?.manualRate || 13500;
  const computedPriceInIdr = editBudgetCurrency === shoppingCurrencyCode
    ? Math.round((parseInt(editBudgetAmount.replace(/[^0-9]/g, '')) || 0) * conversionRate)
    : (parseInt(editBudgetAmount.replace(/[^0-9]/g, '')) || 0);

  const handleCycleBudgetCurrency = () => {
    const sequence = [payoutCurrencyCode, shoppingCurrencyCode];
    const nextIdx = (sequence.indexOf(editBudgetCurrency) + 1) % sequence.length;
    setEditBudgetCurrency(sequence[nextIdx]);
  };

  const handleCycleSellCurrency = () => {
    const sequence = [payoutCurrencyCode, shoppingCurrencyCode];
    const nextIdx = (sequence.indexOf(editSellCurrency) + 1) % sequence.length;
    setEditSellCurrency(sequence[nextIdx]);
  };

  // Form states for manually recording a wishlist
  const [formName, setFormName] = useState('');
  const [formQty, setFormQty] = useState('1');
  const [formLocation, setFormLocation] = useState('');
  const [formCustomer, setFormCustomer] = useState('');
  const [formImage, setFormImage] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingChecklistItem, setEditingChecklistItem] = useState<any>(null);
  const [editChecklistForm, setEditChecklistForm] = useState({ name: '', qty: 1, price: 0, customerName: '' });

  const handleCloseDetail = async (explicitSave: boolean = false) => {
    if (selectedDetailItem) {
      const original = myWishlist.find(w => w.id === selectedDetailItem.id);
      const isDirty = original && (
        original.price !== selectedDetailItem.price || 
        original.sellPrice !== selectedDetailItem.sellPrice || 
        original.qty !== selectedDetailItem.qty || 
        original.status !== selectedDetailItem.status
      );

      if (isDirty) {
        if (explicitSave) {
          // Explicit save triggered by the Save & Close button
          await saveWishlist(selectedDetailItem);
        } else {
          // Accidental close (ESC or click outside)
          const discard = await confirm("You have unsaved changes. Are you sure you want to discard them and close?");
          if (!discard) {
            // Abort the closing process, let the user continue editing
            return;
          }
          // If they confirmed discard, we do NOT save and simply let it close.
        }
      }
    }
    setSelectedDetailItem(null);
  };


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
    if (isSubmitting) return;
    if (!formName) {
      toast.error('Please enter the product name');
      return;
    }
    
    setIsSubmitting(true);
    const confirmed = await confirm(`Are you sure you want to create a new wishlist request for "${formName}"?`);
    if (!confirmed) {
      setIsSubmitting(false);
      return;
    }
    const newEntry: WishlistItem = {
      id: 'w_' + Date.now(),
      name: formName,
      location: formLocation || 'External Chat',
      price: 0,
      qty: parseInt(formQty) || 1,
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
      setFormQty('1');
      setFormLocation('');
      setFormCustomer('');
      setFormImage('');
    } catch (e) {
      toast.error('Failed to create wishlist item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetailImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!selectedDetailItem) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        const updatedItem = {
          ...selectedDetailItem,
          image: base64Image
        };
        
        try {
          await saveWishlist(updatedItem);
          setSelectedDetailItem(updatedItem);
          toast.success('Photo added to wishlist item successfully!');
        } catch (err) {
          toast.error('Failed to upload photo');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'find' | 'found' | 'out of stock' | 'cancel' | 'hold') => {
    const matchedItem = myWishlist.find(item => item.id === id);
    if (!matchedItem) return;
    
    const confirmed = await confirm(`Are you sure you want to change the status of "${matchedItem.name}" to ${newStatus.toUpperCase()}?`);
    if (!confirmed) return;
    
    const updatedItem = { ...matchedItem, status: newStatus };

    try {
      await saveWishlist(updatedItem);
      toast.info(`Status of ${updatedItem.name} set to ${newStatus.toUpperCase()}`);
    } catch (e) {
      toast.error('Failed to update status. Please try again.');
    }
  };

  const handleToggleCustomChecklist = async (id: string, type: 'wishlist' | 'sale') => {
    const isCurrentlyBought = boughtIds.includes(id);
    const action = isCurrentlyBought ? 'uncheck this item' : 'confirm this item as bought';
    
    const confirmed = await confirm(`Are you sure you want to ${action}?`);
    if (!confirmed) return;

    // Auto generate sales record when a wishlist item is checked
    if (!isCurrentlyBought && type === 'wishlist') {
      const matchedWishlist = myWishlist.find(w => `chk_wishlist_${w.id}` === id);
      if (matchedWishlist) {
        try {
          const sellPrice = matchedWishlist.sellPrice || matchedWishlist.price;
          const newSale = {
            id: 'sale_' + Date.now(),
            customerName: matchedWishlist.requester,
            total: sellPrice,
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            items: [{
              productId: matchedWishlist.id,
              name: matchedWishlist.name,
              price: sellPrice,
              qty: 1,
              cost: matchedWishlist.price,
              sourceCategory: 'Wishlist'
            }]
          };
          if (saveSale) await saveSale(newSale);
        } catch (e) {
          console.error("Failed to generate automatic sale", e);
        }
      }
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
        className={cn(
          "fintech-card overflow-visible cursor-pointer relative",
          activeDropdownId === item.id ? "z-50" : "z-10",
          opacityClass
        )}
        onClick={() => setSelectedDetailItem(item)}
      >
        <CardContent className="p-4 flex items-center justify-between gap-4 overflow-visible">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            
            {/* Image Thumbnail */}
            <div className="h-14 w-14 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-[#f2f5f7] border relative">
              {item.image ? (
                <img src={item.image} className="h-full w-full object-cover" alt={item.name} referrerPolicy="no-referrer" />
              ) : (
                <Package className="h-6 w-6 text-slate-400" />
              )}
            </div>

            {/* Specifics */}
            <div className="space-y-1 min-w-0 flex-1">
              <h4 className="text-sm font-bold text-[#163300] truncate">
                {item.name}
              </h4>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
                <span className="text-[#163300]">{item.requester}</span>
                <span className="opacity-40">•</span>
                <span className="font-bold text-[#163300]">Rp {item.price.toLocaleString()}</span>
                <span className="opacity-40">•</span>
                <span className="flex items-center gap-0.5"><MapPinIcon className="h-3 w-3" />{item.location}</span>
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
                <div className="absolute right-0 top-10 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl p-2.5 z-50 min-w-[170px] space-y-1 text-left cursor-default" onClick={e => e.stopPropagation()}>
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
        qty: item.qty || 1,
        price: item.sellPrice || item.price,
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
              id: `chk_sale_${sale.id}_${index}`,
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

  const groupedChecklistItems = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; checkedQty: number; ids: string[] }>();
    checklistItems.forEach(item => {
      const key = (item.name || 'Unknown').toLowerCase().trim();
      const checked = isItemChecked(item.id, item.type);
      if (!map.has(key)) {
        map.set(key, { name: item.name, qty: item.qty, checkedQty: checked ? item.qty : 0, ids: [item.id] });
      } else {
        const existing = map.get(key)!;
        existing.qty += item.qty;
        if (checked) existing.checkedQty += item.qty;
        existing.ids.push(item.id);
      }
    });
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [checklistItems, boughtIds]);

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
    <div className="min-h-screen bg-[#f2f5f7] pb-24">
      {/* Sticky Header mimicking Inventory Screen */}
      <header className="sticky top-0 z-50 bg-[#f2f5f7]/80 backdrop-blur-md px-4 pt-8 pb-4 flex items-center justify-between gap-3">
        <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm hover:bg-slate-50 shrink-0" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5 text-[#163300]" />
        </Button>
        <h2 className="text-xl font-black text-[#163300] tracking-tight flex-1">Wishlist & Tasks</h2>
        <div className="flex items-center gap-2 shrink-0">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className="flex h-10 w-10 items-center justify-center rounded-full bg-[#163300] text-white hover:bg-[#1f4700] shrink-0 outline-none">
              <Plus className="h-5 w-5" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-black text-[#163300] tracking-tight">
                  Record Request
                </DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-500">
                  Manually book requests received from private lines (WA, IG).
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-2">
                {/* Photo Upload Area */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Product Photo</label>
                  {formImage ? (
                    <div className="relative h-28 w-full rounded-2xl overflow-hidden border-none bg-[#f2f5f7] flex items-center justify-center">
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
                      className="flex flex-col items-center justify-center h-28 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-[#f2f5f7] hover:bg-slate-100 transition-colors cursor-pointer text-center p-4 gap-1.5 group"
                    >
                      <Camera className="h-6 w-6 text-slate-400 group-hover:text-[#163300] transition-colors" />
                      <div>
                        <p className="text-xs font-bold text-[#163300]">Attach Photo</p>
                        <p className="text-[10px] text-slate-500 font-medium">Tap to choose image</p>
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
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Product Name *</label>
                  <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                      placeholder="e.g. Aesop Mouthwash 500ml" 
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="h-14 pl-12 rounded-full bg-[#f2f5f7] border-none font-bold text-sm" 
                    />
                  </div>
                </div>


                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Quantity</label>
                  <div className="relative">
                    <Input 
                      type="number"
                      min="1"
                      placeholder="1" 
                      value={formQty}
                      onChange={e => setFormQty(e.target.value)}
                      className="h-14 px-4 rounded-full bg-[#f2f5f7] border-none font-bold text-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Customer Name</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                      placeholder="e.g. WhatsApp / Jane Andrews" 
                      value={formCustomer}
                      onChange={e => setFormCustomer(e.target.value)}
                      className="h-14 pl-12 rounded-full bg-[#f2f5f7] border-none font-bold text-sm" 
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button 
                    className="pill-button w-full h-14 bg-[#163300] text-white hover:bg-[#1f4700]" 
                    onClick={handleCreateWishlist}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Recording...' : 'Record Request'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="p-4 space-y-4">
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
                <DialogContent>
                  <DialogHeader className="text-left">
                    <DialogTitle className="text-lg font-black text-[#163300] tracking-tight">Filter by Status</DialogTitle>
                    <DialogDescription className="text-sm text-slate-500 font-medium">Narrow down tasks by state</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-2 py-2">
                    {['all', 'find', 'found', 'out of stock', 'cancel', 'hold'].map(stat => (
                      <button
                        key={stat}
                        type="button"
                        onClick={() => {
                          setSelectedStatusFilter(stat);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3.5 rounded-2xl text-sm font-bold transition-all",
                          (selectedStatusFilter === stat)
                            ? "bg-[#9fe870] text-[#163300]"
                            : "bg-[#f2f5f7] text-slate-600 hover:bg-slate-200"
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
          <Card className="border-none bg-[#163300] text-white shadow-md rounded-2xl overflow-hidden relative">
            <CardContent className="p-4 relative z-10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="bg-[#9fe870]/20 p-2 rounded-xl">
                    <ListTodo className="h-5 w-5 text-[#9fe870]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight">Checkout Audit</h3>
                    <p className="text-[10px] text-slate-300 font-medium">Verify all items</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-[#9fe870] leading-none">{checkedCount} <span className="text-xs text-slate-400">/ {totalChecklistCount}</span></span>
                </div>
              </div>

              {/* Progress visual section */}
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#9fe870] transition-all duration-500 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Checklist queries list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Checkout Checklist Items</p>
              <div className="flex bg-slate-200/50 p-1 rounded-xl">
                <button
                  onClick={() => setChecklistViewMode('transaction')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                    checklistViewMode === 'transaction' ? "bg-white text-[#163300] shadow-sm" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  By Transaction
                </button>
                <button
                  onClick={() => setChecklistViewMode('summary')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                    checklistViewMode === 'summary' ? "bg-white text-[#163300] shadow-sm" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  By Item Summary
                </button>
              </div>
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
                {checklistViewMode === 'transaction' ? (
                  checklistItems.map((item, idx) => {
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
                            "fintech-card cursor-pointer hover:border-[#9fe870] transition-all select-none p-4",
                            checked ? "bg-slate-50 opacity-60 border-transparent shadow-none" : ""
                          )}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              
                              {/* Visual toggle checkbox */}
                              <div className="shrink-0 transition-transform active:scale-90">
                                {checked ? (
                                  <CheckSquare className="h-8 w-8 text-[#163300] fill-[#9fe870]" />
                                ) : (
                                  <Square className="h-8 w-8 text-slate-300" />
                                )}
                              </div>

                              {/* Item name and descriptors */}
                              <div className="space-y-1 min-w-0 flex-1">
                                <h4 className={cn(
                                  "text-sm font-bold text-[#163300] truncate",
                                  checked ? "line-through text-slate-400" : ""
                                )}>
                                  {item.name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                    item.type === 'sale' ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                                  )}>
                                    {item.type === 'sale' ? 'Invoice' : 'Wishlist'}
                                  </span>
                                  <span className="opacity-40">•</span>
                                  <span className="font-black text-[#163300] text-sm bg-slate-100 px-1.5 py-0.5 rounded">Qty {item.qty}</span>
                                  <span className="opacity-40">•</span>
                                  <span>Client: {item.requester}</span>
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
                              {!checked && (
                                <div className="mt-2 flex justify-end">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 px-2 text-[10px] text-slate-500 hover:text-[#163300] hover:bg-slate-200/50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingChecklistItem(item);
                                      setEditChecklistForm({
                                        name: item.name,
                                        qty: item.qty,
                                        price: item.price,
                                        customerName: item.requester || ''
                                      });
                                    }}
                                  >
                                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })
                ) : (
                  groupedChecklistItems.map((group, idx) => {
                    const fullyChecked = group.checkedQty === group.qty;
                    return (
                      <motion.div
                        key={group.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <Card className={cn(
                          "fintech-card p-4 transition-all select-none",
                          fullyChecked ? "bg-slate-50 opacity-60 border-transparent shadow-none" : ""
                        )}>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              
                              <div className="shrink-0 flex flex-col items-center justify-center bg-slate-100 h-10 w-10 rounded-xl">
                                <span className="text-[10px] font-black text-slate-400 uppercase leading-none">Total</span>
                                <span className={cn("text-lg font-black leading-none", fullyChecked ? "text-slate-400" : "text-[#163300]")}>{group.qty}</span>
                              </div>

                              <div className="space-y-1 min-w-0 flex-1">
                                <h4 className={cn(
                                  "text-sm font-bold text-[#163300] truncate",
                                  fullyChecked ? "line-through text-slate-400" : ""
                                )}>
                                  {group.name}
                                </h4>
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                  <span className="font-bold text-[#163300]">{group.checkedQty}</span> / {group.qty} already bought
                                </div>
                              </div>

                            </div>

                            <div className="shrink-0 text-right">
                              {fullyChecked ? (
                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none px-2 h-5.5 rounded text-[8px] font-black uppercase tracking-widest leading-none">
                                  COMPLETED
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none px-2 h-5.5 rounded text-[8px] font-black uppercase tracking-widest leading-none">
                                  {group.qty - group.checkedQty} REMAINING
                                </Badge>
                              )}
                            </div>
                          </div>
                    </Card>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}
            
            {/* Sticky Progress Bar for Checklist */}
            <div className="fixed bottom-16 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-[#f2f5f7] via-[#f2f5f7] to-transparent pointer-events-none z-30">
              <div className="max-w-md mx-auto">
                <Card className="fintech-card p-4 pointer-events-auto shadow-xl shadow-slate-200/50 border-t-4 border-t-[#9fe870]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shopping Progress</span>
                    <span className="text-sm font-black text-[#163300]">{checkedCount} / {totalChecklistCount} Items</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#9fe870] transition-all duration-500 ease-out" 
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </Card>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DETAIL PRODUCT MODAL SCREEN */}
      <Dialog open={selectedDetailItem !== null} onOpenChange={async (open) => { 
        if (!open) {
          await handleCloseDetail();
        } 
      }}>
        <DialogContent>
          {selectedDetailItem && (
            <div className="space-y-5 text-left">
              <DialogHeader className="text-left pb-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-slate-100 text-slate-600 border-none font-bold uppercase tracking-widest text-[10px]">
                    Wishlist Request
                  </Badge>
                  <Badge className={cn("text-[10px] font-bold uppercase tracking-widest border-none", getStatusStyle(selectedDetailItem.status))}>
                    {selectedDetailItem.status}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl font-black text-[#163300] mt-3 leading-tight tracking-tight">
                  {selectedDetailItem.name}
                </DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                  Sourced for client <span className="text-[#163300] font-bold">{selectedDetailItem.requester}</span>
                </DialogDescription>
              </DialogHeader>

              {/* Product picture rendering (Clickable to upload/take photo) */}
              <div className="space-y-1">
                <input 
                  type="file" 
                  accept="image/*" 
                  id="detail-image-upload" 
                  className="hidden" 
                  onChange={handleDetailImageUpload} 
                />
                {selectedDetailItem.image ? (
                  <label htmlFor="detail-image-upload" className="cursor-pointer block relative group w-full h-48 rounded-2xl overflow-hidden bg-[#f2f5f7]">
                    <img src={selectedDetailItem.image} className="h-full w-full object-cover" alt={selectedDetailItem.name} referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs uppercase">
                      <Camera className="h-4 w-4" /> Change Photo
                    </div>
                  </label>
                ) : (
                  <label htmlFor="detail-image-upload" className="cursor-pointer block w-full h-32 rounded-2xl border-2 border-dashed border-slate-200 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center p-4 bg-[#f2f5f7] text-slate-500 gap-2 text-center">
                    <Camera className="h-8 w-8 text-slate-400" />
                    <span className="text-xs font-bold text-[#163300]">Add Photo Reference</span>
                    <span className="text-[10px] text-slate-500">Tap to upload</span>
                  </label>
                )}
              </div>

              {/* Quantity Editor */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Quantity Requested</label>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-10 w-10 rounded-xl"
                    onClick={async () => {
                      if (!selectedDetailItem) return;
                      const newQty = Math.max(1, (selectedDetailItem.qty || 1) - 1);
                      if (newQty !== selectedDetailItem.qty) {
                        const updated = { ...selectedDetailItem, qty: newQty };
                        setSelectedDetailItem(updated);
                        await saveWishlist(updated);
                      }
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 text-center font-black text-xl text-[#163300]">
                    {selectedDetailItem.qty || 1}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-10 w-10 rounded-xl"
                    onClick={async () => {
                      if (!selectedDetailItem) return;
                      const newQty = (selectedDetailItem.qty || 1) + 1;
                      const updated = { ...selectedDetailItem, qty: newQty };
                      setSelectedDetailItem(updated);
                      await saveWishlist(updated);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Pricing & Currency - Matches Add to Catalog Style */}
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pricing & Currency</label>
                </div>
                
                <Card className="border-none bg-[#f2f5f7] overflow-hidden rounded-2xl">
                  <CardContent className="p-5 space-y-5">
                    {/* Cost Price */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Cost Price</label>
                      </div>
                      <div className="relative">
                        <div 
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold cursor-pointer hover:text-primary transition-colors flex items-center gap-1 z-10"
                          onClick={handleCycleBudgetCurrency}
                          title="Click to switch currency"
                        >
                          {editBudgetCurrency === shoppingCurrencyCode ? (tripSettings?.currency?.symbol || 'S$') : 'Rp'}
                        </div>
                        <Input 
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="0"
                          value={editBudgetAmount}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setEditBudgetAmount(val);
                            if (selectedDetailItem) {
                              const parsedAmount = parseInt(val) || 0;
                              const finalIdrPrice = editBudgetCurrency === shoppingCurrencyCode
                                ? Math.round(parsedAmount * conversionRate)
                                : parsedAmount;
                              setSelectedDetailItem({ ...selectedDetailItem, price: finalIdrPrice });
                            }
                          }}
                          className="h-14 pl-10 rounded-full bg-white border-none text-lg font-black text-[#163300]"
                        />
                      </div>
                      {computedPriceInIdr > 0 && editBudgetCurrency !== 'IDR' && (
                        <p className="text-[10px] font-medium text-slate-500 pt-1">
                          ≈ Rp {computedPriceInIdr.toLocaleString()} (Cost Base)
                        </p>
                      )}
                    </div>

                    {/* Sell Price */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Sell Price (IDR)</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#163300] font-bold">Rp</div>
                        <Input 
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="Selling Price to Customer" 
                          value={editSellAmount}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setEditSellAmount(val);
                            if (selectedDetailItem) {
                              setSelectedDetailItem({ ...selectedDetailItem, sellPrice: parseInt(val) || 0 });
                            }
                          }}
                          className="h-14 pl-10 rounded-full bg-white border-none text-lg font-black text-[#163300]"
                        />
                      </div>
                    </div>
                    
                    {/* Margin Card */}
                    {(() => {
                      const sellNum = parseInt(editSellAmount.replace(/[^0-9]/g, '')) || 0;
                      if (sellNum > 0) {
                        const margin = sellNum - computedPriceInIdr;
                        const marginPercentage = computedPriceInIdr > 0 ? (margin / computedPriceInIdr) * 100 : 0;
                        return (
                          <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${margin > 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                            <div className="space-y-0.5">
                              <p className={`text-[10px] font-bold uppercase ${margin > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                Expected Gross Margin
                              </p>
                              <p className={`text-xl font-black ${margin > 0 ? 'text-green-900' : 'text-red-900'}`}>
                                Rp {margin.toLocaleString()}
                              </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${margin > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {marginPercentage > 0 ? '+' : ''}{marginPercentage.toFixed(1)}%
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </CardContent>
                </Card>
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

              <div className="pt-4 flex gap-3">
                <Button 
                  className="pill-button w-full h-14 bg-[#163300] text-white hover:bg-[#1f4700]"
                  onClick={() => handleCloseDetail(true)}
                >
                  Save & Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT CHECKLIST ITEM MODAL */}
      <Dialog open={editingChecklistItem !== null} onOpenChange={(open) => { if (!open) setEditingChecklistItem(null); }}>
        <DialogContent>
          {editingChecklistItem && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-[#163300]">Edit Transaction Item</DialogTitle>
                <DialogDescription className="text-xs font-medium text-slate-500">
                  Modifying {editingChecklistItem.type === 'wishlist' ? 'a wishlist request' : 'a logged sale invoice'}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Product Name</label>
                  <Input 
                    value={editChecklistForm.name}
                    onChange={e => setEditChecklistForm({ ...editChecklistForm, name: e.target.value })}
                    className="h-12 rounded-xl bg-[#f2f5f7] border-none font-bold text-sm" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Quantity</label>
                    <div className="flex items-center gap-3 h-12 bg-[#f2f5f7] rounded-xl px-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-white shrink-0"
                        onClick={() => {
                          const newQty = Math.max(1, editChecklistForm.qty - 1);
                          if (editingChecklistItem) {
                            const unitPrice = editingChecklistItem.price / (editingChecklistItem.qty || 1);
                            setEditChecklistForm({ ...editChecklistForm, qty: newQty, price: unitPrice * newQty });
                          }
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 text-center font-black text-lg text-[#163300]">
                        {editChecklistForm.qty}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-white shrink-0"
                        onClick={() => {
                          const newQty = editChecklistForm.qty + 1;
                          if (editingChecklistItem) {
                            const unitPrice = editingChecklistItem.price / (editingChecklistItem.qty || 1);
                            setEditChecklistForm({ ...editChecklistForm, qty: newQty, price: unitPrice * newQty });
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Customer Name</label>
                    <Input 
                      value={editChecklistForm.customerName}
                      onChange={e => setEditChecklistForm({ ...editChecklistForm, customerName: e.target.value })}
                      className="h-12 rounded-xl bg-[#f2f5f7] border-none font-bold text-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Price (IDR)</label>
                  <Input 
                    type="text"
                    inputMode="numeric"
                    value={'Rp ' + editChecklistForm.price.toLocaleString()}
                    disabled
                    className="h-12 rounded-xl bg-[#f2f5f7] border-none font-bold text-sm opacity-80" 
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between gap-3">
                <Button 
                  variant="outline" 
                  className="h-12 rounded-xl border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 flex-1"
                  onClick={async () => {
                    const confirmed = await confirm(`Are you sure you want to completely cancel and remove this item?`);
                    if (!confirmed) return;
                    
                    if (editingChecklistItem.type === 'wishlist') {
                      const matched = myWishlist.find(w => w.id === editingChecklistItem.id.replace('chk_wishlist_', ''));
                      if (matched) {
                        await saveWishlist({ ...matched, status: 'cancel' });
                      }
                    } else {
                      const stripped = editingChecklistItem.id.replace('chk_sale_', '');
                      const lastUnderscore = stripped.lastIndexOf('_');
                      const saleId = stripped.substring(0, lastUnderscore);
                      const productIndex = parseInt(stripped.substring(lastUnderscore + 1));
                      const matchedSale = sales.find(s => s.id === saleId);
                      if (matchedSale) {
                        const newItems = [...matchedSale.items];
                        newItems.splice(productIndex, 1);
                        await saveSale({ ...matchedSale, items: newItems });
                      }
                    }
                    toast.success("Item removed successfully");
                    setEditingChecklistItem(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Remove Item
                </Button>
                
                <Button 
                  className="h-12 rounded-xl bg-[#163300] text-white hover:bg-[#1f4700] flex-1"
                  onClick={async () => {
                    const isConfirmed = await confirm("Are you sure you want to save these changes?");
                    if (!isConfirmed) return;

                    if (editingChecklistItem.type === 'wishlist') {
                      const matched = myWishlist.find(w => w.id === editingChecklistItem.id.replace('chk_wishlist_', ''));
                      if (matched) {
                        await saveWishlist({ 
                          ...matched, 
                          name: editChecklistForm.name,
                          qty: editChecklistForm.qty,
                          price: editChecklistForm.price,
                          requester: editChecklistForm.customerName
                        });
                      }
                    } else {
                      const stripped = editingChecklistItem.id.replace('chk_sale_', '');
                      const lastUnderscore = stripped.lastIndexOf('_');
                      const saleId = stripped.substring(0, lastUnderscore);
                      const productIndex = parseInt(stripped.substring(lastUnderscore + 1));
                      const matchedSale = sales.find(s => s.id === saleId);
                      if (matchedSale) {
                        const newItems = [...matchedSale.items];
                        newItems[productIndex] = {
                          ...newItems[productIndex],
                          name: editChecklistForm.name,
                          qty: editChecklistForm.qty,
                          price: editChecklistForm.price
                        };
                        await saveSale({ 
                          ...matchedSale, 
                          customerName: editChecklistForm.customerName,
                          items: newItems 
                        });
                      }
                    }
                    toast.success("Changes saved!");
                    setEditingChecklistItem(null);
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

