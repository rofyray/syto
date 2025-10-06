import { X, Home, BookOpen, BookText, MessageSquare, User, FileText } from "lucide-react";
import { Link } from "react-router-dom";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) return null;

  const menuItems = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: BookOpen, label: "English", href: "/english" },
    { icon: BookText, label: "Mathematics", href: "/mathematics" },
    { icon: MessageSquare, label: "Chat with NAANO", href: "/naano" },
    { icon: FileText, label: "My Progress", href: "/dashboard" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="fixed top-20 right-4 z-50 animate-scale-in">
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl rounded-3xl p-6 border border-white/20 dark:border-white/10 shadow-glass-xl min-w-[280px]">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>

          {/* Menu Items */}
          <div className="mt-8 space-y-3">
            {menuItems.map((item, index) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={onClose}
                className="group flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <item.icon size={24} className="text-primary-500 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-lg text-foreground">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
