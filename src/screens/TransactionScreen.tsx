// src/screens/TransactionScreen.tsx
import React, { FC, useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import { Colors } from '../constants/colors';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { asyncExecuteSQL } from '../database/database';
import { AppContext } from '../context/ContextProvider';
import { Transaction } from '../constants/typesAndInterfaces';

type TransactionScreenRouteProp = RouteProp<RootStackParamList, 'Transaction'>;
type TransactionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Transaction'>;

interface TransactionScreenProps {
  route: TransactionScreenRouteProp;
  navigation: TransactionScreenNavigationProp;
}

const TransactionScreen: FC<TransactionScreenProps> = ({ route, navigation }) => {
  const { mode } = route.params;
  const { db } = useContext(AppContext);
  const [amount, setAmount] = useState<string>('');
  const [concepto, setConcepto] = useState<string>('');
  const [usePiggyBank, setUsePiggyBank] = useState<boolean>(false);
  const [amountError, setAmountError] = useState<string>('');

  const handleAmountChange = (text: string): void => {
    // Elimina caracteres que no sean dígitos o punto decimal
    let cleaned = text.replace(/[^0-9.]/g, '');

    // Permitir sólo un punto decimal: se conserva el primero y se eliminan los siguientes
    const dotIndex = cleaned.indexOf('.');
    if (dotIndex !== -1) {
      // Conserva el primer punto y elimina cualquier otro en el resto de la cadena
      cleaned =
        cleaned.substring(0, dotIndex + 1) +
        cleaned.substring(dotIndex + 1).replace(/\./g, '');
    }

    // Limitar la parte decimal a dos dígitos
    if (dotIndex !== -1) {
      const integerPart = cleaned.substring(0, dotIndex);
      // Obtiene sólo los dos primeros dígitos después del punto
      const decimalPart = cleaned.substring(dotIndex + 1, dotIndex + 3);
      cleaned = integerPart + '.' + decimalPart;
    }

    // Permitir borrar el campo (también si el usuario escribe solo el punto)
    if (cleaned === '' || cleaned === '.') {
      setAmount('');
      setAmountError('');
      return;
    }

    const numericValue = parseFloat(cleaned);

    if (isNaN(numericValue) || numericValue <= 0) {
      setAmount(cleaned);
      setAmountError('La cantidad debe ser mayor que 0');
    } else {
      setAmount(cleaned);
      setAmountError('');
    }
  };

  const handleConceptoChange = (text: string): void => {
    // Elimina cualquier carácter que no sea letra, número o espacio.
    // Si necesitas soportar letras acentuadas o caracteres internacionales,
    // puedes usar la expresión regular Unicode: /[^\p{L}\p{N} ]/gu
    let cleaned = text.replace(/[^a-zA-Z0-9 ]/g, '');
    
    // Trunca a 50 caracteres si es necesario
    if (cleaned.length > 50) {
      cleaned = cleaned.substring(0, 50);
    }
    
    setConcepto(cleaned);
  };
  


  const handleSave = async (): Promise<void> => {
    try {
      if (!db) {
        throw new Error("Base de datos no inicializada")
      }

      const numericAmount = parseFloat(amount);
      if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
        setAmountError('Por favor, ingresa una cantidad válida mayor que 0');
        return;
      }

      const saldoActualQuery = await asyncExecuteSQL(
        db,
        `SELECT saldoPostTransaccion
        FROM Movimientos
        ORDER BY fecha DESC, id DESC
        LIMIT 1;`
      );
      const saldoActual = saldoActualQuery?.rows?.length > 0 ? (saldoActualQuery.rows.item(0) as Transaction).saldoPostTransaccion : 0;
      const nuevoSaldoPostTransaccion = mode === "gasto" ? saldoActual - numericAmount : saldoActual + numericAmount;
      const newTransaction = await asyncExecuteSQL(
        db,
        `INSERT INTO Movimientos (tipo, cantidad, saldoPostTransaccion, descripcion, fecha, hucha_id)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [mode, numericAmount, nuevoSaldoPostTransaccion, concepto, new Date(), null]
      );

      navigation.navigate('Main');
    } catch (error) {
      console.error('Error guardando la transacción:', error);
      Alert.alert('Error al guardar el movimiento');
    }
  };

  return (
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
          onChangeText={handleAmountChange}
          placeholder="0.00"
          placeholderTextColor={Colors.secondary}
        />
        {amountError !== '' && <Text style={styles.errorText}>{amountError}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Concepto</Text>
        <TextInput
          style={styles.input}
          value={concepto}
          onChangeText={handleConceptoChange}
          placeholder="Concepto (opcional)"
          placeholderTextColor={Colors.secondary}
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
          {/* Aquí se puede implementar un dropdown o picker para seleccionar la hucha */}
          <Text style={styles.pickerPlaceholder}>[Dropdown de huchas]</Text>
        </View>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
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
