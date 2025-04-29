import { StyleSheet } from 'react-native';
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
        fontSize: 20,
        fontWeight: 'normal',
    },
    noDataText: {
      textAlign: 'center',
      color: Colors.text,
      marginTop: 10,
    },
})

export const SectionStyles = StyleSheet.create({
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
        maxWidth: '40%',
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