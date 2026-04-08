import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import socketService from '../socket';
import api from '../services/api';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState({});
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  // console.log('online>>', onlineUsers);
  // console.log('currentUser>>', currentUser);

  // Check for stored token on app start
  useEffect(() => {
    checkStoredToken();
  }, []);

  // Initialize socket when user logs in
  useEffect(() => {
    if (currentUser && token) {
      initializeSocket();
    }
  }, [currentUser, token]);

  useEffect(() => {
    socketService.on('typing:start', () => {
      setIsOtherUserTyping(true);
    });

    socketService.on('typing:stop', () => {
      setIsOtherUserTyping(false);
    });

    return () => {
      socketService.off('typing:start');
      socketService.off('typing:stop');
    };
  }, []);

  const checkStoredToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error checking stored token:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = () => {
    socketService.connect(token, currentUser.id);

    socketService.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    socketService.on('disconnect', () => {
      setIsConnected(false);
    });

    socketService.on('online_users_update', users => {
      const liveUsers = users.filter(u => u.userId !== currentUser.id);
      // console.log('Online users update:', users);
      setOnlineUsers(liveUsers);
    });

    // socketService.on('receive_message', message => {
    //   handleIncomingMessage(message);
    // });

    // socketService.on('message_delivered', ({ messageId }) => {
    //   updateMessageStatus(messageId, 'delivered');
    // });

    // socketService.on('message_read', ({ messageId }) => {
    //   updateMessageStatus(messageId, 'read');
    // });

    socketService.on('user_typing', ({ userId, isTyping }) => {
      // Handle typing indicator
      console.log(`${userId} is ${isTyping ? 'typing' : 'not typing'}`);
    });
  };

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      const { token, user } = response.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setCurrentUser(user);

      // Initialize socket connection immediately after login
      console.log('Login successful, connecting socket...');
      socketService.connect(token, user.id);

      return response;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.register(name, email, password);
      const { token, user } = response.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setCurrentUser(user);

      // Initialize socket connection immediately after registration
      console.log('Registration successful, connecting socket...');
      socketService.connect(token, user.id);

      return response;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      socketService.disconnect();
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setCurrentUser(null);
      setContacts([]);
      setConversations({});
      setOnlineUsers(new Set());
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // const handleIncomingMessage = message => {
  // console.log('Received message:', message);
  // setMessages(prev => [...prev, message]);
  // setConversations(prev => {
  //   const contactId =
  //     message.senderId === currentUser?.id
  //       ? message.receiverId
  //       : message.senderId;

  //   const contactMessages = prev[contactId] || [];

  //   // Check for duplicate messages
  //   const isDuplicate = contactMessages.some(m => m._id === message._id);
  //   if (isDuplicate) return prev;

  //   // Mark message as read if currently viewing that chat
  //   // This would need to be implemented based on your navigation state

  //   return {
  //     ...prev,
  //     [contactId]: [...contactMessages, message],
  //   };
  // });
  // };

  // const updateMessageStatus = (messageId, status) => {
  //   setConversations(prev => {
  //     const updated = { ...prev };
  //     Object.keys(updated).forEach(contactId => {
  //       updated[contactId] = updated[contactId].map(msg =>
  //         msg._id === messageId ? { ...msg, status } : msg,
  //       );
  //     });
  //     return updated;
  //   });
  // };

  // const sendMessage = async (contactId, message) => {
  //   if (!currentUser || !message?.text) return;

  //   const tempId = Date.now().toString();
  //   const newMessage = {
  //     _id: tempId,
  //     text: message.text,
  //     createdAt: new Date(),
  //     user: {
  //       _id: currentUser.id,
  //       name: currentUser.name,
  //       avatar: currentUser.avatar,
  //     },
  //     status: 'sending',
  //   };

  //   // Add to local state
  //   setConversations(prev => ({
  //     ...prev,
  //     [contactId]: [...(prev[contactId] || []), newMessage],
  //   }));

  //   // Send via socket
  //   socketService.emit('send_message', {
  //     receiverId: contactId,
  //     message: newMessage.text,
  //   });
  // };

  const getContactMessages = contactId => {
    const list = conversations[contactId] || [];
    return [...list].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  };

  // const updateContactStatus = useCallback((userId, status, lastSeen) => {
  //   setContacts(prev =>
  //     prev.map(contact =>
  //       contact._id === userId
  //         ? { ...contact, status, lastSeen: lastSeen || contact.lastSeen }
  //         : contact,
  //     ),
  //   );
  // }, []);

  const value = {
    currentUser,
    contacts,
    conversations,
    onlineUsers,
    isConnected,
    loading,
    login,
    register,
    logout,
    // sendMessage,
    getContactMessages,
    // updateContactStatus,
    messages,
    setMessages,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
