import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import InputBox from "../InputBox/InputBox";
import { Url } from "../Constants/Constants";

const EmailCheck = ({
  isOpen,
  onClose,
  handleSubmit,
  selectedValue,
  openAdditional,
}) => {
  const [alreadyCustomer, setAlreadyCustomer] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [newCustomer, setNewCustomer] = useState(false);

  const MainOrgName = 87;

  const handleExistingCustomer = async () => {
    try {
      const response = await fetch(
        `${Url}leadRoutes/customerProperty/${MainOrgName}/${newCustomer}`
      );

      const jsonResponse = await response.json();

      if (jsonResponse.success === true) {
        // setIsNewCustomer(null);
        setNewCustomer(null);
        onClose();
        openAdditional();
        // setInfoOpen();
      } else {
        Alert.alert("He is Not a Customer1");
      }
    } catch (e) {
      console.log("There is an error in fetching Api");
    }
  };

  const handleNewCustomer1 = async () => {
    // e.preventDefault();
    try {
      // const response = await fetch(`${Url}leadRoutes/customerProperty`, {
      //   method: "PATCH",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ data: data, name: name, email: email }),
      // });
      const response = await fetch(
        `${Url}leadRoutes/customerProperty1/${MainOrgName}/${newCustomer}`
      );

      const jsonResponse = await response.json();

      if (jsonResponse.success === true) {
        Alert.alert(jsonResponse?.message);
        setNewCustomer(null);
        onClose();
        openAdditional();
        // setInfoOpen();
      } else {
        Alert.alert(jsonResponse?.message);
      }
    } catch (e) {
      console.log("There is an error in fetching Api");
    }
  };

  const handeSubmitCustomer = () => {
    if (alreadyCustomer) {
      //   Alert.alert("nice1");
      handleExistingCustomer();
    } else if (newCustomer) {
      handleNewCustomer1();
      //   Alert.alert("nice2");
    }
  };

  const handleClose = () => {
    setAlreadyCustomer("");
    setNewCustomer("");
    setCustomerName("");

    onClose();
  };

  useEffect(() => {
    if (selectedValue) {
      setCustomerName(selectedValue?.Email_Address);
    }
  }, [selectedValue]);

  return (
    <Modal
      transparent={true}
      visible={isOpen}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>leads Check</Text>
          {/* Uncomment these InputBoxes and implement their logic as needed */}
          {/* <InputBox
            placeholder="Enter 4-digit Verification Code"
            style={styles.input}
            keyboardType="numeric"
            value={otp}
            onchange={(value) => setOtp(value)}
          />
          <InputBox
            placeholder="Enter New Password"
            style={styles.input}
            keyboardType="default"
            secureTextEntry
            value={password}
            onchange={(value) => setPassword(value)}
          />
          <InputBox
            placeholder="Confirm New Password"
            style={styles.input}
            keyboardType="default"
            secureTextEntry
            value={cPassword}
            onchange={(value) => setCPassword(value)}
          /> */}
          {/* Buttons */}
          <TouchableOpacity
            style={[
              styles.button,
              styles.newCustomerButton,
              newCustomer ? styles.bgChange : "",
            ]}
            onPress={() => {
              setNewCustomer(true);
              setAlreadyCustomer(false);
            }}
          >
            <Text style={styles.buttonText}>New Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.existingCustomerButton,
              alreadyCustomer ? styles.bgChange : "",
            ]}
            onPress={() => {
              setAlreadyCustomer(true);
              setNewCustomer(false);
            }}
          >
            <Text style={styles.buttonText}>Already a Customer</Text>
          </TouchableOpacity>
          {alreadyCustomer && (
            <InputBox
              placeholder="Enter Email of Customer"
              style={styles.input}
              keyboardType="default"
              secureTextEntry
              value={customerName}
              onchange={(value) => {
                setCustomerName(value);
              }}
            />
          )}
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handeSubmitCustomer}
          >
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
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
  button: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  newCustomerButton: {
    backgroundColor: "#808080", // Green shade
  },
  existingCustomerButton: {
    backgroundColor: "#808080", // Orange shade
  },
  submitButton: {
    backgroundColor: "#007BFF", // Blue shade
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#007BFF",
    fontSize: 14,
    fontWeight: "600",
  },
  bgChange: {
    backgroundColor: "blue",
  },
});

export default EmailCheck;
