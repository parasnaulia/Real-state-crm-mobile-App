import React from "react";

import { Pressable, Text, StyleSheet } from "react-native";

const CancelButton = ({ onClose }) => {
  return (
    <Pressable style={styles.cancelButton} onPress={onClose}>
      <Text style={styles.cancelButtonText}>Cancel</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cancelButton: {
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 14,
    color: "#007BFF",
  },
});

export default CancelButton;
