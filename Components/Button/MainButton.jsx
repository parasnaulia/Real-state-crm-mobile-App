import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const GradientButton = ({ onClick, label }) => {
  return (
    <LinearGradient
      colors={["#4a90e2", "#8e44ad"]} // Blue to Purple gradient
      style={styles.gradient}
      start={{ x: 0, y: 0.5 }} // Start gradient from the left
      end={{ x: 1, y: 0.5 }} // End gradient on the right
    >
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={onClick}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </Pressable>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 8,
    width: "100%",

    paddingVertical: 4,
    alignItems: "center",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  pressed: {
    opacity: 0.75,
  },
});

export default GradientButton;
