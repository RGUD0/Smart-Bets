import React, { useEffect, useState } from 'react';
import { View, Picker, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from './AuthContext';

const FriendSelector = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState('');
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

  return (
    <View>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Picker
          selectedValue={selectedFriend}
          onValueChange={(itemValue) => setSelectedFriend(itemValue)}
        >
          <Picker.Item label="Select a friend" value="" />
          {friends.map((friend) => (
            <Picker.Item
              key={`${friend.id}`}  // <-- Unique key
              label={`${friend.name}  (ID: ${friend.id})`}
              value={`${friend.name}  (ID: ${friend.id})`}
            />
          ))}
        </Picker>
      )}
    </View>
  );
};

export default FriendSelector;
