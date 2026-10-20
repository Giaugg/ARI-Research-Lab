'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  UserCheck, 
  UserPlus, 
  BookOpen, 
  Users, 
  Award, 
  Tag, 
  Route,
  Sparkles
} from 'lucide-react';
import { api, User, getActiveUserId } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [publications, setPublications] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [separation, setSeparation] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const activeUserId = getActiveUserId();
  const isMe = activeUserId === parseInt(userId, 10);

  const loadData = async () => {
    try {
      const res = await api.getUserById(userId);
      if (res?.user) setUser(res.user);
      if (res?.publications) setPublications(res.publications);
      if (res?.groups) setGroups(res.groups);
      if (res?.followers) setFollowers(res.followers);
      if (res?.following) setFollowing(res.following);

      // Compute degrees of separation from active user
      if (!isMe) {
        const pathRes = await api.findPath(activeUserId, userId, 4);
        if (pathRes && pathRes.shortestDistance !== undefined) {
          setSeparation(pathRes.shortestDistance);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadData();
  }, [userId]);

  const handleToggleFollow = async () => {
    if (isMe) return;
    try {
      await api.toggleFollow(userId);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-24 bg-slate-800 rounded-2xl w-full"></div>
        <div className="h-64 bg-slate-800 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-200">Scholar Profile Not Found</h2>
        <Link href="/" className="mt-4 inline-block text-blue-400 text-sm hover:underline">
          ← Return to Network Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Collaborative Feed</span>
      </Link>

      {/* Profile Header Hero */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <img
            src={user.avatar_url}
            alt={user.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ring-blue-500/50 shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Researcher ID: #{user.user_id}
              </span>
              {separation !== null && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {separation === 1 ? '1st Degree Contact' : `${separation} Degrees of Separation`}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {user.name}
            </h1>
            <p className="text-sm text-cyan-400 font-medium mt-0.5">{user.institution}</p>
            <p className="text-xs text-slate-300 mt-2 max-w-xl leading-relaxed">
              {user.bio}
            </p>

            {/* Research Fields Tags */}
            {user.research_fields && user.research_fields.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {user.research_fields.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 text-[11px] font-mono text-slate-300 border border-slate-800"
                  >
                    <Tag className="w-2.5 h-2.5 text-blue-400" />
                    <span>{f}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {!isMe && (
          <button
            onClick={handleToggleFollow}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 self-start md:self-center transition-all ${
              user.is_following
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-red-950 hover:text-red-300 hover:border-red-800'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
            }`}
          >
            {user.is_following ? (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Following ✓</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Follow Researcher</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Network Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-white">{user.following_count || 0}</p>
          <p className="text-xs text-slate-400 uppercase font-mono mt-1">Following</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-white">{user.followers_count || 0}</p>
          <p className="text-xs text-slate-400 uppercase font-mono mt-1">Followers</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-white">{publications.length}</p>
          <p className="text-xs text-slate-400 uppercase font-mono mt-1">Publications</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-white">{groups.length}</p>
          <p className="text-xs text-slate-400 uppercase font-mono mt-1">Research Labs</p>
        </div>
      </div>

      {/* Tabbed Content: Publications & Labs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Authored Publications */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Authored Publications ({publications.length})</span>
          </h2>

          <div className="space-y-3">
            {publications.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No publications listed yet.</p>
            ) : (
              publications.map((p) => (
                <div
                  key={p.publication_id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="text-purple-400">{p.venue}</span>
                    <span>{new Date(p.published_at).getFullYear()}</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-200">{p.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{p.abstract}</p>
                  {p.doi && (
                    <p className="text-[10px] text-slate-500 font-mono">DOI: {p.doi}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Affiliated Research Groups */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Research Group Memberships ({groups.length})</span>
          </h2>

          <div className="space-y-3">
            {groups.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">Not a member of any research groups.</p>
            ) : (
              groups.map((g) => (
                <div
                  key={g.group_id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800"
                >
                  <div>
                    <Link
                      href={`/groups/${g.group_id}`}
                      className="text-xs font-bold text-slate-200 hover:text-blue-400 transition-colors"
                    >
                      {g.name}
                    </Link>
                    <p className="text-[10px] text-slate-500 mt-0.5">{g.topic}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 capitalize">
                    {g.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
