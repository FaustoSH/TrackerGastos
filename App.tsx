// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainScreen from './src/screens/MainScreen';
import TransactionScreen from './src/screens/TransactionScreen';

export type RootStackParamList = {
  Main: undefined;
  Transaction: { mode: 'nuevoGasto' | 'nuevoIngreso' };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen name="Main" component={MainScreen} options={{ title: 'Inicio' }} />
        <Stack.Screen name="Transaction" component={TransactionScreen} options={{ title: 'Movimiento' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
