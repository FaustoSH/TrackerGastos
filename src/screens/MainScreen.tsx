// src/screens/MainScreen.tsx
import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import AddButton from '../components/AddButton';
import { asyncExecuteSQL, openDatabase } from '../database/database';
import { AppContext } from '../context/ContextProvider';
import LoadingScreen from '../components/LoadingScreen';

interface Transaction {
  id: number;
  tipo: 'gasto' | 'ingreso';
  cantidad: number;
  descripcion: string;
  fecha: Date;
  hucha_id: number;
}

const MainScreen: FC = () => {
  const { db, loading } = useContext(AppContext)
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadTransactions();
  }, [db])

  const loadTransactions = async (): Promise<void> => {
    try {
      if (db) {
        const results = await asyncExecuteSQL(db,`SELECT * FROM Movimientos;`);
        if (results) {
          const rows = results.rows;
          const data: Transaction[] = [];
          for (let i = 0; i < rows.length; i++) {
            data.push(rows.item(i));
          }
          setTransactions(data);
        }
      }
    } catch (error) {
      console.error('Error cargando las transacciones:', error);
    }
  };

  // Calcula el dinero total: suma ingresos y resta gastos.
  const totalMoney: number = transactions.reduce((acc, t) => {
    if (t.tipo === 'ingreso') {
      return acc + t.cantidad;
    } else if (t.tipo === 'gasto') {
      return acc - t.cantidad;
    }
    return acc;
  }, 0);

  // const renderTransaction = ({ item }: { item: Transaction }) => (
  //   <View style={styles.transactionItem}>
  //     <Text style={styles.transactionConcept}>
  //       {item.descripcion || item.tipo}
  //     </Text>
  //     <Text style={styles.transactionAmount}>
  //       {item.tipo === 'ingreso' ? '+' : '-'}${item.cantidad.toFixed(2)}
  //     </Text>
  //     <Text style={styles.transactionDate}>
  //       {new Date(item.fecha).toLocaleDateString()}
  //     </Text>
  //   </View>
  // );

  return (
    <>
      {
        loading ? (
          <LoadingScreen fullWindow={true} />
        ) : (
          <ScrollView style={styles.container}>
            {/* Dinero Total */}
            <View style={styles.totalMoneyContainer}>
              <Text style={styles.label}>Dinero Total</Text>
              <Text style={styles.amount}>${totalMoney.toFixed(2)}</Text>
            </View>

            {/* Sección de Movimientos */}
            {/* <View style={styles.movementsContainer}>
              <Text style={styles.sectionTitle}>Últimos Movimientos</Text>
              {transactions.length > 0 ? (
                <FlatList
                  data={[...transactions].reverse()} // Los más recientes primero
                  keyExtractor={item => item.id.toString()}
                  renderItem={renderTransaction}
                />
              ) : (
                <Text style={styles.noTransactionsText}>No hay movimientos</Text>
              )}
            </View> */}

            {/* Botón "+" */}
            <AddButton onOptionSelect={() => { /* La navegación se gestiona en otro lado */ }} />
          </ScrollView >
        )
      }
    </>
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
