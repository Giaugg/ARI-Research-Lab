'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, HelpCircle, BookOpen, Sparkles, FileText, Globe, User as UserIcon, Users } from 'lucide-react';
import { api, ResearchGroup } from '@/lib/api';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  defaultGroupId?: number;
  fixedGroup?: boolean;
  defaultScope?: 'community' | 'personal' | 'lab';
}

export default function CreatePostModal({ 
  isOpen, 
  onClose, 
  onPostCreated,
  defaultGroupId,
  fixedGroup = false,
  defaultScope
}: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<'community' | 'personal' | 'lab'>('community');
  const [postType, setPostType] = useState<'discussion' | 'question' | 'research' | 'paper_share'>('discussion');
  const [groupId, setGroupId] = useState<string>('');
  const [tagsInput, setTagsInput] = useState('');
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (defaultGroupId) {
        setGroupId(defaultGroupId.toString());
        setScope('lab');
      } else if (defaultScope) {
        setScope(defaultScope);
        setGroupId('');
      } else {
        setScope('community');
        setGroupId('');
      }
      api.getGroups().then((res) => {
        if (res.groups) setGroups(res.groups);
      }).catch(console.error);
    }
  }, [isOpen, defaultGroupId, defaultScope]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    if (scope === 'lab' && !groupId) {
      alert('Vui lòng chọn phòng nghiên cứu (Lab) cho bài viết này.');
      return;
    }

    setSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await api.createPost({
        title: title.trim(),
        content: content.trim(),
        post_type: postType,
        scope,
        group_id: scope === 'lab' && groupId ? parseInt(groupId, 10) : null,
        tags
      });

      setTitle('');
      setContent('');
      setTagsInput('');
      setGroupId('');
      setScope('community');
      onPostCreated();
      onClose();
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const scopes = [
    { id: 'community', label: 'Bài đăng cộng đồng', desc: 'Bảng tin học thuật công khai cho toàn mạng lưới', icon: Globe },
    { id: 'personal', label: 'Bài đăng trang cá nhân', desc: 'Ghi chú & bài nghiên cứu trên trang cá nhân', icon: UserIcon },
    { id: 'lab', label: 'Bài đăng phòng Lab', desc: 'Thảo luận nội bộ chuyên sâu của nhóm nghiên cứu', icon: Users }
  ];

  const types = [
    { id: 'discussion', label: 'Discussion', icon: BookOpen },
    { id: 'question', label: 'Question', icon: HelpCircle },
    { id: 'research', label: 'Research', icon: Sparkles },
    { id: 'paper_share', label: 'Paper Share', icon: FileText }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Đăng bài viết nghiên cứu & thảo luận</h2>
            <p className="text-xs text-slate-500">Chia sẻ các phát hiện, truy vấn tối ưu hóa và ý tưởng khoa học</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* 3 Scopes: Community, Personal, Lab */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Phạm vi bài đăng <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {scopes.map((s) => {
                const Icon = s.icon;
                const isSelected = scope === s.id;
                const isDisabled = fixedGroup && s.id !== 'lab';
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      setScope(s.id as any);
                      if (s.id !== 'lab' && !fixedGroup) {
                        setGroupId('');
                      }
                    }}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                      isDisabled ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200' :
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500 text-blue-900 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span>{s.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight line-clamp-2">{s.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Research Group Association (Only visible if scope === 'lab') */}
          {scope === 'lab' && (
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5 animate-in fade-in duration-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">
                  Chọn phòng nghiên cứu (Lab) <span className="text-rose-500">*</span>
                </label>
                {fixedGroup && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-semibold">
                    Cố định cho phòng Lab này
                  </span>
                )}
              </div>
              <select
                required
                value={groupId}
                disabled={fixedGroup}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-85 disabled:bg-slate-100"
              >
                <option value="">-- Chọn phòng nghiên cứu liên kết --</option>
                {groups.map((g) => (
                  <option key={g.group_id} value={g.group_id}>
                    {g.name} ({g.topic})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Post Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Loại nội dung học thuật</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {types.map((t) => {
                const Icon = t.icon;
                const isSelected = postType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPostType(t.id as any)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tiêu đề bài viết</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Phân tích thực nghiệm truy vấn WITH RECURSIVE trên đồ thị lớn..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nội dung chi tiết / Phương pháp</label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Trình bày chi tiết giả thuyết, câu lệnh SQL, kết quả thực nghiệm hoặc câu hỏi chuyên môn..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none font-sans transition-all"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tags (Phân cách bằng dấu phẩy)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="PostgreSQL, Recursive CTE, Database Optimization, Graph Theory"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono transition-all"
            />
          </div>

          {/* Footer */}
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
              disabled={submitting || !title.trim() || !content.trim() || (scope === 'lab' && !groupId)}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Đang đăng tải...' : 'Xuất bản bài viết'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
