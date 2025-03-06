import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons"; // For icons
import { Url } from "../../Components/Constants/Constants";
import InnerButton from "../../Components/Button/InnerButton";
import ProjectForm from "./ProjectForm";
import axios from "axios";

const Project = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [formopen, setFormOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [tog, setTog] = useState(false);

  const [seleedItem, setSeletedItem] = useState(null);

  const MainOrgName = 87;

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${Url}properties/project/${MainOrgName}`);
        const jsonData = await response.json();
        setProjects(jsonData.data || []);
      } catch (e) {
        console.log("Error fetching project list:", e);
      } finally {
        setIsLoading(false);
      }
    };

    if (MainOrgName) {
      fetchProjects();
    }
  }, [MainOrgName, tog]);

  const handleEdit = (project) => {
    setSeletedItem(project);
    setEditOpen(true);
  };

  const handleDelete = (projectCode) => {
    console.log("Delete project with code:", projectCode);
  };

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item?.Name}</Text>
        <Text style={styles.cardSubtitle}>{item?.Discription}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardText}>Address: {item?.Address}</Text>
        <Text style={styles.cardText}>Owner: {item?.Project_Owner_Name}</Text>
        <Text style={styles.cardText}>Country: {item?.Country}</Text>
        <Text style={styles.cardText}>
          Created:{" "}
          {item?.Created_Date
            ? new Date(item?.Created_Date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "N/A"}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEdit(item)}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteIt(item?.Project_Code, item.Owner)}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const projectSubmit = (code, owner) => {
    console.log("Nice One");
  };

  const deleteIt = (code, owner,item) => {
    console.log(owner);
    console.log(code);
    const handleDelete = async () => {
      try {
        // console.log("nice");
        const response = await axios.delete(`${Url}properties/delete-project`, {
          data: {
            Project_Code: code,
            Owner: owner,
          },
        });
        if (response.data.success) {
          setTog(!tog);
          Alert.alert("Project Deleted ");
          setTog(!tog);
        } else {
          //   toast.error(response.data.message);t("nice")
          Alert.alert("Some went wrong in dleteing the project");
        }
      } catch (error) {
        // toast.error("Error deleting project: " + error.message);
        Alert.alert(e.message);
      }
    };
    handleDelete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
      </View>
      <View style={styles.buttonContainer}>
        <InnerButton
          onClick={() => {
            setFormOpen(true);
          }}
          label="Add Projects"
        />
      </View>

      <ProjectForm
        isOpen={formopen}
        onClose={() => {
          setFormOpen(false);
        }}
        renderList={() => {
          setTog(!tog);
        }}
        // data={seleedItem}
        mode={true}
      />

      <ProjectForm
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false);
        }}
        renderList={() => {
          setTog(!tog);
        }}
        data={seleedItem}
        mode={false}
      />
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : projects.length > 0 ? (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.Project_Code.toString()}
          renderItem={renderCard}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <Text style={styles.noDataText}>No projects available.</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#f9f9f9",
  },
  header: {
    padding: 16,
    // backgroundColor: "#6200ea",
    alignItems: "center",
  },
  headerTitle: {
    color: "black",
    fontSize: 20,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 16,
  },
  noDataText: {
    textAlign: "center",
    fontSize: 16,
    color: "#555",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 8,
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
    marginBottom: 16,
  },
  cardText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 4,
  },
  editButton: {
    backgroundColor: "#4caf50",
  },
  deleteButton: {
    backgroundColor: "#f44336",
  },
  actionButtonText: {
    color: "#fff",
    marginLeft: 4,
    fontSize: 14,
  },
  buttonContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
});

export default Project;
