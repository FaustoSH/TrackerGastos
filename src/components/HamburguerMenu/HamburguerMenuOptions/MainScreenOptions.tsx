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
import { appVersion } from "../../../utils/Utils";

interface MainScreenOptionsProps {
    setMenuVisible?: (visible: boolean) => void;
    navigation: any; 
}

export const MainScreenOptions: FC<MainScreenOptionsProps> = ({ setMenuVisible, navigation }) => {
    const { db, setGeneralLoading } = useContext(AppContext);

    const handleExport = async () => {
        try {
            setMenuVisible?.(false); // Cerrar el menú si está abierto
            const confirmed = await new Promise<boolean>((resolve) => {
                Alert.alert(
                    "Exportar base de datos",
                    "¿Deseas exportar la base de datos actual como archivo .db?",
                    [
                        { text: "Cancelar", onPress: () => resolve(false) },
                        { text: "Exportar", onPress: () => resolve(true) }
                    ]
                );
            });
            if (!confirmed) return;
            const dbName = "TrackerGastos.db";
            // Ruta de la base de datos actual en el dispositivo
            const sourcePath = Platform.OS === 'android'
                ? `${RNFS.DocumentDirectoryPath}/../databases/${dbName}`
                : `${RNFS.LibraryDirectoryPath}/LocalDatabase/${dbName}`;
            // Copiar el archivo .db a una ruta temporal y compartirlo
            const destPath = `${RNFS.CachesDirectoryPath}/${dbName}`;
            setGeneralLoading(true);
            await RNFS.copyFile(sourcePath, destPath);
            await Share.open({
                url: `file://${destPath}`,
                type: 'application/octet-stream',
                filename: dbName
            });
            // Eliminar el archivo temporal después de compartir
            await RNFS.unlink(destPath);
            setGeneralLoading(false);
            Alert.alert(
                "Exportación exitosa",
                "La base de datos se ha exportado correctamente. Puedes encontrar el archivo en tu carpeta de descargas o en la ubicación que hayas seleccionado.",
            );
        } catch (error: any) {
            setGeneralLoading(false);
            if (error?.message === 'User did not share') {
                return;
            }
            Alert.alert('Error', 'Error al exportar la base de datos: ' + (error.message || "Error desconocido"));
        }
    };

    const handleImport = async () => {
        try {
            setMenuVisible?.(false); // Cerrar el menú si está abierto
            const confirmed = await new Promise<boolean>((resolve) => {
                Alert.alert(
                    "Importar base de datos",
                    "Esta acción sobrescribirá la base de datos actual y reiniciará la aplicación. ¿Deseas continuar?",
                    [
                        { text: "Cancelar", onPress: () => resolve(false) },
                        { text: "Importar", onPress: () => resolve(true) }
                    ]
                );
            });
            if (!confirmed) return;
            const [{ uri }] = await pick({
                type: [types.allFiles],
                allowMultiSelection: false,
            });

            setGeneralLoading(true);

            // Aseguramos ruta de archivo
            let sourcePath = decodeURI(uri).replace(/^file:\/\//, '');

            const dbName = 'TrackerGastos.db';
            const destPath =
                Platform.OS === 'android'
                    ? `${RNFS.DocumentDirectoryPath}/../databases/${dbName}`
                    : `${RNFS.LibraryDirectoryPath}/LocalDatabase/${dbName}`;

            await RNFS.copyFile(sourcePath, destPath);
            RNRestart.Restart();
        } catch (error: any) {
            setGeneralLoading(false);
            if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
                return;
            }
            Alert.alert('Error', 'Error al importar la base de datos: ' + (error.message || "Error desconocido"));
        }
    };

    const handleDelete = async (db: SQLiteDatabase | null) => {
        try {
            setMenuVisible?.(false); // Cerrar el menú si está abierto
            const confirmed = await new Promise<boolean>((resolve) => {
                Alert.alert(
                    "Borrar base de datos",
                    "Esta acción eliminará la base de datos actual y reiniciará la aplicación. ¿Estás seguro de que deseas continuar?",
                    [
                        { text: "Cancelar", onPress: () => resolve(false) },
                        { text: "Borrar", onPress: () => resolve(true) }
                    ]
                );
            });
            if (!confirmed) return;
            if (!db) {
                throw new Error("Base de datos no inicializada");
            }
            setGeneralLoading(true);
            await wipeDatabase(db);
            RNRestart.Restart();
        } catch (error: any) {
            setGeneralLoading(false);
            Alert.alert(
                "Error",
                "Error al reiniciar la aplicación: " + (error.message || 'Error desconocido'),
                [{ text: 'Cerrar aplicación', onPress: () => BackHandler.exitApp() }]
            );
        }
    };


    return (
        <>
            <TouchableOpacity style={HamburgerMenuStyles.menuOption} onPress={async () => {setMenuVisible?.(false); navigation.navigate('ReportsScreen') }}>
                <Text style={HamburgerMenuStyles.menuOptionText}>Página de reportes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={HamburgerMenuStyles.menuOption} onPress={async () => { await handleExport(); }}>
                <Text style={HamburgerMenuStyles.menuOptionText}>Exportar base de datos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={HamburgerMenuStyles.menuOption} onPress={async () => { await handleImport(); }}>
                <Text style={HamburgerMenuStyles.menuOptionText}>Importar base de datos</Text>
            </TouchableOpacity>
            {/* Opción de borrar base de datos, estilo disimulado en esquina inferior izquierda */}
            <TouchableOpacity style={HamburgerMenuStyles.deleteOption} onPress={() => { handleDelete(db); }}>
                <FontAwesome6 name="trash" iconStyle="solid" style={{ color: Colors.alert, fontSize: 20 }} />
            </TouchableOpacity>
            <Text style={{...HamburgerMenuStyles.menuOptionText, color: Colors.secondary}}>AppVersion: {appVersion}</Text>

        </>
    );
};
