// src/screens/MainScreen.tsx
import React, { FC, useContext, useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { Colors } from '../constants/colors';
import AddButton from '../components/AddButton';
import { AppContext } from '../context/ContextProvider';
import LoadingScreen from '../components/LoadingScreen';
import { Transaction, Hucha } from '../constants/typesAndInterfaces';
import { FontStyles, MoneyStyles, SectionStyles, TransactionSectionStyles } from '../constants/generalStyles';
import { loadHuchas, loadTransactions } from '../utils/Utils';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import HamburgerMenu from '../components/HamburguerMenu/HamburguerMenu';
import { MainScreenOptions } from '../components/HamburguerMenu/HamburguerMenuOptions/MainScreenOptions';


type MainScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;
type MainScreenRouteProp = RouteProp<RootStackParamList, 'Main'>;

interface MainScreenProps {
  route: MainScreenRouteProp;
  navigation: MainScreenNavigationProp;
}

interface HuchaMainScreen extends Hucha {
  huchaNoContada: boolean;
}

const MainScreen: FC<MainScreenProps> = ({ route, navigation }) => {
  const { db } = useContext(AppContext);
  const [loading, setLoading] = useState<boolean>(true)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [huchas, setHuchas] = useState<HuchaMainScreen[]>([]);
  const [todasNoContadas, setTodasNoContadas] = useState<boolean>(false);


  useEffect(() => {
    loadData()
      .catch(error => {
        Alert.alert("Error", "Error cargando datos iniciales: " + (error.message || 'Error desconocido'),
          [{ text: 'Cerrar aplicación', onPress: () => { BackHandler.exitApp(); } }]
        );
      })
  }, [db]);

  useEffect(() => {
    // Comprueba si todas las huchas tienen su parámetro huchaNoContada a true, si es así, cambia el estado a true
    const todasHuchasNoContadas = huchas.every(h => h.huchaNoContada);
    setTodasNoContadas(todasHuchasNoContadas);
  }, [huchas]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <HamburgerMenu children={<MainScreenOptions navigation={navigation} />} />
    });
  }, [navigation]);


  const loadData = async () => {
    try {
      if (db) {
        const promises = [
          loadTransactions(db, setTransactions),
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
      <View style={TransactionSectionStyles.transactionItem} key={item.id.toString()}>
        <View style={TransactionSectionStyles.transactionCantidadYConcepto}>
          <Text style={[TransactionSectionStyles.transactionAmount, { color: amountColor }]}>
            {item.tipo === 'ingreso' ? '+' : '-'}{item.cantidad.toFixed(2)}€
          </Text>
          <Text style={FontStyles.normalTextStyle}>
            {item.descripcion || (item.tipo === 'ingreso' ? 'Ingreso' : 'Gasto')}
          </Text>
        </View>
        <View style={TransactionSectionStyles.transactionSaldoYFecha}>
          <Text style={FontStyles.normalTextStyle}>
            {item.saldoPostTransaccion}€
          </Text>
          <Text style={TransactionSectionStyles.transactionDate}>
            {fechaString}
          </Text>
        </View>
      </View>
    );
  };

  // Render de cada hucha
  const renderHucha = (item: HuchaMainScreen) => {
    // Calcula progreso si hay objetivo
    const progress = item.objetivo ? Math.min(item.saldo / item.objetivo, 1) : 0;
    const progressWidth = `${(progress * 100).toFixed(0)}%`;

    //Si la hucha se cuenta, su color es el color de la hucha, si no, es gris
    const huchaColor = !item.huchaNoContada ? item.color : Colors.secondary;

    return (
      <TouchableOpacity
        style={[styles.huchaItem, { borderColor: huchaColor }]}
        onLongPress={() => navigation.navigate('HuchaDetails', { huchaId: item.id })}
        onPress={() => descontarHucha(item.id)}
        activeOpacity={0.8}
        key={item.id.toString()}
      >
        <View style={styles.huchaHeader}>
          <View style={[styles.colorTag, { backgroundColor: huchaColor }]} />
          <Text style={styles.huchaName}>{item.nombre}</Text>
        </View>
        <Text style={FontStyles.normalTextStyle}>
          {item.saldo.toFixed(2)}€{item.objetivo ? ' / ' + item.objetivo.toFixed(2) + '€' : ''}
        </Text>
        {item.objetivo && (
          <View style={MoneyStyles.progressBar}>
            <View style={[MoneyStyles.progressFill, { width: progressWidth as any, backgroundColor: huchaColor }]} />
          </View>
        )}
      </TouchableOpacity >
    );
  };

  const descontarHucha = (huchaId: number) => {
    //Selecciona la hucha de la lista de huchas, cambia el parámetro contarSaldoEnTotal y actualiza la lista de huchas
    const hucha = huchas.find(h => h.id === huchaId);
    if (hucha) {
      const updatedHuchas = huchas.map(h => {
        if (h.id === huchaId) {
          return { ...h, huchaNoContada: !h.huchaNoContada };
        }
        return h;
      });
      setHuchas(updatedHuchas);
    }
  }

  const seleccionarTodasLasHuchas = () => {
    //Primero comprueba si todas las huchas tienen su parámetro huchaNoContada a true, si es así, las selecciona todas y si no, las deselecciona todas
    const todasHuchasNoContadas = huchas.every(h => h.huchaNoContada);
    const updatedHuchas = huchas.map(h => {
      return { ...h, huchaNoContada: !todasHuchasNoContadas };
    });
    setHuchas(updatedHuchas);
  }

  const calcularSaldoActual = () => {
    // Calcula el saldo total de las huchas que no se cuentan
    const saldoARestar = huchas.reduce((total, hucha) => {
      if (hucha.huchaNoContada) {
        return total + hucha.saldo;
      }
      return total;
    }, 0);
    const saldoUltimoMovimiento = transactions.length > 0 ? transactions[0].saldoPostTransaccion : 0;
    return saldoUltimoMovimiento - saldoARestar;
  }

  const currentMoney = calcularSaldoActual();
  const moneyColor = currentMoney < 0 ? Colors.alert : Colors.primary;

  return loading ? (
    <LoadingScreen fullWindow={true} />
  ) : (
    <View style={SectionStyles.mainContainer}>
      <ScrollView contentContainerStyle={SectionStyles.container}>
        {/* Sección superior (Dinero total) */}
        <View style={styles.headerCard}>
          <Text style={[MoneyStyles.currencySymbol, { color: moneyColor }]}>€</Text>
          <Text style={[MoneyStyles.totalMoney, { color: moneyColor }]}>{currentMoney.toFixed(2)}</Text>
        </View>

        {/* Sección de Huchas */}
        <View style={styles.huchaCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={SectionStyles.sectionTitle}>Huchas</Text>
            <TouchableOpacity onPress={() => seleccionarTodasLasHuchas()}>
              <FontAwesome6 name="square-check" iconStyle="solid" style={{ color: todasNoContadas ? Colors.primary : Colors.secondary, fontSize: 25 }} />
            </TouchableOpacity>
          </View>
          {huchas.length > 0 ? (
            <ScrollView horizontal={true} contentContainerStyle={styles.huchaScroll}>
              {huchas.map(item => renderHucha(item))}
            </ScrollView>
          ) : (
            <Text style={FontStyles.noDataText}>No hay huchas</Text>
          )}
        </View>

        {/* Últimos movimientos */}
        <View style={SectionStyles.cardSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={SectionStyles.sectionTitle}>Últimos Movimientos</Text>
            {/* <TouchableOpacity onPress={() => navigation.navigate('ReportsScreen', {})}>
              <FontAwesome6 name="chart-simple" iconStyle="solid" style={{color: Colors.primary, fontSize: 25}} />
            </TouchableOpacity> */}
          </View>
          {transactions.length > 0 ? (
            <>
              {
                transactions.map(item => renderTransaction(item))
              }
            </>
          ) : (
            <Text style={FontStyles.noDataText}>No hay movimientos</Text>
          )}
        </View>
      </ScrollView>
      {/* Botón "+" en posición absoluta */}
      <AddButton />
    </View>
  );
};

const styles = StyleSheet.create({
  // Tarjeta superior para el dinero total
  headerCard: {
    ...SectionStyles.cardSection,
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
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
  }
});

export default MainScreen;
