import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { height: screenHeight } = Dimensions.get('window');

const MAX_VISIBLE_ITEMS = 6;
const ITEM_HEIGHT = 52;

/**
 * Reusable Dropdown Component — Bottom Sheet Style
 */
export default function Dropdown({
  placeholder,
  value,
  onSelect,
  options = [],
  leftIcon,
  rightIcon,
  containerStyle,
  textStyle,
  disabled = false,
  label,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  const listHeight = Math.min(options.length, MAX_VISIBLE_ITEMS) * ITEM_HEIGHT + 60; // 60 for header

  const handleOpen = () => {
    if (disabled) return;
    setIsVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });
  };

  const handleSelect = (option) => {
    onSelect(option);
    handleClose();
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, containerStyle]}
        onPress={handleOpen}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={[styles.text, !value && styles.placeholder, textStyle]}>
            {value || placeholder}
          </Text>
        </View>
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Animated.View
            style={[
              styles.bottomSheet,
              {
                maxHeight: listHeight,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Handle bar */}
            <View style={styles.handleBar}>
              <View style={styles.handle} />
            </View>

            {/* Title */}
            <Text style={styles.sheetTitle}>{label || placeholder || 'Select an option'}</Text>

            {/* Options */}
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={options.length > MAX_VISIBLE_ITEMS}
              keyboardShouldPersistTaps="handled"
            >
              {options.map((option, index) => {
                const isSelected = value === option;
                const isLast = index === options.length - 1;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected,
                      isLast && styles.optionLast,
                    ]}
                    onPress={() => handleSelect(option)}
                    activeOpacity={0.6}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}>
                      {option}
                    </Text>
                    {isSelected && (
                      <Icon name="checkmark-circle" size={20} color="#32A6D8" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: '#ffffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
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
    color: '#0D0D12',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    lineHeight: 20,
  },
  placeholder: {
    color: '#B0B0B0',
    fontWeight: '400',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    overflow: 'hidden',
  },
  handleBar: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionSelected: {
    backgroundColor: '#F0F9FF',
  },
  optionText: {
    fontSize: 15,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    color: '#0D0D12',
    lineHeight: 22,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#32A6D8',
  },
});
