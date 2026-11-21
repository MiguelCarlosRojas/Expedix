import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { NotificationItem } from '../types';
import { notifications } from '@mantine/notifications';
import { api } from '../services/api';

export const useNotificationsWebSocket = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get<{ unread_count: number }>('/notifications/unread_count/');
      setUnreadCount(res.data.unread_count);
      const listRes = await api.get<{ results: NotificationItem[] } | NotificationItem[]>('/notifications/');
      const items = Array.isArray(listRes.data) ? listRes.data : (listRes.data.results || []);
      setRecentNotifications(items.slice(0, 10));
    } catch (e) {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();

    const rawWsBase = import.meta.env.VITE_WS_BASE_URL;
    let wsUrl: string;
    if (rawWsBase) {
      const trimmed = rawWsBase.replace(/\/+$/, '');
      wsUrl = trimmed.startsWith('ws') ? `${trimmed}/ws/notifications/` : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${trimmed.replace(/^https?:\/\//, '')}/ws/notifications/`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      wsUrl = `${protocol}//${host}/ws/notifications/`;
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.id) {
            setRecentNotifications((prev) => [data, ...prev].slice(0, 10));
            setUnreadCount((c) => c + 1);

            // Toast alert
            notifications.show({
              title: data.title,
              message: data.message,
              color: data.notification_type === 'ERROR' ? 'red' : 'teal',
            });
          }
        } catch (err) {
          // ignore
        }
      };

      ws.onclose = () => {
        // Disconnected
      };
    } catch (e) {
      // ignore
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, fetchUnreadCount]);

  const markAsRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/mark_as_read/`);
      setRecentNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark_all_as_read/');
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      // ignore
    }
  };

  return {
    unreadCount,
    recentNotifications,
    markAsRead,
    markAllAsRead,
    refresh: fetchUnreadCount,
  };
};
