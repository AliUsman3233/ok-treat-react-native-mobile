import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

/**
 * Reusable Button Component
 * 
 * Types:
 * - primary: Main action button (pink background, blue text)
 * - secondary: Secondary action button (blue background, white text)
 * - outline: Outlined button
 * - text: Text-only button
 * 
 * Sizes:
 * - small: 40px height
 * - medium: 56px height (default)
 * - large: 64px height
 * 
 * Usage:
 * <Button title="Continue" onPress={handlePress} />
 * <Button title="Next" type="secondary" icon={<Icon />} />
 * <Button title="Skip" type="text" size="small" />
 */

export default function Button({
  title,
  onPress,
  type = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'right',
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) {
  const buttonStyles = [
    styles.button,
    styles[`button_${type}`],
    styles[`button_${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${type}`],
    styles[`text_${size}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
      {title && <Text style={textStyles}>{title}</Text>}
      {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
      {icon && !title && icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Base Button Styles
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    gap: 12,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // Button Types
  button_primary: {
    backgroundColor: '#FFC2EB',
    borderWidth: 2,
    borderColor: '#FFC2EB',
  },
  button_secondary: {
    backgroundColor: '#32A6D8',
    borderWidth: 2,
    borderColor: '#32A6D8',
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#32A6D8',
  },
  button_text: {
    backgroundColor: 'transparent',
  },
  button_icon: {
    backgroundColor: '#32A6D8',
    borderRadius: 999,
    padding: 16,
  },

  // Button Sizes
  button_small: {
    height: 40,
  },
  button_medium: {
    height: 56,
  },
  button_large: {
    height: 64,
  },

  // Text Styles
  text: {
    fontFamily: 'Avenir LT Std',
    textAlign: 'center',
  },
  text_primary: {
    color: '#32A6D8',
    fontSize: 14,
    fontWeight: '750',
    lineHeight: 20,
  },
  text_secondary: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '750',
    lineHeight: 20,
  },
  text_outline: {
    color: '#32A6D8',
    fontSize: 14,
    fontWeight: '750',
    lineHeight: 20,
  },
  text_text: {
    color: '#8A8A8A',
    fontSize: 12,
    fontWeight: '400',
  },
  text_small: {
    fontSize: 12,
  },
  text_medium: {
    fontSize: 14,
  },
  text_large: {
    fontSize: 16,
  },
  textDisabled: {
    opacity: 0.5,
  },

  // Icon Positioning
  iconLeft: {
    marginRight: -6,
  },
  iconRight: {
    marginLeft: -6,
  },
});

// Circular Icon Button Component
export function IconButton({ icon, onPress, size = 56, backgroundColor = '#32A6D8', style }) {
  return (
    <TouchableOpacity
      style={[
        {
          width: size,
          height: size,
          backgroundColor,
          borderRadius: 999,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
    </TouchableOpacity>
  );
}
