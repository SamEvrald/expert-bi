import { useState } from 'react';
import { useNavigate, Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';  // Changed from @/hooks/useAuth
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';
import { BarChart3 } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please enter both email and password',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        toast({
          title: 'Success',
          description: 'Logged in successfully',
        });
        navigate(from, { replace: true });
      } else {
        toast({
          title: 'Error',
          description: 'Invalid email or password',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4 animate-bounce-in">
            <div className="p-2 bg-gradient-accent rounded-lg">
              <BarChart3 className="h-6 w-6 text-accent-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary-foreground">Expert BI</span>
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground animate-slide-in-left">Welcome back</h1>
          <p className="text-primary-foreground/80 mt-2 animate-slide-in-left" style={{animationDelay: '0.2s'}}>Sign in to your account to continue</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-elegant animate-scale-in bg-gradient-card border-primary-foreground/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary-foreground">
              <LogIn className="h-5 w-5 text-accent" />
              Sign In
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;