'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, BookOpen, PlusCircle, Check, ArrowRight } from 'lucide-react';
import { api, ResearchGroup } from '@/lib/api';

export default function GroupsPage() {
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');

  const loadGroups = async () => {
    try {
      const res = await api.getGroups();
      if (res?.groups) setGroups(res.groups);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
    const handleUserChanged = () => loadGroups();
    window.addEventListener('ari_user_changed', handleUserChanged);
    return () => window.removeEventListener('ari_user_changed', handleUserChanged);
  }, []);

  const handleJoinToggle = async (groupId: number) => {
    try {
      await api.toggleJoinGroup(groupId);
      loadGroups();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !topic.trim()) return;
    try {
      await api.createGroup({ name: name.trim(), topic: topic.trim(), description: description.trim() });
      setName('');
      setTopic('');
      setDescription('');
      setIsCreating(false);
      loadGroups();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Many-to-Many Group Topology
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Academic Research Groups & Laboratories
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Collaborative research initiatives spanning AI, Distributed DBMS, Cybersecurity, and Graph Theory.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isCreating ? 'Cancel' : 'Found New Research Lab'}</span>
        </button>
      </div>

      {/* Create Group Form */}
      {isCreating && (
        <form onSubmit={handleCreateGroup} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in duration-150">
          <h3 className="text-sm font-bold text-slate-100">Register New Academic Consortium</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Laboratory / Group Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Distributed Consensus & Formal Verification Lab"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Research Domain</label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Distributed Systems, PostgreSQL"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mission & Research Objectives</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State the core experimental agenda, focus areas, and collaboration protocols..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium"
            >
              Establish Group
            </button>
          </div>
        </form>
      )}

      {/* Group Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((group) => (
          <div
            key={group.group_id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <img
                  src={group.avatar_url}
                  alt={group.name}
                  className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-700"
                />
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {group.topic}
                </span>
              </div>

              <Link href={`/groups/${group.group_id}`}>
                <h3 className="text-base font-bold text-slate-100 hover:text-blue-400 transition-colors leading-snug">
                  {group.name}
                </h3>
              </Link>
              <p className="text-xs text-slate-400 mt-1">
                Founded by {group.owner_name} ({group.owner_institution})
              </p>

              <p className="text-xs text-slate-300 mt-3 line-clamp-3 leading-relaxed">
                {group.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <strong>{group.members_count}</strong> members
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <strong>{group.posts_count}</strong> posts
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleJoinToggle(group.group_id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    group.is_member
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-red-950/50 hover:text-red-300 hover:border-red-800'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {group.is_member ? 'Member ✓' : 'Join Lab'}
                </button>

                <Link
                  href={`/groups/${group.group_id}`}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
