import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthContext } from '../context/AuthContext';
import { Redirect } from 'expo-router';

export default function Index() {
  const { isLoading, isAuthenticated } = useAuthContext();

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});