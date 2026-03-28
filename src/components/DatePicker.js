import { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import dayjs from 'dayjs';

/**
 * Reusable DatePicker Component using react-native-modal-datetime-picker
 * 
 * Usage:
 * <DatePicker
 *   label="Select Date"
 *   value={date}
 *   onChange={(date) => setDate(date)}
 *   leftIcon={<CalendarIcon />}
 *   rightIcon={<AngleDownIcon />}
 * />
 */

export default function DatePicker({
  label,
  value,
  onChange,
  leftIcon,
  rightIcon,
  placeholder = 'Select date',
  minimumDate,
  maximumDate,
  containerStyle,
  textStyle,
  mode = 'date', // 'date', 'time', or 'datetime'
}) {
  const [isVisible, setIsVisible] = useState(false);

  const formatDate = (date) => {
    if (!date) return '';
    return dayjs(date).format('D MMM YYYY');
  };

  const handleConfirm = (selectedDate) => {
    setIsVisible(false);
    if (onChange) {
      onChange(selectedDate);
    }
  };

  const handleCancel = () => {
    setIsVisible(false);
  };

  const displayValue = value ? formatDate(value) : '';

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => setIsVisible(true)}
      >
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={[styles.text, !displayValue && styles.placeholder, textStyle]}>
            {displayValue || placeholder}
          </Text>
        </View>
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isVisible}
        mode={mode}
        date={value instanceof Date && !isNaN(value) ? value : new Date()}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: 'black',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
    marginBottom: 8,
  },
  button: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconLeft: {
    width: 20,
    height: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRight: {
    width: 20,
    height: 20,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#898D8F',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 20,
  },
  placeholder: {
    color: '#B0B0B0',
  },
});
