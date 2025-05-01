// src/screens/TransactionScreen.tsx
import React, { FC, useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  BackHandler
} from 'react-native';
import { Colors } from '../constants/colors';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { asyncExecuteSQL } from '../database/database';
import { AppContext } from '../context/ContextProvider';
import { Hucha, Transaction } from '../constants/typesAndInterfaces';
import { backToMain, handleNumericChange, handleTextChange, loadHuchas } from '../utils/Utils';
import LoadingScreen from '../components/LoadingScreen';
import { Picker } from '@react-native-picker/picker';

type TransactionScreenRouteProp = RouteProp<RootStackParamList, 'Transaction'>;
type TransactionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Transaction'>;

interface TransactionScreenProps {
  route: TransactionScreenRouteProp;
  navigation: TransactionScreenNavigationProp;
}

const TransactionScreen: FC<TransactionScreenProps> = ({ route, navigation }) => {
  const { mode } = route.params;
  const { db } = useContext(AppContext);
  const [loading, setLoading] = useState<boolean>(true)
  const [amount, setAmount] = useState<string>('');
  const [concepto, setConcepto] = useState<string>('');
  const [usePiggyBank, setUsePiggyBank] = useState<boolean>(false);
  const [huchas, setHuchas] = useState<Hucha[]>([]);
  const [selectedHucha, setSelectedHucha] = useState<number | null>(null);
  const [modoTransferenciaSaldo, setModoTransferenciaSaldo] = useState<boolean>(false);


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
        ]
        await Promise.all(promises)
        setLoading(false);
      }
    } catch (error) {
      throw error;
    }
  }

  const handleSave = async (): Promise<void> => {
    try {
      if (!db) {
        throw new Error("Base de datos no inicializada")
      }

      if (usePiggyBank && selectedHucha === null) {
        throw new Error("Debe seleccionar una hucha")
      }

      const numericAmount = Number.parseFloat(Number.parseFloat(amount).toFixed(2));

      const saldoActualQuery = await asyncExecuteSQL(
        db,
        `SELECT saldoPostTransaccion
        FROM Movimientos
        ORDER BY fecha DESC, id DESC
        LIMIT 1;`
      );
      let saldoActual = saldoActualQuery?.rows?.length > 0 ? (saldoActualQuery.rows.item(0) as Transaction).saldoPostTransaccion : 0;

      // Si el modo es transferencia de saldo, no se modifica el saldo actual, sino que se hace una transferencia desde / hacia el saldo no asignado y la hucha seleccionada
      let nuevoSaldoPostTransaccion = undefined;
      if (mode === "gasto" && !modoTransferenciaSaldo) {
        nuevoSaldoPostTransaccion = Number.parseFloat((saldoActual - numericAmount).toFixed(2));
      } else if (mode === "ingreso" && !modoTransferenciaSaldo) {
        nuevoSaldoPostTransaccion = Number.parseFloat((saldoActual + numericAmount).toFixed(2));
      } else if (modoTransferenciaSaldo) {
        nuevoSaldoPostTransaccion = saldoActual;
      }

      const newTransaction = await asyncExecuteSQL(
        db,
        `INSERT INTO Movimientos (tipo, cantidad, saldoPostTransaccion, descripcion, fecha, hucha_id, modoTransferencia)
         VALUES (?, ?, ?, ?, DATETIME('now'), ?, ?);`,
        [mode, numericAmount, nuevoSaldoPostTransaccion, concepto, selectedHucha, (modoTransferenciaSaldo ? 1 : 0)]
      );

      backToMain(navigation);
    } catch (error: any) {
      Alert.alert('Error al guardar el movimiento: ', error.message || 'Error desconocido');
    }
  };

  const modoTransferenciaChange = (value: boolean) => {
    if (value) {
      const textoAlerta = mode == 'gasto' ? "¿Estás seguro de que quieres hacer una transferencia desde la hucha seleccionada hacia el saldo no asignado?" : "¿Estás seguro de que quieres hacer una transferencia desde el saldo no asignado hacia la hucha seleccionada?"
      Alert.alert(
        "Transferencia de saldo",
        textoAlerta,
        [
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => setModoTransferenciaSaldo(false)
          },
          {
            text: "Aceptar",
            onPress: () => {
              setModoTransferenciaSaldo(value)
              const hucha = huchas.find(h => h.id === selectedHucha)
              const huchaNombre = hucha ? hucha.nombre : "";
              const textoConcepto = mode == 'gasto' ? `Transferencia hucha->saldo ${huchaNombre}` : `Transferencia saldo->hucha ${huchaNombre}`;
              setConcepto(textoConcepto)
            }
          }
        ],
        { cancelable: true }
      );
    } else {
      setModoTransferenciaSaldo(value)
      setConcepto("")
    }
  }

  return loading ? (
    <LoadingScreen fullWindow={true} />
  ) : (
    <View style={styles.container}>
      <Text style={styles.title}>
        {mode === 'gasto' ? 'Añadir Gasto' : 'Añadir Ingreso'}
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Cantidad</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={amount}
          onChangeText={(text) => handleNumericChange(text, setAmount)}
          placeholder="0.00"
          placeholderTextColor={Colors.secondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Concepto</Text>
        <TextInput
          style={[
            styles.input,
            modoTransferenciaSaldo && { backgroundColor: '#e0e0e0', color: '#666' }
          ]}
          value={concepto}
          onChangeText={(text) => handleTextChange(text, setConcepto, 50)}
          placeholder="Concepto (opcional)"
          placeholderTextColor={Colors.secondary}
          editable={!modoTransferenciaSaldo}
        />
      </View>

      <View style={styles.formGroupRow}>
        <Text style={styles.label}>
          {mode === 'gasto' ? 'Extraer de hucha' : 'Asignar a hucha'}
        </Text>
        <Switch value={usePiggyBank} onValueChange={setUsePiggyBank} />
      </View>

      {usePiggyBank && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Selecciona Hucha</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedHucha}
              onValueChange={(value) => setSelectedHucha(value)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Selecciona una hucha" value={null} />
              {huchas.map((h) => (
                <Picker.Item key={h.id.toString()} label={h.nombre} value={h.id} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {usePiggyBank && selectedHucha && (
        <View style={styles.formGroupRow}>
          <Text style={styles.label}>Activar transferencia de saldo</Text>
          <Switch value={modoTransferenciaSaldo} onValueChange={modoTransferenciaChange} />
        </View>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.text,
  },
  formGroup: {
    marginBottom: 15,
  },
  formGroupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: Colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 4,
    padding: 10,
    color: Colors.text,
  },
  errorText: {
    marginTop: 4,
    color: 'red',
    fontSize: 14,
  },
  pickerPlaceholder: {
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 4,
    color: Colors.text,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 4,
  },
  picker: {
    width: '100%',
    color: Colors.text,
  },
  pickerItem: {
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default TransactionScreen;
