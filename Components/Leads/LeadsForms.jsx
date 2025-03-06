import React, { Children, useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
} from "react-native";
import CancelButton from "../Button/CancelButton";
import InputBox from "../InputBox/InputBox";
// import { Picker } from "@react-native-picker/picker";
import Dropdown from "../DashBoard/Dropdown";
import { enquirySources, options, Url } from "../Constants/Constants";
import GradientButton from "../Button/MainButton";
import Loader from "../Loader/Loader";

const LeadsForms = ({ isOpen, onClose, renderList, data1, isEdit }) => {
  const [isLoading, setIsLoading] = useState(false);

  const [projects, setProjects] = useState([]);
  const [projectCategory, setProjectCatagories] = useState([]);
  const [typeFlat, setTypeFlat] = useState([]);
  const [config, setConfig] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [unitNo, setMainUnitNumber] = useState([]);
  const [mainBlocks, setMainBlocks] = useState([]);

  const userId = 92;
  const orgName = 87;

  const role = "Organization";
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    occupation: "",
    leadStatus: "",
    sourceOfEnquiry: "",
    referrerName: "",
    city: "",
    state: "",
    country: "",
    zipcode: "",
    projectCategory: "",
    type: "",
    configuration: "",
    unitNo: "",
    budget: "",
    finance: "",
    tentativePurchaseDate: "",
    notes: "",
    emailAddress: "",
    contactNumber: "",
    gender: "",
    Address: "",
    ProjectName: "",
    block: "",
  });

  const handleInputChange = (value, name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const data = [
    { label: 1, value: 1 },
    { label: 2, value: 2 },
    { label: 3, value: 3 },
    { label: 4, value: 4 },
  ];
  const handleSubmit = () => {
    const saveLeadFetcher = async () => {
      setIsLoading(true);
      try {
        console.log(formData);
        const response = await fetch(`${Url}leadRoutes/leads`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: formData,

            MainOrgEmail: "parasnaulia645@gmail.com",
            MainOrgName: 87,
            userData: "On-jo",
            userEmail: "onjo1234@gmail.com",
            User_id: 92,
          }),
        });
        const resData = await response.json();
        if (resData?.success === true) {
          setFormData({
            firstName: "",
            lastName: "",
            age: "",
            occupation: "",
            leadStatus: "",
            sourceOfEnquiry: "",
            referrerName: "",
            city: "",
            state: "",
            country: "",
            zipcode: "",
            projectCategory: "",
            type: "",
            configuration: "",
            unitNo: "",
            budget: "",
            finance: "",
            tentativePurchaseDate: "",
            notes: "",
            emailAddress: "",
            contactNumber: "",
            gender: "",
            Address: "",
            ProjectName: "",
            block: "",
          });
          onClose();
          renderList();
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        console.error("There was an error in fetching the API:", e);
      } finally {
        setIsLoading(false);
      }
    };
    saveLeadFetcher();
  };

  //   console.log(formData);
  useEffect(() => {
    if (data1) {
      setFormData((prev) => ({
        ...prev, // Spread the previous state to retain other values
        firstName: data1?.First_Name,
        lastName: data1?.Last_Name,
        age: Number(data1?.Age),
        country: data1?.Country,
        gender: data1?.Gender,
        leadStatus: data1?.Lead_Status,
        sourceOfEnquiry: data1?.Source_of_Inquiry,
        emailAddress: data1?.Email_Address,
        Address: data1?.Address,
        city: data1?.City,
        state: data1?.State,
        country: data1?.Country,
        zipcode: data1?.Zip_code,
        occupation: data1?.Occupation,
        unitNo: data1?.Unit_No,
        ProjectName: data1?.Project_Name,
        projectCategory: data1?.Property_Type,
        type: Number(data1?.Type),
        configuration: data1?.Configuration,
        // unitNo: data1?.Unit_No,
        block: data1?.Block,
      }));
    }
  }, [data1]);

  console.log(data1);

  const handleEdit = () => {
    // Alert.alert("nice");
    const saveLeadFetcher = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${Url}leadRoutes/leads/${data1?.Lead_ID}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              data: formData,

              MainOrgEmail: "parasnaulia645@gmail.com",
              MainOrgName: 87,
              userData: "on-jo",
              userEmail: data1?.emailAddress,
              User_id: 92,
              oldEmail: data1?.Email_Address,
            }),
          }
        );
        const resData = await response.json();
        if (resData?.success === true) {
          setIsLoading(false);
          Alert.alert("Leads Updated Sucessfully");
          onClose();
          renderList();
        } else {
          Alert.alert("Leads is not Updated Sucessfully");
        }
      } catch (e) {
        Alert.alert("Error in updating leads");
        console.error("There was an error in fetching the API:", e);
      } finally {
        setIsLoading(false);
      }
    };
    saveLeadFetcher();
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await fetch(`${Url}project/${orgName}`);
        const jsonData = await data.json();
        if (jsonData?.success) {
          const customProject = jsonData?.data?.map((item, index) => {
            return { label: item?.Name, value: item?.Project_Code };
          });

          // console.log(customProject);
          // console.log("niceeeeeeeeeee");
          setProjects(customProject);
        }
      } catch (e) {
        console.log("There is Some Error In fetching The Project Data " + e);
      }
    };

    // const fetchProjectForUser = async () => {
    //   try {
    //     const data = await fetch(`${Url}properties/projectForUser/${userId}`);
    //     const resData = await data.json();

    //     if (resData?.success) {
    //       setProjects(resData.data);
    //     }
    //     // setProjects(resData?.data);
    //   } catch (e) {
    //     console.log(
    //       "There is some Error In Fetching The Projecr Data For Particylar User " +
    //         e
    //     );
    //   }
    // };
    if (orgName && role === "Organization") {
      fetchProject();
    }
    //  else if (credOrg?.role !== "Organization" && userId) {
    //   fetchProjectForUser();
    // }
  }, [orgName, userId]);

  useEffect(() => {
    const fetchPCatagories = async () => {
      try {
        const data = await fetch(
          `${Url}properties/catagoryproject/${formData?.ProjectName}/${orgName}`
        );
        const jsonData = await data.json();

        if (jsonData?.success) {
          // setProjects(jsonData.data)

          const customCategory = jsonData?.data?.map((item, index) => {
            return { label: item?.Catagory, value: item?.Id };
          });
          setProjectCatagories(customCategory);
        }
      } catch (e) {
        console.log("There is Some Error In fetching The Project Data " + e);
      }
    };
    if (orgName && formData?.ProjectName) {
      fetchPCatagories();
    }
  }, [orgName, formData?.ProjectName]);

  useEffect(() => {
    const fetchPCatagories = async () => {
      try {
        const data = await fetch(
          `${Url}properties/propertyTypeList/${formData?.ProjectName}/${formData?.projectCategory}`
        );
        const jsonData = await data.json();
        if (jsonData?.success) {
          const customFlat = jsonData?.data?.map((item, index) => {
            return { label: item?.Type, value: Number(item?.id) };
          });
          console.log(customFlat);
          setTypeFlat(customFlat);
        }
      } catch (e) {
        console.log("There is Some Error In fetching The Project Data " + e);
      }
    };
    if (orgName && formData?.ProjectName && formData?.projectCategory) {
      fetchPCatagories();
    }
  }, [orgName, formData?.ProjectName, formData?.projectCategory]);

  useEffect(() => {
    const fetchUnit = async () => {
      try {
        const data = await fetch(
          `${Url}properties/flat-1/${formData?.ProjectName}/${formData?.projectCategory}/${formData?.type}`
        );
        const jsonData = await data.json();
        // setProjects(jsonData.data)

        if (jsonData?.success) {
          const customconfig = jsonData?.data?.map((item) => {
            return { label: item?.Configuration, value: item?.Configuration };
          });
          setConfig(customconfig);

          const filterBlock = jsonData.data.filter((item, index) => {
            return formData.configuration === item?.Configuration;
          });
          const customBlock = filterBlock?.map((item) => {
            return { label: item?.Block, value: item?.Block };
          });

          setBlocks(customBlock);
          setMainBlocks(filterBlock);
        }
      } catch (e) {
        console.log("There is Some Error In fetching The Project Data " + e);
      }
    };
    if (formData?.ProjectName && formData?.projectCategory && formData?.type) {
      fetchUnit();
    }
  }, [
    orgName,
    formData?.ProjectName,
    formData?.projectCategory,
    formData?.type,
    formData?.configuration,
  ]);

  useEffect(() => {
    if (formData.block) {
      console.log(blocks);
      const filterUnit =
        mainBlocks &&
        mainBlocks.filter((item) => {
          return formData.block === item.Block;
        });

      console.log(filterUnit);
      console.log("Filter unit");
      // setUnitNumber(filterUnit)

      const customUnit = filterUnit.map((item) => {
        return { label: item?.Unit_No, value: item?.Unit_No };
      });

      setMainUnitNumber(customUnit);
    }
  }, [formData.block]);

  // console.log(unitNo);

  if (isLoading) {
    return <Loader visible={isLoading} message="Inserting leads" />;
  }

  return (
    <Modal
      transparent={true}
      visible={isOpen}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Leads Form</Text>
            <InputBox
              placeholder="First Name"
              name="firstName"
              style={styles.input}
              value={formData.firstName}
              onchange={(value) => handleInputChange(value, "firstName")}
              label="First Name"
            />
            <InputBox
              placeholder="Last Name"
              name="lastName"
              style={styles.input}
              value={formData.lastName}
              onchange={(value) => handleInputChange(value, "lastName")}
              label="Last Name"
            />
            <InputBox
              placeholder="Email"
              name="email"
              style={styles.input}
              value={formData.emailAddress}
              keyboardType="email-address"
              onchange={(value) => handleInputChange(value, "emailAddress")}
              label="Email"
            />
            <InputBox
              placeholder="Address"
              name="address"
              style={styles.input}
              value={formData.Address}
              onchange={(value) => handleInputChange(value, "Address")}
              label="Address"
            />
            <Dropdown
              label="Age"
              name="age"
              selectedValue={formData?.age} // Current selected value
              handleInputChangeData={(value, name) => {
                handleInputChange(value, name);
              }}
              data={data}
            />
            {/* <InputBox
              placeholder="Gender"
              name="gender"
              style={styles.input}
              value={formData.gender}
              onchange={(value) => handleInputChange(value, "gender")}
              label="First Name"
            /> */}
            <InputBox
              placeholder="Gender"
              name="gender"
              style={styles.input}
              value={formData.gender}
              onchange={(value) => handleInputChange(value, "gender")}
              label="Gender"
            />
            <InputBox
              placeholder="Occupation"
              name="occupation"
              style={styles.input}
              value={formData.occupation}
              onchange={(value) => handleInputChange(value, "occupation")}
              label="Occupation"
            />
            {/* <InputBox
              placeholder="Occupation"
              name="occupation"
              style={styles.input}
              value={formData.occupation}
              onchange={(value) => handleInputChange(value, "occupation")}
              label="Occupation"
            /> */}
            <Dropdown
              label="Lead Status"
              name="leadStatus"
              selectedValue={formData?.leadStatus} // Current selected value
              handleInputChangeData={(value, name) => {
                handleInputChange(value, name);
              }}
              //   value={formData.stat}
              data={options}
            />
            <Dropdown
              label="Source of Enquery"
              name="source"
              selectedValue={formData?.sourceOfEnquiry} // Current selected value
              handleInputChangeData={(value, name) => {
                handleInputChange(value, name);
              }}
              data={enquirySources}
            />
            <InputBox
              placeholder="Country"
              name="country"
              style={styles.input}
              value={formData.country}
              onchange={(value) => handleInputChange(value, "country")}
              label="Country"
            />
            <InputBox
              placeholder="State"
              name="state"
              style={styles.input}
              value={formData.state}
              onchange={(value) => handleInputChange(value, "state")}
              label="State"
            />
            <InputBox
              placeholder="City"
              name="city"
              style={styles.input}
              value={formData.city}
              onchange={(value) => handleInputChange(value, "city")}
              label="City"
            />
            <InputBox
              placeholder="Zip"
              name="zip"
              style={styles.input}
              value={formData.zipcode}
              onchange={(value) => handleInputChange(value, "zipcode")}
              label="Zip"
            />

            <View>
              <Text>Additional Details</Text>
            </View>

            <Dropdown
              label="Project Name"
              name="ProjectName"
              selectedValue={formData?.ProjectName} // Current selected value
              handleInputChangeData={(value, name) => {
                handleInputChange(value, name);
              }}
              data={projects}
            />
            <Dropdown
              label="Project Type"
              name="projectCategory"
              selectedValue={formData?.projectCategory} // Current selected value
              handleInputChangeData={(value, name) => {
                handleInputChange(value, name);
              }}
              data={projectCategory}
            />
            <Dropdown
              label="Type"
              name="type"
              selectedValue={formData?.type} // Current selected value
              handleInputChangeData={(value, name) => {
                handleInputChange(value, name);
              }}
              data={typeFlat}
            />
            <Dropdown
              label="Configuration"
              name="configuration"
              selectedValue={formData?.configuration} // Current selected value
              handleInputChangeData={(value, name) => {
                handleInputChange(value, name);
              }}
              data={config}
            />
            <Dropdown
              label="Block"
              name="block"
              selectedValue={formData?.block} // Current selected value
              handleInputChangeData={(value, name) => {
                handleInputChange(value, name);
              }}
              data={blocks}
            />

            <Dropdown
              label="Unit_No"
              name="unitNo"
              selectedValue={formData?.unitNo} // Current selected value
              handleInputChangeData={(value, name) => {
                handleInputChange(value, name);
              }}
              data={unitNo}
            />

            {!data1 && <GradientButton onClick={handleSubmit} label="Add" />}
            {data1 && <GradientButton onClick={handleEdit} label="Edit" />}

            <CancelButton onClose={onClose} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    // justifyContent: "center",
    // alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    // justifyContent: "center",
    // alignItems: "center",
    paddingHorizontal: 20,
    // width: "100%",
  },
  formContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
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

  submitButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default LeadsForms;
