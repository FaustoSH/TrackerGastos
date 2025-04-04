// src/screens/MainScreen.tsx
import React, { FC, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import AddButton from '../components/AddButton';

interface Transaction {
  mode: 'nuevoGasto' | 'nuevoIngreso';
  amount: number;
  concepto: string;
  usePiggyBank: boolean;
  date: string;
}

const MainScreen: FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadTransactions = async (): Promise<void> => {
    try {
      const storedTransactions = await AsyncStorage.getItem('@transactions');
      const parsedTransactions: Transaction[] = storedTransactions
        ? JSON.parse(storedTransactions)
        : [];
      setTransactions(parsedTransactions);
    } catch (error) {
      console.error('Error cargando las transacciones:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  // Calcula el dinero total: suma ingresos y resta gastos.
  const totalMoney: number = transactions.reduce((acc, t) => {
    if (t.mode === 'nuevoIngreso') {
      return acc + t.amount;
    } else if (t.mode === 'nuevoGasto') {
      return acc - t.amount;
    }
    return acc;
  }, 0);

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <Text style={styles.transactionConcept}>
        {item.concepto || (item.mode === 'nuevoIngreso' ? 'Ingreso' : 'Gasto')}
      </Text>
      <Text style={styles.transactionAmount}>
        {item.mode === 'nuevoIngreso' ? '+' : '-'}${item.amount.toFixed(2)}
      </Text>
      <Text style={styles.transactionDate}>
        {new Date(item.date).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Dinero Total */}
      <View style={styles.totalMoneyContainer}>
        <Text style={styles.label}>Dinero Total</Text>
        <Text style={styles.amount}>${totalMoney.toFixed(2)}</Text>
      </View>

      {/* Sección de Movimientos */}
      <View style={styles.movementsContainer}>
        <Text style={styles.sectionTitle}>Últimos Movimientos</Text>
        {transactions.length > 0 ? (
          <FlatList
            data={[...transactions].reverse()} // Mostrar los más recientes primero
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderTransaction}
          />
        ) : (
          <Text style={styles.noTransactionsText}>No hay movimientos</Text>
        )}
      </View>

      {/* Botón "+" */}
      <AddButton onOptionSelect={() => { /* La navegación se gestiona desde MainScreen */ }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  totalMoneyContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  amount: {
    fontSize: 24,
    marginTop: 8,
    color: Colors.text,
  },
  movementsContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.text,
  },
  noTransactionsText: {
    textAlign: 'center',
    color: Colors.text,
  },
  transactionItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary,
  },
  transactionConcept: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  transactionAmount: {
    fontSize: 16,
    color: Colors.text,
  },
  transactionDate: {
    fontSize: 14,
    color: Colors.secondary,
  },
});

export default MainScreen;
