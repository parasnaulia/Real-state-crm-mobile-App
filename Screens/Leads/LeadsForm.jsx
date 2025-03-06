import React from "react";
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
  TouchableOpacity,
} from "react-native";
import CancelButton from "../Button/CancelButton";
import { emailUrl, Url } from "../Constants/Constants";
import InputBox from "../InputBox/InputBox";

const LeadsForm = () => {
  return (
    <Modal
      transparent={true}
      visible={isOpen}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Reset Your Password</Text>

          <InputBox
            placeholder="Enter 4-digit Verification Code"
            style={styles.input}
            keyboardType="numeric"
            value={otp}
            onchange={(value) => {
              setOtp(value);
            }} // Ensure this matches InputBox's prop
          />

          <InputBox
            placeholder="Enter New Password"
            style={styles.input}
            keyboardType="default"
            secureTextEntry
            value={password}
            onchange={(value) => {
              setPassword(value);
            }}
          />

          <InputBox
            placeholder="Confirm New Password"
            style={styles.input}
            keyboardType="default"
            secureTextEntry
            value={cPassword}
            onchange={(value) => {
              setCPassword(value);
            }}
          />

          <TouchableOpacity
            style={styles.resendContainer}
            onPress={sendForgotPasswordRequest}
          >
            <Text style={styles.resendText}>
              Didn’t receive the code? Resend
            </Text>
          </TouchableOpacity>

          <Pressable style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </Pressable>

          <CancelButton onClose={onClose} />
        </View>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: "100%",
    backgroundColor: "red",
  },

  formContainer: {
    backgroundColor: "red",
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    // alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 15,
  },
  resendContainer: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    color: "#007BFF",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default LeadsForm;
