import React, { useState, useEffect } from 'react';
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import { useAuth } from '../AuthContext';

const FriendsScreen = () => {
  const [friends, setFriends] = useState([]);
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { authFetch } = useAuth(); // <-- Access authFetch from context
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const data = await authFetch('/api/friends');
        if (data && data.friends) {
          setFriends(data.friends);
        } else {
          Alert.alert('Error', 'Failed to fetch friends');
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
        Alert.alert('Error', 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, []);

  if (loading) {
    return <Text>Loading...</Text>;
  }
  

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
    backgroundColor: '#28A745',  // Green color here
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
  // Update the icon colors for favorite and remove button
  addButtonIcon: {
    color: 'white',
  },
});

export default FriendsScreen;

