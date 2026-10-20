'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FlaskConical, Mail, Lock, User as UserIcon, Building2, UserPlus, ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';
import { api, setActiveUserId } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'researcher' | 'pi' | 'student'>('researcher');
  const [institution, setInstitution] = useState('');
  const [fieldsInput, setFieldsInput] = useState('');
  const [bio, setBio] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Vui lòng điền họ tên và địa chỉ email.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const researchFields = fieldsInput
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      const res = await api.register({
        name: name.trim(),
        email: email.trim(),
        password: password || undefined,
        role: role as any,
        institution: institution.trim() || undefined,
        bio: bio.trim() || undefined,
        research_fields: researchFields
      });

      if (res.error) {
        setErrorMsg(res.error);
        setLoading(false);
        return;
      }

      if (res.user) {
        setSuccessMsg(`Tạo tài khoản thành công cho ${res.user.name}! Đang chuyển hướng...`);
        setActiveUserId(res.user.user_id);
        setTimeout(() => {
          router.push('/');
        }, 700);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi tạo tài khoản.');
      setLoading(false);
    }
  };

  const roleOptions = [
    { id: 'researcher', label: 'Nhà nghiên cứu (Researcher)', desc: 'Thực hiện nghiên cứu, công bố bài báo và tham gia trao đổi học thuật' },
    { id: 'pi', label: 'Trưởng nhóm / Chủ nhiệm (PI)', desc: 'Chủ trì phòng nghiên cứu, thành lập Consortium và quản lý thành viên' },
    { id: 'student', label: 'Nghiên cứu sinh / Học viên (Student)', desc: 'Học viên cao học, thực hiện đề tài và đặt câu hỏi chuyên môn' }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50">
      <div className="w-full max-w-xl bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 items-center justify-center text-white shadow-xs mb-1">
            <FlaskConical className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Tạo tài khoản Nhà nghiên cứu
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Gia nhập cộng đồng khoa học, chia sẻ truy vấn dữ liệu và đồng tác giả các công trình quốc tế
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

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Phân quyền học thuật (Academic Role)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {roleOptions.map((r) => {
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500 text-blue-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <p className="font-semibold text-xs">{r.label}</p>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight line-clamp-2">{r.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên học thuật <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: TS. Nguyễn Văn B"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nguyen.vb@hust.edu.vn"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tạo mật khẩu an toàn..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cơ quan / Viện nghiên cứu</label>
              <div className="relative">
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Đại học Quốc gia, Viện CNTT"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Lĩnh vực nghiên cứu (Phân cách bằng dấu phẩy)</label>
            <input
              type="text"
              value={fieldsInput}
              onChange={(e) => setFieldsInput(e.target.value)}
              placeholder="PostgreSQL, Recursive CTE, Distributed Systems, Graph Theory"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tiểu sử & Hướng nghiên cứu</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Mô tả tóm tắt kinh nghiệm học thuật, các đề tài đang theo đuổi..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim() || !email.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Đang khởi tạo tài khoản...' : 'Hoàn tất đăng ký'}</span>
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-500 border-t border-slate-100">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-0.5">
            <ArrowLeft className="w-3 h-3" />
            <span>Quay lại trang Đăng nhập</span>
          </Link>
        </div>

      </div>
    </div>
  );
}

