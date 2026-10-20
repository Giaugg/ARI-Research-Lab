'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  MessageSquare, 
  Tag, 
  HelpCircle, 
  Sparkles, 
  BookOpen, 
  FileText,
  Users
} from 'lucide-react';
import { Post, api } from '@/lib/api';

interface PostCardProps {
  post: Post;
  onLikeToggle?: () => void;
}

export default function PostCard({ post, onLikeToggle }: PostCardProps) {
  const [liked, setLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(parseInt(post.likes_count as any, 10) || 0);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await api.toggleLikePost(post.post_id);
      setLiked(res.liked);
      setLikeCount((prev) => (res.liked ? prev + 1 : Math.max(0, prev - 1)));
      if (onLikeToggle) onLikeToggle();
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'question':
        return {
          label: 'Academic Question',
          icon: HelpCircle,
          className: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
        };
      case 'research':
        return {
          label: 'Original Research',
          icon: Sparkles,
          className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
        };
      case 'paper_share':
        return {
          label: 'Paper Discussion',
          icon: FileText,
          className: 'bg-purple-500/10 text-purple-300 border-purple-500/30'
        };
      default:
        return {
          label: 'Scientific Discourse',
          icon: BookOpen,
          className: 'bg-blue-500/10 text-blue-300 border-blue-500/30'
        };
    }
  };

  const badge = getBadgeStyle(post.post_type);
  const BadgeIcon = badge.icon;

  return (
    <article className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-sm">
      {/* Header: Author & Meta */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.author_id}`}>
            <img
              src={post.author_avatar}
              alt={post.author_name}
              className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-700 hover:ring-blue-500 transition-all"
            />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${post.author_id}`}
                className="text-sm font-semibold text-slate-100 hover:text-blue-400 transition-colors"
              >
                {post.author_name}
              </Link>
              {post.group_name && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <span>in</span>
                  <Link
                    href={`/groups/${post.group_id}`}
                    className="text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <Users className="w-3 h-3" />
                    <span>{post.group_name}</span>
                  </Link>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{post.author_institution}</p>
          </div>
        </div>

        {/* Post Type Badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${badge.className}`}>
          <BadgeIcon className="w-3.5 h-3.5" />
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Title */}
      <Link href={`/posts/${post.post_id}`}>
        <h2 className="text-base font-bold text-slate-100 hover:text-blue-400 transition-colors leading-snug mb-2">
          {post.title}
        </h2>
      </Link>

      {/* Content Excerpt */}
      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 mb-4 whitespace-pre-line">
        {post.content}
      </p>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 font-mono hover:bg-slate-700 transition-colors"
            >
              <Tag className="w-2.5 h-2.5 text-blue-400" />
              <span>{tag}</span>
            </span>
          ))}
        </div>
      )}

      {/* Footer / Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors font-medium ${
              liked ? 'text-rose-400' : 'hover:text-rose-400'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-rose-400 text-rose-400' : ''}`} />
            <span>{likeCount}</span>
          </button>

          <Link
            href={`/posts/${post.post_id}`}
            className="flex items-center gap-1.5 hover:text-blue-400 transition-colors font-medium"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.comments_count || 0} discussion replies</span>
          </Link>
        </div>

        <span className="text-[11px] text-slate-500">
          {new Date(post.created_at).toLocaleDateString()}
        </span>
      </div>
    </article>
  );
}
