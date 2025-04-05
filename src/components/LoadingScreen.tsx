// src/components/LoadingScreen.tsx
import React, { FC } from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/colors';

interface LoadingScreenProps {
  fullWindow: boolean;
}

const LoadingScreen: FC<LoadingScreenProps> = ({ fullWindow }) => {
  const containerStyle: ViewStyle = fullWindow ? styles.fullWindow : styles.flexContainer;

  return (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWindow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)', // Fondo opcional para bloquear la vista
  },
  flexContainer: {
    flex: 1,
  },
});

export default LoadingScreen;
