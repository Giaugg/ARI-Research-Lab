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
          className: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      case 'research':
        return {
          label: 'Original Research',
          icon: Sparkles,
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'paper_share':
        return {
          label: 'Paper Discussion',
          icon: FileText,
          className: 'bg-purple-50 text-purple-700 border-purple-200'
        };
      default:
        return {
          label: 'Scientific Discourse',
          icon: BookOpen,
          className: 'bg-blue-50 text-blue-700 border-blue-200'
        };
    }
  };

  const badge = getBadgeStyle(post.post_type);
  const BadgeIcon = badge.icon;

  return (
    <article className="bg-white border border-slate-200/90 rounded-xl p-5 hover:border-slate-300 hover:shadow-xs transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Header: Author & Meta */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.author_id}`}>
            <img
              src={post.author_avatar}
              alt={post.author_name}
              className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 hover:ring-blue-400 transition-all"
            />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${post.author_id}`}
                className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
              >
                {post.author_name}
              </Link>
              {post.group_name && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500">
                  <span>in</span>
                  <Link
                    href={`/groups/${post.group_id}`}
                    className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Users className="w-3 h-3" />
                    <span>{post.group_name}</span>
                  </Link>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{post.author_institution}</p>
          </div>
        </div>

        {/* Post Scope & Type Badges */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {post.scope === 'community' && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Cộng đồng
            </span>
          )}
          {post.scope === 'personal' && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              Cá nhân
            </span>
          )}
          {post.scope === 'lab' && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              Phòng Lab
            </span>
          )}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${badge.className}`}>
            <BadgeIcon className="w-3.5 h-3.5" />
            <span>{badge.label}</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <Link href={`/posts/${post.post_id}`}>
        <h2 className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors leading-snug mb-2">
          {post.title}
        </h2>
      </Link>

      {/* Content Excerpt */}
      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4 whitespace-pre-line">
        {post.content}
      </p>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-[11px] text-slate-600 font-mono hover:bg-slate-200 border border-slate-200/60 transition-colors"
            >
              <Tag className="w-2.5 h-2.5 text-blue-500" />
              <span>{tag}</span>
            </span>
          ))}
        </div>
      )}

      {/* Footer / Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors font-medium ${
              liked ? 'text-rose-500' : 'hover:text-rose-500 text-slate-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{likeCount}</span>
          </button>

          <Link
            href={`/posts/${post.post_id}`}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors font-medium text-slate-500"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.comments_count || 0} discussion replies</span>
          </Link>
        </div>

        <span className="text-[11px] text-slate-400">
          {new Date(post.created_at).toLocaleDateString()}
        </span>
      </div>
    </article>
  );
}
