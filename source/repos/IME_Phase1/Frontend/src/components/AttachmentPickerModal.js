import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const AttachmentPickerModal = ({ visible, options, onClose }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.dialog}>
        <Text style={styles.title}>Attach File</Text>
        <Text style={styles.message}>Choose file type</Text>
        {options.map((option) => (
          <TouchableOpacity
            key={option.text}
            style={styles.option}
            onPress={() => {
              onClose();
              setTimeout(option.onPress, 250);
            }}
            activeOpacity={0.75}
          >
            <Text style={styles.optionText}>{option.text}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.cancel} onPress={onClose} activeOpacity={0.75}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 8,
  },
  title: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '700',
  },
  message: {
    marginTop: 6,
    marginBottom: 12,
    color: '#64748B',
    fontSize: 14,
  },
  option: {
    minHeight: 48,
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  optionText: {
    color: '#1F2937',
    fontSize: 16,
  },
  cancel: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default AttachmentPickerModal;
