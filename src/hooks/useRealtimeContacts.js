import { useState, useEffect, useCallback } from 'react';
import socketService from '../socket';
import { useApp } from '../context/AppContext';

export const useRealtimeContacts = () => {
  const { currentUser } = useApp();
  const [contacts, setContacts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Monitor connection status
  useEffect(() => {
    if (!currentUser) return;

    console.log('🟡 useRealtimeContacts mounted');

    const handleAllUsers = users => {
      console.log('🟢 all_users received:', users.length);
      setContacts(users || []);
      setLoading(false);
    };

    const handleOnlineUsers = users => {
      console.log('🟢 online_users_update:', users.length);
      setOnlineUsers(users || []);
    };

    socketService.on('all_users', handleAllUsers);
    socketService.on('online_users_update', handleOnlineUsers);

    // 🔥 FORCE fetch even if socket already connected
    if (socketService.isConnected()) {
      console.log('🟢 socket already connected → fetching users');
      setLoading(true);
      socketService.emit('get_all_users');
    }

    return () => {
      console.log('🔴 useRealtimeContacts unmounted');
      socketService.off('all_users', handleAllUsers);
      socketService.off('online_users_update', handleOnlineUsers);
    };
  }, [currentUser]);

  useEffect(() => {
    if (socketService.isConnected()) {
      fetchAllUsers();
    }
  }, [fetchAllUsers]);

  // Fetch all users (contacts)
  const fetchAllUsers = useCallback(() => {
    if (socketService.isConnected()) {
      setLoading(true);
      socketService.emit('get_all_users');
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!currentUser) return;

    // Listen for all users
    const handleAllUsers = users => {
      console.log('Received users:', users?.length);
      setContacts(users || []);
      setLoading(false);
    };

    // Listen for online users updates
    const handleOnlineUsersUpdate = users => {
      // console.log('Online users:', users?.length);
      setOnlineUsers(users || []);

      // Update contacts status based on online users
      if (users?.length > 0) {
        const onlineUserIds = new Set(users.map(u => u.userId));
        setContacts(prev =>
          prev.map(contact => ({
            ...contact,
            status: onlineUserIds.has(contact._id) ? 'online' : 'offline',
          })),
        );
      }
    };

    // Listen for individual user status changes
    const handleUserStatusChange = ({ userId, status }) => {
      console.log('user status>>', userId, status);

      setContacts(prev =>
        prev.map(contact =>
          contact._id === userId ? { ...contact, status } : contact,
        ),
      );
    };

    // Register listeners
    socketService.on('all_users', handleAllUsers);
    socketService.on('online_users_update', handleOnlineUsersUpdate);
    socketService.on('user_status_changed', handleUserStatusChange);

    // Request users if already connected
    if (socketService.isConnected()) {
      socketService.emit('get_all_users');
    }

    // Cleanup
    return () => {
      socketService.off('all_users', handleAllUsers);
      socketService.off('online_users_update', handleOnlineUsersUpdate);
      socketService.off('user_status_changed', handleUserStatusChange);
    };
  }, [currentUser]);

  return {
    contacts,
    onlineUsers,
    loading,
    connectionStatus,
  };
};
