'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Smartphone, Calendar, Settings, LogOut, LucideIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSupabaseUser } from '@/utils/useSupabaseUser'
import { supabase } from '@/utils/supabase'

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Devices', href: '/devices', icon: Smartphone },
  { name: 'Events', href: '/alerts', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface NavLinkProps {
  item: NavigationItem;
  isActive: boolean;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ item, isActive, onClick }) => (
  <Link
    href={item.href}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-base transition-all duration-200
      ${isActive 
        ? 'bg-white text-gray-900 shadow-md' 
        : 'text-white hover:bg-yellow-400 hover:text-black hover:shadow-lg'
      }
    `}
    onClick={onClick}
  >
    <item.icon className="h-6 w-6" />
    <span>{item.name}</span>
  </Link>
);

interface MobileMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({ isOpen, onClick }) => (
  <button
    id="mobile-menu-button"
    onClick={onClick}
    className="md:hidden fixed bottom-4 right-4 z-50 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
    aria-label="Toggle menu"
  >
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {isOpen ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      )}
    </svg>
  </button>
);

interface UserSectionProps {
  user: any;
  onLogout: () => void;
}

const UserSection: React.FC<UserSectionProps> = ({ user, onLogout }) => (
  <div className="mt-8 px-4">
    <div className="flex items-center gap-2 text-white text-sm mb-2">
      <span className="truncate">{user.email}</span>
    </div>
    <button
      onClick={onLogout}
      className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-md w-full justify-center mt-2"
    >
      <LogOut className="h-4 w-4" /> Sign Out
    </button>
  </div>
);

const useSidebar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const user = useSupabaseUser();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const mobileButton = document.getElementById('mobile-menu-button');
      if (
        isMobileMenuOpen &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        mobileButton &&
        !mobileButton.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isMounted,
    user,
    handleLogout,
  };
};

export default function Sidebar() {
  const pathname = usePathname();
  const {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isMounted,
    user,
    handleLogout,
  } = useSidebar();

  return (
    <>
      <MobileMenuButton
        isOpen={isMobileMenuOpen}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="sidebar"
        className={`fixed md:static h-screen w-64 bg-gradient-to-b from-black to-yellow-600 shadow-xl z-50 md:z-30 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isMounted ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex flex-col items-center py-6">
          <Image
            src="/logo.png"
            alt="GuardianAngel AI"
            width={120}
            height={120}
            className="mb-2"
            priority
          />
          <span className="text-white text-lg font-bold tracking-wide text-center">
            GuardianAngel AI<sup className="text-xs align-super">®</sup>
          </span>
        </div>

        <nav className="flex flex-col gap-4 px-4 mt-4">
          {NAVIGATION_ITEMS.map((item) => (
            <NavLink
              key={item.name}
              item={item}
              isActive={pathname === item.href}
              onClick={() => setIsMobileMenuOpen(false)}
            />
          ))}
        </nav>

        {user && (
          <UserSection
            user={user}
            onLogout={handleLogout}
          />
        )}
      </aside>
    </>
  );
} 