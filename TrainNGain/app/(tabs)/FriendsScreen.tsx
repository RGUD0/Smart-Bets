import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock data for friends and their activities
const mockFriends = [
  {
    id: '1',
    name: 'Alex Kim',
    status: '🏃 Just went for a run',
    avatar: 'https://placekitten.com/100/100', // Replace with actual image URL
    isFavorite: false,
  },
  {
    id: '2',
    name: 'Morgan Lee',
    status: '📚 Reading a new book',
    avatar: 'https://placekitten.com/101/101', // Replace with actual image URL
    isFavorite: false,
  },
  {
    id: '3',
    name: 'Jordan Bell',
    status: '🧹 Cleaning the apartment',
    avatar: 'https://placekitten.com/102/102', // Replace with actual image URL
    isFavorite: false,
  },
];

const FriendsScreen = () => {
  const [friends, setFriends] = useState(mockFriends);
  const [searchQuery, setSearchQuery] = useState('');

  // Function to add a new friend (mock implementation)
  const addFriend = () => {
    if (searchQuery.trim() === '') return;

    const newFriend = {
      id: String(friends.length + 1),
      name: searchQuery,
      status: '🆕 New friend',
      avatar: 'https://placekitten.com/103/103', // Replace with actual image URL
      isFavorite: false,
    };

    setFriends([...friends, newFriend]);
    setSearchQuery('');
  };

  // Function to remove a friend
  const removeFriend = (id) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setFriends(friends.filter((friend) => friend.id !== id));
          },
        },
      ],
    );
  };

  // Function to toggle a friend as favorite
  const toggleFavorite = (id) => {
    setFriends(
      friends.map((friend) =>
        friend.id === id ? { ...friend, isFavorite: !friend.isFavorite } : friend,
      ),
    );
  };

  // Sort friends so favorites appear at the top
  const sortedFriends = [...friends].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));

  return (
    <View style={styles.container}>
      {/* Search Bar to Add New Friends */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for friends..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.addButton} onPress={addFriend}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Friends List */}
      <FlatList
        data={sortedFriends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.friendItem}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{item.name}</Text>
              <Text style={styles.friendStatus}>{item.status}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
              <Ionicons
                name={item.isFavorite ? 'star' : 'star-outline'}
                size={24}
                color={item.isFavorite ? '#FFD700' : '#888888'}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeFriend(item.id)}>
              <Ionicons name="trash-outline" size={24} color="#FF4444" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  addButton: {
    backgroundColor: '#3D95CE',
    borderRadius: 8,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  friendStatus: {
    fontSize: 14,
    color: '#888888',
  },
});

export default FriendsScreen;