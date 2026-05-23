import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Check, 
  MapPin, 
  Calendar as CalendarIcon, 
  Weight, 
  Globe,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useMaster } from '../context/MasterContext';
import { fetchLiveExchangeRate } from '../lib/currency';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const CURRENCY_SYMBOLS: Record<string, string> = {
  SGD: 'S$',
  KRW: '₩',
  JPY: '¥',
  THB: '฿',
  USD: '$',
  EUR: '€',
  IDR: 'Rp'
};

const CURRENCIES = [
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'IDR', name: 'Indonesian Rupiah' }
];

export function TripSettingsScreen() {
  const navigate = useNavigate();
  const { loading, tripSettings, saveSettings } = useMaster();

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [limit, setLimit] = useState('15');
  const [settings, setSettings] = useState({
    code: 'SGD',
    symbol: 'S$',
    manualRate: 13500,
    realtimeRate: 13050,
    updatedAt: new Date().toISOString()
  });
  const [payoutCurrency, setPayoutCurrency] = useState('IDR');
  // Sync inputs with master context once loaded
  useEffect(() => {
    if (!loading && tripSettings) {
      if (tripSettings.trip) {
        setOrigin(tripSettings.trip.origin || 'Seoul');
        setDestination(tripSettings.trip.destination || 'Jakarta');
        setLimit((tripSettings.trip.weightLimit || 15).toString());
      }
      if (tripSettings.currency) {
        const curCode = tripSettings.currency.code || 'SGD';
        setSettings({
          code: curCode,
          symbol: tripSettings.currency.symbol || 'S$',
          manualRate: tripSettings.currency.manualRate || 13500,
          realtimeRate: tripSettings.currency.realtimeRate || 13050,
          updatedAt: tripSettings.currency.updatedAt || new Date().toISOString()
        });
        setPayoutCurrency(tripSettings.currency.payout || 'IDR');

        // Fetch fresh rate on mount
        fetchLiveExchangeRate(curCode).then(rate => {
          setSettings(prev => ({
            ...prev,
            realtimeRate: rate
          }));
        });
      }
    }
  }, [loading, tripSettings]);

  const handleSave = async () => {
    if (!window.confirm("Are you sure you want to save these trip settings?")) {
      return;
    }
    const updated = {
      trip: {
        origin,
        destination,
        weightLimit: parseInt(limit) || 15
      },
      currency: {
        ...settings,
        payout: payoutCurrency
      },
      notifs: { push: true, email: false, orders: true, chat: true }
    };
    await saveSettings(updated);
    toast.success('Trip settings updated!');
    navigate(-1);
  };

  const getCurrencyName = (code: string) => CURRENCIES.find(c => c.code === code)?.name || code;

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b h-16 flex items-center px-4 gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-bold">Trip Settings</h2>
      </header>

      <div className="p-6 space-y-8">
        {/* Route Details */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
             <MapPin className="h-3 w-3" /> Route Details
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground ml-1">FROM</label>
              <Input value={origin} onChange={(e) => setOrigin(e.target.value)} className="h-12 rounded-xl bg-muted/30 border-none px-4" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground ml-1">TO</label>
              <Input value={destination} onChange={(e) => setDestination(e.target.value)} className="h-12 rounded-xl bg-muted/30 border-none px-4" />
            </div>
          </div>
        </section>

        <Separator />
        
        {/* Currency & Finance */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
             <Globe className="h-3 w-3" /> Currency & Exchange Rate
          </div>
          <div className="space-y-4">
             <div className="p-4 rounded-2xl bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center font-bold text-xs ring-4 ring-primary/5 shadow-sm">{settings.code}</div>
                    <div>
                      <p className="text-sm font-bold">Shopping Currency</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                        {getCurrencyName(settings.code)}
                      </p>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger render={<Button variant="ghost" size="sm" className="text-primary font-bold text-xs h-8 px-3 rounded-lg hover:bg-primary/10" />}>
                      Change
                    </DialogTrigger>
                    <DialogContent className="rounded-3xl border-none max-w-[90%] md:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-left font-black uppercase italic text-xl">Select Shopping Currency</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 gap-2 mt-4">
                        {CURRENCIES.filter(c => c.code !== 'IDR').map(curr => (
                          <Button 
                            key={curr.code}
                            variant={settings.code === curr.code ? 'default' : 'ghost'}
                            className="justify-between h-12 px-4 rounded-xl font-bold"
                            onClick={async () => {
                              if (!window.confirm(`Are you sure you want to change the shopping currency to ${curr.code}? This will fetch and calculate a new exchange rate.`)) {
                                return;
                              }
                              toast.info(`Fetching live rate for ${curr.code}...`);
                              const rate = await fetchLiveExchangeRate(curr.code);
                              const symbol = CURRENCY_SYMBOLS[curr.code] || '$';
                              const manualDefault = Math.round(rate * 1.03);
                              setSettings({
                                code: curr.code,
                                symbol: symbol,
                                realtimeRate: rate,
                                manualRate: manualDefault,
                                updatedAt: new Date().toISOString()
                              });
                              toast.success(`Currency changed to ${curr.code}. Live rate: Rp ${rate.toLocaleString()}`);
                            }}
                          >
                            <span className="flex items-center gap-3">
                               <span className="opacity-40">{curr.code}</span>
                               {curr.name}
                            </span>
                            {settings.code === curr.code && <Check className="h-4 w-4" />}
                          </Button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <Separator className="bg-background" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Manual Rate (1 {settings.code} to IDR)</label>
                    <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-none px-2">Realtime: {settings.realtimeRate.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">Rp</div>
                      <Input 
                        type="text" 
                        value={settings.manualRate === 0 ? '' : settings.manualRate.toLocaleString()} 
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^0-9]/g, '');
                          setSettings({...settings, manualRate: Number(cleaned) || 0});
                        }}
                        inputMode="numeric"
                        className="h-12 pl-10 rounded-xl bg-background border-none font-bold text-lg"
                      />
                    </div>
                    <div className="text-xs font-bold text-primary px-3 py-1 bg-primary/10 rounded-full">
                      +{((settings.manualRate / settings.realtimeRate - 1) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic px-1">Tip: Set a higher rate to cover bank conversion fees and rounding.</p>
                </div>
             </div>

             <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center font-bold text-xs ring-4 ring-primary/5">{payoutCurrency}</div>
                  <div>
                    <p className="text-sm font-bold">Payout Currency</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{getCurrencyName(payoutCurrency)}</p>
                  </div>
                </div>
                <Dialog>
                    <DialogTrigger render={<Button variant="ghost" size="sm" className="text-primary font-bold text-xs h-8 px-3 rounded-lg hover:bg-primary/10" />}>
                      Change
                    </DialogTrigger>
                    <DialogContent className="rounded-3xl border-none max-w-[90%] md:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-left font-black uppercase italic text-xl">Select Payout Currency</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 gap-2 mt-4">
                        {CURRENCIES.map(curr => (
                          <Button 
                            key={curr.code}
                            variant={payoutCurrency === curr.code ? 'default' : 'ghost'}
                            className="justify-between h-12 px-4 rounded-xl font-bold"
                            onClick={() => {
                              if (!window.confirm(`Are you sure you want to set the settlement payout currency to ${curr.code}?`)) {
                                return;
                              }
                              setPayoutCurrency(curr.code);
                              toast.success(`Payout currency updated to ${curr.code}`);
                            }}
                          >
                            <span className="flex items-center gap-3">
                               <span className="opacity-40">{curr.code}</span>
                               {curr.name}
                            </span>
                            {payoutCurrency === curr.code && <Check className="h-4 w-4" />}
                          </Button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
             </div>
          </div>
        </section>

        {/* Operational Status */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
             <Settings2 className="h-3 w-3" /> Operational Status
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="space-y-1">
              <p className="text-sm font-bold text-primary">Accepting Requests</p>
              <p className="text-[10px] text-primary/60 font-medium">Toggle this if you're no longer taking orders</p>
            </div>
            <div className="h-6 w-11 bg-primary rounded-full relative p-1 cursor-pointer">
              <div className="h-4 w-4 bg-white rounded-full ml-auto" />
            </div>
          </div>
        </section>

        <Button className="w-full h-14 rounded-2xl font-bold gap-3 shadow-lg shadow-primary/20" onClick={handleSave}>
          <Check className="h-5 w-5" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
