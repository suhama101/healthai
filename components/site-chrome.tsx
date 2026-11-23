"use client";

import { Aperture, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/workspace", label: "Workspace" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/research", label: "Research" },
  { href: "/about", label: "About" },
];

function Brand() {
  return (
    <Link href="/" className="brand" aria-label="MediLens AI home">
      <span className="brand-mark"><Aperture size={23} aria-hidden="true" /></span>
      <span>MediLens <span className="brand-ai">AI</span></span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <button className="menu-toggle" type="button" ref={toggle}
          aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open}
          aria-controls="site-navigation" onClick={() => setOpen(!open)}>
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <nav id="site-navigation" aria-label="Main navigation" data-open={open}
          onKeyDown={(event) => {
            if (event.key === "Escape" && open) {
              setOpen(false);
              toggle.current?.focus();
            }
          }}>
          {links.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}
              onClick={() => setOpen(false)}>{label}</Link>
          ))}
        </nav>
        <Link href="/workspace" className="button button-primary header-cta" onClick={() => setOpen(false)}>
          Open Workspace
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div><Brand /><p>Capital Youth Expo 2026 · Healthcare Hackathon</p></div>
        <nav aria-label="Footer navigation">
          {links.slice(1).map(({ href, label }) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
      </div>
      <div className="container footer-note">For research and education only. Do not use for clinical diagnosis.</div>
    </footer>
  );
}
