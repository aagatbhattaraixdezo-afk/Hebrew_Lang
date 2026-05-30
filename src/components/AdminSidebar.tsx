'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Users,
  Wand2,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';

const adminNav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, badge: null },
  { href: '/admin#courses', label: 'Courses', icon: BookOpen, badge: null },
  { href: '/admin#scenarios', label: 'Scenarios', icon: MessageSquare, badge: null },
  { href: '/admin#students', label: 'Students', icon: Users, badge: null },
  { href: '/admin#generate', label: 'AI Generate', icon: Wand2, badge: null },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [activeHash, setActiveHash] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHash = () => setActiveHash(window.location.hash);
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <aside
      className="hidden lg:flex flex-col border-r border-border bg-surface shrink-0 transition-all duration-300 ease-in-out h-screen sticky top-0"
      style={{ width: collapsed ? 72 : 240 }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border gap-3 overflow-hidden">
        <AppLogo size={32} />
        {!collapsed && (
          <span className="font-bold text-ink text-base whitespace-nowrap">Shalom</span>
        )}
      </div>
      
      {/* Nav */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-hidden">
        <div className={`text-eyebrow text-muted mb-2 px-2 ${collapsed ? 'opacity-0' : ''}`}>
          Admin
        </div>
        {adminNav?.map((item) => {
          const itemHash = item.href.split('#')[1] || '';
          const active = pathname === '/admin' && activeHash === (itemHash ? `#${itemHash}` : '');
          
          return (
            <Link
              key={`admin-nav-${item.href}`}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                active ? 'admin-nav-active' : 'admin-nav-inactive'
              }`}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 whitespace-nowrap">{item.label}</span>
                  {item.badge && (
                    <span className="badge-level text-xs px-2 py-0.5">{item.badge}</span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* Bottom */}
      <div className="p-3 border-t border-border flex flex-col gap-1">
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm admin-nav-inactive text-left w-full"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full h-9 rounded-xl text-sm admin-nav-inactive"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : (
            <span className="flex items-center gap-2 text-xs text-muted">
              <ChevronLeft size={14} /> Collapse
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
