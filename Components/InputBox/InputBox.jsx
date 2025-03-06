import React from "react";
import { TextInput, View, StyleSheet, Text } from "react-native";

const InputBox = ({
  onchange,
  value,
  label,
  placeholder,
  type,
  keyboardType,
  name,
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        onChangeText={(data) => onchange(data)}
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#888"
        secureTextEntry={type === "password"} // Use secureTextEntry for password input
        keyboardType={keyboardType}
        name={name}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: "100%",
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
});

export default InputBox;
