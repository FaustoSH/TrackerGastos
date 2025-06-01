// src/components/HamburgerMenu.tsx
import React, { useState, FC } from 'react';
import { View, TouchableOpacity, TouchableWithoutFeedback, Modal} from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { HamburgerMenuStyles } from '../../constants/generalStyles';

interface HamburgerMenuProps {
    children?: React.ReactNode;
}

const HamburgerMenu: FC<HamburgerMenuProps> = ({ children }) => {
    const [menuVisible, setMenuVisible] = useState<boolean>(false);

    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, { setMenuVisible } as any);
        }
        return child;
    });
    
    return (
        <>
            {/* Ícono de menú hamburguesa en la barra de navegación */}
            <TouchableOpacity style={HamburgerMenuStyles.hamburgerButton} onPress={() => setMenuVisible(true)}>
                <FontAwesome6 name="bars" iconStyle="solid" style={HamburgerMenuStyles.hamburgerIcon} />
            </TouchableOpacity>

            {/* Menú desplegable con opciones */}
            <Modal visible={menuVisible} transparent={true} animationType="none">
                {/* Clic fuera del menú cierra el menú */}
                <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                    <View style={HamburgerMenuStyles.overlay}>
                        {/* Contenedor del menú (clics dentro no cierran el menú) */}
                        <TouchableWithoutFeedback onPress={() => { /* no-op */ }}>
                            <View style={HamburgerMenuStyles.menuContainer}>
                                {childrenWithProps}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
};

export default HamburgerMenu;
