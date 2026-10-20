'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Users, BookOpen, Shield, Crown, PlusCircle, UserPlus } from 'lucide-react';
import { api, ResearchGroup, Post } from '@/lib/api';
import PostCard from '@/components/PostCard';
import CreatePostModal from '@/components/CreatePostModal';
import InviteMemberModal from '@/components/InviteMemberModal';

export const dynamic = 'force-dynamic';

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<ResearchGroup | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!groupId) return;
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
  }, [groupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Groups Roster</span>
      </Link>

      {/* Group Hero Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <img
            src={group.avatar_url}
            alt={group.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-blue-500/20"
          />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                {group.topic}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {members.length} Active Members
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {group.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Led by {group.owner_name} ({group.owner_institution})
            </p>
            <p className="text-xs text-slate-600 mt-3 max-w-2xl leading-relaxed">
              {group.description}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 self-start md:self-center">
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post to Lab</span>
          </button>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all"
          >
            <UserPlus className="w-4 h-4 text-slate-500" />
            <span>Mời thành viên</span>
          </button>

          <button
            onClick={handleJoinToggle}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              group.is_member
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
            }`}
          >
            {group.is_member ? 'Member ✓ (Leave)' : 'Join Group'}
          </button>
        </div>
      </div>

      {/* Two Column Content: Posts on Left, Member Roster on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Group Feed */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Laboratory Discussion Feed ({posts.length})</span>
            </h2>
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Discussion</span>
            </button>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs">
              No discussions initiated in this laboratory yet.
            </div>
          ) : (
            posts.map((p) => (
              <PostCard key={p.post_id} post={p} onLikeToggle={loadData} />
            ))
          )}
        </div>

        {/* Members Roster Sidebar */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Laboratory Members</span>
            </h3>
            <span className="text-xs font-mono text-blue-600 font-bold">{members.length}</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {members.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200/80"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={m.avatar_url}
                    alt={m.name}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/profile/${m.user_id}`}
                      className="text-xs font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate block"
                    >
                      {m.name}
                    </Link>
                    <p className="text-[10px] text-slate-500 truncate">{m.institution}</p>
                  </div>
                </div>

                <div className="text-right flex items-center gap-1 text-[10px] font-mono capitalize">
                  {m.role === 'owner' && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                  {m.role === 'admin' && <Shield className="w-3.5 h-3.5 text-blue-600" />}
                  <span className={m.role === 'owner' ? 'text-amber-600 font-semibold' : m.role === 'admin' ? 'text-blue-600 font-semibold' : 'text-slate-500'}>
                    {m.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Post to Group Modal */}
      {group && (
        <CreatePostModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          onPostCreated={loadData}
          defaultGroupId={group.group_id}
          fixedGroup={true}
        />
      )}

      {/* Invite Member to Group Modal */}
      {group && (
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          group={group}
        />
      )}
    </div>
  );
}
