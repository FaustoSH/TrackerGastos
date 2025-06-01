import React, { FC, useEffect, useState, useContext, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, Text, Alert, BackHandler } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SectionStyles } from '../constants/generalStyles';
import { AppContext } from '../context/ContextProvider';
import { Transaction } from '../constants/typesAndInterfaces';
import { loadTransactions, backToMain } from '../utils/Utils';
import { Colors } from '../constants/colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import LoadingScreen from '../components/LoadingScreen';

type ReportsScreenRouteProp = RouteProp<RootStackParamList, 'ReportsScreen'>;
type ReportsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ReportsScreen'>;
interface ReportsScreenProps {
    route: ReportsScreenRouteProp;
    navigation: ReportsScreenNavigationProp;
}

const screenWidth = Dimensions.get('window').width - 32;

const ReportsScreen: FC<ReportsScreenProps> = ({ route, navigation }) => {
    const { db } = useContext(AppContext);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        loadData().catch(error => {
            Alert.alert("Error", "Error cargando datos iniciales: " + (error.message || 'Error desconocido'),
                [{ text: 'Cerrar aplicación', onPress: () => { BackHandler.exitApp(); } }]
            );
        });
    }, [db]);

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
                await loadTransactions(db, setTransactions);
                setLoading(false);
            }
        } catch (error) {
            throw error;
        }
    };

    const saldoSerie = useMemo(() => {
        if (!transactions.length) return { labels: [], data: [] };

        // 1. Ordenar transacciones
        const ordered = [...transactions].sort(
            (a, b) => +new Date(a.fecha) - +new Date(b.fecha)
        );

        // 2. Registrar el saldo final de cada día (última transacción del día sobrescribe anteriores)
        const saldoPorDia = new Map<string, number>();
        ordered.forEach(tx => {
            const key = new Date(tx.fecha).toISOString().split('T')[0];
            saldoPorDia.set(key, tx.saldoPostTransaccion);
        });

        // 3. Recorrer desde la primera fecha hasta hoy, rellenando huecos con el saldo anterior
        const firstDate = new Date(ordered[0].fecha);
        const today = new Date();

        const labels: string[] = [];
        const data: number[] = [];

        let cursor = new Date(firstDate);
        let ultimoSaldo = ordered[0].saldoPostTransaccion;

        while (cursor <= today) {
            const key = cursor.toISOString().split('T')[0];
            if (saldoPorDia.has(key)) {
                ultimoSaldo = saldoPorDia.get(key)!;
            }

            labels.push(
                `${cursor.getDate().toString().padStart(2, '0')}/` +
                `${(cursor.getMonth() + 1).toString().padStart(2, '0')}/` +
                `${cursor.getFullYear()}`
            );
            data.push(ultimoSaldo);
            cursor.setDate(cursor.getDate() + 1);
        }

        return { labels, data };
    }, [transactions]);


    const renderLine = (serie: { labels: string[]; data: number[] }) => {
        const totalPoints = serie.labels.length;
        if (!totalPoints) return null;

        const displayLabels = serie.labels.map((label, idx) =>
            label
        );

        const chartWidth = Math.max(screenWidth, totalPoints * 60); // 60 px por día
        const EXTRA_LABEL_SPACE = 90;
        const chartHeight = 260 + EXTRA_LABEL_SPACE;

        const validData = {
            labels: displayLabels,
            data: serie.data.map(d => (isNaN(d) ? 0 : d)),
        };

        return (
            <View style={SectionStyles.cardSection}>
                <Text style={SectionStyles.sectionTitle}>Saldo global</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator style={styles.chartContainer}>
                    <LineChart
                        data={{
                            labels: validData.labels,
                            datasets: [{ data: validData.data }],
                        }}
                        width={chartWidth}
                        height={chartHeight}
                        chartConfig={chartConfig}
                        bezier
                        style={{ borderRadius: 12 }}
                        formatYLabel={chartConfig.formatYLabel}
                        verticalLabelRotation={45}
                        yAxisInterval={1}
                    />
                </ScrollView>
            </View>
        );
    };

    return loading ? (
        <LoadingScreen fullWindow />
    ) : (
        <View style={SectionStyles.mainContainer}>
            <ScrollView contentContainerStyle={SectionStyles.container}>
                {renderLine(saldoSerie)}
            </ScrollView>
        </View>
    );
};

const chartConfig = {
    backgroundGradientFrom: Colors.cardBackground,
    backgroundGradientTo: Colors.cardBackground,
    decimalPlaces: 0,
    color: () => Colors.primary,
    labelColor: () => Colors.text,
    propsForDots: { r: '3' },
    formatYLabel: (value: string) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0' : num.toFixed(0);
    },
};

const styles = StyleSheet.create({
    chartContainer: {
        marginTop: 16,
    }
});

export default ReportsScreen;
