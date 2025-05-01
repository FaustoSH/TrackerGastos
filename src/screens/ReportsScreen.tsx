// src/screens/ReportsScreen.tsx
import React, { FC, useEffect, useState, useContext } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Text, Alert, BackHandler } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import * as XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { FontStyles, SectionStyles } from '../constants/generalStyles';
import { AppContext } from '../context/ContextProvider';
import { Transaction, Hucha } from '../constants/typesAndInterfaces';
import { loadTransactions, loadHuchas, backToMain } from '../utils/Utils';
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
const screenWidth = Dimensions.get('window').width - 32;   // padding lateral

const ReportsScreen: FC<ReportsScreenProps> = ({ route, navigation }) => {
    const { db } = useContext(AppContext);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [huchas, setHuchas] = useState<Hucha[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        loadData()
            .catch(error => {
                Alert.alert("Error cargando datos iniciales: " + error)
            })
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
                const promises = [
                    loadHuchas(db, setHuchas),
                    loadTransactions(db, setTransactions),
                ];
                await Promise.all(promises);
                setLoading(false);
            }
        } catch (error) {
            throw error;
        }
    };

    /* ---------- helpers de transformación ---------- */
    const saldoSerie = React.useMemo(() => {
        const ordered = [...transactions].sort((a, b) => +new Date(a.fecha) - +new Date(b.fecha));
        return {
            labels: ordered.map(t => new Date(t.fecha).toLocaleDateString()),
            data: ordered.map(t => Number(t.saldoPostTransaccion) || 0), // Asegurar número válido
        };
    }, [transactions]);

    const huchasAgregadoSerie = React.useMemo(() => {
        const map: Record<string, number> = {};
        transactions.forEach(t => {
            const d = new Date(t.fecha).toLocaleDateString();
            map[d] = (map[d] ?? 0) + (Number(t.saldoHuchaPostTransaccion) || 0); // Asegurar número válido
        });
        return {
            labels: Object.keys(map),
            data: Object.values(map),
        };
    }, [transactions]);

    const porHuchaSeries = React.useMemo(() => {
        const result: Record<number, { labels: string[]; data: number[]; nombre: string }> = {};
        huchas.forEach(h => {
            result[h.id] = { labels: [], data: [], nombre: h.nombre };
        });
        const ordered = [...transactions].sort((a, b) => +new Date(a.fecha) - +new Date(b.fecha));
        ordered.forEach(t => {
            if (result[t.hucha_id]) {
                result[t.hucha_id].labels.push(new Date(t.fecha).toLocaleDateString());
                result[t.hucha_id].data.push(t.saldoHuchaPostTransaccion);
            }
        });
        return Object.values(result);
    }, [transactions, huchas]);

    /* ---------- exportaciones ---------- */
    const exportToExcel = async () => {
        try {
            // hoja 1: saldo
            const ws1 = XLSX.utils.json_to_sheet(
                saldoSerie.labels.map((l, i) => ({ Fecha: l, Saldo: saldoSerie.data[i] }))
            );
            // hoja 2: agregado huchas
            const ws2 = XLSX.utils.json_to_sheet(
                huchasAgregadoSerie.labels.map((l, i) => ({ Fecha: l, SaldoHuchas: huchasAgregadoSerie.data[i] }))
            );
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws1, 'Saldo');
            XLSX.utils.book_append_sheet(wb, ws2, 'Huchas-Agregadas');
            
            porHuchaSeries.forEach(s => {
                const ws = XLSX.utils.json_to_sheet(
                    s.labels.map((l, i) => ({ Fecha: l, Saldo: s.data[i] }))
                );
                XLSX.utils.book_append_sheet(wb, ws, s.nombre);
            });
    
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

    /* ---------- render ---------- */
    const renderLine = (serie: { labels: string[]; data: number[] }, title: string) => {
        // Filtrar y validar datos antes de renderizar
        const validData = {
            labels: serie.labels,
            data: serie.data.map(d => isNaN(d) ? 0 : d)
        };
    
        return (
            <View style={styles.chartCard} key={title}>
                <Text style={SectionStyles.sectionTitle}>{title}</Text>
                <LineChart
                    data={{
                        labels: validData.labels,
                        datasets: [{ data: validData.data }],
                    }}
                    width={screenWidth}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={{ borderRadius: 12, marginVertical: 8 }}
                    formatYLabel={(value) => chartConfig.formatYLabel(value)}
                />
            </View>
        );
    };
    return loading ? (
        <LoadingScreen fullWindow={true} />
    ) : (
        <View style={styles.container}>
            {/* barra superior */}
            <View style={styles.header}>
                <Text style={FontStyles.h2Style}>Informes</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={exportToExcel}>
                        <FontAwesome6 name="file-csv" iconStyle="solid" style={{ color: Colors.primary, fontSize: 25 }} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={exportToPDF}>
                        <FontAwesome6 name="file-pdf" iconStyle="solid" style={{ color: Colors.primary, fontSize: 25 }} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {renderLine(saldoSerie, 'Saldo global')}
                {renderLine(huchasAgregadoSerie, 'Huchas (todas)')}
                {porHuchaSeries.map(s => renderLine(s, `Hucha — ${s.nombre}`))}
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
    // Modificar el formatNumber para manejar mejor los números
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
