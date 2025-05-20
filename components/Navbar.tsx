'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, User, LogOut } from 'lucide-react'
import { useSupabaseUser } from '@/utils/useSupabaseUser'
import { supabase } from '@/utils/supabase'

interface NavigationItem {
  name: string;
  href: string;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Devices', href: '/devices' },
  { name: 'Events', href: '/alerts' },
];

interface NavLinkProps {
  item: NavigationItem;
  isActive: boolean;
  onClick?: () => void;
  className?: string;
}

const NavLink: React.FC<NavLinkProps> = ({ item, isActive, onClick, className = '' }) => (
  <Link
    href={item.href}
    className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'} ${className}`}
    onClick={onClick}
  >
    {item.name}
  </Link>
);

interface MobileMenuProps {
  isOpen: boolean;
  navigation: NavigationItem[];
  pathname: string;
  user: any;
  onLogout: () => void;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  navigation,
  pathname,
  user,
  onLogout,
  onClose,
}) => (
  <div
    className={`md:hidden fixed inset-x-0 top-16 bg-white border-b border-gray-100 shadow-lg transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-y-0' : '-translate-y-full'
    }`}
  >
    <div className="pt-2 pb-3 space-y-1">
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          item={item}
          isActive={pathname === item.href}
          onClick={onClose}
          className="block px-3 py-2 text-base font-medium rounded-md"
        />
      ))}
    </div>
    <div className="pt-4 pb-3 border-t border-gray-200">
      {user ? (
        <div className="space-y-1">
          <div className="px-4 py-2 text-sm text-gray-700 truncate">{user.email}</div>
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="block w-full text-left px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="block px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          onClick={onClose}
        >
          Login
        </Link>
      )}
    </div>
  </div>
);

export default function Navbar() {
  const user = useSupabaseUser()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav className="h-16 bg-white shadow-sm border-b border-gray-100 sticky top-0 z-20">
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-full">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                AI Monitor
              </Link>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              {NAVIGATION_ITEMS.map((item) => (
                <NavLink
                  key={item.name}
                  item={item}
                  isActive={pathname === item.href}
                />
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Desktop user menu */}
          <div className="hidden md:flex md:items-center md:ml-6">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700 truncate max-w-[200px]">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <User className="h-5 w-5 mr-2" />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        navigation={NAVIGATION_ITEMS}
        pathname={pathname}
        user={user}
        onLogout={handleLogout}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </nav>
  )
} 