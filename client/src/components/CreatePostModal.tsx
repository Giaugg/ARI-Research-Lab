'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, HelpCircle, BookOpen, Sparkles, FileText } from 'lucide-react';
import { api, ResearchGroup } from '@/lib/api';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'discussion' | 'question' | 'research' | 'paper_share'>('discussion');
  const [groupId, setGroupId] = useState<string>('');
  const [tagsInput, setTagsInput] = useState('');
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getGroups().then((res) => {
        if (res.groups) setGroups(res.groups);
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await api.createPost({
        title: title.trim(),
        content: content.trim(),
        post_type: postType,
        group_id: groupId ? parseInt(groupId, 10) : null,
        tags
      });

      setTitle('');
      setContent('');
      setTagsInput('');
      setGroupId('');
      onPostCreated();
      onClose();
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const types = [
    { id: 'discussion', label: 'Discussion', icon: BookOpen },
    { id: 'question', label: 'Question', icon: HelpCircle },
    { id: 'research', label: 'Research', icon: Sparkles },
    { id: 'paper_share', label: 'Paper Share', icon: FileText }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Publish Academic Inquiry or Finding</h2>
            <p className="text-xs text-slate-400">Share your research, recursive queries, or theoretical theorems</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Post Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contribution Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {types.map((t) => {
                const Icon = t.icon;
                const isSelected = postType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPostType(t.id as any)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Research Group Association */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Research Group (Optional)</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Public Scholarly Feed (No specific group)</option>
              {groups.map((g) => (
                <option key={g.group_id} value={g.group_id}>
                  {g.name} ({g.topic})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Title / Proposition</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Empirical analysis of recursive CTE memory consumption on star graphs..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Abstract / Detailed Methodology</label>
            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="State your hypothesis, queries, execution plans, or open questions for fellow researchers..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-sans"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tags (Comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="PostgreSQL, Recursive CTE, Database Optimization, Graph Theory"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !content.trim()}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Publishing...' : 'Publish to Network'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
