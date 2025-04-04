import React, { FC } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';
import AddButton from '../components/AddButton';

const MainScreen: FC = () => {
  const handleOptionSelect = (option: string): void => {
    // Aquí se puede implementar la lógica para cada opción, por ejemplo, navegar a otro formulario.
    console.log("Opción seleccionada:", option);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Dinero Total */}
      <View style={styles.totalMoneyContainer}>
        <Text style={styles.label}>Dinero Total</Text>
        <Text style={styles.amount}>$0.00</Text>
      </View>
      {/* Sección de Huchas */}
      <View style={styles.huchasContainer}>
        <Text style={styles.sectionTitle}>Huchas</Text>
        <Text>Listado de huchas (aún sin datos)</Text>
      </View>
      {/* Últimos Movimientos */}
      <View style={styles.movementsContainer}>
        <Text style={styles.sectionTitle}>Últimos Movimientos</Text>
        <Text>Listado de movimientos (aún sin datos)</Text>
      </View>
      {/* Botón de "+" */}
      <AddButton onOptionSelect={handleOptionSelect} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  totalMoneyContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 24,
    marginTop: 8,
  },
  huchasContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  movementsContainer: {
    marginTop: 20,
  },
});

export default MainScreen;
