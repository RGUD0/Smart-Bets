import { Image, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Mock promises data
const pendingPromises = [
  { id: '1', creator: 'Alex Kim', recipient: 'You', points: 50, description: '🏃 Go for a run together', deadline: '3 days left', status: 'pending' },
  { id: '2', creator: 'You', recipient: 'Morgan Lee', points: 75, description: '📚 Finish reading book club selection', deadline: '5 days left', status: 'pending' },
  { id: '3', creator: 'Jordan Bell', recipient: 'You', points: 30, description: '🧹 Clean the apartment', deadline: '1 day left', status: 'pending' },
];

const pastPromises = [
  { id: '4', creator: 'You', recipient: 'Taylor Swift', points: 40, description: '🎸 Practice guitar for 30 minutes daily', deadline: 'Completed', status: 'completed' },
  { id: '5', creator: 'Riley Chen', recipient: 'You', points: 60, description: '🥗 Stick to meal prep plan', deadline: 'Failed', status: 'failed' },
  { id: '6', creator: 'You', recipient: 'Sam Adams', points: 25, description: '📱 No social media for a week', deadline: 'Completed', status: 'completed' },
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
  const [activeTab, setActiveTab] = useState('pending');
  const [modalVisible, setModalVisible] = useState(false);
  const [newPromise, setNewPromise] = useState({
    recipient: '',
    points: '',
    description: '',
    deadline: ''
  });

  // Points calculation
  const earnedPoints = pastPromises
    .filter(p => p.recipient === 'You' && p.status === 'completed')
    .reduce((sum, p) => sum + p.points, 0);
  
  const lostPoints = pastPromises
    .filter(p => p.creator === 'You' && p.status === 'failed')
    .reduce((sum, p) => sum + p.points, 0);
  
  const currentPoints = earnedPoints - lostPoints;
  
  const pendingOutgoingPoints = pendingPromises
    .filter(p => p.creator === 'You')
    .reduce((sum, p) => sum + p.points, 0);
  
  const pendingIncomingPoints = pendingPromises
    .filter(p => p.recipient === 'You')
    .reduce((sum, p) => sum + p.points, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header with Points Summary */}
      <ThemedView style={styles.header}>
        <ThemedView style={styles.headerLeft}>
          <TouchableOpacity>
            <Image 
              source={require('@/assets/images/partial-react-logo.png')} 
              style={styles.profilePic} 
            />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>PromisePoints</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.pointsSummary}>
          <ThemedText style={styles.pointsLabel}>Points: </ThemedText>
          <ThemedText style={styles.pointsValue}>{currentPoints}</ThemedText>
          <ThemedText style={styles.pendingPointsText}>
            (+{pendingIncomingPoints} / -{pendingOutgoingPoints})
          </ThemedText>
        </ThemedView>
      </ThemedView>
      
      {/* Tabs */}
      <ThemedView style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]} 
          onPress={() => setActiveTab('pending')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.activeTab]} 
          onPress={() => setActiveTab('past')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            Past
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
      
      {/* Promises List */}
      <ThemedView style={styles.promisesContainer}>
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
      
      {/* Floating Create Promise Button */}
      <TouchableOpacity 
        style={styles.floatingActionButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add-outline" size={30} color="white" />
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