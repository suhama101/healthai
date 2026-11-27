import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { nlmSiteDemoEnabled } from "@/lib/nlm-demo-release";
import "./globals.css";
import "./product.css";

export const metadata: Metadata = {
  title: { default: "MediLens AI | Malaria Cell Analysis", template: "%s | MediLens AI" },
  description: "An interactive research demonstration of AI-assisted malaria cell analysis using two included microscopy images.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader showAnalyze={nlmSiteDemoEnabled()} />
        <main id="main-content" tabIndex={-1}>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
