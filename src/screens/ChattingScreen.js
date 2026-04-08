import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import {
  GiftedChat,
  Bubble,
  InputToolbar,
  Send,
} from 'react-native-gifted-chat';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import socketService from '../socket';
import { useApp } from '../context/AppContext';

const ChatScreen = ({ route, navigation }) => {
  const { contactId, contactName } = route.params;
  const [messages, setMessages] = useState([]);
  const { currentUser } = useApp();

  socketService.on('receive_message', message => {
    console.log('Received message:', message);
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, message),
    );
  });

  useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: 'Hey 👋 How can I help you?',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Support',
          avatar: 'https://i.pravatar.cc/300?img=12',
        },
      },
    ]);
  }, []);

  const onSend = useCallback((newMessages = []) => {
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, newMessages),
    );

    // 🔌 Socket emit / API call here
    socketService.emit('send_message', {
      receiverId: contactId,
      senderId: currentUser?.id,
      message: newMessages[0].text,
      senderName: currentUser?.name,
      senderAvatar: currentUser?.avatar,
    });
  }, []);

  const renderBubble = props => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: styles.rightBubble,
        left: styles.leftBubble,
      }}
      textStyle={{
        right: styles.rightBubbleText,
        left: styles.leftBubbleText,
      }}
    />
  );

  const renderInputToolbar = props => (
    <InputToolbar
      {...props}
      containerStyle={styles.inputToolbar}
      primaryStyle={{ alignItems: 'center' }}
    />
  );

  const renderSend = props => (
    <Send {...props}>
      <TouchableOpacity style={styles.sendButton}>
        <Icon name="send" size={20} color="#fff" />
      </TouchableOpacity>
    </Send>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={currentUser}
        placeholder="Type a message..."
        alwaysShowSend
        scrollToBottom
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderSend={renderSend}
        textInputStyle={styles.textInput}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  /* Bubbles */
  rightBubble: {
    backgroundColor: '#4F46E5',
    padding: 6,
    borderRadius: 14,
  },
  leftBubble: {
    backgroundColor: '#E5E7EB',
    padding: 6,
    borderRadius: 14,
  },
  rightBubbleText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  leftBubbleText: {
    color: '#111827',
    fontSize: 15,
  },

  /* Input */
  inputToolbar: {
    marginHorizontal: 8,
    marginBottom: 6,
    borderRadius: 25,
    borderTopWidth: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  textInput: {
    fontSize: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },

  /* Send */
  sendButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    padding: 10,
    marginRight: 4,
    marginBottom: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;
