// src/screens/MainScreen.tsx
import React, { FC, useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView} from 'react-native';
import { Colors } from '../constants/colors';
import AddButton from '../components/AddButton';
import { asyncExecuteSQL } from '../database/database';
import { AppContext } from '../context/ContextProvider';
import LoadingScreen from '../components/LoadingScreen';
import { Transaction } from '../constants/typesAndInterfaces';
import { FontStyles } from '../constants/fonts';

const MainScreen: FC = () => {
  const { db, loading, setLoading } = useContext(AppContext)
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
          setLoading(false)
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

  return (
    <>
      {
        loading ? (
          <LoadingScreen fullWindow={true} />
        ) : (
          <ScrollView contentContainerStyle={styles.container}>
            {/* Dinero Total */}
            <View style={styles.totalMoneyContainer}>
              <Text style={styles.amount}>{totalMoney.toFixed(2)} €</Text>
            </View>

            {/* Botón "+" */}
            <AddButton />
          </ScrollView >
        )
      }
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  totalMoneyContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  amount: {
    ...FontStyles.h1Style,
    marginTop: 8,
    color: Colors.text,
  },
});

export default MainScreen;
