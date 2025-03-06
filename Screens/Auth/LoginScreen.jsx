import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import Login from "../../Components/Authentication/Login";

const LoginScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Login />
      <div>Regiter eere</div>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default LoginScreen;


//THis is auth
