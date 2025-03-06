import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import InputBox from "../../Components/InputBox/InputBox";
import GradientButton from "../../Components/Button/MainButton";
import { Url } from "../../Components/Constants/Constants";

const CustomerEdit = ({ isOpen, onClose, renderList, data1 }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    occupation: "",
    leadStatus: "",
    sourceOfEnquiry: "",
    referrerName: "",
    city: "",
    state: "",
    country: "",
    zipcode: "",
    projectCategory: "",
    type: "",
    configuration: "",
    unitNo: "",
    budget: "",
    finance: "",
    tentativePurchaseDate: "",
    notes: "",
    emailAddress: "",
    contactNumber: "",
    gender: "",
    Address: "",
    ProjectName: "",
    block: "",
  });

  useEffect(() => {
    if (data1) {
      setFormData((prev) => ({
        ...prev,
        firstName: data1?.First_Name,
        lastName: data1?.Last_Name,
        age: Number(data1?.Age),
        country: data1?.Country,
        gender: data1?.Gender,
        leadStatus: data1?.Lead_Status,
        sourceOfEnquiry: data1?.Source_of_Inquiry,
        emailAddress: data1?.Email_Address,
        Address: data1?.Address,
        city: data1?.City,
        state: data1?.State,
        zipcode: data1?.Zip_code,
        occupation: data1?.Occupation,
        unitNo: data1?.Unit_No,
        ProjectName: data1?.Project_Name,
        projectCategory: data1?.Property_Type,
        type: Number(data1?.Type),
        configuration: data1?.Configuration,
        block: data1?.Block,
      }));
    }
  }, [data1]);

  const handleInputChange = (value, name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${Url}leadRoutes/customer/${data1?.Customer_Id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: formData,
          }),
        }
      );
      const resData = await response.json();
      if (resData?.success === true) {
        onClose();
        renderList();
        Alert.alert("Customer Data is Updated Sucessfully");
      } else {
        Alert.alert(resData?.message);
      }
    } catch (e) {
      console.error("There was an error in fetching the API:", e);
      Alert.alert(e.message);
    }
  };
  return (
    <Modal
      transparent={true}
      visible={isOpen}
      animationType="slide"
      onRequestClose={onClose}
    >
  
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Edit Customer</Text>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <InputBox
              placeholder="First Name"
              name="firstName"
              style={styles.input}
              value={formData.firstName}
              onchange={(value) => handleInputChange(value, "firstName")}
              label="First Name"
            />
            <InputBox
              placeholder="Last Name"
              name="lastName"
              style={styles.input}
              value={formData.lastName}
              onchange={(value) => handleInputChange(value, "lastName")}
              label="Last Name"
            />
            <InputBox
              placeholder="Email"
              name="email"
              style={styles.input}
              value={formData.emailAddress}
              keyboardType="email-address"
              onchange={(value) => handleInputChange(value, "emailAddress")}
              label="Email"
            />
            <InputBox
              placeholder="Address"
              name="address"
              style={styles.input}
              value={formData.Address}
              onchange={(value) => handleInputChange(value, "Address")}
              label="Address"
            />
            <InputBox
              placeholder="Gender"
              name="gender"
              style={styles.input}
              value={formData.gender}
              onchange={(value) => handleInputChange(value, "gender")}
              label="Gender"
            />
            <InputBox
              placeholder="Occupation"
              name="occupation"
              style={styles.input}
              value={formData.occupation}
              onchange={(value) => handleInputChange(value, "occupation")}
              label="Occupation"
            />
            <InputBox
              placeholder="Country"
              name="country"
              style={styles.input}
              value={formData.country}
              onchange={(value) => handleInputChange(value, "country")}
              label="Country"
            />
            <InputBox
              placeholder="State"
              name="state"
              style={styles.input}
              value={formData.state}
              onchange={(value) => handleInputChange(value, "state")}
              label="State"
            />
            <InputBox
              placeholder="City"
              name="city"
              style={styles.input}
              value={formData.city}
              onchange={(value) => handleInputChange(value, "city")}
              label="City"
            />
            <InputBox
              placeholder="Zip"
              name="zip"
              style={styles.input}
              value={formData.zipcode}
              onchange={(value) => handleInputChange(value, "zipcode")}
              label="Zip"
            />
            <GradientButton label="Save Changes" onClick={handleFormSubmit} />
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    marginTop: 30,
  },
  scrollContent: {
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButton: {
    marginTop: 15,
    alignSelf: "center",
  },
  cancelButtonText: {
    color: "blue",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
});

export default CustomerEdit;
