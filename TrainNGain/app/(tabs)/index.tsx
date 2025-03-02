import { Image, StyleSheet, Platform, TouchableOpacity, FlatList, Modal, View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
<<<<<<< HEAD
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
=======
import { useAuth } from '../AuthContext'; // <-- Adjust this import path if needed
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Transaction data
const transactions = [
  { id: '1', user: 'Alex Kim', action: 'promised', target: 'You', amount: '10 points', description: 'Completing Seattle 5k', time: '2h ago' },
  { id: '2', user: 'You', action: 'promised', target: 'Taylor Swift', amount: '5 points', description: 'Finishing homework by Thursday 12am', time: '5h ago' },
  { id: '3', user: 'Morgan Lee', action: 'fulfilled promise to', target: 'Gerald', amount: '+12 points', description: 'Morning run', time: '1d ago' },
  { id: '4', user: 'Jordan Bell', action: 'has a timed-out promise to', target: 'You', amount: '-20 points', description: 'Mile Run', time: '2d ago' },
  { id: '5', user: 'You', action: 'have a timed-out promise to', target: 'Morgan Lee', amount: '-15 points', description: 'Doing stats homework', time: '3d ago' },
  { id: '6', user: 'Riley Chen', action: 'promised', target: 'You', amount: '5 points', description: 'Morning yoga', time: '4d ago' },
  { id: '7', user: 'You', action: 'promised', target: 'Sam Adams', amount: '10 points', description: 'Going to career fair', time: '5d ago' },
];

// Notification data
const notifications = [
  { id: '1', message: 'Alex Kim promised you 10 points for completing the Seattle 5k!', time: '2h ago' },
  { id: '2', message: 'Your promise to Taylor Swift has been fulfilled!', time: '5h ago' },
  { id: '3', message: 'Morgan Lee fulfilled a promise to Gerald!', time: '1d ago' },
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
>>>>>>> 1180fc6c9ce080471d20c188c64fa5523eaeb57a
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

// Notification Item Component
const NotificationItem = ({ item }) => (
  <ThemedView style={styles.notificationItem}>
    <ThemedText>{item.message}</ThemedText>
    <ThemedText style={styles.timeText}>{item.time}</ThemedText>
  </ThemedView>
);

export default function HomeScreen() {
  const { authFetch, user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [pendingWagers, setPendingWagers] = useState<Wager[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false); // State for promise modal visibility
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false); // State for notifications modal visibility
  const [searchTerm, setSearchTerm] = useState(""); // State for search term
  const [description, setDescription] = useState(""); // State for description
  const [amount, setAmount] = useState(""); // State for amount
  const [expirationDate, setExpirationDate] = useState(new Date()); // State for the selected date
  const [showDatePicker, setShowDatePicker] = useState(false); // State to control date picker visibility

  // Handle date change
  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate: Date | undefined
  ) => {
    setShowDatePicker(Platform.OS === 'ios'); // On iOS, keep the picker open
    if (selectedDate) {
      setExpirationDate(selectedDate); // Update the selected date
    }
  };

  // Format the date for display
  const formattedDate = expirationDate.toLocaleDateString();

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
              source={require('@/assets/images/cuteplant.png')}
              style={styles.profilePic}
            />
          </TouchableOpacity>
<<<<<<< HEAD
          <ThemedText type="title" style={styles.headerTitle}>BetBuddy</ThemedText>
          <TouchableOpacity>
=======
          <ThemedView style={styles.headerTitleContainer}>
            <ThemedText type="title" style={styles.headerTitle}>Pinky Promises</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Growing healthy habits with friends!</ThemedText>
          </ThemedView>
          <TouchableOpacity onPress={() => setNotificationsModalVisible(true)}>
>>>>>>> 1180fc6c9ce080471d20c188c64fa5523eaeb57a
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
<<<<<<< HEAD
        onPress={() => setModalVisible(true)}
=======
        onPress={() => setModalVisible(true)} // Show the promise modal when button is pressed
>>>>>>> 1180fc6c9ce080471d20c188c64fa5523eaeb57a
      >
        <ThemedText style={styles.plusButton}>+</ThemedText>
      </TouchableOpacity>

<<<<<<< HEAD
      {/* Create Wager Modal */}
=======
      {/* Promise Modal */}
>>>>>>> 1180fc6c9ce080471d20c188c64fa5523eaeb57a
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
<<<<<<< HEAD
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
=======
            <ThemedText style={styles.modalTitle}>Enter Promise Details</ThemedText>

            {/* Search Bar */}
            <TextInput
              style={styles.textInput}
              placeholder="Search..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />

            {/* Description Box */}
            <TextInput
              style={styles.textInput}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            {/* Amount Input */}
            <TextInput
              style={styles.textInput}
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            {/* Date Picker */}
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText>{formattedDate}</ThemedText>
            </TouchableOpacity>

            {/* Date Picker Component */}
            {showDatePicker && (
              <DateTimePicker
                value={expirationDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
              />
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => {
                console.log("Search Term: ", searchTerm);
                console.log("Description: ", description);
                console.log("Amount: ", amount);
                console.log("Expiration Date: ", expirationDate);
                setModalVisible(false); // Close modal after submitting
              }}
            >
              <ThemedText style={styles.submitButtonText}>Submit Promise</ThemedText>
>>>>>>> 1180fc6c9ce080471d20c188c64fa5523eaeb57a
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

      {/* Notifications Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationsModalVisible}
        onRequestClose={() => setNotificationsModalVisible(false)} // Close the modal on request
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Notifications</ThemedText>

            {/* Notifications List */}
            <FlatList
              data={notifications}
              renderItem={({ item }) => <NotificationItem item={item} />}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.notificationsList}
            />

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setNotificationsModalVisible(false)} // Close modal
            >
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
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
    justifyContent: 'space-between', // This will push items to the edges
    paddingHorizontal: 16, // Ensure spacing is consistent
  },
  headerTitleContainer: {
    alignItems: 'center', // Center the text horizontally
  },
  headerTitle: {
    color: '#4CAF50', // Green color code
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
  bellIcon: {
    height: 24,
    width: 24,
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
    justifyContent: 'space-between', // Ensures the text and button are spaced out
    marginBottom: 10, // Optional: space below the header
    paddingHorizontal: 16, // Added horizontal padding for better spacing from edges
    alignItems: 'center', // Vertically align the content to the center
  },
  
  seeAllText: {
    color: '#4CAF50', // Green color code
  },
  wagerItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: 'center',
  },
  activityContent: {
    paddingHorizontal: 16, // Added padding to content area
    paddingTop: 10,        // Optional: space at the top of the content area
  },
  recentActivityContainer: {
    paddingHorizontal: 20, // Adds space on both sides of the container
    paddingVertical: 10,   // Optional: adds space vertically for better separation
    borderRadius: 8,       // Optional: rounded corners for a smoother look
    backgroundColor: '#FFF', // Example background color (you can change it to match your design)
    shadowColor: '#000',   // Optional: adds a shadow effect for visual separation
    shadowOpacity: 0.1,    // Optional: shadow intensity
    shadowRadius: 5,       // Optional: shadow blur radius
    elevation: 3,          // Optional: elevation for Android shadow effect
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50', // Green color code
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
    alignItems: 'center',
  },
  timeText: {
    color: '#888', // Light gray for the time
    fontSize: 12, // Adjust the font size if needed
    marginLeft: 100, // Adds space between time and transaction details
  },
<<<<<<< HEAD
  statusText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666666',
  },
=======
  
>>>>>>> 1180fc6c9ce080471d20c188c64fa5523eaeb57a
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 10, // Adds space between point numbers and other elements
  },
  
  floatingActionButton: {
    position: 'absolute',
    left: '50%',
    bottom: 24,
    width: 60,
    height: 60,
    backgroundColor: '#4CAF50', // Green color code
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
    backgroundColor: '#4CAF50', // Green color code
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
<<<<<<< HEAD
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
=======
  dateInput: {
    height: 40,
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
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
});
>>>>>>> 1180fc6c9ce080471d20c188c64fa5523eaeb57a
