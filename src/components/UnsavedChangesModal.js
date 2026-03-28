import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import React from 'react';

export default function UnsavedChangesModal({ visible, onCancel, onLeave }) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>About to leave this page</Text>
            <Text style={styles.modalSubtitle}>
              Unsaved changes will be lost if you exit this page. Are you sure you want to leave?
            </Text>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={onLeave}
            >
              <Text style={styles.leaveButtonText}>Leave</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    gap: 24,
  },
  modalHeader: {
    gap: 8,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#898D8F',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D0D12',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  cancelButtonText: {
    color: '#F38FB4',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 21.7,
    textAlign: 'center',
  },
  leaveButton: {
    flex: 1,
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#32A6D8',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D0D12',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  leaveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 21.7,
    textAlign: 'center',
  },
});
