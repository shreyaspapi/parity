/**
 * Alert Dialog Component
 * Cross-platform alert dialog that works on web and native
 */

import { useTheme } from '@/src/providers/theme-provider';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AlertDialogProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  onDismiss: () => void;
}

export function AlertDialog({ visible, title, message, buttons, onDismiss }: AlertDialogProps) {
  const { isDark } = useTheme();

  const handleButtonPress = (button: AlertButton) => {
    onDismiss();
    if (button.onPress) {
      button.onPress();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[
              styles.dialog,
              {
                backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
              },
            ]}
          >
            <Text
              style={[
                styles.title,
                { color: isDark ? '#ffffff' : '#000000' },
              ]}
            >
              {title}
            </Text>
            <Text
              style={[
                styles.message,
                { color: isDark ? '#8e8e93' : '#6e6e73' },
              ]}
            >
              {message}
            </Text>
            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    index > 0 && styles.buttonSpacing,
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === 'cancel' && { color: isDark ? '#8e8e93' : '#007aff' },
                      button.style === 'destructive' && { color: '#ff3b30' },
                      (button.style === 'default' || !button.style) && { color: '#007aff' },
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    borderRadius: 14,
    padding: 20,
    minWidth: 270,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  buttonSpacing: {
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});

