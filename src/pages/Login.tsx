import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Dumbbell, Activity, Target } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoginLoading(true);
    try { await login(email, password); }
    catch { setError('Invalid credentials. Try any email/password for demo.'); }
    finally { setLoginLoading(false); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-muted"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-background to-muted/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center space-x-2">
            <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">APT Coach</h1>
          </div>
          <p className="text-muted-foreground text-lg">Body-composition-aware strength coaching</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center space-y-2">
            <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center mx-auto"><Activity className="h-5 w-5 text-accent" /></div>
            <p className="text-xs text-muted-foreground">Track Composition</p>
          </div>
          <div className="text-center space-y-2">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto"><Target className="h-5 w-5 text-primary" /></div>
            <p className="text-xs text-muted-foreground">Smart Programs</p>
          </div>
          <div className="text-center space-y-2">
            <div className="h-10 w-10 bg-warning/10 rounded-xl flex items-center justify-center mx-auto"><Dumbbell className="h-5 w-5 text-warning" /></div>
            <p className="text-xs text-muted-foreground">Build Strength</p>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">Sign in to your coaching dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loginLoading} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required disabled={loginLoading} className="h-12" />
              </div>
              {error && <Alert className="border-destructive/20 bg-destructive/5"><AlertDescription className="text-destructive">{error}</AlertDescription></Alert>}
              <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loginLoading}>
                {loginLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign In'}
              </Button>
            </form>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Demo</span></div>
            </div>
            <Button type="button" variant="outline" className="w-full h-12" onClick={() => { setEmail('demo@apt.coach'); setPassword('demo123'); }} disabled={loginLoading}>Try Demo Login</Button>
            <p className="text-xs text-center text-muted-foreground">Demo app — any email/password works</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
