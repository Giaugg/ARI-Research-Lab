'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Network, 
  BookOpen, 
  Users, 
  FileText, 
  Cpu, 
  FlaskConical, 
  ChevronDown,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { getActiveUserId, setActiveUserId, api, User } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const fetchUserData = async () => {
    try {
      const activeId = getActiveUserId();
      const [userRes, listRes] = await Promise.all([
        api.getUserById(activeId),
        api.getUsers()
      ]);
      if (userRes?.user) setCurrentUser(userRes.user);
      if (listRes?.users) setAllUsers(listRes.users);
    } catch (e) {
      console.error('Failed to load user in Navbar', e);
    }
  };

  useEffect(() => {
    fetchUserData();
    const handleUserChange = () => fetchUserData();
    window.addEventListener('ari_user_changed', handleUserChange);
    return () => window.removeEventListener('ari_user_changed', handleUserChange);
  }, []);

  const handleSelectUser = (uId: number) => {
    setActiveUserId(uId);
    setShowUserDropdown(false);
  };

  const navLinks = [
    { href: '/', label: 'Academic Feed', icon: BookOpen },
    { href: '/network', label: 'Network Traversal', icon: Network, highlight: true },
    { href: '/groups', label: 'Research Groups', icon: Users },
    { href: '/publications', label: 'Publications', icon: FileText },
    { href: '/sql-lab', label: 'PostgreSQL Lab', icon: Cpu, badge: 'WITH RECURSIVE' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Lab Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-200 bg-clip-text text-transparent">
                  ARI Research Lab
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  PG-18
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Academic Network & Recursive SQL</p>
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
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-slate-600 transition-colors text-left"
            >
              {currentUser?.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                </div>
              )}
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-slate-200 leading-tight">
                  {currentUser?.name || 'Loading...'}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight truncate max-w-[140px]">
                  {currentUser?.institution || 'Academic Persona'}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Switch Researcher Persona</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Test graph queries, follow relationships & recommendations from different network perspectives.
                  </p>
                </div>

                <div className="max-h-64 overflow-y-auto py-1">
                  {allUsers.map((u) => {
                    const isSelected = u.user_id === currentUser?.user_id;
                    return (
                      <button
                        key={u.user_id}
                        onClick={() => handleSelectUser(u.user_id)}
                        className={`w-full px-3 py-2 flex items-center gap-2.5 text-left text-xs hover:bg-slate-800 transition-colors ${
                          isSelected ? 'bg-blue-900/30 text-blue-300 font-medium' : 'text-slate-300'
                        }`}
                      >
                        <img
                          src={u.avatar_url}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{u.institution}</p>
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {currentUser && (
                  <div className="px-3 pt-2 border-t border-slate-800">
                    <Link
                      href={`/profile/${currentUser.user_id}`}
                      onClick={() => setShowUserDropdown(false)}
                      className="block text-center text-xs text-blue-400 hover:text-blue-300 font-medium py-1"
                    >
                      View Full Academic Profile →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
