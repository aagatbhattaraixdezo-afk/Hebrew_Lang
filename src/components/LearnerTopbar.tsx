'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { signOut } from 'next-auth/react';
import { BookOpen, LayoutDashboard, Menu, X, LogOut, ShieldCheck } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scenarios', label: 'Scenarios', icon: BookOpen },
  { href: '/alphabet', label: 'Alphabet', icon: BookOpen },
];

interface LearnerTopbarProps {
  userName?: string;
  isAdmin?: boolean;
}

export default function LearnerTopbar({ userName = 'Learner', isAdmin = false }: LearnerTopbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border backdrop-blur-md bg-surface/90">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <AppLogo size={36} />
            <span className="font-sans font-700 text-lg text-ink hidden sm:block" style={{ fontWeight: 700 }}>
              Shalom
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={`topnav-${item.href}`}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-primary/10 text-primary-color font-semibold' : 'text-muted hover:bg-secondary hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary-color border border-primary/20"
              >
                <ShieldCheck size={14} />
                Admin
              </Link>
            )}
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-secondary transition-all duration-150"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-primary-fg"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-ink hidden sm:block">{userName}</span>
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden btn-ghost w-10 h-10 p-0"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-surface shadow-lift p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink text-lg">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="btn-ghost w-9 h-9 p-0">
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={`mobile-nav-${item.href}`}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      active ? 'admin-nav-active' : 'admin-nav-inactive'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto pt-4 border-t border-border">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted hover:bg-secondary transition-all text-left"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
