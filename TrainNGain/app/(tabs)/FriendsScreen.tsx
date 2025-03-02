import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import Svg, { Rect, TSpan, Text as SvgText } from 'react-native-svg';

const FriendsScreen = () => {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { authFetch } = useAuth();

  // Hardcoded leaderboard data
  const leaderboardData = [
    { id: '1', name: 'coffeeguy64', score: 80 },
    { id: '2', name: 'udhacks25', score: 120 },
    { id: '3', name: 'MorganLee', score: 90 },
    { id: '4', name: 'cowhen12', score: 110 },
    { id: '5', name: 'mousekeyboard', score: 110 },
    { id: '6', name: 'You!', score: 50 },
  ];

  const renderBarChart = (data) => {
    const maxScore = Math.max(...data.map(item => item.score));
    const chartHeight = 200;
    const barWidth = 40;
    const spacing = 50; 
    const svgWidth = data.length * (barWidth + spacing);
    const svgHeight = chartHeight + 80; // More height to prevent cutoff
  
    return (
      <View style={[styles.chartContainer, { overflow: 'visible'}]}>
        <Svg height={svgHeight} width={svgWidth}>
          {data.map((item, index) => {
            const barHeight = (item.score / maxScore) * chartHeight;
            return (
              <React.Fragment key={item.id}>
                {/* Bars */}
                <Rect
                  x={index * (barWidth + spacing) + spacing / 2}
                  y={chartHeight - barHeight}
                  width={barWidth}
                  height={barHeight}
                  fill="#28A745"
                />
                {/* Labels */}
                <SvgText
  x={index * (barWidth + spacing) + spacing / 2 + barWidth / 2}
  y={chartHeight + 60} 
  fontSize="12"
  fill="black"
  textAnchor="middle"
>
  <TSpan>{item.name}</TSpan>
</SvgText>


              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    );
  };
  

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
      }
    };

    fetchFriends();
  }, []);

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Friends View</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#388E3C" /> {/* Green settings icon */}
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekly Leaderboard */}
      <Text style={styles.leaderboardTitle}>Weekly Leaderboard</Text>
      {renderBarChart(leaderboardData)}

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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9', // Light green border
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#388E3C', // Dark green title
    fontSize: 20,
  },
  leaderboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Center the labels
    marginTop: 5,
  },
  label: {
    fontSize: 12,
    color: '#333',
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
    backgroundColor: '#28A745',
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