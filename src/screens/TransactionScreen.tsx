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
    // Elimina caracteres no numéricos salvo el punto decimal
    let cleaned = text.replace(/[^0-9.]/g, '');
    // Permitir solo un punto decimal
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    // Permitir borrar el campo
    if (cleaned === '') {
      setAmount('');
      setAmountError('');
      return;
    }
    const numericValue = parseFloat(cleaned);
    if (numericValue > 0) {
      setAmount(cleaned);
      setAmountError('');
    } else {
      setAmount(cleaned);
      setAmountError('La cantidad debe ser mayor que 0');
    }
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

      const newTransaction = await asyncExecuteSQL(
        db,
        `INSERT INTO Movimientos (tipo, cantidad, descripcion, fecha, hucha_id)
         VALUES (?, ?, ?, ?, ?);`,
        [mode, numericAmount, concepto, new Date(), null]
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
          onChangeText={setConcepto}
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
