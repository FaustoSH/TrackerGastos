// src/screens/NewPiggyBankScreen.tsx
import React, { FC, useState, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Switch,
    Alert,
    Platform,
    Modal,
    BackHandler,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors } from '../constants/colors';
import Slider from '@react-native-community/slider';
import { AppContext } from '../context/ContextProvider';
import { asyncExecuteSQL } from '../database/database';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { backToMain, handleNumericChange, handleTextChange } from '../utils/Utils';
import { useFocusEffect, useNavigation } from '@react-navigation/native';


const NewPiggyBankScreen: FC = () => {
    const { db } = useContext(AppContext);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [nombre, setNombre] = useState<string>('');
    const [color, setColor] = useState<string>(Colors.primary); // Color por defecto
    const [objectiveToggle, setObjectiveToggle] = useState<boolean>(false);
    const [objetivo, setObjetivo] = useState<string>('');
    const [fechaLimite, setFechaLimite] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

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

    /**
     * Maneja la selección de fecha desde el DateTimePicker.
     */
    const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date): void => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setFechaLimite(selectedDate);
        }
    };

    // Añadir después de los imports
    const hslToHex = (h: number): string => {
        const s = 1;
        const l = 0.5;
        const a = s * Math.min(l, 1 - l);
        const f = (n: number) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    };

    /**
     * Maneja el guardado de la nueva hucha.
     */
    const handleSave = async (): Promise<void> => {
        if (!nombre.trim()) {
            Alert.alert('Error', 'El nombre de la hucha es obligatorio.');
            return;
        }

        let objetivoValue: number | null = null;
        let fechaLimiteString: string | null = null;
        if (objectiveToggle) {
            objetivoValue = parseFloat(objetivo);
            if (isNaN(objetivoValue) || objetivoValue <= 0) {
                Alert.alert('Error', 'El objetivo debe ser un número mayor que 0.');
                return;
            }
            // Formatear fecha a YYYY-MM-DD
            const year = fechaLimite.getFullYear();
            const month = (fechaLimite.getMonth() + 1).toString().padStart(2, '0');
            const day = fechaLimite.getDate().toString().padStart(2, '0');
            fechaLimiteString = `${year}-${month}-${day}`;
        }

        if (!db) {
            Alert.alert('Error', 'La base de datos no está inicializada.');
            return;
        }

        try {
            await asyncExecuteSQL(
                db,
                `INSERT INTO Huchas (nombre, saldo, color, objetivo, fecha_limite, huchaVisible)
                VALUES (?, ?, ?, ?, ?, 1);`,
                [
                    nombre.trim(),
                    0, // Saldo inicial en 0
                    "#" + color,
                    objectiveToggle ? objetivoValue : null,
                    objectiveToggle ? fechaLimiteString : null,
                ]
            );
            backToMain(navigation);
        } catch (err) {
            console.error('Error al crear hucha:', err);
            Alert.alert('Error', 'No se pudo crear la hucha');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Crear Hucha</Text>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre de la hucha</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Nombre"
                    value={nombre}
                    onChangeText={(text) => handleTextChange(text, setNombre, 50)}
                    placeholderTextColor={Colors.secondary}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Color de etiqueta</Text>
                <View style={styles.colorPickerContainer}>
                    <View style={styles.colorInputContainer}>
                        <TextInput
                            style={styles.colorInput}
                            value={"#" + color}
                            onChangeText={(text) => handleTextChange(text, setColor, 6)}
                            placeholder={Colors.primary}
                            placeholderTextColor={Colors.secondary}
                        />
                        <View style={[styles.colorPreview, { backgroundColor: `#${color}` }]} />
                    </View>
                    <View style={styles.sliderContainer}>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={360}
                            value={140}
                            onValueChange={(value) => {
                                const hexColor = hslToHex(value);
                                setColor(hexColor.substring(1)); // Removemos el # inicial
                            }}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.formGroupRow}>
                <Text style={styles.label}>Establecer objetivo</Text>
                <Switch value={objectiveToggle} onValueChange={setObjectiveToggle} />
            </View>

            {objectiveToggle && (
                <>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Dinero objetivo</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Objetivo"
                            value={objetivo}
                            onChangeText={(text) => handleNumericChange(text, setObjetivo)}
                            keyboardType="numeric"
                            placeholderTextColor={Colors.secondary}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Fecha límite</Text>
                        <TouchableOpacity
                            style={styles.dateInput}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={styles.dateText}>
                                {fechaLimite.toLocaleDateString()}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={fechaLimite}
                                mode="date"
                                display="default"
                                onChange={onChangeDate}
                            />
                        )}
                    </View>
                </>
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
        fontSize: 24,
        fontWeight: '700',
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
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.secondary,
        borderRadius: 4,
        padding: 10,
        color: Colors.text,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: Colors.secondary,
        borderRadius: 4,
        padding: 10,
        justifyContent: 'center',
    },
    dateText: {
        fontSize: 16,
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
    colorPickerContainer: {
        width: '100%',
    },
    colorInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    colorInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: Colors.secondary,
        borderRadius: 4,
        padding: 10,
        color: Colors.text,
        marginRight: 10,
    },
    colorPreview: {
        width: 40,
        height: 40,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.secondary,
    },
    sliderContainer: {
        height: 40,
        width: '100%',
    },
    slider: {
        width: '100%',
        height: 40,
    },
});

export default NewPiggyBankScreen;
