import React, { FC, useEffect, useState, useContext, useLayoutEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Text, Alert, BackHandler } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import * as XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { FontStyles, SectionStyles } from '../constants/generalStyles';
import { AppContext } from '../context/ContextProvider';
import { Transaction } from '../constants/typesAndInterfaces';
import { loadTransactions, backToMain } from '../utils/Utils';
import { Colors } from '../constants/colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import LoadingScreen from '../components/LoadingScreen';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

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
        loadData()
            .catch(error => {
                Alert.alert("Error cargando datos iniciales: " + error)
            })
    }, [db]);

    useLayoutEffect(() => {
        navigation.setOptions({
          headerRight: () => (
            <View style={styles.headerButtons}>
                <TouchableOpacity onPress={() => exportToExcel()}>
                    <FontAwesome6 name="file-excel" iconStyle="solid" style={{ color: Colors.primary }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => exportToPDF()}>
                    <FontAwesome6 name="file-pdf" iconStyle="solid" style={{ color: Colors.primary  }} />
                </TouchableOpacity>
            </View>
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
        try {
            if (db) {
                await loadTransactions(db, setTransactions);
                setLoading(false);
            }
        } catch (error) {
            throw error;
        }
    };

    const saldoSerie = React.useMemo(() => {
        const ordered = [...transactions].sort((a, b) => +new Date(a.fecha) - +new Date(b.fecha));

        // Agrupar por fecha (día)
        const dailyData = ordered.reduce((acc: { [key: string]: number }, curr) => {
            const date = new Date(curr.fecha).toISOString().split('T')[0];
            acc[date] = Number(curr.saldoPostTransaccion) || 0;
            return acc;
        }, {});

        // Convertir a arrays para el gráfico
        const dates = Object.keys(dailyData);
        const values = Object.values(dailyData);

        return {
            labels: dates.map(d => new Date(d).toLocaleDateString()),
            data: values,
        };
    }, [transactions]);

    const exportToExcel = async () => {
        try {
            const ws = XLSX.utils.json_to_sheet(
                saldoSerie.labels.map((l, i) => ({ Fecha: l, Saldo: saldoSerie.data[i] }))
            );

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Saldo');

            const filePath = `${RNFS.CachesDirectoryPath}/informes.xlsx`;
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

            await RNFS.writeFile(filePath, wbout, 'base64');

            await Share.open({
                url: `file://${filePath}`,
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                filename: 'informes.xlsx'
            });
        } catch (e) {
            Alert.alert('Error al exportar', String(e));
        }
    };

    const exportToPDF = async () => {
        try {
            const htmlTableRows = saldoSerie.labels
                .map((l, i) => `<tr><td>${l}</td><td>${saldoSerie.data[i]}</td></tr>`)
                .join('');

            const html = `
            <html><body>
              <h1>Informe de evolución del saldo</h1>
              <table border="1" cellpadding="4" cellspacing="0">
                <thead><tr><th>Fecha</th><th>Saldo</th></tr></thead>
                <tbody>${htmlTableRows}</tbody>
              </table>
            </body></html>`;

            const options = {
                html,
                fileName: 'informes',
                directory: 'Documents',
            };

            const file = await RNHTMLtoPDF.convert(options);

            await Share.open({
                url: `file://${file.filePath}`,
                type: 'application/pdf',
                filename: 'informes.pdf'
            });
        } catch (e) {
            Alert.alert('Error al exportar', String(e));
        }
    };

    const renderLine = (serie: { labels: string[]; data: number[] }) => {
        const validData = {
            labels: serie.labels,
            data: serie.data.map(d => isNaN(d) ? 0 : d)
        };
    
        return (
            <View style={styles.chartCard}>
                <Text style={SectionStyles.sectionTitle}>Saldo global</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <LineChart
                        data={{
                            labels: validData.labels,
                            datasets: [{ data: validData.data }],
                        }}
                        width={Math.max(screenWidth, validData.labels.length * 50)} // Asegura un mínimo de 50px por etiqueta
                        height={220}
                        chartConfig={chartConfig}
                        bezier
                        style={{ borderRadius: 12, marginVertical: 8 }}
                        formatYLabel={(value) => chartConfig.formatYLabel(value)}
                        horizontalLabelRotation={45}
                        yAxisInterval={1}
                    />
                </ScrollView>
            </View>
        );
    };

    return loading ? (
        <LoadingScreen fullWindow={true} />
    ) : (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {renderLine(saldoSerie)}
            </ScrollView>
        </View>
    );
};

const chartConfig = {
    backgroundGradientFrom: Colors.cardBackground,
    backgroundGradientTo: Colors.cardBackground,
    decimalPlaces: 2,
    color: () => Colors.primary,
    labelColor: () => Colors.text,
    propsForDots: { r: '3' },
    formatYLabel: (value: string) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0' : num.toFixed(2);
    }
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    chartCard: { ...SectionStyles.cardSection },
    header: {
        paddingTop: 24,
        paddingHorizontal: 16,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerButtons: { flexDirection: 'row', gap: 12 },
});

export default ReportsScreen;