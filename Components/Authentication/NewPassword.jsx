import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import CancelButton from "../Button/CancelButton";
import { emailUrl, Url } from "../Constants/Constants";
import InputBox from "../InputBox/InputBox";

const NewPassword = ({ isOpen, onClose, email }) => {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [cPassword, setCPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const emailData = "parasnaulia645@gmail.com";

  // userEmail, CPassword, newPassword, fourDigitCode

  const validateInputs = () => {
    if (!otp || !password || !cPassword) {
      Alert.alert("Error", "All fields are required!");
      return false;
    }
    if (password !== cPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return false;
    }
    return true;
  };

  const sendForgotPasswordRequest = async () => {
    // if (!validateInputs()) return;
    // console.log(email);
    // Alert.alert(email);

    try {
      setLoading(true);
      const response = await fetch(`${Url}userRoutes/forgotPasswordMobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "parasnaulia645@gmail.com",

          url: emailUrl,
        }),
      });

      const resData = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Otp has send to Your Email!");
        setLoading(true);
      } else {
        Alert.alert(
          "Error",
          resData.message + email || "Problem in sending otp"
        );
      }
    } catch (error) {
      console.error("Error sending password reset request:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${Url}userRoutes/updateForgotPasswordMobile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userEmail: "parasnaulia645@gmail.com",
            fourDigitCode: otp,
            newPassword: password,
            CPassword: cPassword,
          }),
        }
      );

      const text = await response.text(); // Read the raw response body as text

      console.log("Response Text:", text); // Log the response body for debugging

      // Parse JSON only if the response is OK and content-type is JSON
      if (
        response.ok &&
        response.headers.get("content-type")?.includes("application/json")
      ) {
        const resData = JSON.parse(text);
        setLoading(true);

        Alert.alert("Success", "Password Has been changed sucessfully!");
        setOtp("");
        setPassword("");
        setCPassword("");
        onClose();
      } else {
        Alert.alert("Error", "Password Has not  changed Something went wrong");
      }
    } catch (error) {
      console.error("Error resending code:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // console.log(password);
  // console.log(cPassword);
  // console.log(otp);

  if (loading) {
    return <ActivityIndicator size="large" color="#00ff00" />;
  }

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
  },
  formContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
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

export default NewPassword;
