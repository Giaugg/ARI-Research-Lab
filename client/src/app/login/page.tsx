'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FlaskConical, Mail, Lock, LogIn, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { api, setActiveUserId } from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const demoAccounts = [
    { name: 'Dr. Jennifer Widom', email: 'widom@stanford.edu', role: 'admin', roleLabel: 'Quản trị viên (Admin)' },
    { name: 'Prof. Michael Stonebraker', email: 'stonebraker@mit.edu', role: 'pi', roleLabel: 'Trưởng Lab (PI)' },
    { name: 'Dr. Jeffrey Ullman', email: 'ullman@stanford.edu', role: 'researcher', roleLabel: 'Nhà nghiên cứu' },
    { name: 'Nguyen Van An', email: 'an.nguyen@vnu.edu.vn', role: 'student', roleLabel: 'Nghiên cứu sinh' }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ email.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.login({
        email: email.trim(),
        password: password || undefined
      });

      if (res.error) {
        setErrorMsg(res.error);
        setLoading(false);
        return;
      }

      if (res.user) {
        setSuccessMsg(`Chào mừng ${res.user.name}! Đang chuyển hướng...`);
        setActiveUserId(res.user.user_id);
        setTimeout(() => {
          router.push(redirectUrl);
        }, 600);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi kết nối máy chủ.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Logo & Headline */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 items-center justify-center text-white shadow-xs mb-1">
            <FlaskConical className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Đăng nhập ARI Research Lab
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Hệ thống Mạng lưới Học thuật, Tối ưu hóa Truy vấn PostgreSQL & Hợp tác Khoa học
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Địa chỉ Email học thuật <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="stonebraker@mit.edu"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Mật khẩu</label>
              <span className="text-[11px] text-slate-400">(Tùy chọn cho tài khoản có sẵn)</span>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Đang xác thực thông tin...' : 'Đăng nhập vào hệ thống'}</span>
          </button>
        </form>

        {/* Quick Demo Researcher Cards */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Chọn nhanh tài khoản thử nghiệm theo phân quyền:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword('');
                }}
                className="text-left p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-blue-50/80 hover:border-blue-200 transition-all text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 truncate">{acc.name}</span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    acc.role === 'admin' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    acc.role === 'pi' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    acc.role === 'student' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {acc.role.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{acc.email}</p>
                <p className="text-[10px] text-slate-500 mt-1">{acc.roleLabel}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Register Footer */}
        <div className="text-center pt-2 text-xs text-slate-500">
          Chưa có tài khoản nghiên cứu?{' '}
          <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-0.5">
            <span>Đăng ký ngay</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Đang tải trang đăng nhập...</div>}>
      <LoginForm />
    </Suspense>
  );
}

