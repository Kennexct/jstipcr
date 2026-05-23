import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, KeyRound, User, Briefcase, ChevronLeft } from 'lucide-react';
import { useMaster } from '../context/MasterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export function SignUpScreen() {
  const navigate = useNavigate();
  const { signUp } = useMaster();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || !businessName.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setSubmitting(true);
    try {
      await signUp(username.trim(), password, businessName.trim());
      navigate('/inactive');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
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
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Register Merchant</h2>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Join JastipFlow Network</p>
        </div>

        <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Traveler / Business Name</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input 
                    placeholder="e.g. Jane Doe (Seoul Express)" 
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    className="h-12 pl-12 rounded-xl bg-muted/30 border-none font-bold text-sm text-slate-800" 
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input 
                    placeholder="Create a username" 
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
                    placeholder="Choose a password" 
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
                {submitting ? 'Registering...' : 'Register Account'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link to="/login" className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
            <ChevronLeft className="h-4 w-4" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
