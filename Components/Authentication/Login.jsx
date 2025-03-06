import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  ActivityIndicator,
} from "react-native";
import InputBox from "../InputBox/InputBox";
import MainButton from "../Button/MainButton";
import LogoText from "../Text/LogoText";
import { Url } from "../Constants/Constants";
import ChangePassword from "./ChangePassword";
import NewPassword from "./NewPassword";
import Loader from "../Loader/Loader";
import { useNavigation } from "@react-navigation/native";

const Login = () => {
  const [email, setEmail] = useState("");
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  const [forgotPassword, setForgotPassword] = useState(false);

  const [newPassword, setNewPassword] = useState("");

  // const forgotPassword = () => {};

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${Url}login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const resdata = await response.json();
      console.log(resdata?.data);

      if (resdata?.success) {
        // Alert.alert("Success", "Login successful!");
        // setNewPassword(true);
        setForgotPassword(false);
        // Alert.alert("Login Sucess", resdata.message);
        setEmail("");
        setPassword("");
        setLoading(false);
        navigation.replace("Main");
      } else if (resdata?.isExpired) {
        Alert.alert("Session Expired", resdata.message);
      } else {
        Alert.alert("Error", "Invalid credentials");
      }
    } catch (error) {
      console.error("Error during login:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#00ff00" />;
  }
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <ChangePassword
        isOpen={forgotPassword}
        onClose={() => {
          setForgotPassword(false);
        }}
        newPassOpen={() => {
          setNewPassword(true);
        }}
      />

      <NewPassword
        isOpen={newPassword}
        onClose={() => {
          setNewPassword(false);
        }}
        email={email}
      />
      <View style={styles.logoContainer}>
        <LogoText />
      </View>
      <View style={styles.container}>
        {/* <Text style={styles.headerText}>Welcome Back!</Text> */}
        <Text style={styles.subHeaderText}>Login to your account</Text>

        <View style={styles.inputContainer}>
          <InputBox
            value={email}
            onchange={(data) => setEmail(data)}
            label="Email"
            type="text"
          />
          <InputBox
            value={password}
            onchange={(data) => setPassword(data)}
            label="Password"
            type="password"
          />
          <Pressable
            onPress={() => {
              setForgotPassword(true);
            }}
          >
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </Pressable>
        </View>

        <MainButton onClick={handleSubmit} label="Login" />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don’t have an account?{" "}
            <Text style={styles.signUpText}>Sign up</Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    // backgroundColor: "#f9f9f9",
    marginTop: 20,
  },
  logoContainer: {
    // alignItems: "center",
    marginBottom: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 10,
    // width: "100%",
    // marginHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 5,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "center",
    marginBottom: 5,
  },
  subHeaderText: {
    fontSize: 16,
    color: "#777777",
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  forgotPassword: {
    textAlign: "right",
    color: "#007BFF",
    fontSize: 14,
    marginTop: 10,
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#777777",
  },
  signUpText: {
    color: "#007BFF",
    fontWeight: "bold",
  },
});

export default Login;
