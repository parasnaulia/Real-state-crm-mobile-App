import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ProgressChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import Dropdown from "../../Dropdown";
import {
  Month,
  Periode,
  Quater,
  Url,
  Years,
} from "../../../Constants/Constants";
import axios from "axios";

const screenWidth = Dimensions.get("window").width;

const LeadConversionForOrg = () => {
  const [conversionData, setConversionData] = useState("");
  const data = {
    labels: ["Conversion Rate"],
    data: [Number(conversionData?.conversionRate || 0) / 100], // Default to 0 if undefined
  };

  const currentDate = new Date();

  const currentMonth = currentDate.getMonth() + 1; // Adding 1 to make it 1-indexed

  // Calculate the current quarter
  const currentQuarter = Math.ceil(currentMonth / 3);
  const currentYear = new Date().getFullYear();

  const [selectedYear, setYear] = useState(currentYear);

  // const mainYear = 2025;

  const [isLoading, setIsLoading] = useState(false);

  const [mainYear, setMainYear] = useState(currentYear);

  const [timePeriod, setPeriode] = useState("Monthly");
  const MainName = 87;
  const [selectedMonth, setMonth] = useState(currentMonth);
  const [selectedQuarter, setSelectedQuater] = useState(currentQuarter);
  const [yearsData, setYearsData] = useState([]);

  // const [selectedYear, setSelectedYear] = useState("");
  // console.log(Years);

  console.log("This is Conversiondata");
  console.log(conversionData);

  useEffect(() => {
    if (Years) {
      const data = Years.map((item) => {
        return { label: item, value: item };
      });
      setYearsData(data);
    }
  }, [Years]);

  useEffect(() => {
    const fetchConversionRate = async () => {
      setIsLoading(true); // Show loading spinner or indicator

      try {
        let urlData;

        // Dynamically construct URL based on the selected time period
        switch (timePeriod) {
          case "Monthly":
            if (!selectedMonth || !mainYear) {
              console.error(
                "Both month and year are required for monthly data."
              );
              setIsLoading(false);
              return;
            }
            urlData = `${Url}OrganizationDashBoard/lead-conversion-rate/${MainName}/${timePeriod}/${selectedMonth}-${mainYear}`;
            break;

          case "Quarterly":
            if (!selectedQuarter || !mainYear) {
              console.error(
                "Both quarter and year are required for quarterly data."
              );
              setIsLoading(false);
              return;
            }
            urlData = `${Url}OrganizationDashBoard/lead-conversion-rate/${MainName}/${timePeriod}/${selectedQuarter}-${mainYear}`;
            break;

          case "Yearly":
            if (!selectedYear) {
              console.error("Year is required for yearly data.");
              setIsLoading(false);
              return;
            }
            urlData = `${Url}OrganizationDashBoard/lead-conversion-rate/${MainName}/${timePeriod}/${selectedYear}`;
            break;

          default:
            console.error("Invalid time period selected.");
            setIsLoading(false);
            return;
        }

        // API call to the backend
        const response = await axios.get(urlData);
        if (response.data && response.data.success) {
          setConversionData(response.data.data); // Update conversion rate data
        } else {
          console.error("Failed to fetch conversion rate data.");
        }
      } catch (error) {
        console.error("Error fetching lead conversion rate data", error);
      } finally {
        setIsLoading(false); // Hide loading spinner or indicator
      }
    };

    // Fetch conversion rate data only if MainName is available
    if (MainName) {
      fetchConversionRate();
    }
  }, [
    MainName,
    timePeriod,
    selectedYear,
    mainYear,
    selectedMonth,
    selectedQuarter,
  ]);

  // console.log(year);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conversion Rate</Text>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <ProgressChart
          data={data}
          width={screenWidth - 40} // Width of the chart (screen width minus padding)
          height={300} // Increased height for a larger chart
          strokeWidth={24} // Increased stroke width for a more prominent progress bar
          radius={70} // Increased radius for a larger circle
          chartConfig={{
            backgroundGradientFrom: "#1C1C1E",
            backgroundGradientTo: "#383838",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(102, 255, 178, ${opacity})`, // Gradient green for bars
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // White labels for contrast
            style: {
              borderRadius: 16,
            },
            barPercentage: 0.7, // Adjusted bar width for better spacing
            propsForBackgroundLines: {
              strokeWidth: 1,
              strokeDasharray: "4",
              stroke: "rgba(255, 255, 255, 0.2)", // Subtle gridlines
            },
            propsForLabels: {
              fontSize: 12,
              fontWeight: "600",
            },
          }}
          hideLegend={true} // Hide legend for cleaner UI
        />

        {/* Display percentage in the center of the circle */}
        <View style={styles.absoluteCenter}>
          <Text style={styles.percentageText}>
            {conversionData && Math.round(conversionData?.conversionRate)}%{" "}
            {/* Show the conversion rate */}
          </Text>
        </View>
      </View>
      <View style={styles.dropDownContainer}>
        {timePeriod !== "Yearly" && (
          <View style={styles.dropdownWrapper}>
            <Dropdown
              label="Year"
              name="Year"
              selectedValue={mainYear} // Current selected value
              handleInputChangeData={(value) => {
                setMainYear(value);
              }}
              data={yearsData}
              bg="#1C1C1E"
              color="#66FFB2"
            />
          </View>
        )}
        <View style={styles.dropdownWrapper}>
          <Dropdown
            label="Period"
            name="Period"
            selectedValue={timePeriod} // Current selected value
            handleInputChangeData={(value) => {
              setPeriode(value);
            }}
            data={Periode}
            bg="#1C1C1E"
            color="#66FFB2"
          />
        </View>
        {timePeriod === "Monthly" && (
          <View style={styles.dropdownWrapper}>
            <Dropdown
              label="Month"
              name="Month"
              selectedValue={selectedMonth} // Current selected value
              handleInputChangeData={(value) => {
                setMonth(value);
              }}
              data={Month}
              bg="#1C1C1E"
              color="#66FFB2"
            />
          </View>
        )}

        {timePeriod === "Quarterly" && (
          <View style={styles.dropdownWrapper}>
            <Dropdown
              label="Quarterly"
              name="Quarterly"
              selectedValue={selectedQuarter} // Current selected value
              handleInputChangeData={(value) => {
                setSelectedQuater(value);
              }}
              data={Quater}
              bg="#1C1C1E"
              color="#66FFB2"
            />
          </View>
        )}

        {timePeriod === "Yearly" && (
          <View style={styles.dropdownWrapper}>
            <Dropdown
              label="Yearly"
              name="Yearly"
              selectedValue={selectedYear} // Current selected value
              handleInputChangeData={(value) => {
                setYear(value);
              }}
              data={yearsData}
              bg="#1C1C1E"
              color="#66FFB2"
            />
          </View>
        )}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0A0A",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#66FFB2",
  },
  chartContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    width: 300,
    height: 300,
  },
  absoluteCenter: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  percentageText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#4CAF50",
    textAlign: "center",
  },
  dropDownContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    width: "100%",
  },
  dropdownWrapper: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    backgroundColor: "#1C1C1E", // Light background for dropdown
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  dropdown: {
    fontSize: 14,
    fontWeight: "600",
    color: "#66FFB2", // Highlighted text color
    textAlign: "center",
  },
});

export default LeadConversionForOrg;
