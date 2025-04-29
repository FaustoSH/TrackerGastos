// src/screens/HuchaDetailsScreen.tsx
import React, { FC, useLayoutEffect, useContext, useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Colors } from '../constants/colors';
import { AppContext } from '../context/ContextProvider';
import { Hucha, Transaction } from '../constants/typesAndInterfaces';
import { loadHucha, loadTransactions } from '../utils/Utils';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FontStyles, SectionStyles, TransactionSectionStyles } from '../constants/generalStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'HuchaDetails'>;

const HuchaDetailsScreen: FC<Props> = ({ route, navigation }) => {
    const { huchaId } = route.params;
    const { db } = useContext(AppContext);

    const [hucha, setHucha] = useState<Hucha | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [menuVisible, setMenuVisible] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);

    useEffect(() => {
        loadData()
            .catch(error => {
                Alert.alert("Error cargando datos iniciales: " + error);
            });

    }, [db]);

    const loadData = async () => {
        await loadHucha(db, setHucha, huchaId);
        await loadTransactions(db, setTransactions, undefined, huchaId);
    };


    // ——————————————————————————————————————————
    // Icono ⋮ en la cabecera
    // ——————————————————————————————————————————
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setMenuVisible(true)}>
                    <Icon name="dots-vertical" size={24} color={Colors.secondary} />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    // ——————————————————————————————————————————
    // Eliminar hucha (huchaVisible → 0)
    // ——————————————————————————————————————————
    const deleteHucha = async () => {
        if (!db) return;
        await db.executeSql(
            'UPDATE huchas SET huchaVisible = 0 WHERE id = ?',
            [huchaId]
        );
        setConfirmVisible(false);
        navigation.goBack();
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

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{hucha.nombre}</Text>
            <Text style={styles.subtitle}>Objetivo: {objetivoString}</Text>
            <Text style={styles.balance}>{hucha.saldo.toFixed(2)} €</Text>

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

            {/* Menú flotante — una única opción por ahora */}
            {menuVisible && (
                <TouchableOpacity style={styles.backdrop} onPress={() => setMenuVisible(false)}>
                    <View style={styles.menu}>
                        <TouchableOpacity onPress={() => { setMenuVisible(false); setConfirmVisible(true); }}>
                            <Text style={styles.menuItem}>Eliminar hucha</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            )}

            {/* Modal de confirmación */}
            <Modal transparent visible={confirmVisible} animationType="fade">
                <TouchableOpacity style={styles.backdrop} onPress={() => setConfirmVisible(false)}>
                    <View style={styles.modal}>
                        <Text style={styles.modalText}>¿Eliminar la hucha “{hucha.nombre}”?</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setConfirmVisible(false)}>
                                <Text style={styles.modalCancel}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={deleteHucha}>
                                <Text style={styles.modalDelete}>Eliminar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold' },
    subtitle: { fontSize: 14, color: Colors.secondary, marginBottom: 8 },
    balance: { fontSize: 32, fontWeight: 'bold', marginBottom: 16, color: Colors.primary },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginVertical: 8 },
    txItem: { paddingVertical: 8, borderBottomWidth: 0.5, borderColor: Colors.secondary },
    txAmount: { fontSize: 16, fontWeight: '600' },
    txDate: { fontSize: 12, color: Colors.secondary },
    txDesc: { fontSize: 14 },
    backdrop: { flex: 1, backgroundColor: '#0007', justifyContent: 'center', alignItems: 'center' },
    menu: { backgroundColor: '#fff', borderRadius: 8, padding: 12, minWidth: 160 },
    menuItem: { fontSize: 16, paddingVertical: 4 },
    modal: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '80%' },
    modalText: { fontSize: 16, marginBottom: 16 },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 24 },
    modalCancel: { fontSize: 16, color: Colors.secondary },
    modalDelete: { fontSize: 16, color: Colors.alert },
});

export default HuchaDetailsScreen;
