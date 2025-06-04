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
                <a
                  href="/dashboard"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/english"
                  className="text-muted-foreground hover:text-foreground"
                >
                  English
                </a>
              </li>
              <li>
                <a
                  href="/mathematics"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Mathematics
                </a>
              </li>
              <li>
                <a
                  href="/chale"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Ask Chale
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">
                Email: support@syto.edu.gh
              </li>
              <li className="text-muted-foreground">Phone: +233 20 000 0000</li>
              <li className="text-muted-foreground">
                Address: Accra, Ghana
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