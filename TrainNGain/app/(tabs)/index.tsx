import { Image, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Mock transaction data
const transactions = [
  { id: '1', user: 'Alex Kim', action: 'promised', target: 'You', amount: '10 points', description: 'Completing Seattle 5k', time: '2h ago' },
  { id: '2', user: 'You', action: 'promised', target: 'Taylor Swift', amount: '5 points', description: 'Finishing homework by Thursday 12am', time: '5h ago' },
  { id: '3', user: 'Morgan Lee', action: 'fulfilled promise to', target: 'Gerald', amount: '+12 points', description: 'Morning run', time: '1d ago' },
  { id: '4', user: 'Jordan Bell', action: 'has a timed-out promise to', target: 'You', amount: '-20 points', description: 'Mile Run', time: '2d ago' },
  { id: '5', user: 'You', action: 'have a timed-out promise to', target: 'Morgan Lee', amount: '-15 points', description: 'Doing stats homework', time: '3d ago' },
  { id: '6', user: 'Riley Chen', action: 'promised', target: 'You', amount: '5 points', description: 'Morning yoga', time: '4d ago' },
  { id: '7', user: 'You', action: 'promised', target: 'Sam Adams', amount: '10 points', description: 'Going to career fair', time: '5d ago' },
];

// Promise Item Component
const PromiseItem = ({ item, onAccept, onComplete, onFail }) => (
  <ThemedView style={styles.promiseItem}>
    <ThemedView style={styles.avatarContainer}>
      <ThemedText style={styles.avatarText}>{item.creator.charAt(0)}</ThemedText>
    </ThemedView>
    <ThemedView style={styles.promiseContent}>
      <ThemedView style={styles.promiseHeader}>
        <ThemedText type="defaultSemiBold">
          {item.creator} → {item.recipient}
        </ThemedText>
        <ThemedText style={styles.pointsText}>{item.points} pts</ThemedText>
      </ThemedView>
      <ThemedText>{item.description}</ThemedText>
      <ThemedView style={styles.promiseFooter}>
        <ThemedText style={
          item.status === 'completed' ? styles.completedText : 
          item.status === 'failed' ? styles.failedText : 
          styles.pendingText
        }>
          {item.deadline}
        </ThemedText>
        
        {item.status === 'pending' && item.recipient === 'You' && item.creator !== 'You' && (
          <TouchableOpacity style={styles.acceptButton} onPress={() => onAccept && onAccept(item)}>
            <ThemedText style={styles.buttonText}>Accept</ThemedText>
          </TouchableOpacity>
        )}
        
        {item.status === 'pending' && ((item.creator === 'You' && item.recipient !== 'You') || (item.recipient === 'You' && item.creator !== 'You')) && (
          <ThemedView style={styles.actionButtons}>
            <TouchableOpacity style={styles.completeButton} onPress={() => onComplete && onComplete(item)}>
              <ThemedText style={styles.buttonText}>Complete</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.failButton} onPress={() => onFail && onFail(item)}>
              <ThemedText style={styles.buttonText}>Fail</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  </ThemedView>
);

export default function HomeScreen() {
  const [balance, setBalance] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/balance'); // Ensure this matches backend
        const data = await response.json();
        
        console.log("Fetched balance:", data); // Log response data
        if (data && typeof data.balance === "number") {
          setBalance(data.balance); // Ensure we're setting the balance
        } else {
          console.error("Invalid balance format:", data);
          setBalance(null); // Handle incorrect format
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance(null); // Ensure error handling doesn't break the UI
      } finally {
        setLoading(false);
      }
    };
  
    fetchBalance();
  }, []);
  
  

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedView style={styles.headerLeft}>
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
          data={activeTab === 'pending' ? pendingPromises : pastPromises}
          renderItem={({ item }) => (
            <PromiseItem 
              item={item} 
              onAccept={(item) => console.log('Accepted', item)}
              onComplete={(item) => console.log('Completed', item)}
              onFail={(item) => console.log('Failed', item)}
            />
          )}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.promisesList}
        />
      </ThemedView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.floatingActionButton}>
        <Ionicons name="scan-outline" size={28} color="white" />
      </TouchableOpacity>
      
      {/* Create Promise Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContainer}>
            <ThemedView style={styles.modalHeader}>
              <ThemedText type="subtitle">Create New Promise</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-outline" size={24} color="#000" />
              </TouchableOpacity>
            </ThemedView>
            
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Recipient</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Who is this promise with?"
                value={newPromise.recipient}
                onChangeText={(text) => setNewPromise({...newPromise, recipient: text})}
              />
            </ThemedView>
            
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Points at Stake</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="How many points?"
                keyboardType="numeric"
                value={newPromise.points}
                onChangeText={(text) => setNewPromise({...newPromise, points: text})}
              />
            </ThemedView>
            
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Description</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What are you promising to do?"
                multiline={true}
                numberOfLines={3}
                value={newPromise.description}
                onChangeText={(text) => setNewPromise({...newPromise, description: text})}
              />
            </ThemedView>
            
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Deadline</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="When will this be completed by?"
                value={newPromise.deadline}
                onChangeText={(text) => setNewPromise({...newPromise, deadline: text})}
              />
            </ThemedView>
            
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={() => {
                console.log('New Promise:', newPromise);
                setModalVisible(false);
                setNewPromise({recipient: '', points: '', description: '', deadline: ''});
              }}
            >
              <ThemedText style={styles.submitButtonText}>Create Promise</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#3D95CE',
    fontSize: 18,
    marginLeft: 8,
  },
  profilePic: {
    height: 32,
    width: 32,
    borderRadius: 16,
  },
  pointsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F2FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsLabel: {
    fontSize: 12,
    color: '#555555',
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3D95CE',
  },
  pendingPointsText: {
    fontSize: 10,
    color: '#777777',
    marginLeft: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#E6F2FA',
    borderBottomWidth: 2,
    borderBottomColor: '#3D95CE',
  },
  tabText: {
    color: '#888888',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3D95CE',
    fontWeight: '600',
  },
  promisesContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  promisesList: {
    paddingBottom: 80, // Space for floating button
  },
  promiseItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderRadius: 8,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3D95CE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  promiseContent: {
    flex: 1,
  },
  promiseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pointsText: {
    fontWeight: '600',
    color: '#3D95CE',
  },
  promiseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  pendingText: {
    fontSize: 12,
    color: '#FF9800',
  },
  completedText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  failedText: {
    fontSize: 12,
    color: '#F44336',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  failButton: {
    backgroundColor: '#F44336',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: 'white',
    width: '100%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#3D95CE',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});