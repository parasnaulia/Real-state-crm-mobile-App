import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import axios from "axios";
import { Url } from "../../../Constants/Constants";

const LeadsByStageCharts = () => {
  const MainName = 87;
  const year = "All";
  const [labels, setLabels] = useState([]);
  const [seriesData, setSeriesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    const fetchLeadsByStage = async () => {
      try {
        const response = await axios.get(
          `${Url}OrganizationDashBoard/leads-by-stage/${MainName}/${year}`
        );
        const data = response.data.data;

        if (data && data.length > 0) {
          const extractedLabels = data.map((item) => item.stage);
          const extractedData = data.map((item) => item.leadsCount);

          // Sort the data by leads count
          const combinedData = extractedLabels.map((label, index) => ({
            label,
            count: extractedData[index],
          }));
          combinedData.sort((a, b) => b.count - a.count);

          setLabels(combinedData.map((item) => item.label));
          setSeriesData(combinedData.map((item) => item.count));
        }
      } catch (error) {
        console.error("Error fetching leads by stage data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeadsByStage();
  }, [MainName, year]);

  // Prepare the data for the chart
  const chartData = {
    labels: labels,
    datasets: [
      {
        data: seriesData,
      },
    ],
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leads By Stage</Text>
      <BarChart
        data={chartData}
        width={screenWidth - 40}
        height={400}
        yAxisSuffix=" leads"
        chartConfig={{
          backgroundGradientFrom: "#1C1C1E",
          backgroundGradientTo: "#383838",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(102, 255, 178, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          barPercentage: 0.7,
          propsForBackgroundLines: {
            strokeWidth: 1,
            strokeDasharray: "4",
            stroke: "rgba(255, 255, 255, 0.2)",
          },
          propsForLabels: {
            fontSize: 12,
            fontWeight: "600",
          },
        }}
        verticalLabelRotation={30}
        style={styles.chart}
        showValuesOnTopOfBars
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#0A0A0A",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    color: "#66FFB2",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1.5,
  },
  chart: {
    marginVertical: 12,
    borderRadius: 16,
    paddingBottom: 50,
  },
  loadingText: {
    fontSize: 20,
    color: "#FFFFFF",
  },
});

export default LeadsByStageCharts;
