// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainScreen from './src/screens/MainScreen';
import TransactionScreen from './src/screens/TransactionScreen';
import ContextProvider from './src/context/ContextProvider';
import NewPiggyBankScreen from './src/screens/NewPiggyBankScreen';
import HuchaDetailsScreen from './src/screens/HuchaDetailsScreen';


export type RootStackParamList = {
  Main: undefined;
  Transaction: { mode: 'gasto' | 'ingreso' };
  NewPiggyBank: undefined;
  HuchaDetails: { huchaId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <ContextProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Main">
          <Stack.Screen name="Main" component={MainScreen} options={{ title: 'Inicio' }} />
          <Stack.Screen name="Transaction" component={TransactionScreen} options={{ title: 'Movimiento' }} />
          <Stack.Screen name="NewPiggyBank" component={NewPiggyBankScreen} options={{ title: 'Nueva hucha' }} />
          <Stack.Screen name="HuchaDetails" component={HuchaDetailsScreen} options={{ title: 'Detalle de hucha' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ContextProvider>
  );
};

export default App;
