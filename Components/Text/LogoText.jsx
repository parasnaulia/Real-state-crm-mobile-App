import React from "react";
import { View, StyleSheet } from "react-native";
import {
  Svg,
  Text as SvgText,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from "react-native-svg";

const LogoText = () => {
  return (
    <View style={styles.container}>
      {/* "Welcome to" with Gradient */}
      <View style={styles.welcome}>
        <Svg height="50" width="300">
          <Defs>
            <SvgGradient id="welcomeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#4CAF50" stopOpacity="1" />
              <Stop offset="50%" stopColor="#2196F3" stopOpacity="1" />
              <Stop offset="100%" stopColor="#FF4081" stopOpacity="1" />
            </SvgGradient>
          </Defs>
          <SvgText
            fill="url(#welcomeGrad)"
            fontSize="28"
            fontWeight="500"
            x="10"
            y="35"
            textAnchor="start"
          >
            Welcome to
          </SvgText>
        </Svg>
      </View>

      {/* "Realty Realm" with Gradient */}

      <View style={styles.logo}>
        <Svg height="80" width="320">
          <Defs>
            <SvgGradient id="realtyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#4CAF50" stopOpacity="1" />
              <Stop offset="50%" stopColor="#2196F3" stopOpacity="1" />
              <Stop offset="100%" stopColor="#FF4081" stopOpacity="1" />
            </SvgGradient>
          </Defs>
          <SvgText
            fill="url(#realtyGrad)"
            fontSize="40"
            fontWeight="bold"
            x="10"
            y="50"
            textAnchor="start"
          >
            Realty Realm
          </SvgText>
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#fff",
  },
  welcome: {
    // marginLeft: 10,
  },
  logo: {
    marginLeft: 10,
  },
});

export default LogoText;
