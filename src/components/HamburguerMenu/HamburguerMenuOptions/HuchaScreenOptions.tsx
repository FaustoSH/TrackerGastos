import { Alert, BackHandler, Platform, Text, TouchableOpacity } from "react-native";
import { HamburgerMenuStyles } from "../../../constants/generalStyles";
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import RNRestart from 'react-native-restart';
import {
    pick,
    errorCodes,
    isErrorWithCode,
    types,
} from '@react-native-documents/picker';
import { FC, useContext } from "react";
import { AppContext } from "../../../context/ContextProvider";
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { Colors } from "../../../constants/colors";
import { wipeDatabase } from "../../../database/database";
import { SQLiteDatabase } from "react-native-sqlite-storage";
import { appVersion, backToMain } from "../../../utils/Utils";

interface HuchaScreenOptionsProps {
    setMenuVisible?: (visible: boolean) => void;
    setLoading: (loading: boolean) => void;
    navigation: any; // Navegación opcional para volver a la pantalla principal
    huchaId: number; // ID de la hucha para eliminar
}

export const HuchaScreenOptions: FC<HuchaScreenOptionsProps> = ({ setMenuVisible, setLoading, navigation, huchaId }) => {
    const { db } = useContext(AppContext);

    // ——————————————————————————————————————————
    // Eliminar hucha (huchaVisible → 0)
    // ——————————————————————————————————————————
    const deleteHuchaConfirmation = async () => {
        try {
            const confirmed = await new Promise<boolean>((resolve) => {
                Alert.alert(
                    "Eliminar hucha",
                    "¿Estás seguro de que deseas eliminar esta hucha? Esta acción no se puede deshacer.",
                    [
                        { text: "Cancelar", onPress: () => resolve(false) },
                        { text: "Eliminar", onPress: () => resolve(true) }
                    ]
                );
            });
            if (confirmed && db) {
                setMenuVisible?.(false); // Cerrar el menú si está abierto
                setLoading?.(true);
                await db.executeSql(
                    'UPDATE huchas SET huchaVisible = 0 WHERE id = ?',
                    [huchaId]
                );
                Alert.alert("Hucha eliminada", "La hucha ha sido eliminada correctamente.");
                setLoading?.(false);
                backToMain(navigation);
            }
        } catch (error: any) {
            setLoading?.(false);
            Alert.alert("Error", "Error eliminando la hucha: " + (error.message || 'Error desconocido'));
        }
    };

    return (
        <>
            <TouchableOpacity style={HamburgerMenuStyles.menuOption} onPress={() => { setMenuVisible?.(false); navigation.navigate('NewEditPiggyBank', { huchaId: huchaId }) }}>
                <Text style={HamburgerMenuStyles.menuOptionText}>Editar hucha</Text>
            </TouchableOpacity>
            <TouchableOpacity style={HamburgerMenuStyles.deleteOption} onPress={() => deleteHuchaConfirmation()}>
                <FontAwesome6 name="trash" iconStyle="solid" style={{ color: Colors.alert, fontSize: 16 }} />
            </TouchableOpacity>
        </>
    );
};
