// src/screens/HuchaDetailsScreen.tsx
import React, { FC, useLayoutEffect, useContext, useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal,
    BackHandler
} from 'react-native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Colors } from '../constants/colors';
import { AppContext } from '../context/ContextProvider';
import { Hucha, Transaction } from '../constants/typesAndInterfaces';
import { backToMain, loadHucha, loadTransactions } from '../utils/Utils';
import { FontStyles, SectionStyles, TransactionSectionStyles } from '../constants/generalStyles';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

type Props = NativeStackScreenProps<RootStackParamList, 'HuchaDetails'>;

const HuchaDetailsScreen: FC<Props> = ({ route }) => {
    const { huchaId } = route.params;
    const { db } = useContext(AppContext);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [hucha, setHucha] = useState<Hucha | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        loadData()
            .catch(error => {
                Alert.alert("Error cargando datos iniciales: " + error);
            });

    }, [db]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => deleteHuchaConfirmation()}>
                    <FontAwesome6 name="trash" iconStyle="solid" style={{color: Colors.secondary}}/>
                </TouchableOpacity>
            ),
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
        await loadHucha(db, setHucha, huchaId);
        await loadTransactions(db, setTransactions, undefined, huchaId);
    };


    // ——————————————————————————————————————————
    // Eliminar hucha (huchaVisible → 0)
    // ——————————————————————————————————————————
    const deleteHuchaConfirmation = () => {
        Alert.alert(
            "Eliminar Hucha",
            "¿Estás seguro de que quieres eliminar esta hucha?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Eliminar",
                    onPress: () => deleteHucha()
                }
            ],
            { cancelable: true }
        );
    };
    const deleteHucha = async () => {
        if (!db) return;
        await db.executeSql(
            'UPDATE huchas SET huchaVisible = 0 WHERE id = ?',
            [huchaId]
        );
        backToMain(navigation);
    };

    if (!hucha) return null;

    const objetivoString = hucha.objetivo
        ? `${hucha.objetivo.toFixed(2)} € · ${new Date(hucha.fecha_limite).toLocaleDateString()}`
        : '—';

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

    const moneyColor = hucha.saldo < 0 ? Colors.alert : Colors.primary;

    return (
        <View style={styles.mainContainer}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>{hucha.nombre}</Text>
                <Text style={styles.subtitle}>Objetivo: {objetivoString}</Text>

                <View style={styles.headerCard}>
                    <Text style={[styles.currencySymbol, { color: moneyColor }]}>€</Text>
                    <Text style={[styles.totalMoney, { color: moneyColor }]}>{hucha.saldo.toFixed(2)}</Text>
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
                        <Text style={FontStyles.noDataText}>No hay movimientos</Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    title: { fontSize: 24, fontWeight: 'bold' },
    subtitle: { fontSize: 14, color: Colors.secondary, marginBottom: 8 },
    balance: { fontSize: 32, fontWeight: 'bold', marginBottom: 16, color: Colors.primary },
    mainContainer: {
        position: 'relative',
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flexGrow: 1,
        backgroundColor: Colors.background,
        paddingHorizontal: 16,
        paddingTop: 16,
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
});

export default HuchaDetailsScreen;
