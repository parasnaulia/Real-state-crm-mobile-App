import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Button,
  Alert,
} from "react-native";
import LeadsForms from "../../Components/Leads/LeadsForms";
import InnerButton from "../../Components/Button/InnerButton";
import { options, Url } from "../../Components/Constants/Constants";
import Ionicons from "react-native-vector-icons/Ionicons";
import Dropdown from "../../Components/DashBoard/Dropdown";
import EmailCheck from "../../Components/Leads/EmailCheck";
import AdditionalDetails from "../../Components/Leads/AdditionalDetails";
import LeadsShimmer from "../../Components/Leads/LeadsShimmer.jsx/LeadsShimmer";

const Index = () => {
  const [openForm, setOpenForm] = useState(false);
  const [leadsData, setLeadsData] = useState([]);
  const [leadsStatus, setLeadsStatus] = useState("");

  const [openAdditional, setOpenAdditional] = useState(false);

  const [leadsAssociated, setLeadsAssocaited] = useState(null);
  const [confirmFrom, setConformationForm] = useState(false);

  const [selectedValue, setSelectedValue] = useState(null);

  const MainOrgName = 87;

  const [leadsData1, setLeadsData1] = useState(null);

  const [loading, setLoading] = useState(false);

  const leadssubmitHandler = () => {
    setOpenForm(true);
  };

  const [toggle, setToggle] = useState(false);

  useEffect(() => {
    const leadsFetcher = async () => {
      try {
        setLoading(true);
        const data = await fetch(`${Url}leadRoutes/leadsData/${MainOrgName}`);
        const resData = await data.json();
        setLeadsData(resData.data);
        setLoading(false);
      } catch (e) {
        console.error("Error fetching leads:", e);
      }
    };

    if (MainOrgName) {
      leadsFetcher();
    }
  }, [MainOrgName, toggle]);
  const handleDelete = async (leadId) => {
    try {
      setLoading(true);
      // Send a DELETE request to the backend API using fetch
      const response = await fetch(
        `${Url}leadRoutes/deleteLeadData/${leadId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Parse the JSON response
      const data = await response.json();

      if (data.success === true) {
        // Display success toast notification

        // Refresh the list of leads (ensure renderList is properly defined)
        // renderList();
        setToggle(!toggle);
        setLoading(false);
        Alert.alert("Leads Deleted Sucessfully", "Good");
      } else {
        // Display error toast notification for failure response
      }
    } catch (error) {
      // Enhanced error handling to display the appropriate error message
      const errorMessage = error.message || "An error occurred";
    }
  };

  // import Ionicons from "react-native-vector-icons/Ionicons";

  const changeLeadsStatus = (value, row) => {
    alert(value);
    // console.log(value);
    // console.log(status);
    console.log(row);

    const selectedValue = value;
    row.Lead_Status = selectedValue;

    // console.log(selectedValue);

    if (selectedValue === "Closed Won-Converted") {
      if (row?.Flat_id) {
        const checkConfirmation = async () => {
          try {
            const data = await fetch(
              `${Url}leadRoutes/getAssociated/${row?.Lead_ID}/${row?.Flat_id}`
            );

            console.log(row?.Lead_ID);
            console.log(row?.Flat_id);

            const jsonData = await data.json();

            console.log(jsonData);

            // console.log("res data");
            if (jsonData?.data?.length) {
              setLeadsAssocaited(jsonData?.data);
              setConformationForm(true);
              // setCurrentRowSelected(row);
              // alert("DSF")
            } else {
              setLeadsAssocaited([]);
              setConformationForm(true);
              // setDataEmailOpen();
              // dataLead(row);
            }
            setToggle(!toggle);
          } catch (e) {
            console.log(
              "There is Some Error In Getting leads Assocaited With User" + e
            );
          }
        };
        checkConfirmation();
      } else {
        setLeadsAssocaited([]);
        setConformationForm(true);
        setToggle(!toggle);
        // setDataEmailOpen();
        // dataLead(row);
      }
      // setDataEmailOpen();
      // alert("Aamaasdioasd");
    } else {
      setToggle(!toggle);
      updateStatusApi(row.Lead_ID, selectedValue);
    }
  };

  const updateStatusApi = async (leadId, status) => {
    try {
      const response = await fetch(`${Url}leadRoutes/leadsstatus`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Lead_id: leadId, status }),
      });
      if (response.ok) setToggle(!toggle);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("An error occurred while updating status");
    }
  };

  const handleEmail = () => {
    console.log("nice");
  };

  if (loading) {
    return <LeadsShimmer />;
  }

  const renderCard = ({ item }) => (
    // const data=10;
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {item.First_Name} {item.Last_Name}
        </Text>
        <Text style={styles.cardSubtitle}>{item.Email_Address}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardText}>Age: {item.Age}</Text>
        <Text style={styles.cardText}>Status: {item.Lead_Status}</Text>
        <Text style={styles.cardText}>Contact: {item.Contact_Number}</Text>
        <Text style={styles.cardText}>Country: {item.Country}</Text>
        <View style={styles.dropDown}>
          <Dropdown
            label="Lead Status"
            name="leadStatus"
            selectedValue={item?.Lead_Status} // Current selected value
            handleInputChangeData={(value) => {
              setSelectedValue(item);
              changeLeadsStatus(value, item);
            }}
            // value={selectedV}
            data={options}
          />
        </View>

        <View style={styles.actionButtons}>
          {/* Delete Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item?.Lead_ID)}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>

          {/* Update Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.updateButton]}
            onPress={() => {
              setLeadsData1(item); // Replace with your update handler
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Leads Management</Text>
          {/* <Text style={styles.subtitle}>
            Manage and track your leads effectively.
          </Text> */}
        </View>

        <LeadsForms
          renderList={() => {
            setToggle(!toggle);
          }}
          isOpen={openForm}
          onClose={() => {
            setOpenForm(false);
            setLeadsData1("");
          }}
          isEdit={true}
          data1={leadsData1}
        />
        <EmailCheck
          isOpen={confirmFrom}
          onClose={() => {
            setConformationForm(false);
          }}
          handleSubmit={handleEmail}
          selectedValue={selectedValue}
          openAdditional={() => {
            setOpenAdditional(true);
          }}
        />
        <AdditionalDetails
          isOpen={openAdditional}
          onClose={() => {
            setOpenAdditional(false);
          }}
          data={selectedValue}
          renderList={() => {
            setToggle(!toggle);
          }}
        />

        <View style={styles.buttonContainer}>
          <InnerButton onClick={leadssubmitHandler} label="Add Leads" />
        </View>

        <FlatList
          data={leadsData}
          keyExtractor={(item) => item.Lead_ID.toString()}
          renderItem={renderCard}
          contentContainerStyle={styles.cardList}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  buttonContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  cardList: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
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
    marginTop: 5,
  },
  cardBody: {
    flexDirection: "column",
  },
  cardText: {
    fontSize: 14,
    color: "#555",
    marginVertical: 2,
  },

  buttonContainer1: {
    marginBottom: 2,
  },
  buttonContainer2: {
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    elevation: 2,
  },
  deleteButton: {
    backgroundColor: "#ff4d4d",
  },
  updateButton: {
    backgroundColor: "#4CAF50",
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
  },
  dropDown: {
    marginTop: 10,
  },
});

export default Index;
