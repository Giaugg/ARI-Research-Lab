'use client';

import React, { useState } from 'react';
import { X, LogIn, UserPlus, Mail, Lock, User as UserIcon, Building2, Sparkles, CheckCircle2 } from 'lucide-react';
import { api, setActiveUserId, User } from '@/lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regInstitution, setRegInstitution] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regFields, setRegFields] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const quickDemoAccounts = [
    { name: 'Prof. Stonebraker', email: 'stonebraker@mit.edu' },
    { name: 'Dr. Jennifer Widom', email: 'widom@stanford.edu' },
    { name: 'Dr. Yann LeCun', email: 'lecun@nyu.edu' },
    { name: 'Dr. Jeffrey Ullman', email: 'ullman@stanford.edu' }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ email.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.login({
        email: loginEmail.trim(),
        password: loginPassword || undefined
      });

      if (res.error) {
        setErrorMsg(res.error);
        return;
      }

      if (res.user) {
        setSuccessMsg('Đăng nhập thành công!');
        setActiveUserId(res.user.user_id);
        if (onSuccess) onSuccess(res.user);
        setTimeout(() => {
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi khi đăng nhập vào hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setErrorMsg('Vui lòng điền họ tên và email.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const researchFields = regFields
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      const res = await api.register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword || undefined,
        institution: regInstitution.trim() || undefined,
        bio: regBio.trim() || undefined,
        research_fields: researchFields
      });

      if (res.error) {
        setErrorMsg(res.error);
        return;
      }

      if (res.user) {
        setSuccessMsg('Đăng ký tài khoản thành công!');
        setActiveUserId(res.user.user_id);
        if (onSuccess) onSuccess(res.user);
        setTimeout(() => {
          onClose();
        }, 700);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi khi đăng ký tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {tab === 'login' ? 'Đăng nhập Nghiên cứu sinh' : 'Tạo tài khoản Nhà khoa học'}
            </h2>
            <p className="text-xs text-slate-500">
              {tab === 'login' ? 'Truy cập mạng lưới học thuật và phòng lab ARI' : 'Tham gia cộng đồng nghiên cứu cơ sở dữ liệu & AI'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mt-4">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'register'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Đăng ký mới</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mt-3.5 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mt-3.5 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email đăng nhập</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="stonebraker@mit.edu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu (Tùy chọn cho tài khoản mặc định)</label>
              <div className="relative">
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Quick Demo Fill Buttons */}
            <div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Hoặc chọn nhanh tài khoản Giáo sư / Nhà khoa học:</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {quickDemoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setLoginEmail(acc.email);
                      setLoginPassword('');
                    }}
                    className="text-left p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-[11px] transition-colors"
                  >
                    <p className="font-semibold text-slate-800 truncate">{acc.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{acc.email}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !loginEmail.trim()}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Đang kiểm tra...' : 'Đăng nhập vào ARI'}</span>
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="VD: TS. Trần Văn Minh"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Địa chỉ Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="minh.tv@hust.edu.vn"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Tạo mật khẩu bảo vệ tài khoản..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cơ quan / Viện nghiên cứu</label>
              <div className="relative">
                <input
                  type="text"
                  value={regInstitution}
                  onChange={(e) => setRegInstitution(e.target.value)}
                  placeholder="Đại học Bách Khoa Hà Nội"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lĩnh vực nghiên cứu (Phân cách bằng dấu phẩy)</label>
              <input
                type="text"
                value={regFields}
                onChange={(e) => setRegFields(e.target.value)}
                placeholder="PostgreSQL, Machine Learning, Graph Theory"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tiểu sử ngắn</label>
              <textarea
                rows={2}
                value={regBio}
                onChange={(e) => setRegBio(e.target.value)}
                placeholder="Mô tả tóm tắt về hướng nghiên cứu của bạn..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !regName.trim() || !regEmail.trim()}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Đang khởi tạo tài khoản...' : 'Đăng ký Nhà nghiên cứu'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

