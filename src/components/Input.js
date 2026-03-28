import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { EnvelopeIcon, PasswordIcon, EyeIcon } from '../assets';

const { width } = Dimensions.get('window');

/**
 * Reusable Input Component
 * 
 * Types:
 * - email: Email input with envelope icon
 * - password: Password input with lock icon and eye toggle
 * - text: Generic text input with custom icon
 * 
 * Usage:
 * <Input
 *   type="email"
 *   placeholder="Email"
 *   value={email}
 *   onChangeText={setEmail}
 * />
 * 
 * <Input
 *   type="password"
 *   placeholder="Password"
 *   value={password}
 *   onChangeText={setPassword}
 * />
 * 
 * <Input
 *   type="text"
 *   placeholder="Full Name"
 *   value={name}
 *   onChangeText={setName}
 *   leftIcon={<CustomIcon />}
 * />
 */

export default function Input({
  type = 'text',
  placeholder,
  value,
  onChangeText,
  leftIcon,
  rightIcon,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  autoCorrect = false,
  style,
  containerStyle,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  // Determine icon based on type
  const getLeftIcon = () => {
    if (leftIcon) return leftIcon;
    
    switch (type) {
      case 'email':
        return (
          <EnvelopeIcon 
            width={width * 0.053} 
            height={width * 0.053} 
          />
        );
      case 'password':
        return (
          <PasswordIcon 
            width={width * 0.053} 
            height={width * 0.053} 
          />
        );
      default:
        return null;
    }
  };

  // Determine keyboard type based on type
  const getKeyboardType = () => {
    if (keyboardType) return keyboardType;
    
    switch (type) {
      case 'email':
        return 'email-address';
      case 'phone':
        return 'phone-pad';
      case 'number':
        return 'numeric';
      default:
        return 'default';
    }
  };

  // Determine if input should be secure
  const isSecure = type === 'password' ? !showPassword : secureTextEntry;

  // Show eye icon for password type
  const showEyeIcon = type === 'password';

  // Get the left icon once
  const leftIconElement = getLeftIcon();

  return (
    <View style={[styles.container, containerStyle]}>
      {leftIconElement && (
        <View style={styles.iconLeft}>
          {leftIconElement}
        </View>
      )}
      
      <TextInput
        style={[
          styles.input,
          style,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#B0B0B0"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={isSecure}
        keyboardType={getKeyboardType()}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        underlineColorAndroid="transparent"
        textContentType={type === 'password' ? 'password' : undefined}
        {...props}
      />

      {showEyeIcon && (
        <TouchableOpacity 
          style={styles.iconRight}
          onPress={() => setShowPassword(!showPassword)}
        >
          <View style={{ opacity: 0.3 }}>
            <EyeIcon 
              width={width * 0.053} 
              height={width * 0.053}
            />
          </View>
        </TouchableOpacity>
      )}

      {rightIcon && !showEyeIcon && (
        <View style={styles.iconRight}>
          {rightIcon}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 55,
    backgroundColor: '#fefefeff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEFF3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
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
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
    color: '#0D0D12',
    padding: 0,
    outlineStyle: 'none',
  },
});
