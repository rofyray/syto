import { Link } from "react-router-dom";
import { Logo } from "@/components/logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30 py-6 theme-transition">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground">
              An innovative EdTech platform for Primary 4-6 students in Ghana,
              providing engaging learning experiences in English Language and
              Mathematics.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/dashboard"
                  className="text-muted-foreground hover:text-ghana-gold transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/english"
                  className="text-muted-foreground hover:text-ghana-gold transition-colors"
                >
                  English
                </Link>
              </li>
              <li>
                <Link
                  to="/mathematics"
                  className="text-muted-foreground hover:text-ghana-gold transition-colors"
                >
                  Mathematics
                </Link>
              </li>
              <li>
                <Link
                  to="/naano"
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium border-2 border-ghana-gold text-ghana-gold hover:bg-ghana-gold hover:text-white rounded-lg transition-all"
                >
                  Ask NAANO
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">
                Email: info@syto.online
              </li>
              <li className="text-muted-foreground">Phone: +233 54 819 8980</li>
              <li className="text-muted-foreground">
                Address: Ashaiman, Ghana
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          <p>&copy; {currentYear} Syto EdTech. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}