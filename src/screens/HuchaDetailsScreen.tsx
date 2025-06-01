// src/screens/HuchaDetailsScreen.tsx
import React, { FC, useLayoutEffect, useContext, useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Alert,
    BackHandler
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Colors } from '../constants/colors';
import { AppContext } from '../context/ContextProvider';
import { Hucha, Transaction } from '../constants/typesAndInterfaces';
import { backToMain, loadHucha, loadTransactions } from '../utils/Utils';
import { FontStyles, MoneyStyles, SectionStyles, TransactionSectionStyles } from '../constants/generalStyles';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import LoadingScreen from '../components/LoadingScreen';
import HamburgerMenu from '../components/HamburguerMenu/HamburguerMenu';
import { HuchaScreenOptions } from '../components/HamburguerMenu/HamburguerMenuOptions/HuchaScreenOptions';

type HuchaDetailsScreenRouteProp = RouteProp<RootStackParamList, 'HuchaDetails'>;
type HuchaDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HuchaDetails'>;

interface HuchaDetailsScreenProps {
    route: HuchaDetailsScreenRouteProp;
    navigation: HuchaDetailsScreenNavigationProp;
}

interface HuchaTransaction extends Transaction {
    saldoHuchaPostTransaccion: number;
}

const HuchaDetailsScreen: FC<HuchaDetailsScreenProps> = ({ route, navigation }) => {
    const { huchaId } = route.params;
    const { db } = useContext(AppContext);
    const [hucha, setHucha] = useState<Hucha | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [huchaTransactions, setHuchaTransactions] = useState<HuchaTransaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        loadData()
            .catch(error => {
                Alert.alert("Error", "Error cargando datos iniciales: " + (error.message || 'Error desconocido'),
                    [{ text: 'Cerrar aplicación', onPress: () => { BackHandler.exitApp(); } }]
                );
            });
    }, [db]);

    useEffect(() => {
        transactionsToHuchaTransactions(transactions);
    }, [transactions]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => <HamburgerMenu children={<HuchaScreenOptions setLoading={setLoading} navigation={navigation} huchaId={huchaId} />} />
        });
    }, [navigation]);

    useFocusEffect(
        React.useCallback(() => {
            const onBack = () => {
                backToMain(navigation);
                return true;
            };

            const backHandler = BackHandler.addEventListener('hardwareBackPress', onBack);
            return () => backHandler.remove();
        }, [navigation])
    );

    const loadData = async () => {
        try {
            if (db) {
                const promises = [
                    loadHucha(db, setHucha, huchaId),
                    loadTransactions(db, setTransactions, undefined, huchaId),
                ];
                await Promise.all(promises);
            }
        } catch (error) {
            throw error;
        }
    };

    const transactionsToHuchaTransactions = (transactions: Transaction[]) => {
        try {
            let saldoHuchaPostTransaccion = 0;
            const huchaTransactions = [];
            const transactionsReverse = [...transactions].reverse();
            for (const transaction of transactionsReverse) {
                if (transaction.tipo === 'ingreso') {
                    saldoHuchaPostTransaccion = Number.parseFloat((saldoHuchaPostTransaccion + transaction.cantidad).toFixed(2));
                }
                else if (transaction.tipo === 'gasto') {
                    saldoHuchaPostTransaccion = Number.parseFloat((saldoHuchaPostTransaccion - transaction.cantidad).toFixed(2));
                }
                huchaTransactions.push({
                    ...transaction,
                    saldoHuchaPostTransaccion: saldoHuchaPostTransaccion,
                });
            }
            huchaTransactions.reverse();

            setHuchaTransactions(huchaTransactions);
            setLoading(false);
        } catch (error: any) {
            Alert.alert("Error", "Error procesando transacciones: " + (error.message || 'Error desconocido'),
                [{ text: 'Cerrar aplicación', onPress: () => { BackHandler.exitApp(); } }]
            );
        }
    }

    const renderTransaction = (item: HuchaTransaction) => {
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
                        {item.saldoHuchaPostTransaccion}€
                    </Text>
                    <Text style={TransactionSectionStyles.transactionDate}>
                        {fechaString}
                    </Text>
                </View>
            </View>
        );
    };

    if (!hucha) return null;

    const huchaColor = hucha.color || Colors.primary;
    const progress = hucha.objetivo ? Math.min(hucha.saldo / hucha.objetivo, 1) : 0;
    const progressWidth = `${(progress * 100).toFixed(0)}%`;
    const fechaLimite = hucha.fecha_limite ? new Date(hucha.fecha_limite) : null;
    const fechaLimiteString = fechaLimite ? `${fechaLimite.getDate().toString().padStart(2, '0')}/${(fechaLimite.getMonth() + 1).toString().padStart(2, '0')}/${fechaLimite.getFullYear()}` : 'Sin fecha límite';
    const objetivoText = (`${hucha.saldo.toFixed(2)}€${hucha.objetivo ? ' / ' + hucha.objetivo.toFixed(2) + '€' : ''}`);

    const moneyColor = hucha.saldo < 0 ? Colors.alert : Colors.primary;

    return loading ? (
        <LoadingScreen fullWindow={true} />
    ) : (
        <View style={SectionStyles.mainContainer}>
            <ScrollView contentContainerStyle={SectionStyles.container}>
                <View style={SectionStyles.cardSection}>
                    <View style={styles.tituloContainer}>
                        <View style={[styles.colorTag, { backgroundColor: huchaColor }]} />
                        <Text style={SectionStyles.sectionTitle}>{hucha.nombre}</Text>
                    </View>
                    <View style={styles.dinero}>
                        <Text style={[MoneyStyles.currencySymbol, { color: moneyColor }]}>€</Text>
                        <Text style={[MoneyStyles.totalMoney, { color: moneyColor }]}>{hucha.saldo.toFixed(2)}</Text>
                    </View>
                    {
                        hucha.objetivo && (
                            <>
                                <View style={styles.objetivo}>
                                    <Text style={styles.objetivo}>Objetivo: {objetivoText}</Text>
                                    <Text style={styles.objetivo}>Fecha límite: {fechaLimiteString}</Text>
                                </View>
                                <View style={MoneyStyles.progressBar}>
                                    <View style={[MoneyStyles.progressFill, { width: progressWidth as any, backgroundColor: huchaColor }]} />
                                </View>
                            </>
                        )
                    }
                </View>

                {/* Últimos movimientos */}
                <View style={SectionStyles.cardSection}>
                    <Text style={SectionStyles.sectionTitle}>Últimos Movimientos</Text>
                    {huchaTransactions.length > 0 ? (
                        <>
                            {
                                huchaTransactions.map(item => renderTransaction(item))
                            }
                        </>
                    ) : (
                        <Text style={FontStyles.noDataText}>No hay movimientos</Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    tituloContainer: {
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
    },
    colorTag: {
        width: 20,
        height: 20,
        borderRadius: 4,
    },
    dinero: {
        ...SectionStyles.cardSection,
        padding: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    objetivo: {
        ...FontStyles.normalTextStyle,
        color: Colors.secondary, marginBottom: 8
    },
});

export default HuchaDetailsScreen;
