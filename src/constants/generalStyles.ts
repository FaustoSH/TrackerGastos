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