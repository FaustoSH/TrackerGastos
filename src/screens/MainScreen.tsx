// src/screens/MainScreen.tsx
import React, { FC, useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ListRenderItemInfo,
} from 'react-native';
import { Colors } from '../constants/colors';
import AddButton from '../components/AddButton';
import { asyncExecuteSQL } from '../database/database';
import { AppContext } from '../context/ContextProvider';
import LoadingScreen from '../components/LoadingScreen';
import { Transaction } from '../constants/typesAndInterfaces';
import { FontStyles, SectionStyles } from '../constants/generalStyles';

const MainScreen: FC = () => {
  const { db, loading, setLoading } = useContext(AppContext);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadTransactions();
  }, [db]);

  const currentMoney = transactions.length > 0 ? transactions[0].saldoPostTransaccion : 0;
  const moneyColor = currentMoney < 0 ? Colors.alert : Colors.primary;


  const loadTransactions = async (): Promise<void> => {
    try {
      if (db) {
        const results = await asyncExecuteSQL(db, `SELECT *
          FROM Movimientos
          ORDER BY fecha DESC, id DESC
          LIMIT 15;
        `);
        if (results) {
          const rows = results.rows;
          const data: Transaction[] = [];
          for (let i = 0; i < rows.length; i++) {
            data.push(rows.item(i));
          }
          setTransactions(data);
        }

        setLoading(false);

      }
    } catch (error) {
      console.error('Error cargando las transacciones:', error);
    }
  };

  const renderTransaction = ({ item }: ListRenderItemInfo<Transaction>) => {
    // Definimos un color según si es ingreso o gasto
    const amountColor = item.tipo === 'ingreso' ? Colors.primary : Colors.alert; // rojo para gasto

    const itemDate = new Date(item.fecha);

    // Obtenemos la fecha de hoy, sin horas
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Obtenemos la fecha de ayer
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // También obtenemos la fecha del item sin horas para comparar
    const itemDateWithoutHours = new Date(itemDate);
    itemDateWithoutHours.setHours(0, 0, 0, 0);

    let fechaString: string;
    if (itemDateWithoutHours.getTime() === today.getTime()) {
      fechaString = "Hoy";
    } else if (itemDateWithoutHours.getTime() === yesterday.getTime()) {
      fechaString = "Ayer";
    } else {
      // Formato dd/mm/aaaa
      const day = itemDate.getDate().toString().padStart(2, '0');
      const month = (itemDate.getMonth() + 1).toString().padStart(2, '0');
      const year = itemDate.getFullYear();
      fechaString = `${day}/${month}/${year}`;
    }

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionCantidadYConcepto}>
          <Text style={[styles.transactionAmount, { color: amountColor }]}>
            {item.tipo === 'ingreso' ? '+' : '-'}{item.cantidad.toFixed(2)}€
          </Text>
          <Text style={FontStyles.normalTextStyle}>
            {item.descripcion || (item.tipo === 'ingreso' ? 'Ingreso' : 'Gasto')}
          </Text>
        </View>
        <View style={styles.transactionSaldoYFecha}>
          <Text style={FontStyles.normalTextStyle}>
            {item.saldoPostTransaccion}€
          </Text>
          <Text style={styles.transactionDate}>
            {fechaString}
          </Text>
        </View>
      </View>
    );
  };

  return loading ? (
    <LoadingScreen fullWindow={true} />
  ) : (
    <View style={styles.container}>
      {/* Sección superior (Dinero total) */}
      <View style={styles.headerCard}>
        <Text style={[styles.currencySymbol, { color: moneyColor }]}>€</Text>
        <Text style={[styles.totalMoney, { color: moneyColor }]}>{currentMoney}</Text>
      </View>

      {/* Últimos movimientos */}
      <View style={SectionStyles.cardSection}>
        <Text style={SectionStyles.sectionTitle}>Últimos Movimientos</Text>
        {transactions.length > 0 ? (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTransaction}
          />
        ) : (
          <Text style={styles.noTransactionsText}>No hay movimientos</Text>
        )}
      </View>

      {/* Botón "+" en posición absoluta */}
      <AddButton />
    </View>
  );
};

const styles = StyleSheet.create({
  // Contenedor principal
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 16,
    position: 'relative',
  },
  // Tarjeta superior para el dinero total
  headerCard: {
    ...SectionStyles.cardSection,
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  currencySymbol: {
    ...FontStyles.h1Style,
    color: Colors.primary,
    marginRight: 8,
  },
  totalMoney: {
    ...FontStyles.h1Style,
    color: Colors.primary,
  },


  // Últimos movimientos
  noTransactionsText: {
    textAlign: 'center',
    color: Colors.text,
    marginTop: 10,
  },
  transactionItem: {
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  transactionCantidadYConcepto:{
    flexDirection: "row",
    maxWidth: "40%",
    gap: 10
  },
  transactionSaldoYFecha:{
    flexDirection: "column",
    maxWidth: "40%",
    justifyContent: "flex-start",
    alignItems: "flex-end"
  },
  transactionAmount: {
    ...FontStyles.normalTextStyle,
    marginVertical: 2,
  },
  transactionDate: {
    ...FontStyles.normalTextStyle,
    color: Colors.secondary,
  },
});

export default MainScreen;
