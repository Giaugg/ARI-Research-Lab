'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  UserCheck, 
  UserPlus, 
  BookOpen, 
  Users, 
  Tag,
  Edit3,
  PlusCircle,
  MessageSquare
} from 'lucide-react';
import { api, User, Post, getActiveUserId } from '@/lib/api';
import PostCard from '@/components/PostCard';
import CreatePostModal from '@/components/CreatePostModal';
import EditProfileModal from '@/components/EditProfileModal';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [publications, setPublications] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [separation, setSeparation] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'posts' | 'publications' | 'groups'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  const activeUserId = getActiveUserId();
  const isMe = activeUserId === parseInt(userId, 10);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [res, postsRes] = await Promise.all([
        api.getUserById(userId),
        api.getPosts({ author_id: userId, limit: 30 })
      ]);

      if (res?.user) setUser(res.user);
      if (res?.publications) setPublications(res.publications);
      if (res?.groups) setGroups(res.groups);
      if (postsRes?.posts) setUserPosts(postsRes.posts);

      // Compute degrees of separation from active user
      if (!isMe) {
        const pathRes = await api.findPath(activeUserId, userId, 4);
        if (pathRes && pathRes.shortestDistance !== undefined) {
          setSeparation(pathRes.shortestDistance);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId, isMe, activeUserId]);

  useEffect(() => {
    loadData();
    const handleUserChanged = () => {
      loadData();
    };
    window.addEventListener('ari_user_changed', handleUserChanged);
    return () => window.removeEventListener('ari_user_changed', handleUserChanged);
  }, [loadData]);

  const handleToggleFollow = async () => {
    if (isMe) return;
    try {
      await api.toggleFollow(userId);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-24 bg-slate-800 rounded-2xl w-full"></div>
        <div className="h-64 bg-slate-800 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-200">Scholar Profile Not Found</h2>
        <Link href="/" className="mt-4 inline-block text-blue-400 text-sm hover:underline">
          ← Return to Network Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Collaborative Feed</span>
      </Link>

      {/* Profile Header Hero */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <img
            src={user.avatar_url}
            alt={user.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                Researcher ID: #{user.user_id}
              </span>
              {user.role && (
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                  user.role === 'admin' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  user.role === 'pi' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  user.role === 'student' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {user.role === 'admin' ? 'ADMIN / QUẢN TRỊ VIÊN' :
                   user.role === 'pi' ? 'PI / TRƯỞNG LAB' :
                   user.role === 'student' ? 'NGHIÊN CỨU SINH' : 'NHÀ NGHIÊN CỨU'}
                </span>
              )}
              {separation !== null && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-sky-50 text-sky-700 border border-sky-200 font-semibold">
                  {separation === 1 ? '1st Degree Contact' : `${separation} Degrees of Separation`}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {user.name}
            </h1>
            <p className="text-sm text-blue-600 font-medium mt-0.5">{user.institution}</p>
            <p className="text-xs text-slate-600 mt-2 max-w-xl leading-relaxed">
              {user.bio}
            </p>

            {/* Research Fields Tags */}
            {user.research_fields && user.research_fields.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {user.research_fields.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-[11px] font-mono text-slate-700 border border-slate-200"
                  >
                    <Tag className="w-2.5 h-2.5 text-blue-600" />
                    <span>{f}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isMe ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 self-start md:self-center">
            <button
              onClick={() => setIsCreatePostModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Đăng bài mới</span>
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200"
            >
              <Edit3 className="w-4 h-4 text-slate-500" />
              <span>Sửa thông tin</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleToggleFollow}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 self-start md:self-center transition-all ${
              user.is_following
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
            }`}
          >
            {user.is_following ? (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Following ✓</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Follow Researcher</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Network Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 text-center shadow-xs">
          <p className="text-xl sm:text-2xl font-black text-slate-900">{user.following_count || 0}</p>
          <p className="text-[11px] text-slate-500 uppercase font-mono mt-0.5">Following</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 text-center shadow-xs">
          <p className="text-xl sm:text-2xl font-black text-slate-900">{user.followers_count || 0}</p>
          <p className="text-[11px] text-slate-500 uppercase font-mono mt-0.5">Followers</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 text-center shadow-xs">
          <p className="text-xl sm:text-2xl font-black text-slate-900">{userPosts.length}</p>
          <p className="text-[11px] text-slate-500 uppercase font-mono mt-0.5">Discussions</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 text-center shadow-xs">
          <p className="text-xl sm:text-2xl font-black text-slate-900">{publications.length}</p>
          <p className="text-[11px] text-slate-500 uppercase font-mono mt-0.5">Publications</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 text-center shadow-xs col-span-2 sm:col-span-1">
          <p className="text-xl sm:text-2xl font-black text-slate-900">{groups.length}</p>
          <p className="text-[11px] text-slate-500 uppercase font-mono mt-0.5">Research Labs</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'posts'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Bài viết & Thảo luận ({userPosts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('publications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'publications'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Công trình xuất bản ({publications.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'groups'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Nhóm nghiên cứu ({groups.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Bài viết do {isMe ? 'bạn' : user.name} đăng ({userPosts.length})</span>
            </h2>
            {isMe && (
              <button
                onClick={() => setIsCreatePostModalOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Tạo bài viết mới</span>
              </button>
            )}
          </div>

          {userPosts.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs space-y-3">
              <p>Chưa có bài viết nào được đăng bởi nhà nghiên cứu này.</p>
              {isMe && (
                <button
                  onClick={() => setIsCreatePostModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Đăng bài nghiên cứu đầu tiên</span>
                </button>
              )}
            </div>
          ) : (
            userPosts.map((p) => (
              <PostCard key={p.post_id} post={p} onLikeToggle={loadData} />
            ))
          )}
        </div>
      )}

      {activeTab === 'publications' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Authored Publications ({publications.length})</span>
          </h2>

          <div className="space-y-3">
            {publications.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">Chưa có công trình khoa học nào được liệt kê.</p>
            ) : (
              publications.map((p) => (
                <div
                  key={p.publication_id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="text-purple-700 font-semibold">{p.venue}</span>
                    <span>{new Date(p.published_at).getFullYear()}</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">{p.title}</h3>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{p.abstract}</p>
                  {p.doi && (
                    <p className="text-[10px] text-slate-500 font-mono">DOI: {p.doi}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Research Group Memberships ({groups.length})</span>
          </h2>

          <div className="space-y-3">
            {groups.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">Chưa tham gia phòng nghiên cứu nào.</p>
            ) : (
              groups.map((g) => (
                <div
                  key={g.group_id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div>
                    <Link
                      href={`/groups/${g.group_id}`}
                      className="text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {g.name}
                    </Link>
                    <p className="text-[10px] text-slate-500 mt-0.5">{g.topic}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 capitalize font-medium">
                    {g.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {user && isMe && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={user}
          onProfileUpdated={(updated) => {
            setUser(updated);
            loadData();
          }}
        />
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        onPostCreated={loadData}
        defaultScope="personal"
      />
    </div>
  );
}
