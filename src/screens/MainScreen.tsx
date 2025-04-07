// src/screens/MainScreen.tsx
import React, { FC, useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors } from '../constants/colors';
import AddButton from '../components/AddButton';
import { AppContext } from '../context/ContextProvider';
import LoadingScreen from '../components/LoadingScreen';
import { Transaction, Hucha } from '../constants/typesAndInterfaces';
import { FontStyles, SectionStyles } from '../constants/generalStyles';
import { loadHuchas, loadTransactions } from '../utils/Utils';

const MainScreen: FC = () => {
  const { db} = useContext(AppContext);
  const [loading, setLoading] = useState<boolean>(true)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [huchas, setHuchas] = useState<Hucha[]>([]);

  useEffect(() => {
    loadData()
    .catch(error=>{
      Alert.alert("Error cargando datos iniciales: "+error)
    })
  }, [db]);

  const loadData = async ()=>{
    try {
      if (db) {
        const promises=[
          loadTransactions(db, setTransactions, 15),
          loadHuchas(db, setHuchas),
        ]
        await Promise.all(promises)
        setLoading(false);
      }
    } catch (error) {
      throw error;
    }
  }

  // Render de un movimiento (transacción)
  const renderTransaction = (item: Transaction) => {
    const amountColor = item.tipo === 'ingreso' ? Colors.primary : Colors.alert;

    const itemDate = new Date(item.fecha);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const itemDateWithoutHours = new Date(itemDate);
    itemDateWithoutHours.setHours(0, 0, 0, 0);

    let fechaString: string;
    if (itemDateWithoutHours.getTime() === today.getTime()) {
      fechaString = "Hoy";
    } else if (itemDateWithoutHours.getTime() === yesterday.getTime()) {
      fechaString = "Ayer";
    } else {
      const day = itemDate.getDate().toString().padStart(2, '0');
      const month = (itemDate.getMonth() + 1).toString().padStart(2, '0');
      const year = itemDate.getFullYear();
      fechaString = `${day}/${month}/${year}`;
    }

    return (
      <View style={styles.transactionItem} key={item.id.toString()}>
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

  // Render de cada hucha
  const renderHucha = (item: Hucha) => {
    // Calcula progreso si hay objetivo
    const progress = item.objetivo ? Math.min(item.saldo / item.objetivo, 1) : 0;
    const progressWidth = `${(progress * 100).toFixed(0)}%`;

    return (
      <View style={[styles.huchaItem, { borderColor: item.color }]} key={item.id.toString()}>
        <View style={styles.huchaHeader}>
          <View style={[styles.colorTag, { backgroundColor: item.color }]} />
          <Text style={styles.huchaName}>{item.nombre}</Text>
        </View>
        <Text style={FontStyles.normalTextStyle}>
          {item.saldo.toFixed(2)}€{item.objetivo ? ' / ' + item.objetivo.toFixed(2) + '€' : ''}
        </Text>
        {item.objetivo && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: progressWidth as any, backgroundColor: item.color }]} />
          </View>
        )}
      </View>
    );
  };

  const currentMoney = transactions.length > 0 ? transactions[0].saldoPostTransaccion : 0;
  const moneyColor = currentMoney < 0 ? Colors.alert : Colors.primary;

  return loading ? (
    <LoadingScreen fullWindow={true} />
  ) : (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Sección superior (Dinero total) */}
      <View style={styles.headerCard}>
        <Text style={[styles.currencySymbol, { color: moneyColor }]}>€</Text>
        <Text style={[styles.totalMoney, { color: moneyColor }]}>{currentMoney.toFixed(2)}</Text>
      </View>

      {/* Sección de Huchas */}
      <View style={styles.huchaCard}>
        <Text style={SectionStyles.sectionTitle}>Huchas</Text>
        {huchas.length > 0 ? (
          <ScrollView horizontal={true} contentContainerStyle={styles.huchaScroll}>
            {huchas.map(item => renderHucha(item))}
          </ScrollView>
        ) : (
          <Text style={styles.noDataText}>No hay huchas</Text>
        )}
      </View>

      {/* Últimos movimientos */}
      <View style={SectionStyles.cardSection}>
        <Text style={SectionStyles.sectionTitle}>Últimos Movimientos</Text>
        {transactions.length > 0 ? (
          <>
            {
              transactions.map(item => renderTransaction(item))
            }
          </>
        ) : (
          <Text style={styles.noDataText}>No hay movimientos</Text>
        )}
      </View>

      {/* Botón "+" en posición absoluta */}
      <AddButton />
    </ScrollView>
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

  //Estilo general para textos no data
  noDataText: {
    textAlign: 'center',
    color: Colors.text,
    marginTop: 10,
  },

  //Estilos sección huchas
  huchaCard: {
    ...SectionStyles.cardSection,
    maxHeight: 240
  },
  huchaScroll: {
    flexDirection: "row",
    gap: 8
  },
  huchaItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    maxWidth: 320
  },
  huchaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8
  },
  colorTag: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  huchaName: {
    ...FontStyles.normalTextStyle,
    flexWrap: 'wrap',
    flexShrink: 1
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  //Estilos sección movimientos
  transactionItem: {
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionCantidadYConcepto: {
    flexDirection: 'row',
    maxWidth: '40%',
    gap: 10,
  },
  transactionSaldoYFecha: {
    flexDirection: 'column',
    maxWidth: '40%',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
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
