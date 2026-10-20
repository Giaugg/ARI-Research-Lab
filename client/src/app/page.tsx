'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Search, 
  PlusCircle, 
  Users, 
  Tag, 
  Database, 
  SlidersHorizontal,
  Flame,
  ArrowRight
} from 'lucide-react';
import { Post, api, getActiveUserId, User } from '@/lib/api';
import PostCard from '@/components/PostCard';
import CreatePostModal from '@/components/CreatePostModal';

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, [activeType, activeTag, useFts]);

  useEffect(() => {
    loadSideData();
    const handleUserChanged = () => {
      loadFeed();
      loadSideData();
    };
    window.addEventListener('ari_user_changed', handleUserChanged);
    return () => window.removeEventListener('ari_user_changed', handleUserChanged);
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
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-900/40 p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                PostgreSQL Recursive Research Platform
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {posts.length} Publications Loaded
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Academic Collaboration & Discourse Network
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Explore recursive relational queries, multi-level threaded discussions, academic graph traversals, and PostgreSQL execution plans in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sql-lab"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-all shadow-sm"
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span>SQL Optimization Lab</span>
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-600/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Contribution</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Search & Engine Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles, theorems, recursive queries..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-slate-800/80">
              {/* Type Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {postTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveType(t.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      activeType === t.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* FTS vs ILIKE Engine Toggle */}
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-slate-400">Search Engine:</span>
                <button
                  type="button"
                  onClick={() => setUseFts(!useFts)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    useFts 
                      ? 'bg-cyan-950 border-cyan-700 text-cyan-300' 
                      : 'bg-amber-950 border-amber-700 text-amber-300'
                  }`}
                  title={useFts ? 'Using PostgreSQL GIN tsvector full-text index' : 'Using Sequential ILIKE query'}
                >
                  {useFts ? 'PostgreSQL GIN (FTS)' : 'Traditional ILIKE'}
                </button>

                {executionMs !== null && (
                  <span className="text-slate-500 text-[10px]">
                    ({executionMs} ms)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Active Tag Filter Indicator */}
          {activeTag && (
            <div className="flex items-center justify-between bg-blue-950/40 border border-blue-900/60 rounded-xl px-4 py-2 text-xs text-blue-300">
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />
                <span>Filtered by domain tag: <strong>#{activeTag}</strong></span>
              </div>
              <button
                onClick={() => setActiveTag('')}
                className="text-[11px] text-blue-400 hover:underline"
              >
                Clear Tag Filter
              </button>
            </div>
          )}

          {/* Feed List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 animate-pulse">
                  <div className="h-4 bg-slate-800 rounded w-1/3 mb-3"></div>
                  <div className="h-6 bg-slate-800 rounded w-3/4 mb-4"></div>
                  <div className="h-12 bg-slate-800 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
              <Database className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-200">No Scholarly Entries Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
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
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-2">
                Current Researcher Persona
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/40"
                />
                <div className="min-w-0">
                  <Link
                    href={`/profile/${currentUser.user_id}`}
                    className="font-bold text-sm text-slate-100 hover:text-blue-400 truncate block transition-colors"
                  >
                    {currentUser.name}
                  </Link>
                  <p className="text-xs text-slate-400 truncate">{currentUser.institution}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-center">
                <div className="bg-slate-950 p-2 rounded-lg">
                  <p className="text-xs font-bold text-slate-100">{currentUser.following_count || 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Following</p>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg">
                  <p className="text-xs font-bold text-slate-100">{currentUser.followers_count || 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Followers</p>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg">
                  <p className="text-xs font-bold text-slate-100">{currentUser.publications_count || 0}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Papers</p>
                </div>
              </div>
            </div>
          )}

          {/* Problem 4: Academic Collaborative Recommendations */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Scholars You May Know</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-800/40">
                2-Hop CTE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Generated via 2nd-degree mutual followings and shared research group memberships.
            </p>

            {recommendations.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                No immediate recommendations. Try exploring the network graph!
              </p>
            ) : (
              <div className="space-y-2.5">
                {recommendations.map((rec) => (
                  <div
                    key={rec.user_id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={rec.avatar_url}
                        alt={rec.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/profile/${rec.user_id}`}
                          className="text-xs font-semibold text-slate-200 hover:text-blue-400 truncate block transition-colors"
                        >
                          {rec.name}
                        </Link>
                        <p className="text-[10px] text-slate-500 truncate">{rec.institution}</p>
                        <div className="flex items-center gap-2 text-[9px] text-cyan-400 font-mono mt-0.5">
                          <span>score: {rec.recommendation_score}</span>
                          {rec.mutual_connections_count > 0 && (
                            <span>• {rec.mutual_connections_count} mutuals</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/profile/${rec.user_id}`}
                      className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded text-[11px] font-medium transition-all"
                    >
                      Connect
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Research Topic Tags Cloud */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-3">
              <Tag className="w-4 h-4 text-blue-400" />
              <span>Academic Domains</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <button
                  key={t.tag_id}
                  onClick={() => setActiveTag(activeTag === t.name ? '' : t.name)}
                  className={`text-[11px] font-mono px-2 py-1 rounded-md transition-all ${
                    activeTag === t.name
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  #{t.name} <span className="text-[9px] text-slate-500">({t.post_count})</span>
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
