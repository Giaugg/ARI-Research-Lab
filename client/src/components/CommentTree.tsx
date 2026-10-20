'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CornerDownRight, 
  MessageSquare, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Send,
  GitBranch,
  Layers
} from 'lucide-react';
import { CommentItem, api, getActiveUserId } from '@/lib/api';

interface CommentTreeProps {
  comments: CommentItem[];
  postId: number;
  onCommentAdded: () => void;
}

export default function CommentTree({ comments, postId, onCommentAdded }: CommentTreeProps) {
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [collapsedBranches, setCollapsedBranches] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const currentUserId = getActiveUserId();

  const toggleCollapse = (commentId: number) => {
    setCollapsedBranches((prev) => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handlePostReply = async (parentId: number | null) => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await api.createComment(postId, replyContent.trim(), parentId);
      setReplyContent('');
      setReplyingToId(null);
      onCommentAdded();
    } catch (e) {
      console.error('Error posting reply:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment and all its nested sub-replies?')) return;
    try {
      await api.deleteComment(commentId);
      onCommentAdded();
    } catch (e) {
      console.error('Error deleting comment:', e);
    }
  };

  // Determine if a comment should be hidden because one of its ancestors is collapsed
  const isCommentHidden = (comment: CommentItem) => {
    for (let i = 0; i < comment.sort_path.length - 1; i++) {
      const ancestorId = comment.sort_path[i];
      if (collapsedBranches[ancestorId]) {
        return true;
      }
    }
    return false;
  };

  // Depth color highlights for visual hierarchy in light theme
  const depthColors = [
    'border-slate-200 bg-white shadow-xs',
    'border-blue-200/80 bg-blue-50/20',
    'border-sky-200/80 bg-sky-50/20',
    'border-emerald-200/80 bg-emerald-50/15',
    'border-purple-200/80 bg-purple-50/15'
  ];

  return (
    <div className="space-y-4">
      {/* Root Comment Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-700">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span>Contribute to this Academic Thread</span>
        </div>
        <textarea
          rows={3}
          value={replyingToId === null ? replyContent : ''}
          onChange={(e) => {
            setReplyingToId(null);
            setReplyContent(e.target.value);
          }}
          placeholder="Share your peer review, mathematical critique, or replication query..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
        />
        <div className="flex justify-between items-center mt-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
            <GitBranch className="w-3.5 h-3.5 text-blue-600" />
            <span>Target: Root Branch (depth: 0)</span>
          </div>
          <button
            onClick={() => handlePostReply(null)}
            disabled={submitting || replyingToId !== null || !replyContent.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post Root Comment</span>
          </button>
        </div>
      </div>

      {/* Threaded Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-10 bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
          No discussion entries yet. Start the academic discourse above!
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            if (isCommentHidden(comment)) return null;

            const isReplying = replyingToId === comment.comment_id;
            const isCollapsed = !!collapsedBranches[comment.comment_id];
            const hasChildren = (comment.direct_replies_count || 0) > 0;
            const depthClass = depthColors[comment.depth % depthColors.length];

            return (
              <div
                key={comment.comment_id}
                style={{ marginLeft: `${Math.min(comment.depth, 6) * 1.5}rem` }}
                className={`relative group transition-all duration-200 border rounded-xl p-4 shadow-xs ${depthClass}`}
              >
                {/* Visual Branch Connection Line */}
                {comment.depth > 0 && (
                  <div className="absolute -left-4 top-5 w-4 h-[1.5px] bg-slate-300" />
                )}

                {/* Header: Author + Meta */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={comment.author_avatar}
                      alt={comment.author_name}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profile/${comment.author_id}`}
                          className="text-xs font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {comment.author_name}
                        </Link>
                        {comment.author_id === currentUserId && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded font-mono font-medium">
                            You
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate max-w-sm">
                        {comment.author_institution}
                      </p>
                    </div>
                  </div>

                  {/* Depth & Recursive Path Badge */}
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-600">
                      <Layers className="w-3 h-3 text-blue-600" />
                      <span>depth: {comment.depth}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-500 truncate max-w-[90px]">
                        path: [{comment.sort_path.join('→')}]
                      </span>
                    </div>

                    {hasChildren && (
                      <button
                        onClick={() => toggleCollapse(comment.comment_id)}
                        className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
                        title="Collapse or expand replies"
                      >
                        {isCollapsed ? (
                          <>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span>{comment.direct_replies_count}</span>
                          </>
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Content */}
                <div className="mt-2.5 text-xs text-slate-700 leading-relaxed pl-1 whitespace-pre-wrap">
                  {comment.content}
                </div>

                {/* Comment Actions */}
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      if (isReplying) {
                        setReplyingToId(null);
                        setReplyContent('');
                      } else {
                        setReplyingToId(comment.comment_id);
                        setReplyContent('');
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 font-medium transition-colors"
                  >
                    <CornerDownRight className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isReplying ? 'Cancel' : 'Reply'}</span>
                  </button>

                  {comment.author_id === currentUserId && (
                    <button
                      onClick={() => handleDelete(comment.comment_id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      title="Delete comment branch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Nested Inline Reply Form */}
                {isReplying && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 mb-2 text-[11px] text-blue-600 font-mono">
                      <CornerDownRight className="w-3.5 h-3.5" />
                      <span>Replying to #{comment.comment_id} (New depth: {comment.depth + 1})</span>
                    </div>
                    <textarea
                      rows={2}
                      autoFocus
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply directly to ${comment.author_name}...`}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => {
                          setReplyingToId(null);
                          setReplyContent('');
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handlePostReply(comment.comment_id)}
                        disabled={submitting || !replyContent.trim()}
                        className="flex items-center gap-1 px-3.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Submit Reply</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
