import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore, selectIsAuthenticated } from '../stores';
import { useNotificationStore } from '../stores/useNotificationStore';
import { getMyInfo } from '../services/user';
import { message } from 'antd';

export const useSocketIO = () => {
  const isSignedIn = useAuthStore(selectIsAuthenticated);
  const { setHasUnreadBooking } = useNotificationStore();

  useEffect(() => {
    if (!isSignedIn) return;

    let isMounted = true;
    let socket: any = null;

    getMyInfo().then((userInfo) => {
      if (!isMounted || !userInfo) return;
      
      socket = io('http://localhost:9093', {
        query: { accountId: userInfo.id },
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        console.log('Socket.IO connected', socket.id);
      });

      socket.on('notification:new', (data: any) => {
        console.log('New notification received:', data);
        setHasUnreadBooking(true);
        message.info(data.message || 'You have a new notification!');
      });

      socket.on('disconnect', () => {
        console.log('Socket.IO disconnected');
      });
    }).catch(err => console.error("Failed to fetch user for socket", err));

    return () => {
      isMounted = false;
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isSignedIn, setHasUnreadBooking]);
};
