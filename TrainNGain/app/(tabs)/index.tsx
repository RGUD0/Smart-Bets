import { Image, StyleSheet, Platform, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Mock transaction data
const transactions = [
  { id: '1', user: 'Alex Kim', action: 'paid', target: 'You', amount: '$25.00', description: '🍕 Pizza night', time: '2h ago' },
  { id: '2', user: 'You', action: 'paid', target: 'Taylor Swift', amount: '$12.50', description: '🎸 Concert tickets', time: '5h ago' },
  { id: '3', user: 'Morgan Lee', action: 'charged', target: 'You', amount: '$8.75', description: '☕️ Coffee run', time: '1d ago' },
  { id: '4', user: 'Jordan Bell', action: 'paid', target: 'You', amount: '$45.00', description: '🏠 Utilities', time: '2d ago' },
  { id: '5', user: 'You', action: 'charged', target: 'Pat Johnson', amount: '$15.30', description: '🚕 Uber', time: '3d ago' },
  { id: '6', user: 'Riley Chen', action: 'paid', target: 'You', amount: '$32.80', description: '🍔 Dinner', time: '4d ago' },
  { id: '7', user: 'You', action: 'paid', target: 'Sam Adams', amount: '$18.50', description: '🎬 Movie tickets', time: '5d ago' },
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
        <ThemedText type="title">$248.65</ThemedText>
        <ThemedView style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="arrow-up-outline" size={20} color="white" />
            <ThemedText style={styles.actionButtonText}>Pay</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="arrow-down-outline" size={20} color="white" />
            <ThemedText style={styles.actionButtonText}>Request</ThemedText>
          </TouchableOpacity>
        </ThemedView>
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
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.transactionsList}
        />
      </ThemedView>
      
      {/* Floating Action Button */}
      <TouchableOpacity style={styles.floatingActionButton}>
        <Ionicons name="scan-outline" size={28} color="white" />
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
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: '#3D95CE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 24,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  transactionsContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  transactionsList: {
    paddingBottom: 80, // Give space for floating action button
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