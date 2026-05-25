import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, KeyRound, User, Sparkles } from 'lucide-react';
import { useMaster } from '../context/MasterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { getCleanErrorMessage } from '../lib/error';

export function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useMaster();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Supabase Config State
  const [showConfig, setShowConfig] = useState(false);
  const [supaUrl, setSupaUrl] = useState('');
  const [supaKey, setSupaKey] = useState('');
  
  // Load existing config if available
  useState(() => {
    try {
      const saved = localStorage.getItem('jastip_supabase_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.url) setSupaUrl(parsed.url);
        if (parsed.key) setSupaKey(parsed.key);
      }
    } catch (e) {}
  });

  const handleSaveConfig = () => {
    if (!supaUrl || !supaKey) {
      toast.error('Both URL and Key are required');
      return;
    }
    localStorage.setItem('jastip_supabase_config', JSON.stringify({ url: supaUrl, key: supaKey }));
    toast.success('Cloud connection saved! You can now log in.');
    setShowConfig(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Please enter both username and password');
      return;
    }
    
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate('/');
    } catch (err: any) {
      toast.error(getCleanErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white mx-auto shadow-lg shadow-primary/20">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">JastipFlow</h2>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Traveler Sourcing Ledger</p>
        </div>

        <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input 
                    placeholder="Enter your username" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="h-12 pl-12 rounded-xl bg-muted/30 border-none font-bold text-sm text-slate-800" 
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input 
                    type="password"
                    placeholder="Enter your password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-12 pl-12 rounded-xl bg-muted/30 border-none font-bold text-sm text-slate-800" 
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full h-12 rounded-2xl font-black uppercase italic shadow-lg shadow-primary/20 gap-2 mt-2"
              >
                {submitting ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground font-semibold">
            New traveler merchant?{' '}
            <Link to="/signup" className="text-primary font-bold hover:underline">
              Create Account
            </Link>
          </p>
          <button 
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-4 hover:text-primary transition-colors"
          >
            Database Connection settings
          </button>
        </div>

        {showConfig && (
          <Card className="border border-primary/20 bg-primary/5 rounded-3xl overflow-hidden mt-4">
            <CardContent className="p-6 space-y-4 text-left">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Cloud Database Settings</p>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Supabase URL</label>
                <Input 
                  placeholder="https://xyzcompany.supabase.co" 
                  value={supaUrl}
                  onChange={e => setSupaUrl(e.target.value)}
                  className="h-10 rounded-xl bg-white border-none font-medium text-xs" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Supabase Anon Key</label>
                <Input 
                  type="password"
                  placeholder="eyJh..." 
                  value={supaKey}
                  onChange={e => setSupaKey(e.target.value)}
                  className="h-10 rounded-xl bg-white border-none font-medium text-xs" 
                />
              </div>

              <Button 
                type="button" 
                onClick={handleSaveConfig}
                className="w-full h-10 rounded-xl font-bold uppercase text-xs"
              >
                Save Connection
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
