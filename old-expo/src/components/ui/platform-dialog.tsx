/**
 * PlatformDialog Component
 * Uses React Native Paper Dialog on Android/Web, Alert on iOS
 */

import React from 'react';
import { Alert, Platform, StyleSheet } from 'react-native';
import {
    Button as PaperButton,
    Dialog as PaperDialog,
    Text as PaperText,
    Portal,
    useTheme as usePaperTheme,
} from 'react-native-paper';

interface DialogButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface PlatformDialogProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: DialogButton[];
  onDismiss: () => void;
}

export function PlatformDialog({
  visible,
  title,
  message,
  buttons,
  onDismiss,
}: PlatformDialogProps) {
  const paperTheme = usePaperTheme();

  // iOS uses native Alert (handled via showDialog function)
  if (Platform.OS === 'ios') {
    // For iOS, we return null and rely on showDialog being called imperatively
    return null;
  }

  // Android/Web uses React Native Paper Dialog
  return (
    <Portal>
      <PaperDialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <PaperDialog.Title style={styles.title}>{title}</PaperDialog.Title>
        <PaperDialog.Content>
          <PaperText variant="bodyLarge" style={{ color: paperTheme.colors.onSurfaceVariant }}>
            {message}
          </PaperText>
        </PaperDialog.Content>
        <PaperDialog.Actions style={styles.actions}>
          {buttons.map((button, index) => (
            <PaperButton
              key={index}
              onPress={() => {
                button.onPress?.();
                onDismiss();
              }}
              textColor={
                button.style === 'destructive'
                  ? '#ff3b30'
                  : button.style === 'cancel'
                  ? paperTheme.colors.onSurfaceVariant
                  : paperTheme.colors.primary
              }
            >
              {button.text}
            </PaperButton>
          ))}
        </PaperDialog.Actions>
      </PaperDialog>
    </Portal>
  );
}

/**
 * Show a dialog in a platform-appropriate way
 * iOS: Uses native Alert
 * Android/Web: Uses state-based PaperDialog (caller must manage visible state)
 */
export function showPlatformDialog(
  title: string,
  message: string,
  buttons: DialogButton[]
) {
  if (Platform.OS === 'ios') {
    Alert.alert(
      title,
      message,
      buttons.map((b) => ({
        text: b.text,
        onPress: b.onPress,
        style: b.style,
      }))
    );
    return true; // Indicates the dialog was shown imperatively
  }
  return false; // Indicates caller should use PlatformDialog component
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

