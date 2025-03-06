import React from "react";
import { Picker } from "@react-native-picker/picker";
import { View, Text, StyleSheet } from "react-native";

const Dropdown = ({
  label,
  name,
  selectedValue,
  handleInputChangeData,
  data = [],
  containerStyle = {},
  pickerStyle = {},
  labelStyle = {},
  bg = "#f9f9f9", // Default background color
  color = "black",
}) => {
  // Deduplicate the data based on the `value` property
  const uniqueData = Array.from(
    new Map(data.map((item) => [item.value, item])).values()
  );

  return (
    <View style={[styles.pickerContainer, containerStyle]}>
      {label && (
        <Text style={[styles.pickerLabel, labelStyle, , { color: color }]}>
          {label}
        </Text>
      )}
      <Picker
        selectedValue={selectedValue}
        onValueChange={(value) => handleInputChangeData(value, name)}
        style={[
          styles.picker,
          pickerStyle,
          { backgroundColor: bg, color: color },
        ]}
        accessibilityLabel={label ? `${label} dropdown` : "Dropdown"}
      >
        <Picker.Item label="Select an option" value="" />
        {uniqueData.map((item, index) => (
          <Picker.Item key={index} label={item?.label} value={item?.value} />
        ))}
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerContainer: {
    width: "100%",
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
    fontWeight: "bold",
  },
  picker: {
    width: "100%",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
});

export default Dropdown;
