import { Image, StyleSheet, Platform, TouchableOpacity, FlatList, Modal, View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../AuthContext';

// Define the wager type
interface Wager {
  wager_id: string;
  creator_id: string;
  creator_username?: string;
  receiver_id: string;
  receiver_username?: string;
  wager_description: string;
  wager_amount: number;
  expiration_time: string;
  save_time: string;
  status: string;
}

// Wager Item Component
const WagerItem = ({ item, currentUserId }: { item: Wager; currentUserId: string }) => {
  // Calculate relative time (e.g., "2h ago")
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const pastDate = new Date(dateString);
    const timeDiff = now.getTime() - pastDate.getTime();
    
    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };
  
  // Determine if user is creator or receiver
  const isCreator = item.creator_id === currentUserId;
  const otherParty = isCreator ? 'You wagered with' : 'Wagered with you by';
  
  // Use username if available, otherwise fallback to ID
  const otherPartyName = isCreator 
    ? (item.receiver_username || item.receiver_id) 
    : (item.creator_username || item.creator_id);
  
  return (
    <ThemedView style={styles.wagerItem}>
      <ThemedView style={styles.avatarContainer}>
        <ThemedText style={styles.avatarText}>{otherPartyName.charAt(0).toUpperCase()}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.wagerContent}>
        <ThemedView style={styles.wagerHeader}>
          <ThemedText type="defaultSemiBold">
            {otherParty} {otherPartyName}
          </ThemedText>
          <ThemedText style={styles.timeText}>{getRelativeTime(item.save_time)}</ThemedText>
        </ThemedView>
        <ThemedText>{item.wager_description}</ThemedText>
        <ThemedText style={styles.statusText}>Status: {item.status}</ThemedText>
      </ThemedView>
      <ThemedText style={styles.amountText}>{item.wager_amount} points</ThemedText>
    </ThemedView>
  );
};

