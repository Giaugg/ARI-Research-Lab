'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Network, 
  BookOpen, 
  Users, 
  FileText, 
  Cpu, 
  FlaskConical, 
  ChevronDown,
  User as UserIcon,
  Bell,
  LogOut,
  Shield,
  LogIn
} from 'lucide-react';
import { getActiveUserId, logout, isLoggedIn, api, User } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const fetchUserData = useCallback(async () => {
    try {
      const activeId = getActiveUserId();
      if (activeId && isLoggedIn()) {
        const [userRes, notifRes] = await Promise.all([
          api.getUserById(activeId),
          api.getNotifications()
        ]);
        if (userRes?.user) setCurrentUser(userRes.user);
        if (notifRes?.unreadCount !== undefined) setUnreadCount(notifRes.unreadCount);
      } else {
        setCurrentUser(null);
        setUnreadCount(0);
      }
    } catch (e) {
      console.error('Failed to load user in Navbar', e);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
    const handleUserChange = () => fetchUserData();
    window.addEventListener('ari_user_changed', handleUserChange);
    return () => window.removeEventListener('ari_user_changed', handleUserChange);
  }, [fetchUserData]);

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setShowUserDropdown(false);
    router.push('/login');
  };

  const navLinks = [
    { href: '/', label: 'Academic Feed', icon: BookOpen },
    { href: '/network', label: 'Network Traversal', icon: Network, highlight: true },
    { href: '/groups', label: 'Research Groups', icon: Users },
    { href: '/publications', label: 'Publications', icon: FileText },
    { href: '/sql-lab', label: 'PostgreSQL Lab', icon: Cpu, badge: 'WITH RECURSIVE' },
    { href: '/admin', label: 'Admin Demo SQL', icon: Shield, badge: 'ADMIN' }
  ];

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', className: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'pi':
        return { label: 'Trưởng Lab', className: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'student':
        return { label: 'Học viên', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: 'Nghiên cứu sinh', className: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Lab Title */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-all text-white shrink-0">
              <FlaskConical className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[15px] sm:text-base tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  ARI Research Lab
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 font-semibold leading-none">
                  PG-18
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">Academic Network & Recursive SQL</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-xs border border-blue-200/60 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Notifications & User Profile or Login */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Notification Bell Icon */}
            {currentUser && (
              <Link
                href="/notifications"
                className={`relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
                  pathname === '/notifications' ? 'bg-blue-50 text-blue-700' : ''
                }`}
                title="Thông báo"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {currentUser ? (
              /* User Menu Dropdown */
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all text-left"
                >
                  <img
                    src={currentUser.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=ari'}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20"
                  />
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-900 leading-tight">
                        {currentUser.name}
                      </span>
                      {currentUser.role && (
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${getRoleBadge(currentUser.role).className}`}>
                          {getRoleBadge(currentUser.role).label}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight truncate max-w-[130px]">
                      {currentUser.institution || 'Academic Scholar'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in duration-100">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                      <div className="mt-1.5 flex items-center gap-1 text-[10px]">
                        <Shield className="w-3 h-3 text-blue-600" />
                        <span className="text-slate-600">Vai trò:</span>
                        <span className="font-semibold text-blue-700 capitalize">{currentUser.role || 'researcher'}</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href={`/profile/${currentUser.user_id}`}
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-medium transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Hồ sơ học thuật của tôi</span>
                      </Link>
                      <Link
                        href="/notifications"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center justify-between px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-medium transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Bell className="w-4 h-4 text-slate-400" />
                          <span>Thông báo</span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                    </div>

                    <div className="px-2 pt-1 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất khỏi hệ thống</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Guest Actions: Login & Register */
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                >
                  Đăng ký
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
