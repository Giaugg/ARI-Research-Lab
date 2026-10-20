'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Users, Send, CheckCircle2 } from 'lucide-react';
import { api, ResearchGroup, User } from '@/lib/api';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: ResearchGroup;
}

export default function InviteMemberModal({ isOpen, onClose, group }: InviteMemberModalProps) {
  const [copied, setCopied] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [inviting, setInviting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const inviteUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/groups/join/${group.invite_code || ''}`
    : '';

  useEffect(() => {
    if (isOpen) {
      setSuccessMsg('');
      setErrorMsg('');
      setSelectedUserId('');
      api.getUsers().then((res) => {
        if (res?.users) {
          setAllUsers(res.users);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setInviting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.inviteUserToGroup(group.group_id, parseInt(selectedUserId, 10));
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(res.message || 'Đã gửi thông báo mời tham gia phòng Lab thành công!');
        setSelectedUserId('');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi khi gửi lời mời.');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Mời thành viên vào phòng Lab</h2>
              <p className="text-xs text-slate-500 truncate max-w-xs">{group.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Direct Invite Link */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            Liên kết mời tham gia trực tiếp (Direct Invite Link)
          </label>
          <p className="text-[11px] text-slate-500">
            Bất kỳ nhà nghiên cứu nào mở liên kết này đều có thể gia nhập phòng nghiên cứu ngay lập tức.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 select-all focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <span className="relative bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            hoặc mời trực tiếp
          </span>
        </div>

        {/* Section 2: In-app Direct Invitation */}
        <form onSubmit={handleSendInvite} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-800">
            Chọn nhà nghiên cứu từ hệ thống ARI
          </label>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn thành viên muốn mời --</option>
              {allUsers.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name} ({u.institution}) - {u.email}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={inviting || !selectedUserId}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{inviting ? 'Đang gửi...' : 'Gửi lời mời'}</span>
            </button>
          </div>
        </form>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}

