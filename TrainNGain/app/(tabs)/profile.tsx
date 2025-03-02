import { StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../AuthContext'; // <-- ADJUST import path to your project structure
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const { authFetch, logout } = useAuth();
  const navigation = useNavigation();
  const [userData, setUserData] = useState({
    balance: null,
    email: null,
    username: null,
    bio: null,
  });
  const [loading, setLoading] = useState(true);

  // Handle logout and navigation
  const handleLogout = async () => {
    try {
      await logout();
      // Navigate to Login screen after successful logout
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Use authFetch so we include Authorization: Bearer <token>
        const data = await authFetch('/api/user/profile');
        console.log('Fetched user data:', data);

        if (data && data.user) {
          setUserData({
            balance: data.user.balance ?? null,
            email: data.user.email ?? 'user@example.com',
            username: data.user.username ?? 'John Doe',
            bio:
              data.user.bio ??
              'Hi there! I love building apps with React Native and exploring new technologies.',
          });
        } else {
          console.error('Invalid user data format:', data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authFetch]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedView style={styles.headerContent}>
          <ThemedText type="title" style={styles.headerTitle}>
            Profile
          </ThemedText>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#3D95CE" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3D95CE" />
          <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
        </ThemedView>
      ) : (
        <>
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
                <ThemedText style={styles.bioText}>{userData.bio}</ThemedText>
              </ThemedView>
            </ThemedView>

            {/* Balance Section */}
            <ThemedView style={styles.balanceSection}>
              <ThemedText type="defaultSemiBold">Current Balance</ThemedText>
              <ThemedText type="title">
                {userData.balance ? `$${userData.balance}` : 'N/A'}
              </ThemedText>
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
              <Ionicons name="create-outline" size={24} color="#3D95CE" />
              <ThemedText style={styles.optionText}>Edit Bio</ThemedText>
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

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <ThemedText style={styles.logoutText}>Log Out</ThemedText>
          </TouchableOpacity>
        </>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666666',
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
  bioText: {
    color: '#666666',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
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