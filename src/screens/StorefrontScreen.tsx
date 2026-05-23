import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Check, 
  Package, 
  Share2, 
  MessageSquare,
  Globe,
  Coins,
  Send,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { db } from '../lib/supabase';

export function StorefrontScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  // Sourcing request dialog states
  const [isOpen, setIsOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientBudget, setClientBudget] = useState('');
  const [clientLocation, setClientLocation] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [items, loadedSettings] = await Promise.all([
          db.getItems(),
          db.getSettings()
        ]);
        setSettings(loadedSettings);

        const foundItem = items.find(i => i.id === id);
        if (foundItem) {
          setItem(foundItem);
          setClientBudget(foundItem.price.toString());
          setClientLocation(loadedSettings.trip?.origin || 'Seoul');
        }
      } catch (e) {
        console.error('Failed to load storefront data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    const savedAvatar = localStorage.getItem('jastip_profile_avatar');
    if (savedAvatar) {
      setAvatar(savedAvatar);
    }
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Storefront link copied!', {
      description: 'You can now share this direct storefront link with your customer.'
    });
  };

  const handleRequestSourcing = async () => {
    if (!clientName.trim()) {
      toast.error('Please enter your name to submit the request');
      return;
    }

    const budgetNum = parseInt(clientBudget.replace(/[^0-9]/g, '')) || 0;
    if (budgetNum <= 0) {
      toast.error('Please enter a valid target budget');
      return;
    }

    if (!window.confirm(`Are you sure you want to submit this sourcing request for "${item.name}" with a budget of Rp ${budgetNum.toLocaleString()}?`)) {
      return;
    }

    const newRequest = {
      id: 'wish_' + Date.now(),
      name: item.name,
      requester: clientName.trim(),
      status: 'find',
      price: budgetNum,
      location: clientLocation.trim() || settings?.trip?.origin || 'Seoul',
      image: item.image,
      note: clientNotes.trim() || undefined
    };

    try {
      await db.saveWishlist(newRequest);
      toast.success('Sourcing request submitted successfully!', {
        description: `Traveler Jane Doe has been notified to search for "${item.name}" in ${newRequest.location}.`
      });
      setIsOpen(false);
      setClientName('');
      setClientNotes('');
    } catch (e) {
      toast.error('Failed to submit request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Storefront...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
        <Package className="h-16 w-16 text-muted-foreground opacity-40 mb-4 animate-bounce" />
        <h2 className="text-xl font-black uppercase italic tracking-tight text-slate-800">Product Not Listed</h2>
        <p className="text-xs text-muted-foreground max-w-xs mt-2 leading-relaxed">
          The requested item catalog link is invalid or the traveler has removed this listing.
        </p>
        <Button className="mt-6 rounded-2xl font-bold gap-2 px-6" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" /> Go to Hub
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b h-16 flex items-center justify-between px-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Storefront Product</span>
        <Button variant="ghost" size="icon" className="rounded-full text-primary" onClick={handleShare}>
          <Share2 className="h-5 w-5" />
        </Button>
      </header>

      {/* Hero Image Section */}
      <div className="relative aspect-square w-full max-w-md mx-auto overflow-hidden bg-muted/20 border-b">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4 bg-emerald-500 text-white font-black px-3.5 py-1.5 rounded-xl shadow-lg text-[10px] tracking-wider uppercase flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          Live Sourcing Request
        </div>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        {/* Title & Price Card */}
        <section className="space-y-3">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2.5 py-1 rounded-full inline-block">
              Matched Sourcing Catalog
            </span>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800 leading-tight">
              {item.name}
            </h2>
          </div>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Publish Sourcing Price</p>
                <p className="text-2xl font-black text-primary font-mono">Rp {item.price.toLocaleString()}</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100/60 font-bold px-3 py-1.5 rounded-xl text-[10px] leading-none uppercase shrink-0">
                100% Genuine Guarantee
              </Badge>
            </CardContent>
          </Card>
        </section>

        {/* Traveler details block */}
        <section className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sourcing Traveler</label>
          <Card className="border-none shadow-sm bg-white rounded-3xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary/10">
                  {avatar ? (
                    <AvatarImage src={avatar} alt="Jane Doe" />
                  ) : (
                    <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" />
                  )}
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="space-y-0.5 text-left">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-slate-800">Jane Doe</h4>
                    <Badge variant="ghost" className="h-4 text-[7px] font-black uppercase bg-primary/10 text-primary border-none px-1 rounded-md">
                      Star Traveler
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                    <span className="flex items-center gap-0.5 text-slate-700"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> 4.98</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3 text-red-500" /> {settings?.trip?.origin || 'Seoul'} → {settings?.trip?.destination || 'Jakarta'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Trip Ledger details */}
        <section className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Trip Sourcing Route Specifications</label>
          <div className="p-4 rounded-3xl bg-slate-900 text-white space-y-4 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center relative z-10">
              <div className="space-y-1 text-left">
                <p className="text-[8px] opacity-40 font-black uppercase tracking-widest">Departure Date</p>
                <p className="text-xs font-bold uppercase tracking-tight">{settings?.trip?.date || '22 May 2026'}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[8px] opacity-40 font-black uppercase tracking-widest">Sourcing Currency</p>
                <p className="text-xs font-bold uppercase tracking-tight">{settings?.currency?.code || 'SGD'} ({settings?.currency?.symbol || 'S$'})</p>
              </div>
            </div>
            
            <Separator className="bg-slate-800" />
            
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-2 text-left">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Globe className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[8px] opacity-40 font-black uppercase tracking-widest">Sourcing Origin</p>
                  <p className="text-xs font-bold uppercase tracking-tight">{settings?.trip?.origin || 'Seoul'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-right justify-end">
                <div>
                  <p className="text-[8px] opacity-40 font-black uppercase tracking-widest">Destination</p>
                  <p className="text-xs font-bold uppercase tracking-tight">{settings?.trip?.destination || 'Jakarta'}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-red-400" />
                </div>
              </div>
            </div>

            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full -mr-12 -mt-12 blur-2xl opacity-60" />
          </div>
        </section>

        {/* CTA Sourcing Request button */}
        <div className="pt-4">
          <Button 
            className="w-full h-14 rounded-2xl font-black uppercase italic text-sm gap-3 shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all"
            onClick={() => setIsOpen(true)}
          >
            <Sparkles className="h-5 w-5" /> Request Traveler to Settle Sourcing
          </Button>
        </div>
      </div>

      {/* Sourcing Request Modal Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="rounded-3xl border-none max-w-[95%] sm:max-w-md bg-white p-6">
          <DialogHeader className="text-left pb-2">
            <DialogTitle className="text-lg font-black tracking-tight uppercase italic text-primary flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Order Sourcing Request
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-semibold">
              Fill in your details below to book this sourcing request directly into the traveler's active catalog docket.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your Full Name *</label>
              <Input 
                placeholder="e.g. Jane Andrews" 
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="h-11 rounded-xl bg-muted/30 border-none font-bold text-sm text-slate-800" 
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Budget (Rp) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">Rp</span>
                <Input 
                  placeholder="0"
                  value={clientBudget === '' ? '' : Number(clientBudget.replace(/[^0-9]/g, '')).toLocaleString()}
                  onChange={e => setClientBudget(e.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                  className="h-11 pl-10 rounded-xl bg-muted/30 border-none font-bold text-sm text-slate-850 text-slate-800" 
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Sourcing City</label>
              <Input 
                placeholder="e.g. Seoul" 
                value={clientLocation}
                onChange={e => setClientLocation(e.target.value)}
                className="h-11 rounded-xl bg-muted/30 border-none font-bold text-sm text-slate-800" 
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Request Notes / Custom Requests</label>
              <Input 
                placeholder="e.g. Please pick the 75ml option, gift box packaging if possible." 
                value={clientNotes}
                onChange={e => setClientNotes(e.target.value)}
                className="h-11 rounded-xl bg-muted/30 border-none font-bold text-sm text-slate-850 text-slate-800" 
              />
            </div>

            <div className="pt-2">
              <Button 
                className="w-full h-12 rounded-2xl font-black uppercase italic shadow-lg shadow-primary/10 gap-2"
                onClick={handleRequestSourcing}
              >
                <Send className="h-4 w-4" /> Submit Sourcing Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
