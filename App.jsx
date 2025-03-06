import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

// Import your screens
import LoginScreen from "./Screens/Auth/LoginScreen";
import Index from "./Screens/Leads/Index"; // Leads Screen
import Customer from "./Screens/Customer/Customer"; // Customer Screen
import DashBoard from "./Components/DashBoard/DashBoard"; // Dashboard Screen
import { Ionicons } from "@expo/vector-icons";
import Project from "./Screens/Projects/Project";

// Create Stack Navigator for login flow
const Stack = createNativeStackNavigator();

// Create Bottom Tabs Navigator for dashboard flow
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // Hides header in tab screens
        tabBarStyle: { backgroundColor: "#f5f5f5" },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashBoard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Leads"
        component={Index}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Customer"
        component={Customer}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Project"
        component={Project}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="code-slash-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Login">
        {/* Login Screen */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        {/* Tab Navigator after login */}
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});
