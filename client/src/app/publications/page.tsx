'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Search, ExternalLink, Users, BookOpen, Sparkles } from 'lucide-react';
import { api, Publication } from '@/lib/api';

export default function PublicationsPage() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [coauthorships, setCoauthorships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Co-Authorship Relational Topology
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Scientific Publications & Peer Collaborations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Research papers published by network members, indexed by DOI and co-authorship relationships.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles, venues, DOIs..."
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
          >
            Filter
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Publications Column */}
        <div className="lg:col-span-8 space-y-4">
          {publications.map((pub) => (
            <div
              key={pub.publication_id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
                  {pub.venue || 'Peer Reviewed'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(pub.published_at).getFullYear()}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-100 hover:text-blue-400 transition-colors">
                {pub.title}
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {pub.abstract}
              </p>

              {/* Authors List with sequence numbering */}
              <div className="pt-2">
                <div className="text-[11px] text-slate-400 mb-1.5 font-semibold">Contributing Authors:</div>
                <div className="flex flex-wrap items-center gap-2">
                  {pub.authors.map((author) => (
                    <Link
                      key={author.user_id}
                      href={`/profile/${author.user_id}`}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-blue-400 hover:border-slate-700 transition-colors"
                    >
                      <img
                        src={author.avatar_url}
                        alt={author.name}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span>{author.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">#{author.author_order}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* DOI */}
              {pub.doi && (
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>DOI: {pub.doi}</span>
                  <span className="flex items-center gap-1 text-blue-400 text-[11px]">
                    <span>Indexed</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Co-Authorship Sidebar */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Co-Authorship Network</span>
            </h3>
            <span className="text-[11px] font-mono text-cyan-400 font-bold">{coauthorships.length} links</span>
          </div>
          <p className="text-xs text-slate-400">
            Joint scientific collaborations extracted via publication authorship intersections.
          </p>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {coauthorships.map((c, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between font-semibold text-slate-200">
                  <span>{c.researcher_1_name} ↔ {c.researcher_2_name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/30 text-blue-300">
                    {c.coauthor_count} paper{c.coauthor_count > 1 ? 's' : ''}
                  </span>
                </div>
                {c.joint_publications && (
                  <p className="text-[11px] text-slate-400 truncate">
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
