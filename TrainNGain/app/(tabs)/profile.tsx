import { StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function ProfileScreen() {
  const [userData, setUserData] = useState({
    balance: null,
    email: 'user@example.com',
    username: 'John Doe'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // In a real app, you would fetch this data from your API
        const response = await fetch('http://localhost:5001/api/balance');
        const data = await response.json();
        
        if (data && typeof data.balance === "number") {
          setUserData(prevState => ({
            ...prevState,
            balance: data.balance
          }));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedView style={styles.headerContent}>
          <ThemedText type="title" style={styles.headerTitle}>Profile</ThemedText>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#3D95CE" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Profile Card */}
      <ThemedView style={styles.profileCard}>
        <ThemedView style={styles.profileHeader}>
          <Image 
            source={require('@/assets/images/partial-react-logo.png')} 
            style={styles.profilePic} 
          />
          <ThemedView style={styles.profileInfo}>
            <ThemedText type="title">{userData.username}</ThemedText>
            <ThemedText style={styles.emailText}>{userData.email}</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Balance Section */}
        <ThemedView style={styles.balanceSection}>
          <ThemedText type="defaultSemiBold">Current Balance</ThemedText>
          {loading ? (
            <ActivityIndicator size="small" color="#3D95CE" />
          ) : (
            <ThemedText type="title">{userData.balance ? `$${userData.balance}` : 'N/A'}</ThemedText>
          )}
        </ThemedView>
      </ThemedView>

      {/* Profile Options */}
      <ThemedView style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionItem}>
          <Ionicons name="person-outline" size={24} color="#3D95CE" />
          <ThemedText style={styles.optionText}>Edit Profile</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#999999" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.optionItem}>
          <Ionicons name="card-outline" size={24} color="#3D95CE" />
          <ThemedText style={styles.optionText}>Payment Methods</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#999999" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.optionItem}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#3D95CE" />
          <ThemedText style={styles.optionText}>Privacy & Security</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#999999" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.optionItem}>
          <Ionicons name="notifications-outline" size={24} color="#3D95CE" />
          <ThemedText style={styles.optionText}>Notifications</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#999999" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.optionItem}>
          <Ionicons name="help-circle-outline" size={24} color="#3D95CE" />
          <ThemedText style={styles.optionText}>Help & Support</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#999999" />
        </TouchableOpacity>
      </ThemedView>
      
      <TouchableOpacity style={styles.logoutButton}>
        <ThemedText style={styles.logoutText}>Log Out</ThemedText>
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
  profileCard: {
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
  profileHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePic: {
    height: 80,
    width: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  emailText: {
    color: '#666666',
    marginTop: 4,
  },
  balanceSection: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 16,
    alignItems: 'center',
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  optionText: {
    flex: 1,
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: '#3D95CE',
    margin: 16,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});