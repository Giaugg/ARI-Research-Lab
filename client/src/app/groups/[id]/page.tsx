'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Users, BookOpen, Shield, Crown, User as UserIcon } from 'lucide-react';
import { api, ResearchGroup, Post } from '@/lib/api';
import PostCard from '@/components/PostCard';

export const dynamic = 'force-dynamic';

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<ResearchGroup | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await api.getGroupById(groupId);
      if (res?.group) setGroup(res.group);
      if (res?.members) setMembers(res.members);
      if (res?.posts) setPosts(res.posts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) loadData();
  }, [groupId]);

  const handleJoinToggle = async () => {
    if (!group) return;
    try {
      await api.toggleJoinGroup(group.group_id);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-8 bg-slate-800 rounded w-1/3"></div>
        <div className="h-24 bg-slate-800 rounded w-full"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-200">Group Not Found</h2>
        <Link href="/groups" className="mt-4 inline-block text-blue-400 text-sm hover:underline">
          ← Return to Research Groups
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link
        href="/groups"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Groups Roster</span>
      </Link>

      {/* Group Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <img
            src={group.avatar_url}
            alt={group.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-blue-500/40"
          />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                {group.topic}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {members.length} Active Members
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {group.name}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Led by {group.owner_name} ({group.owner_institution})
            </p>
            <p className="text-xs text-slate-300 mt-3 max-w-2xl leading-relaxed">
              {group.description}
            </p>
          </div>
        </div>

        <button
          onClick={handleJoinToggle}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold self-start md:self-center transition-all ${
            group.is_member
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-red-950 hover:text-red-300 hover:border-red-800'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
          }`}
        >
          {group.is_member ? 'Member ✓ (Click to Leave)' : 'Join Research Group'}
        </button>
      </div>

      {/* Two Column Content: Posts on Left, Member Roster on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Group Feed */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Laboratory Discussion Feed ({posts.length})</span>
          </h2>

          {posts.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
              No discussions initiated in this laboratory yet.
            </div>
          ) : (
            posts.map((p) => (
              <PostCard key={p.post_id} post={p} onLikeToggle={loadData} />
            ))
          )}
        </div>

        {/* Members Roster Sidebar */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Laboratory Members</span>
            </h3>
            <span className="text-xs font-mono text-cyan-400 font-bold">{members.length}</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {members.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-950 border border-slate-800/80"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={m.avatar_url}
                    alt={m.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/profile/${m.user_id}`}
                      className="text-xs font-semibold text-slate-200 hover:text-blue-400 transition-colors truncate block"
                    >
                      {m.name}
                    </Link>
                    <p className="text-[10px] text-slate-500 truncate">{m.institution}</p>
                  </div>
                </div>

                <div className="text-right flex items-center gap-1 text-[10px] font-mono capitalize">
                  {m.role === 'owner' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                  {m.role === 'admin' && <Shield className="w-3.5 h-3.5 text-blue-400" />}
                  <span className={m.role === 'owner' ? 'text-amber-400' : m.role === 'admin' ? 'text-blue-400' : 'text-slate-400'}>
                    {m.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
