import { Image, StyleSheet, Platform, TouchableOpacity, FlatList, Modal, View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../AuthContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

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
const WagerItem = ({ 
  item, 
  currentUserId, 
  onResolve 
}: { 
  item: Wager; 
  currentUserId: string;
  onResolve: (wager: Wager) => void;
}) => {
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
  
  // Determine if the user can resolve this wager (only creators can resolve)
  // Show Choose Winner button for both 'pending' and 'approval' status
  const canResolve = isCreator && (item.status === 'approval' || item.status === 'pending');
  
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
        
        {/* Choose Winner Button - Show for creator and resolvable statuses */}
        {canResolve && (
          <TouchableOpacity 
            style={styles.chooseWinnerButton}
            onPress={() => onResolve(item)}
          >
            <ThemedText style={styles.chooseWinnerText}>Choose Winner</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
      <ThemedText style={styles.amountText}>{item.wager_amount} points</ThemedText>
    </ThemedView>
  );
};

// Incoming Wager Notification Item Component
const IncomingWagerItem = ({ 
  item, 
  onAccept, 
  onReject 
}: { 
  item: Wager; 
  onAccept: (wagerId: string) => void; 
  onReject: (wagerId: string) => void;
}) => {
  // Calculate relative time
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

  return (
    <ThemedView style={styles.notificationItem}>
      <ThemedText>{`${item.creator_username || item.creator_id} promised you ${item.wager_amount} points for: ${item.wager_description}`}</ThemedText>
      <ThemedText style={styles.timeText}>{getRelativeTime(item.save_time)}</ThemedText>
      
      {/* Action Buttons */}
      <ThemedView style={styles.notificationActions}>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => onAccept(item.wager_id)}
        >
          <ThemedText style={styles.actionButtonText}>Accept</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.rejectButton}
          onPress={() => onReject(item.wager_id)}
        >
          <ThemedText style={styles.actionButtonText}>Reject</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
};

export default function HomeScreen() {
  const { authFetch, user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [pendingWagers, setPendingWagers] = useState<Wager[]>([]);
  const [incomingWagers, setIncomingWagers] = useState<Wager[]>([]);
  const [loading, setLoading] = useState(true);
  const [wagersLoading, setWagersLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [wagerDetails, setWagerDetails] = useState({
    receiverId: "",
    description: "",
    amount: "",
    expirationTime: ""
  });
  
  // Date and time state
  const [expirationDate, setExpirationDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  // Winner selection modal state
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [selectedWager, setSelectedWager] = useState<Wager | null>(null);
  // Add a loading state for wager resolution
  const [resolvingWager, setResolvingWager] = useState(false);

  // Format the date and time for display
  const formattedDate = expirationDate.toLocaleDateString();
  const formattedTime = expirationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Format date for API whenever it changes
  useEffect(() => {
    const formattedForApi = expirationDate.toISOString().replace('T', ' ').substring(0, 19);
    setWagerDetails({...wagerDetails, expirationTime: formattedForApi});
  }, [expirationDate]);

  // Native platforms date/time change handler
  const handleDateTimeChange = (
    event: DateTimePickerEvent,
    selectedValue: Date | undefined
  ) => {
    // Hide the picker when Android selects (iOS will keep it open)
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedValue) {
      const newDateTime = new Date(expirationDate); // Start with current date/time
      
      if (pickerMode === 'date') {
        // Update only date parts, preserve time
        newDateTime.setFullYear(selectedValue.getFullYear());
        newDateTime.setMonth(selectedValue.getMonth());
        newDateTime.setDate(selectedValue.getDate());
      } else {
        // Update only time parts, preserve date
        newDateTime.setHours(selectedValue.getHours());
        newDateTime.setMinutes(selectedValue.getMinutes());
      }
      
      // Update the state with the new date/time
      setExpirationDate(newDateTime);
    }
    
    // On iOS, we need to manually close the picker when in time mode
    // Date mode has a "Done" button built-in
    if (Platform.OS === 'ios' && pickerMode === 'time') {
      setShowPicker(false);
    }
  };

  // Web platform handlers
  const handleWebDateChange = (e: any) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      // Preserve the current time when changing the date
      newDate.setHours(expirationDate.getHours());
      newDate.setMinutes(expirationDate.getMinutes());
      setExpirationDate(newDate);
    }
  };

  const handleWebTimeChange = (e: any) => {
    if (e.target.value) {
      const [hours, minutes] = e.target.value.split(':').map((num: string) => parseInt(num));
      const newDate = new Date(expirationDate);
      newDate.setHours(hours || 0);
      newDate.setMinutes(minutes || 0);
      setExpirationDate(newDate);
    }
  };

  // Fetch user balance
  useEffect(() => {
    fetchBalance();
  }, []);

  // Fetch pending wagers
  useEffect(() => {
    fetchPendingWagers();
  }, []);

  // Fetch incoming wagers for notifications
  const fetchIncomingWagers = async () => {
    try {
      setNotificationsLoading(true);
      const data = await authFetch('/api/wagers/incoming');
      console.log('Fetched incoming wagers for notifications:', data);
      if (data && Array.isArray(data.wagers)) {
        setIncomingWagers(data.wagers);
      } else {
        // Ensure we have an empty array if no wagers are returned
        setIncomingWagers([]);
      }
    } catch (error) {
      console.error('Error fetching incoming wagers:', error);
      // Set empty array on error to avoid loading state
      setIncomingWagers([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Fetch incoming wagers when notification modal opens
  useEffect(() => {
    if (notificationsModalVisible) {
      fetchIncomingWagers();
    }
  }, [notificationsModalVisible]);

  useEffect(() => {
    fetchIncomingWagers();
  }, []);

  // Handler functions for wagers
  const handleAcceptWager = async (wagerId: string) => {
    try {
      // Display a loading indicator or disable buttons while processing
      setNotificationsLoading(true);
      
      const response = await authFetch('/api/wagers/respond', {
        method: 'PUT',
        body: JSON.stringify({
          wager_id: wagerId,
          action: 'accept'
        })
      });
      
      console.log('Wager accepted:', response);
      
      // Refresh wagers and balance
      await fetchIncomingWagers();
      await fetchPendingWagers();
      await fetchBalance();
    } catch (error) {
      console.error('Error accepting wager:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleRejectWager = async (wagerId: string) => {
    try {
      // Display a loading indicator or disable buttons while processing
      setNotificationsLoading(true);
      
      const response = await authFetch('/api/wagers/respond', {
        method: 'PUT',
        body: JSON.stringify({
          wager_id: wagerId,
          action: 'reject'
        })
      });
      
      console.log('Wager rejected:', response);
      
      // Refresh wagers and balance
      await fetchIncomingWagers();
      await fetchPendingWagers();
      await fetchBalance();
    } catch (error) {
      console.error('Error rejecting wager:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Updated handleResolveWager function with better error handling
  const handleResolveWager = async (wagerId: string, winnerId: string) => {
    try {
      setResolvingWager(true); // Set loading state
      console.log(`Resolving wager ${wagerId} with winner ${winnerId}`);
      
      const response = await authFetch('/api/wagers/resolve', {
        method: 'PUT',
        body: JSON.stringify({
          wager_id: wagerId,
          winner_id: winnerId
        })
      });
      
      console.log('Wager resolved successfully:', response);
      
      // Refresh wagers and balance
      await fetchPendingWagers();
      await fetchIncomingWagers();
      await fetchBalance();
      
      // Alert success if needed
      // alert('Wager resolved successfully!');
      
      // Close the resolve modal
      setResolveModalVisible(false);
      setSelectedWager(null);
    } catch (error: any) {
      console.error('Error resolving wager:', error);
      
      // Show error message to user
      alert(`Failed to resolve wager: ${error.message || 'Unknown error'}`);
    } finally {
      setResolvingWager(false); // Clear loading state
    }
  };

  // Function to open the resolve modal
  const openResolveModal = (wager: Wager) => {
    console.log('Opening resolve modal for wager:', wager);
    setSelectedWager(wager);
    setResolveModalVisible(true);
  };

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
              source={require('@/assets/images/cuteplant.png')}
              style={styles.profilePic}
            />
          </TouchableOpacity>
          <ThemedView style={styles.headerTitleContainer}>
            <ThemedText type="title" style={styles.headerTitle}>Pinky Promises</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Growing healthy habits with friends!</ThemedText>
          </ThemedView>
          <TouchableOpacity onPress={() => setNotificationsModalVisible(true)}>
            <Ionicons name="notifications-outline" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Balance Card */}
      <ThemedView style={styles.balanceCard}>
        <ThemedText type="defaultSemiBold">Your Balance</ThemedText>
        {loading ? (
          <ActivityIndicator size="small" color="#4CAF50" />
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
          <ActivityIndicator size="large" color="#4CAF50" style={styles.loadingIndicator} />
        ) : (
          <>
            {pendingWagers.length > 0 ? (
              <FlatList
                data={pendingWagers}
                renderItem={({ item }) => (
                  <WagerItem 
                    item={item} 
                    currentUserId={user?.id || ''} 
                    onResolve={openResolveModal}
                  />
                )}
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
            <ThemedText style={styles.modalTitle}>Create New Promise</ThemedText>
            
            <ThemedText>Friend ID</ThemedText>
            <TextInput
              style={styles.textInput}
              placeholder="User ID of friend"
              value={wagerDetails.receiverId}
              onChangeText={(text) => setWagerDetails({...wagerDetails, receiverId: text})}
            />
            
            <ThemedText>Description</ThemedText>
            <TextInput
              style={styles.textInput}
              placeholder="What's the promise about?"
              value={wagerDetails.description}
              onChangeText={(text) => setWagerDetails({...wagerDetails, description: text})}
              multiline
            />
            
            <ThemedText>Amount (points)</ThemedText>
            <TextInput
              style={styles.textInput}
              placeholder="Amount to wager"
              keyboardType="numeric"
              value={wagerDetails.amount}
              onChangeText={(text) => setWagerDetails({...wagerDetails, amount: text})}
            />
            
            {/* Date and Time Picker - Web Compatible Version */}
            <ThemedText>Expiration Date</ThemedText>
            {Platform.OS === 'web' ? (
              // Web-specific date input
              <View style={styles.dateInput}>
                <input
                  type="date"
                  value={expirationDate.toISOString().split('T')[0]}
                  onChange={handleWebDateChange}
                  style={{
                    height: 36,
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                  }}
                />
              </View>
            ) : (
              // TouchableOpacity for native platforms
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  setPickerMode('date');
                  setShowPicker(true);
                }}
              >
                <ThemedText>{formattedDate}</ThemedText>
              </TouchableOpacity>
            )}
            
            <ThemedText>Expiration Time</ThemedText>
            {Platform.OS === 'web' ? (
              // Web-specific time input
              <View style={styles.dateInput}>
                <input
                  type="time"
                  value={`${String(expirationDate.getHours()).padStart(2, '0')}:${String(expirationDate.getMinutes()).padStart(2, '0')}`}
                  onChange={handleWebTimeChange}
                  style={{
                    height: 36,
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                  }}
                />
              </View>
            ) : (
              // TouchableOpacity for native platforms
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  setPickerMode('time');
                  setShowPicker(true);
                }}
              >
                <ThemedText>{formattedTime}</ThemedText>
              </TouchableOpacity>
            )}

            {/* Only render the DateTimePicker on native platforms */}
            {Platform.OS !== 'web' && showPicker && (
              <DateTimePicker
                value={expirationDate}
                mode={pickerMode}
                display="default"
                onChange={handleDateTimeChange}
              />
            )}
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateWager}
            >
              <ThemedText style={styles.submitButtonText}>Create Promise</ThemedText>
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

      {/* Notifications Modal with Incoming Wagers */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationsModalVisible}
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Incoming Promises</ThemedText>

            {/* Incoming Wagers as Notifications */}
            {notificationsLoading ? (
              <ActivityIndicator size="large" color="#4CAF50" style={styles.loadingIndicator} />
            ) : (
              <>
                {incomingWagers.length > 0 ? (
                  <FlatList
                    data={incomingWagers}
                    renderItem={({ item }) => (
                      <IncomingWagerItem 
                        item={item} 
                        onAccept={handleAcceptWager}
                        onReject={handleRejectWager}
                      />
                    )}
                    keyExtractor={(item) => item.wager_id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.notificationsList}
                  />
                ) : (
                  <ThemedView style={styles.noWagersContainer}>
                    <ThemedText style={styles.noWagersText}>No new promises</ThemedText>
                  </ThemedView>
                )}
              </>
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setNotificationsModalVisible(false)}
            >
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Resolve Wager Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={resolveModalVisible}
        onRequestClose={() => setResolveModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Choose Winner</ThemedText>
            
            {selectedWager && (
              <>
                <ThemedText style={styles.wagerSummary}>{selectedWager.wager_description}</ThemedText>
                <ThemedText style={styles.wagerAmount}>{selectedWager.wager_amount} points</ThemedText>
                
                {resolvingWager ? (
                  <ActivityIndicator size="large" color="#4CAF50" style={{marginVertical: 20}} />
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.winnerButton}
                      onPress={() => handleResolveWager(selectedWager.wager_id, selectedWager.creator_id)}
                    >
                      <ThemedText style={styles.winnerButtonText}>
                        {selectedWager.creator_username || selectedWager.creator_id} (Creator)
                      </ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.winnerButton}
                      onPress={() => handleResolveWager(selectedWager.wager_id, selectedWager.receiver_id)}
                    >
                      <ThemedText style={styles.winnerButtonText}>
                        {selectedWager.receiver_username || selectedWager.receiver_id} (Recipient)
                      </ThemedText>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setResolveModalVisible(false)}
              disabled={resolvingWager}
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
    paddingHorizontal: 16,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#4CAF50',
    fontSize: 20,
  },
  headerSubtitle: {
    color: '#666666',
    fontSize: 14,
    marginTop: 2,
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
    paddingHorizontal: 16,
  },
  seeAllText: {
    color: '#4CAF50',
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
    backgroundColor: '#4CAF50',
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
    color: '#4CAF50',
  },
  floatingActionButton: {
    position: 'absolute',
    left: '50%',
    bottom: 24,
    width: 60,
    height: 60,
    backgroundColor: '#4CAF50',
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
    maxHeight: '80%',
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
    backgroundColor: '#4CAF50',
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
  dateInput: {
    height: 40,
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  notificationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  notificationsList: {
    paddingBottom: 20,
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Choose winner functionality styles
  chooseWinnerButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  chooseWinnerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  wagerSummary: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  wagerAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'center',
  },
  winnerButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 5,
    marginVertical: 5,
    alignItems: 'center',
  },
  winnerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});