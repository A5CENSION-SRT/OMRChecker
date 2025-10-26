import type { Metadata } from "next";
import Link from "next/link";
import { ScanLine, Upload, Home, BarChart3 } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import "./globals.css";

export const metadata: Metadata = {
  title: "OMR Grading System | Automated Optical Mark Recognition",
  description: "Professional OMR sheet grading and batch processing system with automatic evaluation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto max-w-7xl">
            <div className="flex h-16 items-center justify-between px-6 lg:px-8">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ScanLine className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold leading-none tracking-tight">OMR System</span>
                  <span className="text-xs text-muted-foreground font-mono">Automated Grading</span>
                </div>
              </Link>

              {/* Navigation Menu */}
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link href="/" className={navigationMenuTriggerStyle()}>
                        <Home className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link href="/upload" className={navigationMenuTriggerStyle()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Batch
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t mt-auto">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 lg:px-8 py-6">
              <p className="text-sm text-muted-foreground font-mono">
                © 2025 OMR Grading System • Built with OMRChecker
              </p>
              <p className="text-sm text-muted-foreground">
                Powered by FastAPI & Next.js
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
