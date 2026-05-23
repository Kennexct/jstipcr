import { useNavigate } from 'react-router-dom';
import { CreditCard, LogOut, Mail, HelpCircle } from 'lucide-react';
import { useMaster } from '../context/MasterContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function SubscriptionInactiveScreen() {
  const navigate = useNavigate();
  const { currentUser, logout } = useMaster();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="h-16 w-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto shadow-sm border border-amber-200 animate-pulse">
            <CreditCard className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">Subscription Inactive</h2>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Account Activation Required</p>
        </div>

        <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
          <CardContent className="p-6 space-y-5 text-center">
            <p className="text-sm text-slate-600 leading-relaxed">
              Hello <span className="font-bold text-slate-800">{currentUser?.businessName || currentUser?.username}</span>, 
              your traveler merchant account is registered but does not have an active subscription yet.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-left">
              <div className="flex gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase">Step 1: Contact Support</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Send an activation request to <span className="font-semibold text-primary">admin@jstipflow.com</span> with your registered username.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <HelpCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase">Step 2: Admin Activation</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Once subscription payment is validated, the administrator will toggle your account status to live.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleLogout} 
              variant="outline"
              className="w-full h-12 rounded-2xl font-black uppercase text-xs gap-2 text-red-500 border-red-100 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Log Out
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground font-medium">JastipFlow v1.0.4 • Centralized Traveler Sourcing</p>
      </div>
    </div>
  );
}
