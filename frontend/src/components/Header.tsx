import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BarChart3, Menu } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-sm border-b border-primary-foreground/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-accent rounded-lg">
            <BarChart3 className="h-6 w-6 text-accent-foreground" />
          </div>
          <span className="text-2xl font-bold text-primary-foreground">Expert BI</span>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Pricing
          </a>
          <a href="#about" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            About
          </a>
          <a href="#contact" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Contact
          </a>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10 hidden sm:inline-flex" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
          <Button variant="gradient" className="hidden sm:inline-flex" asChild>
            <Link to="/register">Get Started</Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden text-primary-foreground hover:bg-primary-foreground/10">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;