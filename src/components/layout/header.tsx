import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User, Home, BookOpen, BookText, MessageSquare, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout, profile } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle scrolling for header transparency
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Close mobile menu when location changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

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
                  "text-sm font-medium hover:text-ghana-gold dark:hover:text-ghana-gold transition-colors",
                  location.pathname === "/dashboard" &&
                    "text-ghana-gold dark:text-ghana-gold"
                )}
              >
                Dashboard
              </Link>
              <Link
                to="/english"
                className={cn(
                  "text-sm font-medium hover:text-ghana-gold dark:hover:text-ghana-gold transition-colors",
                  location.pathname.startsWith("/english") &&
                    "text-ghana-gold dark:text-ghana-gold"
                )}
              >
                English
              </Link>
              <Link
                to="/mathematics"
                className={cn(
                  "text-sm font-medium hover:text-ghana-gold dark:hover:text-ghana-gold transition-colors",
                  location.pathname.startsWith("/mathematics") &&
                    "text-ghana-gold dark:text-ghana-gold"
                )}
              >
                Mathematics
              </Link>
              <Link
                to="/naano"
                className={cn(
                  "text-sm font-medium px-3 py-2 rounded-lg border-2 transition-all",
                  location.pathname === "/naano"
                    ? "bg-ghana-gold text-white border-transparent shadow-lg"
                    : "border-ghana-gold text-ghana-gold hover:bg-ghana-gold hover:text-white hover:border-transparent hover:shadow-md"
                )}
              >
                Ask NAANO
              </Link>

            </>
          )}
        </nav>

        <div className="flex items-center space-x-2">
          <ThemeToggle />

          {user ? (
            <div className="hidden md:flex items-center relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-sm"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ghana-green to-ghana-gold flex items-center justify-center text-white font-semibold">
                  {profile?.first_name?.[0] || user.email?.[0].toUpperCase()}
                </div>
                <ChevronDown size={16} className={cn("transition-transform", isUserMenuOpen && "rotate-180")} />
              </Button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-glass-xl border border-white/20 dark:border-white/10 backdrop-blur-xl overflow-hidden animate-scale-in z-50">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium">{profile?.first_name} {profile?.last_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="py-2 px-2">
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-800/40 rounded-lg flex items-center gap-3 transition-all hover:scale-[1.02] mb-2"
                    >
                      <User size={16} className="text-primary-600 dark:text-primary-400" />
                      <span className="font-medium">Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm bg-error-100 dark:bg-error-900/30 hover:bg-error-200 dark:hover:bg-error-800/40 text-error-700 dark:text-error-400 rounded-lg flex items-center gap-3 transition-all hover:scale-[1.02]"
                    >
                      <LogOut size={16} />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Button
                variant="gold"
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
                    "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === "/dashboard"
                      ? "bg-muted text-ghana-gold dark:text-ghana-gold"
                      : "hover:bg-muted hover:text-ghana-gold"
                  )}
                >
                  <Home size={20} className={location.pathname === "/dashboard" ? "text-ghana-gold" : "text-primary-500"} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/english"
                  className={cn(
                    "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname.startsWith("/english")
                      ? "bg-muted text-ghana-gold dark:text-ghana-gold"
                      : "hover:bg-muted hover:text-ghana-gold"
                  )}
                >
                  <BookOpen size={20} className={location.pathname.startsWith("/english") ? "text-ghana-gold" : "text-primary-500"} />
                  <span>English</span>
                </Link>
                <Link
                  to="/mathematics"
                  className={cn(
                    "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname.startsWith("/mathematics")
                      ? "bg-muted text-ghana-gold dark:text-ghana-gold"
                      : "hover:bg-muted hover:text-ghana-gold"
                  )}
                >
                  <BookText size={20} className={location.pathname.startsWith("/mathematics") ? "text-ghana-gold" : "text-primary-500"} />
                  <span>Mathematics</span>
                </Link>
                <Link
                  to="/naano"
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium border-2 transition-all",
                    location.pathname === "/naano"
                      ? "bg-ghana-gold text-white border-transparent shadow-lg"
                      : "border-ghana-gold text-ghana-gold dark:text-ghana-gold hover:bg-ghana-gold hover:text-white hover:border-transparent"
                  )}
                >
                  <MessageSquare size={20} className={location.pathname === "/naano" ? "text-white" : "text-ghana-gold"} />
                  <span>Ask NAANO</span>
                </Link>
                <Link
                  to="/profile"
                  className={cn(
                    "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === "/profile"
                      ? "bg-muted text-ghana-gold dark:text-ghana-gold"
                      : "hover:bg-muted hover:text-ghana-gold"
                  )}
                >
                  <User size={20} className={location.pathname === "/profile" ? "text-ghana-gold" : "text-primary-500"} />
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
                  variant="gold"
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