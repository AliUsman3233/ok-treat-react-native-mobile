import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Modal,
  Animated
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height: screenHeight } = Dimensions.get('window');

const MAX_VISIBLE_ITEMS = 6;
const ITEM_HEIGHT = 48; // 14 + 14 padding + 20 lineHeight

/**
 * Reusable Dropdown Component
 *
 * Usage:
 * <Dropdown
 *   placeholder="Select an option"
 *   value={selectedValue}
 *   onSelect={setSelectedValue}
 *   options={['Option 1', 'Option 2', 'Option 3']}
 *   leftIcon={<Icon />}
 *   rightIcon={<Icon />}
 * />
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
  maxHeight: maxHeightProp,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [openAbove, setOpenAbove] = useState(false);
  const buttonRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Calculate max height based on visible items or prop
  const maxHeight = maxHeightProp || Math.min(options.length, MAX_VISIBLE_ITEMS) * ITEM_HEIGHT;

  const handleOpen = () => {
    if (disabled) return;

    buttonRef.current?.measureInWindow((x, y, measuredWidth, measuredHeight) => {
      const spaceBelow = screenHeight - (y + measuredHeight);
      const spaceAbove = y;
      const shouldOpenAbove = spaceBelow < maxHeight + 10 && spaceAbove > spaceBelow;

      setDropdownLayout({ x, y, width: measuredWidth, height: measuredHeight });
      setOpenAbove(shouldOpenAbove);
      setIsVisible(true);

      // Animate in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });
  };

  const handleSelect = (option) => {
    onSelect(option);
    handleClose();
  };

  const dropdownTop = openAbove
    ? dropdownLayout.y - Math.min(maxHeight, options.length * ITEM_HEIGHT)
    : dropdownLayout.y + dropdownLayout.height;

  return (
    <>
      <TouchableOpacity
        ref={buttonRef}
        style={[styles.container, containerStyle]}
        onPress={handleOpen}
        disabled={disabled}
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
        animationType="none"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View
            style={[
              styles.dropdownList,
              {
                top: dropdownTop,
                left: dropdownLayout.x,
                width: dropdownLayout.width,
                maxHeight: maxHeight,
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [openAbove ? 6 : -6, 0],
                  }),
                }],
              },
              openAbove ? styles.dropdownListAbove : styles.dropdownListBelow,
            ]}
          >
            <ScrollView
              style={{ maxHeight: maxHeight }}
              nestedScrollEnabled
              showsVerticalScrollIndicator={options.length > MAX_VISIBLE_ITEMS}
              keyboardShouldPersistTaps="handled"
              bounces={false}
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
                      <Icon name="checkmark" size={18} color="#32A6D8" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dropdownList: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowRadius: 12,
    overflow: 'hidden',
  },
  dropdownListBelow: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    elevation: 4,
  },
  dropdownListAbove: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    elevation: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionSelected: {
    backgroundColor: '#F0F9FF',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    color: '#0D0D12',
    lineHeight: 20,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#32A6D8',
  },
});
