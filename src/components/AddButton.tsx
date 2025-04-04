// components/AddButton.tsx
import React, { useState, FC } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
} from 'react-native';
import { Colors } from '../constants/colors';

interface AddButtonProps {
    onOptionSelect?: (option: string) => void;
}

const AddButton: FC<AddButtonProps> = ({ onOptionSelect }) => {
    const [menuVisible, setMenuVisible] = useState<boolean>(false);

    const handleOptionPress = (option: string): void => {
        if (onOptionSelect) {
            onOptionSelect(option);
        }
        setMenuVisible(false);
    };

    return (
        <>
            {/* Botón "+" */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setMenuVisible(!menuVisible)}
            >
                <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>

            {/* Menú anclado al botón */}
            {menuVisible && (
                <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                    <View style={styles.overlay}>
                        {/* Evitamos que el toque dentro del menú cierre el overlay */}
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View style={styles.menuContainer}>
                                <TouchableOpacity
                                    style={styles.menuOption}
                                    onPress={() => handleOptionPress('nuevoGasto')}
                                >
                                    <Text style={styles.menuOptionText}>Añadir gasto</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.menuOption}
                                    onPress={() => handleOptionPress('nuevoIngreso')}
                                >
                                    <Text style={styles.menuOptionText}>Añadir ingreso</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.menuOption}
                                    onPress={() => handleOptionPress('nuevaHucha')}
                                >
                                    <Text style={styles.menuOptionText}>Crear hucha</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    // Botón "+"
    addButton: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: Colors.primary,
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 30,
    },

    // Overlay que ocupa toda la pantalla
    overlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        // Se puede ajustar la opacidad si se desea, aunque al usar el mismo color se fusiona visualmente
        backgroundColor: 'rgba(0,0,0,0.2)',
    },

    // Menú con el mismo color verde que el botón, posicionado para que toque el botón
    menuContainer: {
        position: 'absolute',
        right: 50,
        bottom: 50,
        width: 150,
        backgroundColor: Colors.primary,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 0, // Se funde con el botón
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },

    // Estilos para cada opción del menú
    menuOption: {
        paddingVertical: 10,
    },
    menuOptionText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#fff',
    },
});

export default AddButton;
