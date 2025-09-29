import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { LogIn, Mail, Lock, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
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
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading} variant="gradient">
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <Separator className="my-6" />

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="text-accent hover:underline font-medium">
                  Sign up
                </Link>
              </p>
              <Link to="/forgot-password" className="text-sm text-accent hover:underline">
                Forgot your password?
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Alert>
          <AlertDescription className="text-sm">
            <strong>Demo Credentials:</strong><br />
            Email: demo@expertbi.com<br />
            Password: demo123
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default Login;