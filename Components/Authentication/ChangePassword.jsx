import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import CancelButton from "../Button/CancelButton";
import { emailUrl, Url } from "../Constants/Constants";
import InputBox from "../InputBox/InputBox";

const ChangePassword = ({ isOpen, onClose, newPassOpen }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const sendForgotPasswordRequest = async () => {
    try {
      setLoading(true);
      // alert("nice");
      const response = await fetch(`${Url}userRoutes/forgotPasswordMobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email, // User's email
          url: emailUrl, // Dynamic URL based on the frontend origin
        }),
      });

      const resData = await response.json();

      console.log(resData);

      if (response.ok) {
        Alert.alert("Mail is send Sucesfully");
        setLoading(false);
        // setLoader(false);
        // closeForm();
        setEmail("");
        onClose();
        newPassOpen();
      } else {
        // setLoader(false);
        Alert.alert("Problem  in sending Mail");
      }
    } catch (error) {
      //   setLoader(false);
      console.error("Error sending password reset request:", error);
      Alert.alert("Problem in sending Mail");
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <ActivityIndicator size="large" color="#00ff00" />;
  }
  return (
    <Modal
      transparent={true}
      visible={isOpen}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Change Password</Text>
          <InputBox
            placeholder="Enter your email"
            style={styles.input}
            keyboardType="email-address"
            value={email}
            onchange={(value) => {
              setEmail(value);
            }}
          />
          {/* <TextInput
            placeholder="New password"
            style={styles.input}
            secureTextEntry={true}
          />
          <TextInput
            placeholder="Confirm password"
            style={styles.input}
            secureTextEntry={true}
          /> */}
          <Pressable
            style={styles.submitButton}
            onPress={sendForgotPasswordRequest}
          >
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
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background for modal
  },
  formContainer: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  submitButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ChangePassword;
