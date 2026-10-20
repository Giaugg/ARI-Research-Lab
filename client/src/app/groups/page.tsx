'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, BookOpen, PlusCircle, ArrowRight } from 'lucide-react';
import { api, ResearchGroup } from '@/lib/api';

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadGroups = useCallback(async () => {
    try {
      const res = await api.getGroups();
      if (res?.groups) setGroups(res.groups);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
    const handleUserChanged = () => {
      loadGroups();
    };
    window.addEventListener('ari_user_changed', handleUserChanged);
    return () => window.removeEventListener('ari_user_changed', handleUserChanged);
  }, [loadGroups]);

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

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.createGroup({ 
        name: name.trim(), 
        topic: topic.trim(), 
        description: description.trim() 
      });

      if (res?.group?.group_id) {
        setName('');
        setTopic('');
        setDescription('');
        setIsCreating(false);
        router.push(`/groups/${res.group.group_id}`);
      } else {
        loadGroups();
        setIsCreating(false);
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || 'Lỗi khi thành lập nhóm nghiên cứu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              Many-to-Many Group Topology
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Academic Research Groups & Laboratories
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Collaborative research initiatives spanning AI, Distributed DBMS, Cybersecurity, and Graph Theory.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isCreating ? 'Cancel' : 'Found New Research Lab'}</span>
        </button>
      </div>

      {/* Create Group Form */}
      {isCreating && (
        <form onSubmit={handleCreateGroup} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Register New Academic Consortium</h3>
            <span className="text-[11px] text-slate-500">You will be designated as the founding Principal Investigator (Owner)</span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Laboratory / Group Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Distributed Consensus & Formal Verification Lab"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Research Domain</label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Distributed Systems, PostgreSQL"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mission & Research Objectives</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State the core experimental agenda, focus areas, and collaboration protocols..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim() || !topic.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
            >
              {submitting ? 'Founding Consortium...' : 'Establish Group'}
            </button>
          </div>
        </form>
      )}

      {/* Group Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs animate-pulse space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                <div className="w-24 h-5 bg-slate-200 rounded-full"></div>
              </div>
              <div className="h-5 bg-slate-200 rounded w-1/2"></div>
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-10 bg-slate-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map((group) => (
            <div
              key={group.group_id}
              className="bg-white border border-slate-200/90 rounded-2xl p-6 hover:border-slate-300 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <img
                    src={group.avatar_url}
                    alt={group.name}
                    className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200"
                  />
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                    {group.topic}
                  </span>
                </div>

                <Link href={`/groups/${group.group_id}`}>
                  <h3 className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors leading-snug">
                    {group.name}
                  </h3>
                </Link>
                <p className="text-xs text-slate-500 mt-1">
                  Founded by {group.owner_name} ({group.owner_institution})
                </p>

                <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                  {group.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <strong>{group.members_count}</strong> members
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <strong>{group.posts_count}</strong> posts
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleJoinToggle(group.group_id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      group.is_member
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                    }`}
                  >
                    {group.is_member ? 'Member ✓' : 'Join Lab'}
                  </button>

                  <Link
                    href={`/groups/${group.group_id}`}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
