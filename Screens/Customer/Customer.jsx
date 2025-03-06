import React, { useState, useEffect } from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Url } from "../../Components/Constants/Constants";
import CustomerEdit from "./CustomerEdit";

const Customer = () => {
  const [customer, setCustomer] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const mainOrgName = 87;

  const [tog, setTog] = useState(false);

  const [openForm, setOpenForm] = useState(false);

  const [selectedData, setSelectedData] = useState(null);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${Url}leadRoutes/customer1/${mainOrgName}`
        );
        const jsonData = await response.json();
        setCustomer(jsonData?.data);
        setIsLoading(false);
      } catch (e) {
        console.log("Error fetching customer data", e);
        setIsLoading(false);
      }
    };

    if (mainOrgName) {
      fetchCustomerData();
    }
  }, [mainOrgName, tog]);

  const renderCard = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {item.First_Name} {item.Last_Name}
        </Text>
        <Text style={styles.cardSubtitle}>{item.Email_Address}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardText}>Age: {item.Age}</Text>

        <Text style={styles.cardText}>
          Contact: {item.Contact_Number || "N/a"}
        </Text>
        <Text style={styles.cardText}>Country: {item.Country}</Text>

        <View style={styles.dropDown}></View>

        <View style={styles.actionButtons}>
          {/* <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item?.Lead_ID)}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={[styles.actionButton, styles.updateButton]}
            onPress={() => {
              setSelectedData(item);
              setOpenForm(true);
            }}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <CustomerEdit
        isOpen={openForm}
        onClose={() => {
          setOpenForm(false);
        }}
        renderList={() => {
          setTog(!tog);
        }}
        data1={selectedData}
      />
      <View style={styles.header}>
        <Text style={styles.title}>Customer</Text>
        {/* <Text style={styles.subtitle}>
            Manage and track your leads effectively.
          </Text> */}
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
      ) : (
        <FlatList
          data={customer}
          keyExtractor={(item) => item.Customer_Id.toString()}
          renderItem={renderCard}
          contentContainerStyle={styles.cardList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 10,
  },
  loader: {
    marginTop: 20,
  },
  cardList: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  cardBody: {
    marginTop: 10,
  },
  cardText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  dropDown: {
    marginTop: 10,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 15,
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
  },
  updateButton: {
    backgroundColor: "#4CAF50",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
});

export default Customer;
