import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Button,
  TouchableOpacity,
  Alert,
} from "react-native";

import CancelButton from "../../Components/Button/CancelButton";
import InputBox from "../../Components/InputBox/InputBox";
import InnerButton from "../../Components/Button/InnerButton";
import Dropdown from "../../Components/DashBoard/Dropdown";
import { Url } from "../../Components/Constants/Constants";
// import { ScrollView } from "react-native-gesture-handler";
import { ScrollView } from "react-native";

const ProjectForm = ({ isOpen, onClose, renderList, data, mode }) => {
  const MainOrgName = 87;
  const [contactInfos, setContactInfos] = useState([
    { name: "", mobile: "", email: "" },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    Pcode: "",

    multiuser: "",
    Address: "",
    discription: "",
    status: "",
    country: "",
    city: "",
    zip: "",
    state: "",
    Owner_Name: MainOrgName,
  });
  const [projectTypes, setProjectTypes] = useState([]); // Initialize with one empty dropdown field
  const addProjectType = () => {
    setProjectTypes([...projectTypes, ""]);
  };
  const projectSubmit = () => {
    console.log("nice");
  };

  const handleInputChange = (value, name) => {
    if (name === "category") {
      const data = [...projectTypes];
      data.push(value);
      setProjectTypes(data);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [categories, setCategories] = useState([]);
  //   const [projectTypes, setProjectTypes] = useState([]);

  useEffect(() => {
    const catagoryFetcher = async () => {
      try {
        const data = await fetch(
          `${Url}settingsRoutes/catagory/${MainOrgName}`
        );
        const resData = await data.json();

        if (resData?.success) {
          const filterData = resData?.data?.map((item) => {
            return { label: item?.Catagory, value: item?.Id };
          });
          //   console.log(resData?.data);
          //   console.log("ctaegory");
          setCategories(filterData);
        }
      } catch (e) {
        console.log("There is Some Some error In fetching Data Catagory " + e);
      }
    };
    if (MainOrgName) {
      catagoryFetcher();
    }
  }, [MainOrgName]);

  const handleProjectTypeChange = (value, index) => {
    const newProjectTypes = [...projectTypes];
    newProjectTypes.push(value);
    setProjectTypes(newProjectTypes);
  };

  console.log(projectTypes);
  console.log("This is Project Types");
  const handleAddProjectType = () => {
    setProjectTypes([...projectTypes, ""]);
  };

  const handleRemoveProjectType = (index) => {
    const updatedTypes = projectTypes.filter((_, i) => i !== index);
    setProjectTypes(updatedTypes);
  };

  //   const handleProjectTypeChange = (value, index) => {
  //     const updatedTypes = [...projectTypes];
  //     updatedTypes[index] = value;
  //     setProjectTypes(updatedTypes);
  //   };

  const saveProjectToDb = () => {
    // e.preventDefault();
    // Data saving logic...

    // setProjectTypes([""]);
    // setUsersSelection([]);
    const dataSave = async () => {
      try {
        const data = await fetch(`${Url}properties/project`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            // Pcode: code,
            projectTypes,
            multiuser: contactInfos,
            // usersSelection,
            // multiuser: contactInfos,
            Address: formData.Address,
            discription: formData.discription,
            status: formData.status,
            country: formData.country,
            city: formData.city,
            zip: formData.zip,
            state: formData.state,
            Owner_Name: MainOrgName,
          }),
        });
        const resData = await data.json();

        if (resData?.success === true) {
          //   toast.success("Project Added successfully!", {
          //     position: "top-right",
          //     autoClose: 3000,
          //     hideProgressBar: false,
          //     closeOnClick: true,
          //     pauseOnHover: true,
          //     draggable: true,
          //     progress: undefined,
          //   });
          //   setIsloading(false);
          //   setfetcherData(!fetcherdata);
          Alert.alert("Project Inserted");
          onClose();
          renderList();
          //   setDatafetcherData();
          //   setErrorMessage("");
        } else {
          //   setErrorMessage(resData.message);
          //   openModal();
        }
      } catch (e) {
        console.log("Error inserting data: " + e);
      }
    };
    dataSave();
  };
  useEffect(() => {
    if (data) {
      console.log("This is Project data");
      console.log(data);

      setFormData((prev) => ({
        ...prev,
        name: data?.Name,
        discription: data?.Discription,
        country: data?.Country,
        state: data?.State,
        city: data?.City,
        zip: data?.Zip,
        Address: data?.Address,
      }));

      // Map Categories to projectTypes
      if (data?.Categories) {
        let arr = [];
        for (let i = 0; i < data?.Categories.length; i++) {
          arr.push(data?.Categories[i].Category_Id);
        }
        setProjectTypes(arr);
      }
    }
  }, [data]);

  const saveProjectToDbEdit = () => {
    // setIsloading(true);
    setProjectTypes([""]);
    // setUsersSelection([]);
    const dataSave = async () => {
      try {
        const data1 = await fetch(`${Url}properties/projectEdit`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Id: data?.Project_Code,
            name: formData?.name,
            // Pcode: for,
            projectTypes,
            // usersSelection,
            multiuser: contactInfos,
            Address: formData?.Address,
            discription: formData?.discription,
            status: formData?.status,
            country: formData?.status,
            city: formData?.city,
            zip: formData?.zip,
            state: formData?.state,
            Owner_Name: MainOrgName,
            dateCreated: data?.Created_Date,
            OldPName: data?.Name,
          }),
        });
        const resData = await data1.json();
        if (resData?.success === true) {
          //   setIsloading(false);
          //   setfetcherData(!fetcherdata);
          //   formClose();
          onClose();
          Alert.alert("Project is Edited ");
          renderList()

          //   setDatafetcherData();
        } else {
          Alert.alert("Problem in Editing Code ");
          //   setErrorMessage(resData?.message);
        }
      } catch (e) {
        Alert.alert(e.message);
        console.log("Error inserting data: " + e);
      }
    };
    dataSave();
  };

  console.log(projectTypes);

  return (
    <Modal
      transparent={true}
      visible={isOpen}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.formWrapper}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.title}>Project</Text>

            <InputBox
              placeholder="Project Name"
              style={styles.input}
              keyboardType="text"
              value={formData.name}
              onchange={(value) => {
                handleInputChange(value, "name");
              }}
              label="Project Name"
            />
            {mode === true && (
              <Dropdown
                label="Category"
                name="category"
                selectedValue={formData.category}
                handleInputChangeData={(value) =>
                  handleInputChange(value, "category")
                }
                data={categories}
              />
            )}

            {projectTypes?.length &&
              projectTypes.map((type, index) => (
                <View key={index} style={styles.projectTypeContainer}>
                  <Dropdown
                    label={`Project Type ${index + 1}`}
                    name={`projectType_${index}`}
                    selectedValue={type} // Ensure this matches your state structure
                    handleInputChangeData={(value) =>
                      handleProjectTypeChange(value, index)
                    }
                    data={categories} // Pass available categories for the dropdown
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveProjectType(index)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddProjectType}
            >
              <Text style={styles.addButtonText}>+ Add Project Type</Text>
            </TouchableOpacity>

            <InputBox
              placeholder="Description"
              style={styles.input}
              value={formData.discription}
              onchange={(value) => {
                handleInputChange(value, "discription");
              }}
              label="Description"
            />
            <InputBox
              placeholder="Address"
              style={styles.input}
              value={formData.Address}
              onchange={(value) => {
                handleInputChange(value, "Address");
              }}
              label="Address"
            />
            <InputBox
              placeholder="Country"
              style={styles.input}
              value={formData.country}
              onchange={(value) => {
                handleInputChange(value, "country");
              }}
              label="Country"
            />
            <InputBox
              placeholder="State"
              style={styles.input}
              value={formData.state}
              onchange={(value) => {
                handleInputChange(value, "state");
              }}
              label="State"
            />
            <InputBox
              placeholder="City"
              style={styles.input}
              value={formData.city}
              onchange={(value) => {
                handleInputChange(value, "city");
              }}
              label="City"
            />
            <InputBox
              placeholder="Zip Code"
              style={styles.input}
              value={formData.zip}
              onchange={(value) => {
                handleInputChange(value, "zip");
              }}
              label="Zip Code"
            />

            <View style={styles.buttonContainer}>
              {mode === true && (
                <InnerButton onClick={saveProjectToDb} label="Add Projects" />
              )}
              {mode === false && (
                <InnerButton
                  onClick={saveProjectToDbEdit}
                  label="Edit Projects"
                />
              )}

              <View style={{ justifyContent: "center", alignItems: "center" }}>
                <CancelButton onClose={onClose} />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  formWrapper: {
    width: "100%",
    maxHeight: "90%", // Ensures content fits within the screen
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 15,
  },
  projectTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
  },
  removeButton: {
    marginLeft: 10,
    backgroundColor: "#f44336",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  addButton: {
    marginTop: 10,
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonContainer: {
    marginTop: 20,
    width: "100%",
  },
});

export default ProjectForm;
