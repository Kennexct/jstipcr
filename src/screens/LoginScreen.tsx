import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, KeyRound, User, Sparkles } from 'lucide-react';
import { useMaster } from '../context/MasterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useMaster();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Please enter both username and password');
      return;
    }
    
    setSubmitting(true);
    try {
      const user = await login(username.trim(), password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (!user.paid) {
        navigate('/inactive');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
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
          <p className="text-[9px] text-muted-foreground italic">
            Tip: Log in with username <span className="font-bold text-slate-700">admin</span> / password <span className="font-bold text-slate-700">admin</span> to test admin console.
          </p>
        </div>
      </div>
    </div>
  );
}
