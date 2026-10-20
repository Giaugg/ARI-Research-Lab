'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Search, 
  PlusCircle, 
  Tag, 
  Database
} from 'lucide-react';
import { Post, api, getActiveUserId, User } from '@/lib/api';
import PostCard from '@/components/PostCard';
import CreatePostModal from '@/components/CreatePostModal';

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScope, setActiveScope] = useState<string>('');
  const [activeType, setActiveType] = useState<string>('');
  const [activeTag, setActiveTag] = useState<string>('');
  const [tags, setTags] = useState<{ tag_id: number; name: string; post_count: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [useFts, setUseFts] = useState(true);
  const [executionMs, setExecutionMs] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const activeUserId = getActiveUserId();

  const loadFeed = async () => {
    setLoading(true);
    try {
      const res = await api.getPosts({
        scope: (activeScope as any) || undefined,
        post_type: activeType || undefined,
        tag: activeTag || undefined,
        search: searchQuery || undefined,
        use_fts: useFts
      });
      if (res?.posts) {
        setPosts(res.posts);
        setExecutionMs(res.executionMs);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSideData = async () => {
    try {
      const [tagsRes, recsRes, userRes] = await Promise.all([
        api.getTags(),
        api.getRecommendations(activeUserId),
        api.getUserById(activeUserId)
      ]);
      if (tagsRes?.tags) setTags(tagsRes.tags);
      if (recsRes?.recommendations) setRecommendations(recsRes.recommendations.slice(0, 5));
      if (userRes?.user) setCurrentUser(userRes.user);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScope, activeType, activeTag, useFts]);

  useEffect(() => {
    loadSideData();
    const handleUserChanged = () => {
      loadFeed();
      loadSideData();
    };
    window.addEventListener('ari_user_changed', handleUserChanged);
    return () => window.removeEventListener('ari_user_changed', handleUserChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFeed();
  };

  const postTypes = [
    { id: '', label: 'All Scholarly Works' },
    { id: 'question', label: 'Questions' },
    { id: 'research', label: 'Research' },
    { id: 'discussion', label: 'Discussions' },
    { id: 'paper_share', label: 'Papers' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner / Callout */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/70 to-slate-50 border border-blue-200/80 p-6 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-100 text-blue-800 border border-blue-200 font-semibold">
                PostgreSQL Recursive Research Platform
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {posts.length} Publications Loaded
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Academic Collaboration & Discourse Network
            </h1>
            <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
              Explore recursive relational queries, multi-level threaded discussions, academic graph traversals, and PostgreSQL execution plans in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sql-lab"
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 flex items-center gap-2 transition-all shadow-xs"
            >
              <Database className="w-4 h-4 text-blue-600" />
              <span>SQL Optimization Lab</span>
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Contribution</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* Scope Selector Tabs (3 loại bài viết: Cộng đồng, Cá nhân, Lab) */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-x-auto">
            {[
              { id: '', label: 'Tất cả bài viết' },
              { id: 'community', label: '🌐 Bài đăng cộng đồng' },
              { id: 'personal', label: '👤 Bài đăng cá nhân' },
              { id: 'lab', label: '🔬 Bài đăng phòng Lab' }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveScope(s.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeScope === s.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Search & Engine Filters */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
            <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles, theorems, recursive queries..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-slate-100">
              {/* Type Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {postTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveType(t.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      activeType === t.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* FTS vs ILIKE Engine Toggle */}
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-slate-500">Search Engine:</span>
                <button
                  type="button"
                  onClick={() => setUseFts(!useFts)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    useFts 
                      ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold' 
                      : 'bg-amber-50 border-amber-200 text-amber-700 font-semibold'
                  }`}
                  title={useFts ? 'Using PostgreSQL GIN tsvector full-text index' : 'Using Sequential ILIKE query'}
                >
                  {useFts ? 'PostgreSQL GIN (FTS)' : 'Traditional ILIKE'}
                </button>

                {executionMs !== null && (
                  <span className="text-slate-400 text-[10px]">
                    ({executionMs} ms)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Active Tag Filter Indicator */}
          {activeTag && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-xs text-blue-800">
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>Filtered by domain tag: <strong>#{activeTag}</strong></span>
              </div>
              <button
                onClick={() => setActiveTag('')}
                className="text-[11px] text-blue-600 hover:underline font-medium"
              >
                Clear Tag Filter
              </button>
            </div>
          )}

          {/* Feed List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse shadow-xs">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                  <div className="h-12 bg-slate-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
              <Database className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Scholarly Entries Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No articles matched the current filters. Adjust your query or publish a new contribution.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.post_id} post={post} onLikeToggle={loadFeed} />
              ))}
            </div>
          )}

        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">

          {/* Active Researcher Persona Card */}
          {currentUser && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-mono text-blue-600 uppercase tracking-wider mb-2 font-semibold">
                Current Researcher Persona
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20"
                />
                <div className="min-w-0">
                  <Link
                    href={`/profile/${currentUser.user_id}`}
                    className="font-bold text-sm text-slate-900 hover:text-blue-600 truncate block transition-colors"
                  >
                    {currentUser.name}
                  </Link>
                  <p className="text-xs text-slate-500 truncate">{currentUser.institution}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg">
                  <p className="text-xs font-bold text-slate-900">{currentUser.following_count || 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Following</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg">
                  <p className="text-xs font-bold text-slate-900">{currentUser.followers_count || 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Followers</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg">
                  <p className="text-xs font-bold text-slate-900">{currentUser.publications_count || 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Papers</p>
                </div>
              </div>
            </div>
          )}

          {/* Problem 4: Academic Collaborative Recommendations */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Scholars You May Know</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                2-Hop CTE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Generated via 2nd-degree mutual followings and shared research group memberships.
            </p>

            {recommendations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                No immediate recommendations. Try exploring the network graph!
              </p>
            ) : (
              <div className="space-y-2.5">
                {recommendations.map((rec) => (
                  <div
                    key={rec.user_id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={rec.avatar_url}
                        alt={rec.name}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/profile/${rec.user_id}`}
                          className="text-xs font-semibold text-slate-900 hover:text-blue-600 truncate block transition-colors"
                        >
                          {rec.name}
                        </Link>
                        <p className="text-[10px] text-slate-500 truncate">{rec.institution}</p>
                        <div className="flex items-center gap-2 text-[9px] text-blue-600 font-mono mt-0.5">
                          <span>score: {rec.recommendation_score}</span>
                          {rec.mutual_connections_count > 0 && (
                            <span>• {rec.mutual_connections_count} mutuals</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/profile/${rec.user_id}`}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded text-[11px] font-medium transition-all"
                    >
                      Connect
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Research Topic Tags Cloud */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-3">
              <Tag className="w-4 h-4 text-blue-600" />
              <span>Academic Domains</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <button
                  key={t.tag_id}
                  onClick={() => setActiveTag(activeTag === t.name ? '' : t.name)}
                  className={`text-[11px] font-mono px-2 py-1 rounded-md transition-all ${
                    activeTag === t.name
                      ? 'bg-blue-600 text-white shadow-xs font-medium'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  #{t.name} <span className="text-[9px] text-slate-400">({t.post_count})</span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Contribution Modal */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPostCreated={loadFeed}
      />
    </div>
  );
}
