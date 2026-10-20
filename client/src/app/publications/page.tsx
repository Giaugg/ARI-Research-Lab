'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ExternalLink, Sparkles } from 'lucide-react';
import { api, Publication } from '@/lib/api';

export default function PublicationsPage() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [coauthorships, setCoauthorships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [pubsRes, coauthRes] = await Promise.all([
        api.getPublications(search || undefined),
        api.getCoauthorshipGraph()
      ]);
      if (pubsRes?.publications) setPublications(pubsRes.publications);
      if (coauthRes?.coauthorships) setCoauthorships(coauthRes.coauthorships);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
              Co-Authorship Relational Topology
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Scientific Publications & Peer Collaborations
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Research papers published by network members, indexed by DOI and co-authorship relationships.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles, venues, DOIs..."
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 shadow-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Filter
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Publications Column */}
        <div className="lg:col-span-8 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-slate-200/90 rounded-2xl p-6 animate-pulse space-y-3 shadow-xs">
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-12 bg-slate-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : (
            publications.map((pub) => (
            <div
              key={pub.publication_id}
              className="bg-white border border-slate-200/90 rounded-2xl p-6 hover:border-slate-300 hover:shadow-xs transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                  {pub.venue || 'Peer Reviewed'}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {new Date(pub.published_at).getFullYear()}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors">
                {pub.title}
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {pub.abstract}
              </p>

              {/* Authors List with sequence numbering */}
              <div className="pt-2">
                <div className="text-[11px] text-slate-500 mb-1.5 font-semibold">Contributing Authors:</div>
                <div className="flex flex-wrap items-center gap-2">
                  {pub.authors.map((author) => (
                    <Link
                      key={author.user_id}
                      href={`/profile/${author.user_id}`}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/20 transition-colors"
                    >
                      <img
                        src={author.avatar_url}
                        alt={author.name}
                        className="w-4 h-4 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <span>{author.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">#{author.author_order}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* DOI */}
              {pub.doi && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>DOI: {pub.doi}</span>
                  <span className="flex items-center gap-1 text-blue-600 text-[11px] font-semibold">
                    <span>Indexed</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              )}
            </div>
          )))}
        </div>

        {/* Co-Authorship Sidebar */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Co-Authorship Network</span>
            </h3>
            <span className="text-[11px] font-mono text-purple-700 font-bold">{coauthorships.length} links</span>
          </div>
          <p className="text-xs text-slate-500">
            Joint scientific collaborations extracted via publication authorship intersections.
          </p>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {coauthorships.map((c, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>{c.researcher_1_name} ↔ {c.researcher_2_name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                    {c.coauthor_count} paper{c.coauthor_count > 1 ? 's' : ''}
                  </span>
                </div>
                {c.joint_publications && (
                  <p className="text-[11px] text-slate-500 truncate">
                    Joint work: {c.joint_publications[0]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
