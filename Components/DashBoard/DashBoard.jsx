import React from "react";
import { ScrollView, StyleSheet } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import OrganizationDashBoard from "./OrgAdmin/OrgDashboard";
import { View } from "react-native";

const Dashboard = () => {
  return (
    <SafeAreaView>
      <View>
        <OrganizationDashBoard />{" "}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
});

export default Dashboard;
