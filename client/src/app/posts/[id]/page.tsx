'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Tag, 
  GitBranch, 
  Code2, 
  Clock
} from 'lucide-react';
import { Post, CommentItem, api } from '@/lib/api';
import CommentTree from '@/components/CommentTree';

export const dynamic = 'force-dynamic';

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [executionMs, setExecutionMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSqlExplanation, setShowSqlExplanation] = useState(false);

  const loadData = useCallback(async () => {
    if (!postId) return;
    try {
      const [postRes, commentRes] = await Promise.all([
        api.getPostById(postId),
        api.getComments(postId)
      ]);
      if (postRes?.post) setPost(postRes.post);
      if (commentRes?.comments) {
        setComments(commentRes.comments);
        setExecutionMs(commentRes.executionMs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/4"></div>
        <div className="h-10 bg-slate-200 rounded w-3/4"></div>
        <div className="h-32 bg-slate-200 rounded w-full"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Publication Not Found</h2>
        <Link href="/" className="mt-4 inline-block text-blue-600 text-sm hover:underline">
          ← Return to Scholarly Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Collaborative Feed</span>
      </Link>

      {/* Main Post Container */}
      <article className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
        {/* Author Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3.5">
            <Link href={`/profile/${post.author_id}`}>
              <img
                src={post.author_avatar}
                alt={post.author_name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20 hover:ring-blue-500 transition-all"
              />
            </Link>
            <div>
              <Link
                href={`/profile/${post.author_id}`}
                className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors"
              >
                {post.author_name}
              </Link>
              <p className="text-xs text-slate-500">{post.author_institution}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Published on {new Date(post.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 capitalize">
              {post.post_type}
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug mb-4">
          {post.title}
        </h1>

        {/* Content Body */}
        <div className="text-sm text-slate-700 leading-relaxed space-y-4 whitespace-pre-wrap font-sans">
          {post.content}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-6 pt-4 border-t border-slate-100">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-xs text-slate-700 font-mono border border-slate-200/80"
              >
                <Tag className="w-3 h-3 text-blue-600" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        )}
      </article>

      {/* Problem 3: Threaded Recursive Comment Tree Header */}
      <div className="mb-6 rounded-xl bg-white border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Threaded Discussion Tree ({comments.length} comments)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Hierarchical parent-child discourse rendered via PostgreSQL <code className="text-blue-700 font-mono bg-blue-50 px-1 py-0.5 rounded border border-blue-100">WITH RECURSIVE</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {executionMs !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-blue-700">
              <Clock className="w-3.5 h-3.5" />
              <span>CTE Execution: {executionMs} ms</span>
            </div>
          )}

          <button
            onClick={() => setShowSqlExplanation(!showSqlExplanation)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showSqlExplanation ? 'Hide SQL Logic' : 'View Recursive CTE'}</span>
          </button>
        </div>
      </div>

      {/* SQL Logic Explanation Box */}
      {showSqlExplanation && (
        <div className="mb-6 rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 shadow-inner overflow-x-auto animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-cyan-400 mb-2 font-bold">
            <span>-- Problem 3: Multi-Level Comment Tree Query</span>
            <span className="text-[11px] text-slate-500">PostgreSQL 18</span>
          </div>
          <pre className="text-slate-300 text-[11px] leading-relaxed">
{`WITH RECURSIVE comment_tree AS (
    -- 1. Anchor Member: Top-level root comments
    SELECT 
        comment_id, post_id, user_id, parent_id, content, created_at,
        0 AS depth,
        ARRAY[comment_id] AS sort_path
    FROM comments
    WHERE post_id = ${postId} AND parent_id IS NULL

    UNION ALL

    -- 2. Recursive Member: Child replies joined to parent
    SELECT 
        c.comment_id, c.post_id, c.user_id, c.parent_id, c.content, c.created_at,
        ct.depth + 1,
        ct.sort_path || c.comment_id
    FROM comments c
    JOIN comment_tree ct ON c.parent_id = ct.comment_id
)
SELECT * FROM comment_tree ORDER BY sort_path ASC;`}
          </pre>
          <p className="mt-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-sans leading-normal">
            <strong>Tree Sorting Principle:</strong> The composite array <code className="text-cyan-300 font-mono">sort_path</code> orders replies depth-first directly under their respective parent branch, ensuring all replies are grouped logically without requiring multiple network round-trips.
          </p>
        </div>
      )}

      {/* Comment Tree Component */}
      <CommentTree
        comments={comments}
        postId={parseInt(postId, 10)}
        onCommentAdded={loadData}
      />
    </div>
  );
}
