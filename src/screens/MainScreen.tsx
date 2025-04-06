// src/screens/MainScreen.tsx
import React, { FC, useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ListRenderItemInfo } from 'react-native';
import { Colors } from '../constants/colors';
import AddButton from '../components/AddButton';
import { asyncExecuteSQL } from '../database/database';
import { AppContext } from '../context/ContextProvider';
import LoadingScreen from '../components/LoadingScreen';
import { Transaction } from '../constants/typesAndInterfaces';
import { FontStyles } from '../constants/fonts';

const MainScreen: FC = () => {
  const { db, loading, setLoading } = useContext(AppContext);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // Número de movimientos a mostrar visualmente
  const [displayCount, setDisplayCount] = useState<number>(15);

  useEffect(() => {
    loadTransactions();
  }, [db]);

  const loadTransactions = async (): Promise<void> => {
    try {
      if (db) {
        const results = await asyncExecuteSQL(db, `SELECT * FROM Movimientos;`);
        if (results) {
          const rows = results.rows;
          const data: Transaction[] = [];
          for (let i = 0; i < rows.length; i++) {
            data.push(rows.item(i));
          }
          setTransactions(data);
          setLoading(false);
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

  // Ordena las transacciones de forma descendente por fecha.
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
  // Movimientos a visualizar.
  const displayedTransactions = sortedTransactions.slice(0, displayCount);

  const renderTransaction = ({ item }: ListRenderItemInfo<Transaction>) => (
    <View style={styles.transactionItem}>
      <Text style={styles.transactionConcept}>
        {item.descripcion || (item.tipo === 'ingreso' ? 'Ingreso' : 'Gasto')}
      </Text>
      <Text style={styles.transactionAmount}>
        {item.tipo === 'ingreso' ? '+' : '-'} {item.cantidad.toFixed(2)} €
      </Text>
      <Text style={styles.transactionDate}>
        {new Date(item.fecha).toLocaleDateString()}
      </Text>
    </View>
  );

  // Aumenta visualmente el número de elementos en 15 cuando se alcanza el final.
  const loadMore = useCallback(() => {
    if (displayCount < sortedTransactions.length) {
      setDisplayCount(prev => prev + 15);
    }
  }, [displayCount, sortedTransactions.length]);

  return (
    <>
      {loading ? (
        <LoadingScreen fullWindow={true} />
      ) : (
        <View style={styles.mainContainer}>
          <FlatList
            data={displayedTransactions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTransaction}
            onEndReached={loadMore}
            onEndReachedThreshold={0.2}
            ListHeaderComponent={
              <View style={styles.totalMoneyContainer}>
                <Text style={styles.amount}>{totalMoney.toFixed(2)} €</Text>
              </View>
            }
            ListEmptyComponent={
              <Text style={styles.noTransactionsText}>No hay movimientos</Text>
            }
            contentContainerStyle={styles.listContentContainer}
          />
          <AddButton />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    position: 'relative',
  },
  listContentContainer: {
    padding: 16,
    paddingBottom: 100, // espacio para que no tape el botón "+"
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
  noTransactionsText: {
    textAlign: 'center',
    color: Colors.text,
    marginTop: 20,
  },
  transactionItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary,
    paddingVertical: 10,
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
