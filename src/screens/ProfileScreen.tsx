import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Settings, 
  ShieldCheck, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Star, 
  MapPin,
  Camera,
  Globe,
  Coins,
  Bell,
  Mail,
  Scale,
  MessageSquare,
  Sparkles,
  PlaneTakeoff,
  Lock,
  Smartphone,
  Save,
  Check
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useMaster } from '../context/MasterContext';
import { fetchLiveExchangeRate } from '../lib/currency';

const CURRENCIES_SYMBOLS: Record<string, string> = {
  SGD: 'S$',
  KRW: '₩',
  JPY: '¥',
  THB: '฿',
  USD: '$',
  EUR: '€',
  IDR: 'Rp'
};

const CURRENCY_LIST = [
  { code: 'SGD', name: 'Singapore Dollar (S$)' },
  { code: 'KRW', name: 'South Korean Won (₩)' },
  { code: 'JPY', name: 'Japanese Yen (¥)' },
  { code: 'THB', name: 'Thai Baht (฿)' },
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'IDR', name: 'Indonesian Rupiah (Rp)' }
];

export function ProfileScreen() {
  const navigate = useNavigate();
  const { loading, tripSettings, saveSettings } = useMaster();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);

  // Settings states
  const [origin, setOrigin] = useState('Seoul');
  const [destination, setDestination] = useState('Jakarta');
  const [utilizationLimit, setUtilizationLimit] = useState('15');
  const [shoppingCurrency, setShoppingCurrency] = useState('SGD');
  const [manualRate, setManualRate] = useState('13500');
  const [payoutCurrency, setPayoutCurrency] = useState('IDR');

  // Notifications states
  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifChat, setNotifChat] = useState(true);

  // Active category tab in settings dialog
  const [activeTab, setActiveTab] = useState<'trip' | 'currency' | 'notifications'>('trip');

  useEffect(() => {
    // 0. Loading profile avatar
    const savedAvatar = localStorage.getItem('jastip_profile_avatar');
    if (savedAvatar) {
      setAvatar(savedAvatar);
    }
  }, []);

  useEffect(() => {
    if (tripSettings) {
      if (tripSettings.trip) {
        setOrigin(tripSettings.trip.origin || 'Seoul');
        setDestination(tripSettings.trip.destination || 'Jakarta');
        setUtilizationLimit((tripSettings.trip.weightLimit || 15).toString());
      }
      if (tripSettings.currency) {
        setShoppingCurrency(tripSettings.currency.code || 'SGD');
        setManualRate((tripSettings.currency.manualRate || 13500).toString());
        setPayoutCurrency(tripSettings.currency.payout || 'IDR');
      }
      if (tripSettings.notifs) {
        setNotifPush(tripSettings.notifs.push !== false);
        setNotifEmail(tripSettings.notifs.email === true);
        setNotifOrders(tripSettings.notifs.orders !== false);
        setNotifChat(tripSettings.notifs.chat !== false);
      }
    }
  }, [tripSettings, isSettingsOpen]);

  const handleSaveSettings = async () => {
    const rate = await fetchLiveExchangeRate(shoppingCurrency);
    const updated = {
      trip: {
        origin,
        destination,
        weightLimit: parseInt(utilizationLimit) || 15,
        date: '22 May 2026'
      },
      currency: {
        code: shoppingCurrency,
        symbol: CURRENCIES_SYMBOLS[shoppingCurrency] || '$',
        manualRate: Number(manualRate.replace(/[^0-9]/g, '')) || 13500,
        realtimeRate: rate,
        payout: payoutCurrency,
        updatedAt: new Date().toISOString()
      },
      notifs: {
        push: notifPush,
        email: notifEmail,
        orders: notifOrders,
        chat: notifChat
      }
    };

    try {
      await saveSettings(updated);
      toast.success('Traveler configurations updated!', {
        description: 'Trip routing context and exchange rates refreshed in real-time.'
      });
      setIsSettingsOpen(false);
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatar(base64);
        localStorage.setItem('jastip_profile_avatar', base64);
        toast.success('Profile photo updated!');
      };
      reader.readAsDataURL(file);
    }
  };
  const menuItems = [
    { 
      icon: ShieldCheck, 
      label: 'Identity Verification', 
      color: 'text-green-500', 
      badge: 'Verified',
      onClick: () => toast.success('Your identity is securely verified with GovID!')
    },
    { 
      icon: Settings, 
      label: 'Settings & Preferences', 
      color: 'text-primary', 
      badge: 'Configure',
      onClick: () => {
        setActiveTab('trip');
        setIsSettingsOpen(true);
      } 
    },
    { 
      icon: HelpCircle, 
      label: 'Help Center', 
      color: 'text-orange-500', 
      onClick: () => toast.info('Our support center is ready 24/7. Chat open!') 
    },
  ];

  return (
    <div className="pb-10 pt-8 px-4">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            <input 
              type="file"
              accept="image/*"
              className="hidden"
              id="profile-avatar-upload"
              onChange={handleAvatarChange}
            />
            <label htmlFor="profile-avatar-upload" className="cursor-pointer block">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                {avatar ? (
                  <AvatarImage src={avatar} alt="Profile Avatar" />
                ) : (
                  <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop" />
                )}
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 h-8 w-8 rounded-full border-2 border-background shadow-lg bg-secondary text-secondary-foreground flex items-center justify-center hover:bg-secondary/80">
                <Camera className="h-4 w-4" />
              </div>
            </label>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Jane Doe</h2>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] uppercase font-bold px-2 h-5">
                STAR TRAVELER
              </Badge>
              <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> 4.98</span>
              <span className="text-muted-foreground/30">•</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Jakarta</span>
            </div>
          </div>

          <div className="flex gap-4 w-full justify-center">
            <div className="bg-muted/50 rounded-2xl p-3 flex-1">
              <p className="text-lg font-bold">12</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Orders</p>
            </div>
            <div className="bg-muted/50 rounded-2xl p-3 flex-1">
              <p className="text-lg font-bold">3</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Trips</p>
            </div>
            <div className="bg-muted/50 rounded-2xl p-3 flex-1">
              <p className="text-lg font-bold">4.2k</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Followers</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-muted/30 rounded-3xl overflow-hidden border">
          {menuItems.map((item, i) => (
            <div key={item.label}>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                onClick={item.onClick}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-white shadow-sm ${item.color}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <Badge 
                      variant="secondary" 
                      className={`text-[9px] font-bold h-5 px-2 rounded-full ${
                        item.badge === 'Verified' 
                          ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </motion.div>
              {i < menuItems.length - 1 && <Separator className="bg-border/50" />}
            </div>
          ))}
        </div>

        <Button variant="ghost" className="w-full h-14 rounded-2xl text-red-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-between px-6 border border-dashed border-red-200" onClick={() => navigate('/')}>
          <span className="font-bold">Log Out</span>
          <LogOut className="h-5 w-5" />
        </Button>

        <p className="text-center text-[10px] text-muted-foreground font-medium">JastipFlow v1.0.4 • Build 2026.05</p>

        {/* Global Travel Settings Dialog */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="rounded-3xl border-none max-w-[95%] md:max-w-lg bg-white p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-left pb-2">
              <DialogTitle className="text-lg font-black tracking-tight uppercase italic text-primary flex items-center gap-2">
                <Settings className="h-5 w-5" /> Traveler Settings
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-semibold">
                Configure your active trip locations, fallback shopping rates, and merged notification controls in one centralized hub.
              </DialogDescription>
            </DialogHeader>

            {/* Micro tabs configuration */}
            <div className="flex border-b border-slate-100 gap-1.5 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('trip')}
                className={`flex-1 py-2 font-black text-[10px] uppercase tracking-tight text-center rounded-xl transition-all ${
                  activeTab === 'trip' 
                    ? 'bg-primary text-white' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                ✈️ Trip Location
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('currency')}
                className={`flex-1 py-2 font-black text-[10px] uppercase tracking-tight text-center rounded-xl transition-all ${
                  activeTab === 'currency' 
                    ? 'bg-primary text-white' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                💰 Currency / Rate
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 py-2 font-black text-[10px] uppercase tracking-tight text-center rounded-xl transition-all ${
                  activeTab === 'notifications' 
                    ? 'bg-primary text-white' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                🔔 Notifications
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Trip Location Setup tab */}
              {activeTab === 'trip' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <PlaneTakeoff className="h-3.5 w-3.5" /> Departure Origin *
                    </label>
                    <Input 
                      placeholder="e.g. Seoul" 
                      value={origin}
                      onChange={e => setOrigin(e.target.value)}
                      className="h-11 rounded-xl bg-muted/30 border-none font-bold text-sm text-slate-800" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-red-500" /> Destination City *
                    </label>
                    <Input 
                      placeholder="e.g. Jakarta" 
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      className="h-11 rounded-xl bg-muted/30 border-none font-bold text-sm text-slate-800" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5 text-blue-500" /> Luggage Limit Allowance (KG)
                    </label>
                    <Input 
                      type="number" 
                      placeholder="e.g. 15" 
                      value={utilizationLimit}
                      onChange={e => setUtilizationLimit(e.target.value)}
                      className="h-11 rounded-xl bg-muted/30 border-none font-bold text-sm text-slate-800" 
                    />
                  </div>
                </div>
              )}

              {/* Currency & Financial setup tab */}
              {activeTab === 'currency' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-emerald-600" /> Shopping Currency
                    </label>
                    <select 
                      value={shoppingCurrency}
                      onChange={async (e) => {
                        const newCode = e.target.value;
                        setShoppingCurrency(newCode);
                        toast.info(`Fetching live rate for ${newCode}...`);
                        const rate = await fetchLiveExchangeRate(newCode);
                        setManualRate(Math.round(rate * 1.03).toString());
                        toast.success(`Fetched live rate: Rp ${rate.toLocaleString()}`);
                      }}
                      className="w-full h-11 px-3 rounded-xl bg-muted/30 border-none font-bold text-sm text-slate-800 outline-none"
                    >
                      {CURRENCY_LIST.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5 text-primary" /> Exchange Rate Target (1 {shoppingCurrency} inside IDR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-500">Rp</span>
                      <Input 
                        type="text" 
                        placeholder="e.g. 13.500" 
                        value={manualRate === '' ? '' : Number(manualRate.replace(/[^0-9]/g, '')).toLocaleString()}
                        onChange={e => setManualRate(e.target.value.replace(/[^0-9]/g, ''))}
                        className="h-11 pl-10 rounded-xl bg-muted/30 border-none font-bold text-sm text-slate-800" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-slate-400" /> Settlement Payout Currency
                    </label>
                    <select 
                      value={payoutCurrency}
                      onChange={e => setPayoutCurrency(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-muted/30 border-none font-bold text-sm text-slate-800 outline-none"
                    >
                      <option value="IDR">Indonesian Rupiah (IDR)</option>
                      <option value="SGD">Singapore Dollar (SGD)</option>
                      <option value="USD">US Dollar (USD)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Notification setup merged layout */}
              {activeTab === 'notifications' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center text-primary border shadow-sm">
                        <Smartphone className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Push App Alerts</p>
                        <p className="text-[9px] text-slate-400">Instantly view orders & task status changes</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifPush(!notifPush)}
                      className={`h-6 w-11 rounded-full relative p-0.5 transition-colors duration-250 shrink-0 ${notifPush ? 'bg-primary' : 'bg-slate-300/80'}`}
                    >
                      <div className={`h-5 w-5 bg-white rounded-full shadow transition-transform ${notifPush ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center text-emerald-500 border shadow-sm">
                        <Mail className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Weekly Email Digests</p>
                        <p className="text-[9px] text-slate-400">Receive summaries of profit of travel trips</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifEmail(!notifEmail)}
                      className={`h-6 w-11 rounded-full relative p-0.5 transition-colors duration-250 shrink-0 ${notifEmail ? 'bg-primary' : 'bg-slate-300/80'}`}
                    >
                      <div className={`h-5 w-5 bg-white rounded-full shadow transition-transform ${notifEmail ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center text-blue-500 border shadow-sm">
                        <Sparkles className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">New Order Alerts</p>
                        <p className="text-[9px] text-slate-400">Notified as soon as customer issues a request</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifOrders(!notifOrders)}
                      className={`h-6 w-11 rounded-full relative p-0.5 transition-colors duration-250 shrink-0 ${notifOrders ? 'bg-primary' : 'bg-slate-300/80'}`}
                    >
                      <div className={`h-5 w-5 bg-white rounded-full shadow transition-transform ${notifOrders ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center text-orange-500 border shadow-sm">
                        <MessageSquare className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Customer Chat Sounds</p>
                        <p className="text-[9px] text-slate-400">Continuous sound loop during chats</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifChat(!notifChat)}
                      className={`h-6 w-11 rounded-full relative p-0.5 transition-colors duration-250 shrink-0 ${notifChat ? 'bg-primary' : 'bg-slate-300/80'}`}
                    >
                      <div className={`h-5 w-5 bg-white rounded-full shadow transition-transform ${notifChat ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-2xl font-black uppercase text-xs" onClick={() => setIsSettingsOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 h-12 rounded-2xl font-black uppercase text-xs gap-1.5" onClick={handleSaveSettings}>
                <Save className="h-4 w-4" /> Save Preferences
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
