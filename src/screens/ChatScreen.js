import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  GiftedChat,
  Bubble,
  InputToolbar,
  Send,
} from 'react-native-gifted-chat';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../context/AppContext';
import socketService from '../socket';

const ChatScreen = ({ route, navigation }) => {
  const { contactId, contactName } = route.params;
  const {
    currentUser,
    getContactMessages,
    fetchChatHistory,
    messages,
    setMessages,
  } = useApp();
  // const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const typingTimeoutRef = useRef(null);
  const isMounted = useRef(true);

  // Get messages from context - use useRef to prevent re-renders
  const contactMessages = getContactMessages(contactId);

  // Load messages when component mounts - only once
  useEffect(() => {
    isMounted.current = true;

    const loadMessages = async () => {
      try {
        setLoading(true);
        // await fetchChatHistory(contactId);
      } catch (error) {
        console.error('Error loading messages:', error);
        if (isMounted.current) {
          Alert.alert('Error', 'Failed to load messages');
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    loadMessages();

    // Mark messages as read when opening chat
    markMessagesAsRead();

    // Join room for this conversation
    socketService.emit('join_room', `chat_${contactId}`);

    return () => {
      isMounted.current = false;
      // Clean up typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [contactId]); // Only depend on contactId

  // Update local messages when context messages change - with proper comparison
  useEffect(() => {
    if (isMounted.current) {
      // Only update if messages actually changed
      const messagesString = JSON.stringify(contactMessages);
      const currentMessagesString = JSON.stringify(messages);

      if (messagesString !== currentMessagesString) {
        setMessages(contactMessages);
      }
    }
  }, [contactMessages]); // Only depend on contactMessages

  // Socket event listeners - with stable references
  useEffect(() => {
    const handleReceiveMessage = message => {
      console.log('reveive messsage', message);

      if (!isMounted.current) return;

      // Only show messages for this conversation
      if (
        message.senderId === contactId ||
        message.senderId === currentUser?.id
      ) {
        setMessages(prevMessages => {
          // Check for duplicates
          const exists = prevMessages.some(m => m._id === message._id);
          if (exists) return prevMessages;
          return [message, ...prevMessages];
        });
      }
    };

    const handleTypingIndicator = ({ userId, isTyping: typing }) => {
      if (!isMounted.current) return;
      if (userId === contactId) {
        setIsTyping(typing);
      }
    };

    const handleMessageDelivered = ({ messageId }) => {
      if (!isMounted.current) return;
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg._id === messageId ? { ...msg, status: 'delivered' } : msg,
        ),
      );
    };

    const handleMessageRead = ({ messageId }) => {
      if (!isMounted.current) return;
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg._id === messageId ? { ...msg, status: 'read' } : msg,
        ),
      );
    };

    // Listen for incoming messages
    socketService.on('receive_message', handleReceiveMessage);

    // Listen for typing indicator
    socketService.on('user_typing', handleTypingIndicator);

    // Listen for message delivery status
    socketService.on('message_delivered', handleMessageDelivered);

    // Listen for message read status
    socketService.on('message_read', handleMessageRead);

    return () => {
      socketService.off('receive_message', handleReceiveMessage);
      socketService.off('user_typing', handleTypingIndicator);
      socketService.off('message_delivered', handleMessageDelivered);
      socketService.off('message_read', handleMessageRead);
    };
  }, [contactId, currentUser?.id]); // Add necessary dependencies

  const markMessagesAsRead = useCallback(() => {
    const unreadMessages = messages.filter(
      msg => msg.user._id !== currentUser?.id && msg.status !== 'read',
    );

    unreadMessages.forEach(msg => {
      socketService.emit('mark_read', {
        messageId: msg._id,
        senderId: msg.user._id,
      });
    });
  }, [messages, currentUser?.id]);

  const onSend = useCallback(
    (newMessages = []) => {
      if (!newMessages.length) return;

      const message = newMessages[0];

      // Emit typing stopped
      socketService.emit('typing', {
        receiverId: contactId,
        isTyping: false,
      });

      // Emit message
      socketService.emit('send_message', {
        receiverId: contactId,
        senderId: currentUser?.id,
        message: message.text,
      });
      setMessages(prev => GiftedChat.append(prev, message));
    },
    [contactId],
  );

  // const handleInputTextChanged = useCallback(
  //   text => {
  //     if (text.length > 0) {
  //       socketService.emit('typing', {
  //         receiverId: contactId,
  //         isTyping: true,
  //       });

  //       // Clear existing timeout
  //       if (typingTimeoutRef.current) {
  //         clearTimeout(typingTimeoutRef.current);
  //       }

  //       // Set new timeout to stop typing indicator
  //       typingTimeoutRef.current = setTimeout(() => {
  //         socketService.emit('typing', {
  //           receiverId: contactId,
  //           isTyping: false,
  //         });
  //       }, 2000);
  //     }
  //   },
  //   [contactId],
  // );

  let typingTimeout;

  const handleInputTextChanged = useCallback(text => {
    if (text.length > 0) {
      socketService.emit('typing:start', {
        roomId,
        userId,
      });

      if (typingTimeout) clearTimeout(typingTimeout);

      typingTimeout = setTimeout(() => {
        socketService.emit('typing:stop', {
          roomId,
          userId,
        });
      }, 1000); // stop typing after 1s of no input
    }
  });

  const renderBubble = props => {
    const { currentMessage } = props;
    console.log('props>>', props);

    const isOwnMessage = currentMessage.user._id === currentUser?.id;

    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: {
            backgroundColor: '#f0f0f0',
            borderRadius: 16,
            borderTopLeftRadius: 4,
            marginRight: 60,
          },
          right: {
            backgroundColor: '#007AFF',
            borderRadius: 16,
            borderTopRightRadius: 4,
            marginLeft: 60,
          },
        }}
        textStyle={{
          left: {
            color: '#000',
            fontSize: 16,
          },
          right: {
            color: '#fff',
            fontSize: 16,
          },
        }}
        timeTextStyle={{
          left: {
            color: '#666',
            fontSize: 12,
          },
          right: {
            color: 'rgba(255,255,255,0.7)',
            fontSize: 12,
          },
        }}
      />
    );
  };

  const renderSend = props => {
    return (
      <Send {...props} containerStyle={styles.sendContainer}>
        <View style={styles.sendButton}>
          <Icon name="send" size={24} color="#007AFF" />
        </View>
      </Send>
    );
  };

  const renderInputToolbar = props => {
    return (
      <InputToolbar
        {...props}
        containerStyle={styles.inputToolbar}
        primaryStyle={styles.inputPrimary}
      />
    );
  };

  const renderMessageStatus = props => {
    const { currentMessage } = props;

    if (currentMessage.user._id !== currentUser?.id) return null;

    let statusIcon = 'check';
    let statusColor = '#999';

    switch (currentMessage.status) {
      case 'delivered':
        statusIcon = 'done-all';
        statusColor = '#999';
        break;
      case 'read':
        statusIcon = 'done-all';
        statusColor = '#007AFF';
        break;
      default:
        statusIcon = 'check';
        statusColor = '#999';
    }

    return (
      <View style={styles.statusContainer}>
        <Icon name={statusIcon} size={16} color={statusColor} />
      </View>
    );
  };

  const renderFooter = () => {
    if (isTyping) {
      return (
        <View style={styles.typingContainer}>
          <View style={styles.typingBubble}>
            <Text style={styles.typingText}>{contactName} is typing...</Text>
          </View>
        </View>
      );
    }
    return null;
  };

  const renderLoading = () => {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  };

  if (loading && messages.length === 0) {
    return renderLoading();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <GiftedChat
        messages={messages}
        onSend={onSend}
        onInputTextChanged={handleInputTextChanged}
        user={{
          _id: currentUser?.id,
          name: currentUser?.name,
          avatar: currentUser?.avatar,
        }}
        renderBubble={renderBubble}
        renderSend={renderSend}
        renderInputToolbar={renderInputToolbar}
        renderFooter={renderFooter}
        renderAvatar={null}
        alwaysShowSend
        scrollToBottom
        scrollToBottomComponent={() => (
          <Icon name="keyboard-arrow-down" size={24} color="#007AFF" />
        )}
        renderLoading={renderLoading}
        minInputToolbarHeight={50}
        keyboardShouldPersistTaps="never"
        messagesContainerStyle={styles.messagesContainer}
        timeFormat="HH:mm"
        dateFormat="DD/MM/YYYY"
        renderMessageStatus={renderMessageStatus}
        showUserAvatar={false}
        showAvatarForEveryMessage={false}
        maxComposerHeight={100}
        textInputProps={{
          autoCorrect: true,
          autoCapitalize: 'sentences',
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesContainer: {
    backgroundColor: '#fff',
  },
  inputToolbar: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inputPrimary: {
    alignItems: 'center',
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 5,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 5,
    marginBottom: 2,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  typingBubble: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    maxWidth: '60%',
  },
  typingText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default ChatScreen;
