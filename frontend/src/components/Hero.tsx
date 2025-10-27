import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BarChart3, TrendingUp, Zap, Shield } from "lucide-react";
import heroImage from "@/assets/hero-analytics.jpg";

const Hero = () => {
  return (
    <div className="relative min-h-screen bg-gradient-primary">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight animate-slide-in-left">
                Transform Data Into
                <span className="bg-gradient-accent bg-clip-text text-transparent"> Insights</span>
              </h1>
              <p className="text-xl text-primary-foreground/90 leading-relaxed animate-slide-in-left" style={{animationDelay: '0.2s'}}>
                Upload your CSV files and get instant, professional analytics dashboards. 
                No technical skills required - just drag, drop, and discover.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-bounce-in" style={{animationDelay: '0.4s'}}>
              <Button variant="hero" size="lg" className="text-lg px-8 py-4" asChild>
                <Link to="/register">Start Analyzing Now</Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 hover:border-primary-foreground/50" asChild>
                <Link to="/login">View Demo</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 animate-fade-in" style={{animationDelay: '0.6s'}}>
              <div className="text-center transform hover:scale-105 transition-all duration-200">
                <div className="text-3xl font-bold text-primary-foreground">10K+</div>
                <div className="text-primary-foreground/80">Files Analyzed</div>
              </div>
              <div className="text-center transform hover:scale-105 transition-all duration-200">
                <div className="text-3xl font-bold text-primary-foreground">99.9%</div>
                <div className="text-primary-foreground/80">Uptime</div>
              </div>
              <div className="text-center transform hover:scale-105 transition-all duration-200">
                <div className="text-3xl font-bold text-primary-foreground">&lt;60s</div>
                <div className="text-primary-foreground/80">Processing Time</div>
              </div>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative animate-slide-in-right">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant transform hover:scale-105 transition-all duration-300">
              <img 
                src={heroImage} 
                alt="Data analytics dashboard preview" 
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Zap className="h-8 w-8" />,
              title: "Instant Analysis",
              description: "Get comprehensive insights in under 60 seconds"
            },
            {
              icon: <BarChart3 className="h-8 w-8" />,
              title: "Smart Visualizations",
              description: "AI-powered charts that tell your data's story"
            },
            {
              icon: <TrendingUp className="h-8 w-8" />,
              title: "Trend Detection",
              description: "Automatically identify patterns and correlations"
            },
            {
              icon: <Shield className="h-8 w-8" />,
              title: "Secure & Private",
              description: "Your data is encrypted and never shared"
            }
          ].map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 bg-gradient-card border-primary-foreground/10 hover:shadow-card transform hover:scale-105 transition-all duration-300 animate-scale-in group"
              style={{animationDelay: `${0.8 + index * 0.1}s`}}
            >
              <div className="text-accent mb-4 group-hover:scale-110 transition-transform duration-200">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-primary-foreground">{feature.title}</h3>
              <p className="text-primary-foreground/80">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;