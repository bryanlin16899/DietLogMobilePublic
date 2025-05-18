import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserInfo {
  googleId: string;
  userId: string;
  name: string;
  email: string;
  picture?: string;
}

export interface TokenInfo {
  access_token: string;
  refresh_token: string;
  expires_in: string;
  user: string;
}

interface UserContextType {
  userInfo: UserInfo | null;
  setUserInfo: (info: UserInfo | null) => void;
  token: TokenInfo | null;
  setToken: (token: TokenInfo | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<TokenInfo | null>(null);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedUserInfo = await AsyncStorage.getItem('userInfo');
        const storedToken = await AsyncStorage.getItem('token');

        if (storedUserInfo) {
          setUserInfo(JSON.parse(storedUserInfo));
        }
        if (storedToken) {
          setToken(JSON.parse(storedToken));
        }
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
    };

    loadStoredData();
  }, []);

  const handleSetUserInfo = async (info: UserInfo | null) => {
    setUserInfo(info);
    if (info) {
      await AsyncStorage.setItem('userInfo', JSON.stringify(info));
    } else {
      await AsyncStorage.removeItem('userInfo');
    }
  };

  const handleSetToken = async (newToken: TokenInfo | null) => {
    setToken(newToken);
    if (newToken) {
      await AsyncStorage.setItem('token', JSON.stringify(newToken));
    } else {
      await AsyncStorage.removeItem('token');
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['userInfo', 'token']);
    setUserInfo(null);
    setToken(null);
  };

  return (
    <UserContext.Provider
      value={{
        userInfo,
        setUserInfo: handleSetUserInfo,
        token,
        setToken: handleSetToken,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
