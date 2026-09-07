'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/lib/types';
import { getCurrentUser, setCurrentUser, getIsRevealActive } from '@/lib/db';
import CodeLoginModal from './CodeLoginModal';
import { 
  Home, 
  Users, 
  Heart, 
  MessageSquare, 
  BookOpen, 
  Sparkles, 
  Settings, 
  LogOut, 
  Gift 
} from 'lucide-react';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const pathname = usePathname();
  const [currentUser, setUserState] = useState<User | null>(null);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isRevealActive, setIsRevealActive] = useState(false);

  useEffect(() => {
    async function loadData() {
      const user = await getCurrentUser();
      setUserState(user);
      const reveal = await getIsRevealActive();
      setIsRevealActive(reveal);
    }
    loadData();
  }, [pathname]);

  const handleLoginSuccess = async (user: User) => {
    await setCurrentUser(user);
    setUserState(user);
  };

  const handleLogout = async () => {
    await setCurrentUser(null);
    setUserState(null);
  };

  const navItems = [
    { label: '홈', href: '/', icon: Home },
    { label: 'Mate', href: '/mate', icon: Users },
    { label: '칭찬하기', href: '/thanks', icon: Heart, highlight: true },
    { label: 'Wall', href: '/wall', icon: MessageSquare },
    { label: '내 메모', href: '/notes', icon: BookOpen },
  ];

  if (isRevealActive) {
    navItems.push({ label: 'Reveal', href: '/reveal', icon: Gift });
  }

  if (currentUser?.role === 'admin') {
    navItems.push({ label: '관리자', href: '/admin', icon: Settings });
  }

  return (
    <div className="w-full max-w-[480px] min-h-screen bg-slate-50 relative flex flex-col shadow-2xl pb-24 overflow-x-hidden border-x border-slate-200/60">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between shadow-xs">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
            AI
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 leading-tight">
              HT사업본부 <span className="text-sky-600">AI Vitamin</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Connecting People</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {isRevealActive && (
            <Link 
              href="/reveal" 
              className="px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-sm animate-pulse"
            >
              <Sparkles className="w-3 h-3" />
              <span>Reveal Day</span>
            </Link>
          )}

          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-slate-100 py-1 px-2.5 rounded-full border border-slate-200">
              <span className="text-xs">{currentUser.avatar || '👤'}</span>
              <span className="text-xs font-bold text-slate-700">{currentUser.name}</span>
              <button 
                onClick={handleLogout}
                title="로그아웃"
                className="text-slate-400 hover:text-red-500 transition-colors ml-0.5"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLoginModalOpen(true)}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-full shadow-sm transition-all"
            >
              참여코드 입력
            </button>
          )}
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 p-4">{children}</main>

      {/* Bottom Fixed Navigation Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-2.5 z-40 shadow-card">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            if (item.highlight) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center -mt-5 transition-transform active:scale-95`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-float ${
                    isActive 
                      ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white ring-4 ring-purple-100' 
                      : 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white'
                  }`}>
                    <Icon className="w-6 h-6 fill-white/20" />
                  </div>
                  <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-purple-600' : 'text-slate-600'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                  isActive ? 'text-sky-600 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Login Modal */}
      <CodeLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
