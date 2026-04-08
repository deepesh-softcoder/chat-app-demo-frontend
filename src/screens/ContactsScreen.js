import React, { useState, useEffect } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../context/AppContext';
import socketService from '../socket';

const ContactsScreen = ({ navigation }) => {
  const { currentUser, isConnected, onlineUsers } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Refresh logic will be handled by the hook
    setTimeout(() => setRefreshing(false), 1000);
  };

  useEffect(() => {
    onRefresh();
  }, []);

  const renderContact = ({ item }) => {
    const isOnline = item.status === 'online';

    return (
      <TouchableOpacity
        style={styles.contactRow}
        onPress={() =>
          navigation.navigate('Chat', {
            contactId: item.userId,
            contactName: item.name,
            contactAvatar: item.avatar,
            contactStatus: isOnline ? 'online' : 'offline',
          })
        }
      >
        <View style={styles.avatarWrap}>
          <Image
            source={{
              uri:
                item.avatar ||
                `https://ui-avatars.com/api/?name=${item.name}&background=random`,
            }}
            style={styles.avatar}
          />
          {isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          {/* {item.email && <Text style={styles.contactEmail}>{item.email}</Text>} */}
        </View>

        {isOnline && (
          <View style={styles.onlineBadge}>
            <Text style={styles.onlineBadgeText}>Online</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.userName}>{currentUser?.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Image
            source={{ uri: currentUser?.avatar }}
            style={styles.profileAvatar}
          />
        </TouchableOpacity>
      </View>

      {/* Connection Status */}
      {!socketService.isConnected() && (
        <View style={styles.connectionStatus}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.connectionText}>
            {!socketService.isConnected() ? 'Connecting...' : 'Reconnecting...'}
          </Text>
        </View>
      )}

      {/* Online Users Count */}
      {onlineUsers.length > 0 && (
        <View style={styles.onlineCount}>
          <Icon name="fiber-manual-record" size={12} color="#22c55e" />
          <Text style={styles.onlineCountText}>
            {onlineUsers.length} user{onlineUsers.length > 1 ? 's' : ''} online
          </Text>
        </View>
      )}

      {/* Contacts List */}
      {onlineUsers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="people-outline" size={70} color="#cbd5e1" />
          <Text style={styles.emptyText}>No Users found</Text>
          <Text style={styles.emptySubtext}>
            Other users will appear here when they register
          </Text>
        </View>
      ) : (
        <FlatList
          data={onlineUsers}
          keyExtractor={item => item.userId}
          renderItem={renderContact}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  welcomeText: {
    fontSize: 14,
    color: '#64748b',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  connectionText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#64748b',
  },
  onlineCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  onlineCountText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
    color: '#22c55e',
  },
  listContent: {
    padding: 12,
  },
  contactRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  contactEmail: {
    fontSize: 13,
    color: '#64748b',
  },
  onlineBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ContactsScreen;
