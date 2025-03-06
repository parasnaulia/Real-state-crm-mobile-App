import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
// import SkeletonPlaceholder from "react-native-skeleton-placeholder";

const SCREEN_WIDTH = Dimensions.get("window").width;

const LeadsShimmer = () => {
  return (
    <View style={styles.container}>
      {/* Card 1 */}
      {/* <SkeletonPlaceholder borderRadius={4}>
        <View style={styles.card}>
          {/* Name and email */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f5f5f5",
  },
  card: {
    width: SCREEN_WIDTH - 20,
    padding: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  line: {
    height: 12,
    width: "90%",
    backgroundColor: "#e0e0e0",
    marginBottom: 5,
  },
  statusDropdown: {
    height: 40,
    width: "100%",
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    width: "48%",
    height: 40,
    backgroundColor: "#ff4d4f",
    borderRadius: 4,
  },
});

export default LeadsShimmer;
