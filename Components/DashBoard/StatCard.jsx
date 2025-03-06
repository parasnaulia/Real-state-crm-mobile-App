import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const StatCard = ({
  iconName,
  iconColor = "#fff",
  heading,
  description,
  backgroundColor = "#4CAF50",
  borderColor = "#388E3C",
}) => {
  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      <View style={styles.innerContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={30} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.heading}>{heading}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 15,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  innerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  textContainer: {
    flex: 1,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  description: {
    fontSize: 18,
    color: "#f0f0f0",
  },
});

export default StatCard;
