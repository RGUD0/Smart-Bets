import { Image, StyleSheet, Platform, TouchableOpacity, FlatList, Modal, View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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
      </ThemedView>
      <ThemedText>{item.description}</ThemedText>
    </ThemedView>
    <ThemedText style={styles.amountText}>{item.amount}</ThemedText>
  </ThemedView>
);

// Notification Item Component
const NotificationItem = ({ item }) => (
  <ThemedView style={styles.notificationItem}>
    <ThemedText>{item.message}</ThemedText>
    <ThemedText style={styles.timeText}>{item.time}</ThemedText>
  </ThemedView>
);

export default function HomeScreen() {
  const { authFetch } = useAuth(); // <-- Access authFetch from context
  const [balance, setBalance] = useState<number | string | null>(null);
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

  useEffect(() => {
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
              source={require('@/assets/images/cuteplant.png')}
              style={styles.profilePic}
            />
          </TouchableOpacity>
          <ThemedView style={styles.headerTitleContainer}>
            <ThemedText type="title" style={styles.headerTitle}>Pinky Promises</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Growing healthy habits with friends!</ThemedText>
          </ThemedView>
          <TouchableOpacity onPress={() => setNotificationsModalVisible(true)}>
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
      <TouchableOpacity
        style={styles.floatingActionButton}
        onPress={() => setModalVisible(true)} // Show the promise modal when button is pressed
      >
        <ThemedText style={styles.plusButton}>+</ThemedText>
      </TouchableOpacity>

      {/* Promise Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} // Close the modal on request
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
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
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)} // Close modal without submitting
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
  transactionsContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  transactionsList: {
    paddingBottom: 80, // Give space for the floating action button
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Ensures the text and button are spaced out
    marginBottom: 10, // Optional: space below the header
    paddingHorizontal: 16, // Added horizontal padding for better spacing from edges
    alignItems: 'center', // Vertically align the content to the center
  },
  
  seeAllText: {
    color: '#4CAF50', // Green color code
  },
  transactionItem: {
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
  transactionContent: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: '#888', // Light gray for the time
    fontSize: 12, // Adjust the font size if needed
    marginLeft: 100, // Adds space between time and transaction details
  },
  
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
    marginBottom: 10,
    fontWeight: 'bold',
  },
  textInput: {
    height: 40,
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    paddingLeft: 10,
  },
  submitButton: {
    backgroundColor: '#4CAF50', // Green color code
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
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