export default function HomeScreen() {
  const { authFetch, user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [pendingWagers, setPendingWagers] = useState<Wager[]>([]);
  const [loading, setLoading] = useState(true);
  const [wagersLoading, setWagersLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [wagerDetails, setWagerDetails] = useState({
    receiverId: "",
    description: "",
    amount: "",
    expirationTime: ""
  });

  // Fetch user balance
  useEffect(() => {
    fetchBalance();
  }, []);

  // Fetch pending wagers
  useEffect(() => {
    fetchPendingWagers();
  }, []);

  // Function to fetch balance
  const fetchBalance = async () => {
    try {
      const data = await authFetch('/api/balance');
      console.log('Fetched balance:', data);
      if (data && typeof data.balance === 'number') {
        setBalance(data.balance);
      } else {
        setBalance(null);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch pending wagers
  const fetchPendingWagers = async () => {
    try {
      setWagersLoading(true);
      const data = await authFetch('/api/wagers/pending');
      console.log('Fetched pending wagers:', data);
      if (data && Array.isArray(data.wagers)) {
        setPendingWagers(data.wagers);
      } else {
        // Ensure we have an empty array if no wagers are returned
        setPendingWagers([]);
      }
    } catch (error) {
      console.error('Error fetching pending wagers:', error);
      // Set empty array on error to avoid loading state
      setPendingWagers([]);
    } finally {
      setWagersLoading(false);
    }
  };

  // Handle creating a new wager
  const handleCreateWager = async () => {
    if (!wagerDetails.receiverId || !wagerDetails.description || !wagerDetails.amount) {
      console.error('Please fill all required fields');
      return;
    }

    try {
      const amount = parseInt(wagerDetails.amount);
      if (isNaN(amount) || amount <= 0) {
        console.error('Please enter a valid amount');
        return;
      }

      // Set default expiration time to 7 days from now if not provided
      const expirationTime = wagerDetails.expirationTime || 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substr(0, 19);

      const response = await authFetch('/api/wagers/create', {
        method: 'POST',
        body: JSON.stringify({
          receiver_id: wagerDetails.receiverId,
          wager_description: wagerDetails.description,
          wager_amount: amount,
          expiration_time: expirationTime
        })
      });

      console.log('Wager created:', response);
      
      // Reset form and close modal
      setWagerDetails({
        receiverId: "",
        description: "",
        amount: "",
        expirationTime: ""
      });
      setModalVisible(false);
      
      // Refresh wagers and balance
      fetchPendingWagers();
      fetchBalance();
    } catch (error) {
      console.error('Error creating wager:', error);
    }
  };

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
          <ThemedText type="title" style={styles.headerTitle}>BetBuddy</ThemedText>
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
          <ThemedText type="title">{balance !== null ? `${balance} points` : 'N/A'}</ThemedText>
        )}
      </ThemedView>

      {/* Pending Wagers */}
      <ThemedView style={styles.wagersContainer}>
        <ThemedView style={styles.wagersHeader}>
          <ThemedText type="subtitle">Pending Wagers</ThemedText>
          <TouchableOpacity>
            <ThemedText style={styles.seeAllText}>See All</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {wagersLoading ? (
          <ActivityIndicator size="large" color="#3D95CE" style={styles.loadingIndicator} />
        ) : (
          <>
            {pendingWagers.length > 0 ? (
              <FlatList
                data={pendingWagers}
                renderItem={({ item }) => <WagerItem item={item} currentUserId={user?.id || ''} />}
                keyExtractor={(item) => item.wager_id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.wagersList}
              />
            ) : (
              <ThemedView style={styles.noWagersContainer}>
                <ThemedText style={styles.noWagersText}>No pending wagers</ThemedText>
              </ThemedView>
            )}
          </>
        )}
      </ThemedView>

      {/* Floating Action Button with Plus Sign */}
      <TouchableOpacity
        style={styles.floatingActionButton}
        onPress={() => setModalVisible(true)}
      >
        <ThemedText style={styles.plusButton}>+</ThemedText>
      </TouchableOpacity>

      {/* Create Wager Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Create New Wager</ThemedText>
            
            <ThemedText>Receiver ID</ThemedText>
            <TextInput
              style={styles.textInput}
              placeholder="User ID of receiver"
              value={wagerDetails.receiverId}
              onChangeText={(text) => setWagerDetails({...wagerDetails, receiverId: text})}
            />
            
            <ThemedText>Description</ThemedText>
            <TextInput
              style={styles.textInput}
              placeholder="What's the wager about?"
              value={wagerDetails.description}
              onChangeText={(text) => setWagerDetails({...wagerDetails, description: text})}
            />
            
            <ThemedText>Amount (points)</ThemedText>
            <TextInput
              style={styles.textInput}
              placeholder="Amount to wager"
              keyboardType="numeric"
              value={wagerDetails.amount}
              onChangeText={(text) => setWagerDetails({...wagerDetails, amount: text})}
            />
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateWager}
            >
              <ThemedText style={styles.submitButtonText}>Create Wager</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <ThemedText style={styles.closeButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  wagersContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  wagersList: {
    paddingBottom: 80,
  },
  wagersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    color: '#3D95CE',
  },
  wagerItem: {
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
  wagerContent: {
    flex: 1,
  },
  wagerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#999999',
  },
  statusText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666666',
  },
  amountText: {
    fontWeight: '600',
  },
  floatingActionButton: {
    position: 'absolute',
    left: '50%',
    bottom: 24,
    width: 60,
    height: 60,
    backgroundColor: '#3D95CE',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -30 }],
  },
  plusButton: {
    fontSize: 36,
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textInput: {
    height: 40,
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingLeft: 10,
  },
  submitButton: {
    backgroundColor: '#3D95CE',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    backgroundColor: '#CCCCCC',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  loadingIndicator: {
    marginTop: 40,
  },
  noWagersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  noWagersText: {
    color: '#999999',
    fontSize: 16,
  },
});