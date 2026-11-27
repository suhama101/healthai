"use client";

import { Aperture, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
];

const resourceLinks = [
  { href: "/workspace", label: "Workspace" },
  { href: "/research", label: "Technology & Validation" },
  { href: "/about", label: "About" },
  { href: "/licenses/nlm-demo/dataset.txt", label: "Sample attribution" },
];

function Brand() {
  return (
    <Link href="/" className="brand" aria-label="MediLens AI home">
      <span className="brand-mark"><Aperture size={23} aria-hidden="true" /></span>
      <span>MediLens <span className="brand-ai">AI</span></span>
    </Link>
  );
}

export function SiteHeader({ showAnalyze = false }: { showAnalyze?: boolean }) {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="container header-inner product-header">
        <Brand />
        <nav className="product-nav" aria-label="Main navigation">
          {primaryLinks.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>
          ))}
          {showAnalyze && (
            <Link href="/analyze" className="button button-primary product-nav-cta"
              aria-current={pathname === "/analyze" || pathname === "/analyze/browser" ? "page" : undefined}>
              Analyze <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div><Brand /><p>Capital Youth Expo 2026 · Healthcare Hackathon</p></div>
        <nav aria-label="Research and project resources">
          {resourceLinks.map(({ href, label }) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
      </div>
      <div className="container footer-note">For research and education only. Do not use for clinical diagnosis.</div>
    </footer>
  );
}
