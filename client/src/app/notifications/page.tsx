'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  CheckCheck, 
  Users, 
  Heart, 
  MessageSquare, 
  UserCheck, 
  ArrowLeft, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { api, NotificationItem } from '@/lib/api';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.getNotifications();
      if (res?.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch (e) {
      console.error('Error loading notifications:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const handleUserChanged = () => {
      loadNotifications();
    };
    window.addEventListener('ari_user_changed', handleUserChanged);
    return () => window.removeEventListener('ari_user_changed', handleUserChanged);
  }, [loadNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      window.dispatchEvent(new Event('ari_user_changed'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      try {
        await api.markNotificationAsRead(notif.notification_id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.notification_id === notif.notification_id ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        window.dispatchEvent(new Event('ari_user_changed'));
      } catch (e) {
        console.error(e);
      }
    }

    if (notif.link) {
      router.push(notif.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'lab_invite':
        return { icon: Users, bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'post_like':
        return { icon: Heart, bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'comment':
        return { icon: MessageSquare, bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'follow':
        return { icon: UserCheck, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { icon: Bell, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Breadcrumb */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại Bảng tin học thuật</span>
      </Link>

      {/* Hero Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Trung tâm Thông báo Học thuật</span>
            </span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                {unreadCount} chưa đọc
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Thông báo & Tương tác
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cập nhật lời mời tham gia phòng Lab, lượt thích, phản hồi bình luận và theo dõi mới.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors self-start sm:self-center"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" />
            <span>Đánh dấu tất cả đã đọc</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filter === 'all'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Tất cả thông báo ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filter === 'unread'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Chưa đọc ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-3 bg-slate-100 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-slate-500 space-y-2">
          <Bell className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            {filter === 'unread' ? 'Bạn không có thông báo chưa đọc nào.' : 'Chưa có thông báo nào trong hệ thống.'}
          </p>
          <p className="text-xs text-slate-400">
            Các tương tác như mời vào lab, bình luận, và theo dõi sẽ hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((n) => {
            const { icon: Icon, bg } = getNotificationIcon(n.type);
            return (
              <div
                key={n.notification_id}
                onClick={() => handleNotificationClick(n)}
                className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                  !n.is_read
                    ? 'bg-blue-50/40 border-blue-200/90 hover:bg-blue-50/70 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50/80 hover:border-slate-300'
                }`}
              >
                {/* Icon Badge */}
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 truncate">
                      <span>{n.title}</span>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                      )}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(n.created_at).toLocaleDateString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {n.message}
                  </p>

                  {n.sender_name && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                      {n.sender_avatar && (
                        <img
                          src={n.sender_avatar}
                          alt={n.sender_name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                      )}
                      <span className="font-medium text-slate-700">{n.sender_name}</span>
                      {n.sender_institution && (
                        <span className="text-slate-400">({n.sender_institution})</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Navigation Arrow */}
                {n.link && (
                  <div className="text-slate-400 hover:text-blue-600 p-1 shrink-0 self-center">
                    <ExternalLink className="w-4 h-4" />
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
