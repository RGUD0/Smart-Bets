import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Define types
interface User {
  id: string;
  username: string;
  email: string;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (username: string, email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  authFetch: (endpoint: string, options?: RequestInit) => Promise<any>;
  isAuthenticated: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// API endpoint - change this to your server address
const API_URL = 'http://localhost:5001'; // Use 10.0.2.2 for Android emulator, localhost for iOS/web

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);

  // Load user data from AsyncStorage on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        const savedToken = await AsyncStorage.getItem('token');
        
        if (savedUser && savedToken) {
          console.log('Loading user from storage');
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  // Register function
  const register = async (username: string, email: string, password: string) => {
    try {
      console.log('Sending registration request to:', `${API_URL}/api/auth/register`);
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });
      
      const data = await response.json();
      console.log('Registration response:', response.status, data.message || 'No message');
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Save user data to AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      await AsyncStorage.setItem('token', data.token);
      
      // Update state
      setUser(data.user);
      setToken(data.token);
      console.log('User saved to state and storage');
      
      return data;
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error.message);
      throw error;
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      console.log('Sending login request to:', `${API_URL}/api/auth/login`);
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      
      const data = await response.json();
      console.log('Login response:', response.status, data.message || 'No message');
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Save user data to AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      await AsyncStorage.setItem('token', data.token);
      
      // Update state
      setUser(data.user);
      setToken(data.token);
      console.log('User logged in and saved to state/storage');
      
      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Clear user data from AsyncStorage
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      
      // Clear state
      setUser(null);
      setToken(null);
      console.log('User logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Make authenticated API requests
  const authFetch = async (endpoint: string, options: RequestInit = {}) => {
    // Check if we have a token in state
    let currentToken = token;
    
    // If no token in state, try to get it from storage
    if (!currentToken) {
      try {
        currentToken = await AsyncStorage.getItem('token');
        if (currentToken) {
          console.log('Retrieved token from storage for request');
          setToken(currentToken); // Update state with token from storage
        }
      } catch (error) {
        console.error('Error retrieving token from storage:', error);
      }
    }
    
    // If still no token, throw error
    if (!currentToken) {
      console.warn('No authentication token available for request to:', endpoint);
      throw new Error('No authentication token');
    }
    
    // Log the token being used (but mask most of it for security)
    const tokenPreview = currentToken.substring(0, 10) + '...' + 
                        (currentToken.length > 20 ? currentToken.substring(currentToken.length - 10) : '');
    console.log(`Making authenticated request to: ${API_URL}${endpoint} with token: ${tokenPreview}`);
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`,
      ...options.headers,
    };
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
      
      console.log(`Response from ${endpoint}:`, response.status);
      const data = await response.json();
      
      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401) {
          console.warn('Token expired or invalid, logging out');
          await logout();
          throw new Error('Session expired. Please log in again.');
        }
        
        throw new Error(data.message || 'Request failed');
      }
      
      return data;
    } catch (error: any) {
      console.error(`API request error for ${endpoint}:`, error.message);
      throw error;
    }
  };

  // Log auth state changes
  useEffect(() => {
    console.log('Auth state updated:', { 
      isAuthenticated: !!user, 
      userId: user?.id || 'none'
    });
  }, [user, token]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      authFetch,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};