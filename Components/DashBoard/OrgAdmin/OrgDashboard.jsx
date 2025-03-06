import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import StatCard from "../StatCard";
import { Url } from "../../Constants/Constants";

import { View } from "react-native";
import LeadsByStageCharts from "./Charts/LeadsByStageCharts";
import LeadConversionForOrg from "./Charts/LeadConversionForOrg";

// import ConversionRateChart from "./Charts/ConversionRate";

const OrganizationDashBoard = () => {
  const MainName = 87;
  const [project, setProjects] = useState([]);
  const [totalSale, setTotalSale] = useState("");

  const [totalRevenue, setOrgRevenue] = useState("s");

  useEffect(() => {
    const projectFetcher = async () => {
      try {
        const data = await fetch(`${Url}properties/project/${MainName}`);
        const jsonData = await data.json();
        if (jsonData?.success) {
          console.log(jsonData?.data);
          console.log("This is The Project Data");

          setProjects(jsonData?.data);
        }
      } catch (e) {
        console.log(
          "There Is Some Error In Getting Project Organization: " + e
        );
      }
    };

    // const projectAdmin = async () => {
    //   try {
    //     const data = await fetch(`${Url}projectAdmin`);
    //     const jsonData = await data.json();
    //     dispatch(AddProjectData(jsonData.data));
    //   } catch (e) {
    //     console.log("There Is Error In inserting Project data: " + e);
    //   }    // };

    if (MainName) {
      projectFetcher();
    }

    // else if (cred.role === "Admin") {
    //   projectAdmin();
    // }
  }, [MainName]);

  useEffect(() => {
    const projectFetcher = async () => {
      const data = await fetch(
        `${Url}OrganizationDashBoard/total-sales/${MainName}`
      );
      const jsonData = await data.json();
      if (jsonData?.success) {
        setTotalSale(jsonData?.totalSales);
      }
    };
    if (MainName) {
      projectFetcher();
    }
  }, [MainName]);

  useEffect(() => {
    const projectFetcher = async () => {
      const data = await fetch(
        `${Url}OrganizationDashBoard/total-revenue/${MainName}`
      );
      const jsonData = await data.json();

      // dispatch(AddProjectData(jsonData.data))
      if (jsonData?.success) {
        setOrgRevenue(jsonData?.totalRevenue);
      }
    };
    if (MainName) {
      projectFetcher();
    }
  }, [MainName]);

  return (
    <ScrollView>
      <View style={styles.container}>
        <View>
          <StatCard
            iconName="analytics-outline"
            iconColor="#4CAF50" // Modern green for analytics
            heading="Total Sale"
            description={totalSale}
            backgroundColor="#1E293B" // Dark slate background for elegance
            borderColor="#4CAF50" // Matching green for border
          />
        </View>
        <View>
          <StatCard
            iconName="code-slash-outline"
            iconColor="#FF9800" // Warm amber for projects
            heading="Projects"
            description={project?.length}
            backgroundColor="#1E293B" // Consistent dark slate background
            borderColor="#FF9800" // Amber for the border
          />
        </View>
        <View>
          <StatCard
            iconName="trending-up-outline"
            iconColor="#03A9F4" // Cool blue for revenue
            heading="Total Revenue"
            description={`₹ ${Number(totalRevenue)?.toLocaleString("en-IN")}`}
            backgroundColor="#1E293B" // Consistent dark slate background
            borderColor="#03A9F4" // Matching blue for border
          />
        </View>

        <View>
          <LeadsByStageCharts />
        </View>
        {/* <View style={styles.conversion}>
          <LeadsByStageCharts />
        </View> */}

        <View
          style={{
            marginTop: 10,
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
          }}
        >
          <LeadConversionForOrg />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  inner1: {
    marginTop: 10,
  },
  conversion: {
    marginTop: 10,
  },
});

export default OrganizationDashBoard;
