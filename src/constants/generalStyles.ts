import { Platform, StyleSheet } from 'react-native';
import { Colors } from './colors';

export const FontStyles = StyleSheet.create({
    h1Style: {
        fontSize: 40,
        fontWeight: '700'
    },
    h2Style: {
        fontSize: 30,
        fontWeight: '500'
    },
    h3Style: {
        fontSize: 25,
        fontWeight: 'normal'
    },
    normalTextStyle: {
        fontSize: 15,
        fontWeight: 'normal',
    },
    noDataText: {
        fontSize: 15,
        textAlign: 'center',
        color: Colors.text,
        marginTop: 10,
    },
})

export const SectionStyles = StyleSheet.create({
    mainContainer: {
        position: 'relative',
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flexGrow: 1,
        backgroundColor: Colors.background,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    cardSection: {
        backgroundColor: Colors.cardBackground,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16
    },

    sectionTitle: {
        ...FontStyles.h2Style,
        color: Colors.text,
    },
});

export const MoneyStyles = StyleSheet.create({
    currencySymbol: {
        ...FontStyles.h1Style,
        color: Colors.primary,
        marginRight: 8,
    },
    totalMoney: {
        ...FontStyles.h1Style,
        color: Colors.primary,
    },
    progressBar: {
        width: '100%',
        height: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
});

export const TransactionSectionStyles = StyleSheet.create({
    transactionSection: {
        ...SectionStyles.cardSection,
        flex: 1,
    },
    transactionItem: {
        paddingVertical: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    transactionCantidadYConcepto: {
        flexDirection: 'row',
        maxWidth: '45%',
        gap: 10,
    },
    transactionSaldoYFecha: {
        flexDirection: 'column',
        maxWidth: '40%',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    transactionAmount: {
        ...FontStyles.normalTextStyle,
        marginVertical: 2,
    },
    transactionDate: {
        ...FontStyles.normalTextStyle,
        color: Colors.secondary,
    },
});

export const HamburgerMenuStyles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0, right: 0, bottom: 0, left: 0,
        backgroundColor: 'rgba(0,0,0,0.2)'
    },
    menuContainer: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 60 : 80,
        left: 10,
        width: 200,
        backgroundColor: Colors.primary,
        borderRadius: 8,
        paddingVertical: 10,
        // Sombra para elevar el menú sobre el fondo
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    menuOption: {
        paddingVertical: 10
    },
    menuOptionText: {
        ...FontStyles.normalTextStyle,
        color: "#fff",
        textAlign: 'center',
        fontSize: 16
    },
    deleteOption: {
        paddingTop: 50,
        paddingVertical: 10,
        paddingHorizontal: 10,
        alignSelf: 'flex-end',
        marginTop: 5
    },
    hamburgerButton: {
        padding: 10
    },
    hamburgerIcon: {
        color: Colors.primary,
        fontSize: 25
    }
});