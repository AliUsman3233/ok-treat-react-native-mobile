import { View, Text, StyleSheet, Switch } from 'react-native';

export default function FilterOption({ title, subtitle, value, onValueChange }) {
  return (
    <View style={[styles.container, subtitle ? styles.containerWithSubtitle : styles.containerNoSubtitle]}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E5E5', true: '#FFC2EB' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E5E5E5"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  containerWithSubtitle: {
    height: 52,
  },
  containerNoSubtitle: {
    height: 45,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: 'black',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  subtitle: {
    color: '#676869',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
});
