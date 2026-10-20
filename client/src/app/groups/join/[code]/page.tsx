'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Users, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, LogIn, AlertCircle } from 'lucide-react';
import { api, ResearchGroup, isLoggedIn } from '@/lib/api';

export default function JoinGroupPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [group, setGroup] = useState<ResearchGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  useEffect(() => {
    setUserLoggedIn(isLoggedIn());
    if (code) {
      api.getGroupByInviteCode(code).then((res) => {
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.group) {
          setGroup(res.group);
        }
      }).catch((err) => {
        setErrorMsg(err?.message || 'Không thể tải thông tin phòng Lab.');
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [code]);

  const handleJoin = async () => {
    if (!userLoggedIn) {
      router.push(`/login?redirect=/groups/join/${code}`);
      return;
    }

    setJoining(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.joinGroupByLink(code);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(res.message);
        setTimeout(() => {
          router.push(`/groups/${res.group_id}`);
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi tham gia phòng Lab.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full animate-pulse space-y-4 text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-2xl mx-auto"></div>
          <div className="h-5 bg-slate-200 rounded w-2/3 mx-auto"></div>
          <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (errorMsg && !group) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Liên kết tham gia không hợp lệ</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{errorMsg}</p>
          <Link
            href="/groups"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Xem danh sách phòng Lab</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-center">
        
        {/* Lab Avatar */}
        <div className="relative inline-block">
          <img
            src={group?.avatar_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=150'}
            alt={group?.name}
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-blue-500/10 shadow-sm mx-auto"
          />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Headings */}
        <div className="space-y-1.5">
          <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
            {group?.topic}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
            {group?.name}
          </h1>
          <p className="text-xs text-slate-500">
            Chủ trì: <span className="font-semibold text-slate-800">{group?.owner_name}</span> ({group?.owner_institution})
          </p>
          <p className="text-xs text-slate-400 font-mono">
            {group?.members_count} Nhà nghiên cứu đang hoạt động
          </p>
        </div>

        {/* Description */}
        {group?.description && (
          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl text-xs text-slate-600 text-left leading-relaxed">
            {group.description}
          </div>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {group?.is_member ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                <ShieldCheck className="w-4 h-4" />
                <span>Bạn đã là thành viên của phòng nghiên cứu này.</span>
              </div>
              <Link
                href={`/groups/${group.group_id}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Vào trang thảo luận phòng Lab</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : userLoggedIn ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <Users className="w-4 h-4" />
              <span>{joining ? 'Đang gia nhập...' : 'Xác nhận gia nhập phòng Lab'}</span>
            </button>
          ) : (
            <button
              onClick={handleJoin}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập để gia nhập phòng Lab</span>
            </button>
          )}

          <Link
            href="/groups"
            className="block text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            ← Khám phá các phòng Lab khác
          </Link>
        </div>

      </div>
    </div>
  );
}

