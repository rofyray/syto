import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    // Check current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // Handle scrolling for header transparency
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      authListener?.subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Close mobile menu when location changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 theme-transition",
        isScrolled
          ? "bg-background/95 backdrop-blur-sm"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-6 md:flex">
          {user && (
            <>
              <Link
                to="/dashboard"
                className={cn(
                  "text-sm font-medium hover:text-ghana-green dark:hover:text-ghana-green",
                  location.pathname === "/dashboard" &&
                    "text-ghana-green dark:text-ghana-green"
                )}
              >
                Dashboard
              </Link>
              <Link
                to="/english"
                className={cn(
                  "text-sm font-medium hover:text-ghana-green dark:hover:text-ghana-green",
                  location.pathname.startsWith("/english") &&
                    "text-ghana-green dark:text-ghana-green"
                )}
              >
                English
              </Link>
              <Link
                to="/mathematics"
                className={cn(
                  "text-sm font-medium hover:text-ghana-green dark:hover:text-ghana-green",
                  location.pathname.startsWith("/mathematics") &&
                    "text-ghana-green dark:text-ghana-green"
                )}
              >
                Mathematics
              </Link>
              <Link
                to="/chale"
                className={cn(
                  "text-sm font-medium hover:text-ghana-green dark:hover:text-ghana-green",
                  location.pathname === "/chale" &&
                    "text-ghana-green dark:text-ghana-green"
                )}
              >
                Ask Chale
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center space-x-2">
          <ThemeToggle />
          
          {user ? (
            <div className="hidden md:flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-sm"
                onClick={() => navigate("/profile")}
              >
                <User size={16} />
                <span>Profile</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-sm"
                onClick={handleSignOut}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button
                variant="ghana"
                size="sm"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="flex flex-col space-y-4 bg-background px-4 py-4 shadow-lg animate-fade-in">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={cn(
                    "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium",
                    location.pathname === "/dashboard"
                      ? "bg-muted text-ghana-green dark:text-ghana-green"
                      : "hover:bg-muted"
                  )}
                >
                  Dashboard
                </Link>
                <Link
                  to="/english"
                  className={cn(
                    "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium",
                    location.pathname.startsWith("/english")
                      ? "bg-muted text-ghana-green dark:text-ghana-green"
                      : "hover:bg-muted"
                  )}
                >
                  English
                </Link>
                <Link
                  to="/mathematics"
                  className={cn(
                    "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium",
                    location.pathname.startsWith("/mathematics")
                      ? "bg-muted text-ghana-green dark:text-ghana-green"
                      : "hover:bg-muted"
                  )}
                >
                  Mathematics
                </Link>
                <Link
                  to="/chale"
                  className={cn(
                    "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium",
                    location.pathname === "/chale"
                      ? "bg-muted text-ghana-green dark:text-ghana-green"
                      : "hover:bg-muted"
                  )}
                >
                  Ask Chale
                </Link>
                <Link
                  to="/profile"
                  className={cn(
                    "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium",
                    location.pathname === "/profile"
                      ? "bg-muted text-ghana-green dark:text-ghana-green"
                      : "hover:bg-muted"
                  )}
                >
                  <User size={16} />
                  <span>Profile</span>
                </Link>
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2 text-sm"
                  onClick={handleSignOut}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </Button>
                <Button
                  variant="ghana"
                  className="w-full justify-center"
                  onClick={() => navigate("/signup")}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}