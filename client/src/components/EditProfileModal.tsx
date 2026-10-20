'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, User as UserIcon, Building2, BookMarked, RefreshCw } from 'lucide-react';
import { api, User } from '@/lib/api';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onProfileUpdated: (updatedUser: User) => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  user,
  onProfileUpdated
}: EditProfileModalProps) {
  const [name, setName] = useState(user.name || '');
  const [role, setRole] = useState<'admin' | 'pi' | 'researcher' | 'student'>((user.role as any) || 'researcher');
  const [institution, setInstitution] = useState(user.institution || '');
  const [bio, setBio] = useState(user.bio || '');
  const [researchFieldsInput, setResearchFieldsInput] = useState(
    Array.isArray(user.research_fields) ? user.research_fields.join(', ') : ''
  );
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(user.name || '');
      setRole((user.role as any) || 'researcher');
      setInstitution(user.institution || '');
      setBio(user.bio || '');
      setResearchFieldsInput(
        Array.isArray(user.research_fields) ? user.research_fields.join(', ') : ''
      );
      setAvatarUrl(user.avatar_url || '');
      setErrorMsg('');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleGenerateAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(randomSeed)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Họ tên không được để trống.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const researchFields = researchFieldsInput
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      const res = await api.updateUser(user.user_id, {
        name: name.trim(),
        role,
        institution: institution.trim(),
        bio: bio.trim(),
        research_fields: researchFields,
        avatar_url: avatarUrl.trim()
      });

      if (res.error) {
        setErrorMsg(res.error);
        setSubmitting(false);
        return;
      }

      if (res.user) {
        onProfileUpdated(res.user);
        window.dispatchEvent(new Event('ari_user_changed'));
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Chỉnh sửa thông tin cá nhân</h2>
            <p className="text-xs text-slate-500">Cập nhật hồ sơ nghiên cứu, học vị và lĩnh vực chuyên môn</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Avatar Preview & URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ảnh đại diện (Avatar)</label>
            <div className="flex items-center gap-4">
              <img
                src={avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=ari'}
                alt="Avatar preview"
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-xs bg-slate-100"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={handleGenerateAvatar}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tạo avatar ngẫu nhiên mới</span>
                </button>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: PGS. TS. Nguyễn Văn A"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Academic Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Vai trò học thuật (Role)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            >
              <option value="researcher">Nhà nghiên cứu (Researcher)</option>
              <option value="pi">Trưởng nhóm Lab / Chủ nhiệm đề tài (PI)</option>
              <option value="student">Nghiên cứu sinh / Học viên (Student)</option>
              <option value="admin">Quản trị viên hệ thống (Admin)</option>
            </select>
          </div>

          {/* Institution */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cơ quan / Viện nghiên cứu / Trường Đại học</label>
            <div className="relative">
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="VD: ĐH Quốc Gia Hà Nội, Viện Công nghệ Thông tin"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Research Fields */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Lĩnh vực nghiên cứu (Phân cách bằng dấu phẩy)</label>
            <div className="relative">
              <input
                type="text"
                value={researchFieldsInput}
                onChange={(e) => setResearchFieldsInput(e.target.value)}
                placeholder="PostgreSQL, Recursive CTE, Distributed Systems, Graph Theory"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
              />
              <BookMarked className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Giới thiệu bản thân & Hướng nghiên cứu</label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Mô tả tóm tắt về chuyên môn, các đề tài đang thực hiện, giải thưởng hoặc sở thích khoa học..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none transition-all"
            />
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{submitting ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
