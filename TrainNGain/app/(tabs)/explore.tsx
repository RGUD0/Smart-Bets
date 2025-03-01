import React from 'react';
import { StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

// Mock friends data
const friends = [
  { id: '1', name: 'Alex Kim', username: '@alexkim', isFollowing: true },
  { id: '2', name: 'Taylor Swift', username: '@taylorswift', isFollowing: true },
  { id: '3', name: 'Morgan Lee', username: '@morganlee', isFollowing: false },
  { id: '4', name: 'Jordan Bell', username: '@jordanbell', isFollowing: true },
  { id: '5', name: 'Pat Johnson', username: '@patjohnson', isFollowing: true },
];

export default function FriendsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedView style={styles.headerContent}>
          <TouchableOpacity>
            <Image
              source={require('@/assets/images/partial-react-logo.png')}
              style={styles.profilePic}
            />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>Friends</ThemedText>
          <TouchableOpacity>
            <Ionicons name="search" size={24} color="#3D95CE" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Friend Suggestions Card */}
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Friend Suggestions</ThemedText>
        <ThemedText style={styles.subtitle}>Find people you may know</ThemedText>
        
        <ThemedView style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton}>
            <Ionicons name="person-add-outline" size={20} color="white" />
            <ThemedText style={styles.primaryButtonText}>Find Friends</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="share-social-outline" size={20} color="#3D95CE" />
            <ThemedText style={styles.secondaryButtonText}>Invite</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Friends List */}
      <ThemedView style={styles.listContainer}>
        <ThemedView style={styles.listHeader}>
          <ThemedText type="subtitle">Your Friends</ThemedText>
          <TouchableOpacity>
            <ThemedText style={styles.seeAllText}>See All</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ThemedView style={styles.friendItem}>
              <ThemedView style={styles.avatar}>
                <ThemedText style={styles.avatarText}>{item.name.charAt(0)}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.friendInfo}>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText style={styles.username}>{item.username}</ThemedText>
              </ThemedView>
              
              <TouchableOpacity 
                style={[
                  styles.followButton, 
                  item.isFollowing ? styles.followingButton : {}
                ]}
              >
                <ThemedText style={[
                  styles.followButtonText,
                  item.isFollowing ? styles.followingButtonText : {}
                ]}>
                  {item.isFollowing ? 'Following' : 'Follow'}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}
        />
      </ThemedView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="person-add" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#3D95CE',
    fontSize: 20,
  },
  profilePic: {
    height: 36,
    width: 36,
    borderRadius: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subtitle: {
    color: '#999999',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: '#3D95CE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#3D95CE',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#3D95CE',
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    color: '#3D95CE',
  },
  friendItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3D95CE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
  },
  friendInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    color: '#999999',
  },
  followButton: {
    backgroundColor: '#3D95CE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3D95CE',
  },
  followingButtonText: {
    color: '#3D95CE',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#3D95CE',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});