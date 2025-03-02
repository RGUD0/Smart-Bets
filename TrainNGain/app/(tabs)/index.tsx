import { Image, StyleSheet, Platform, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../AuthContext'; // <-- Adjust this import path if needed

// transaction data
const transactions = [
  { id: '1', user: 'Alex Kim', action: 'promised', target: 'You', amount: '10 points', description: 'Completing Seattle 5k', time: '2h ago' },
  { id: '2', user: 'You', action: 'promised', target: 'Taylor Swift', amount: '5 points', description: 'Finishing homework by Thursday 12am', time: '5h ago' },
  { id: '3', user: 'Morgan Lee', action: 'fulfilled promise to', target: 'Gerald', amount: '+12 points', description: 'Morning run', time: '1d ago' },
  { id: '4', user: 'Jordan Bell', action: 'has a timed-out promise to', target: 'You', amount: '-20 points', description: 'Mile Run', time: '2d ago' },
  { id: '5', user: 'You', action: 'have a timed-out promise to', target: 'Morgan Lee', amount: '-15 points', description: 'Doing stats homework', time: '3d ago' },
  { id: '6', user: 'Riley Chen', action: 'promised', target: 'You', amount: '5 points', description: 'Morning yoga', time: '4d ago' },
  { id: '7', user: 'You', action: 'promised', target: 'Sam Adams', amount: '10 points', description: 'Going to career fair', time: '5d ago' },
];

// Transaction Item Component
const TransactionItem = ({ item }) => (
  <ThemedView style={styles.transactionItem}>
    <ThemedView style={styles.avatarContainer}>
      <ThemedText style={styles.avatarText}>{item.user.charAt(0)}</ThemedText>
    </ThemedView>
    <ThemedView style={styles.transactionContent}>
      <ThemedView style={styles.transactionHeader}>
        <ThemedText type="defaultSemiBold">
          {item.user} {item.action} {item.target}
        </ThemedText>
        <ThemedText style={styles.timeText}>{item.time}</ThemedText>
      </ThemedView>
      <ThemedText>{item.description}</ThemedText>
    </ThemedView>
    <ThemedText style={styles.amountText}>{item.amount}</ThemedText>
  </ThemedView>
);

export default function HomeScreen() {
  const { authFetch } = useAuth(); // <-- Access authFetch from context
  const [balance, setBalance] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        // Use authFetch with a relative path so it includes the Authorization header
        const data = await authFetch('/api/balance');

        console.log('Fetched balance:', data);
        if (data && typeof data.balance === 'number') {
          setBalance(data.balance);
        } else {
          console.error('Invalid balance format:', data);
          setBalance(null);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [authFetch]);

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
          <ThemedText type="title" style={styles.headerTitle}>Venmo</ThemedText>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="#3D95CE" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Balance Card */}
      <ThemedView style={styles.balanceCard}>
        <ThemedText type="defaultSemiBold">Your Balance</ThemedText>
        {loading ? (
          <ActivityIndicator size="small" color="#3D95CE" />
        ) : (
          <ThemedText type="title">{balance ? `${balance} points` : 'N/A'}</ThemedText>
        )}
      </ThemedView>

      {/* Transactions Feed */}
      <ThemedView style={styles.transactionsContainer}>
        <ThemedView style={styles.transactionsHeader}>
          <ThemedText type="subtitle">Recent Activity</ThemedText>
          <TouchableOpacity>
            <ThemedText style={styles.seeAllText}>See All</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <FlatList
          data={transactions}
          renderItem={({ item }) => <TransactionItem item={item} />}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.transactionsList}
        />
      </ThemedView>

      {/* Floating Action Button with Plus Sign */}
      <TouchableOpacity style={styles.floatingActionButton}>
        <ThemedText style={styles.plusButton}>+</ThemedText>
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
  balanceCard: {
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
  transactionsContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  transactionsList: {
    paddingBottom: 80, // Give space for the floating action button
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    color: '#3D95CE',
  },
  transactionItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: 'center',
  },
  avatarContainer: {
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
  transactionContent: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#999999',
  },
  amountText: {
    fontWeight: '600',
  },
  floatingActionButton: {
    position: 'absolute',
    left: '50%',
    bottom: 24,
    backgroundColor: '#3D95CE',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -28, // Centers the button horizontally
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  plusButton: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
