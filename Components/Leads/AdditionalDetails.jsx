import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import InputBox from "../InputBox/InputBox";
import { Url } from "../Constants/Constants";
import Dropdown from "../DashBoard/Dropdown";
import GradientButton from "../Button/MainButton";
import CancelButton from "../Button/CancelButton";

const AdditionalDetails = ({
  isOpen,
  onClose,

  selectedValue,
  data,
  renderList,
}) => {
  const [alreadyCustomer, setAlreadyCustomer] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [newCustomer, setNewCustomer] = useState(false);
  const [projects, setProjects] = useState([]);

  const [projectCategory, setProjectCategory] = useState([]);
  const [typeFlat, setTypeFlat] = useState([]);

  const [config, setConfig] = useState([]);
  const [blocks, setBlocks] = useState([]);

  const [unitNo, setUnitNo] = useState([]);

  console.log(data);
  console.log("This is teh data");

  const [plans, setPlans] = useState([]);

  const MainOrgName = 87;

  const userId = 92;

  const [formData, setFormData] = useState({
    ProjectName: "",
    projectCategory: "",
    type: "",

    configuration: "",
    block: "",
    unitNo: "",
    List_Price: "",

    additionalCost: "",
    purchasePrice: "",

    plans: "",
    orgName: MainOrgName,
  });

  //   useEffect(() => {
  //     const fetchProject = async () => {
  //       try {
  //         const data1 = await fetch(
  //           `${Url}project/${data?.Organization_Name_Leads}`
  //         );
  //         const jsonData = await data1.json();

  //         if (jsonData?.success) {
  //           setProjects(jsonData.data);

  //           // setFormData({
  //           //   orgName: MainOrgName,
  //           // });
  //         }
  //       } catch (e) {
  //         console.log("There is Some Error In fetching The Project Data " + e);
  //       }
  //     };
  //     const fetchProjectForUser = async () => {
  //       // alert("nieeceec");
  //       try {
  //         const data = await fetch(`${Url}properties/projectForUser/${userId}`);
  //         const resData = await data.json();
  //         setProjects(resData?.data);
  //       } catch (e) {
  //         console.log(
  //           "There is some Error In Fetching The Projecr Data For Particylar User " +
  //             e
  //         );
  //       }
  //     };
  //     if (data?.Organization_Name_Leads && credOrg?.role === "Organization") {
  //       fetchProject();
  //     } else if (credOrg?.role !== "Organization" && userId) {
  //       fetchProjectForUser();
  //     }
  //   }, [data?.Organization_Name_Leads, userId]);

  const handleInputChange = (value, name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      projectCategory: "",
      type: "",
      configuration: "",
      unitNo: "",
      ProjectName: "",
      additionalCost: "",
      purchasePrice: "",
      List_Price: "",
      plans: "",
      orgName: "",
      block: "",
      customer_Id: "",
      Lead_ID: "",
    });
  };

  const handleSubmit = async () => {
    // Optional: If you need to alert an email, define and use it properly
    if (formData.email) {
      alert(`Email submitted: ${formData.email}`);
    }

    try {
      const response = await fetch(`${Url}leadRoutes/propertyPlan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData: formData,
          data: data,
        }),
      });

      const resData = await response.json();

      if (resData?.success) {
        // setMainCustomerDetails([]); // Assuming mainCustomerDetails is an array and you want to reset it.

        resetForm(); // Reset the form after submission
        // setInfoClose();
        renderList();
        onClose();

        // setpopup(true);
        Alert.alert("nice Leads data is saved ");
      }
    } catch (error) {
      console.error("There is some error in data insertion:", error);
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data1 = await fetch(
          `${Url}properties/project/${data?.Organization_Name_Leads}`
        );
        const jsonData = await data1.json();

        if (jsonData?.success) {
          const customProject = jsonData?.data?.map((item, index) => {
            return { label: item?.Name, value: item?.Project_Code };
          });
          setProjects(customProject);
        }
      } catch (e) {
        console.log("There is Some Error In fetching The Project Data " + e);
      }
    };
    // const fetchProjectForUser = async () => {
    //   // alert("nieeceec");
    //   try {
    //     const data = await fetch(`${Url}properties/projectForUser/${userId}`);
    //     const resData = await data.json();
    //     setProjects(resData?.data);
    //   } catch (e) {
    //     console.log(
    //       "There is some Error In Fetching The Projecr Data For Particylar User " +
    //         e
    //     );
    //   }
    // };
    if (data?.Organization_Name_Leads) {
      fetchProject();
    }
    // } else if (credOrg?.role !== "Organization" && userId) {
    //   fetchProjectForUser();
    // }
  }, [data?.Organization_Name_Leads, userId]);

  useEffect(() => {
    const fetchPCatagories = async () => {
      try {
        const data1 = await fetch(
          `${Url}properties/catagoryproject/${formData?.ProjectName}/${data?.Organization_Name_Leads}`
        );
        const jsonData = await data1.json();

        if (jsonData?.success) {
          const customCategory = jsonData?.data?.map((item, index) => {
            return { label: item?.Catagory, value: item?.Id };
          });

          setProjectCategory(customCategory);
        }
      } catch (e) {
        console.log("There is Some Error In fetching The Project Data " + e);
      }
    };
    if (data?.Organization_Name_Leads && formData?.ProjectName) {
      fetchPCatagories();
    }
  }, [data?.Organization_Name_Leads, formData?.ProjectName, formData]);

  useEffect(() => {
    const fetchPaymentPlan = async () => {
      try {
        const data1 = await fetch(
          `${Url}properties/planSize/${formData?.ProjectName}/${formData?.projectCategory}/${formData?.type}`
        );
        const jsonData = await data1.json();

        const customData = jsonData?.data.map((item) => {
          return { label: item?.Name, value: item?.Name };
        });

        setPlans(customData);
      } catch (e) {
        console.log("There is Some Error In fetching The Project Data " + e);
      }
    };
    if (
      data?.Organization_Name_Leads &&
      formData?.ProjectName &&
      formData?.projectCategory &&
      formData?.type
    ) {
      fetchPaymentPlan();
    }
  }, [
    formData?.type,
    formData?.projectCategory,
    formData?.ProjectName,
    data?.Organization_Name_Leads,
    formData,
  ]);

  useEffect(() => {
    const fetchPCatagories = async () => {
      try {
        const data1 = await fetch(
          `${Url}properties/propertyTypeList/${formData?.ProjectName}/${formData?.projectCategory}`
        );
        const jsonData = await data1.json();
        const customFlat = jsonData?.data?.map((item, index) => {
          return { label: item?.Type, value: Number(item?.id) };
        });

        setTypeFlat(customFlat);
      } catch (e) {
        console.log("There is Some Error In fetching The Project Data " + e);
      }
    };
    if (
      data?.Organization_Name_Leads &&
      formData?.ProjectName &&
      formData?.projectCategory
    ) {
      fetchPCatagories();
    }
  }, [
    data?.Organization_Name_Leads,
    formData?.ProjectName,
    formData?.projectCategory,
  ]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data1 = await fetch(
          `${Url}properties/catagoryFetch-1/${formData?.ProjectName}/${formData?.projectCategory}/${formData?.type}/${data?.Organization_Name_Leads}`
        );
        const resdata = await data1.json();

        const customconfig = resdata?.data?.map((item) => {
          return { label: item?.Configuration, value: item?.Configuration };
        });
        setConfig(customconfig);
      } catch (e) {
        console.log("There is Some Error In Fetching the User data" + e);
      }
    };

    if (
      data?.Organization_Name_Leads &&
      formData?.ProjectName &&
      formData?.projectCategory &&
      formData?.type
    ) {
      fetchConfig();
    }
  }, [
    data?.Organization_Name_Leads,
    formData?.ProjectName,
    formData?.projectCategory,
    formData?.type,
  ]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data1 = await fetch(
          `${Url}properties/BlockFetch/${formData?.ProjectName}/${formData?.projectCategory}/${formData?.type}/${data?.Organization_Name_Leads}/${formData?.configuration}`
        );
        const jsonData = await data1.json();

        const filterBlock = jsonData.data.filter((item, index) => {
          return formData.configuration === item?.Configuration;
        });
        const customBlock = filterBlock?.map((item) => {
          return { label: item?.Block, value: item?.Block };
        });

        setBlocks(customBlock);
      } catch (e) {
        console.log("There is Some Error In Fetching the User data" + e);
      }
    };

    if (
      data?.Organization_Name_Leads &&
      formData?.ProjectName &&
      formData?.projectCategory &&
      formData?.type &&
      formData?.configuration
    ) {
      fetchConfig();
    }
  }, [
    data?.Organization_Name_Leads,
    formData?.ProjectName,
    formData?.projectCategory,
    formData?.type,
    formData?.configuration,
  ]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data1 = await fetch(
          `${Url}properties/UnitFetch/${formData?.ProjectName}/${formData?.projectCategory}/${formData?.type}/${data?.Organization_Name_Leads}/${formData?.configuration}/${formData?.block}`
        );
        const resdata = await data1.json();

        const customUnit = resdata?.data.map((item) => {
          return { label: item?.Unit_No, value: item?.Unit_No };
        });

        setUnitNo(customUnit);
      } catch (e) {
        console.log("There is Some Error In Fetching the User data" + e);
      }
    };

    if (
      data?.Organization_Name_Leads &&
      formData?.ProjectName &&
      formData?.projectCategory &&
      formData?.type &&
      formData?.configuration &&
      formData?.block
    ) {
      fetchConfig();
    }
  }, [
    data?.Organization_Name_Leads,
    formData?.ProjectName,
    formData?.projectCategory,
    formData?.type,
    formData?.configuration,
    formData?.block,
  ]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data1 = await fetch(
          `${Url}properties/ListPriceFetch/${formData?.ProjectName}/${formData?.projectCategory}/${formData?.type}/${formData?.orgName}/${formData?.configuration}/${formData?.block}/${formData?.unitNo}`
        );
        const resdata = await data1.json();

        // setMainListPrice(resdata.data[0]?.List_Price);
        // alert(resdata.data[0]?.List_Price);
        // alert(resdata.data[0]?.List_Price);

        setFormData((prevData) => ({
          ...prevData,
          List_Price: resdata.data[0]?.List_Price,
        }));
      } catch (e) {
        console.log("There is Some Error In Fetching the User data" + e);
      }
    };

    if (
      formData?.orgName &&
      formData?.ProjectName &&
      formData?.projectCategory &&
      formData?.type &&
      formData?.configuration &&
      formData?.block &&
      formData?.unitNo
    ) {
      fetchConfig();
      // alert("mnice");
    }
  }, [
    data,
    userId,
    formData?.ProjectName,
    formData?.projectCategory,
    formData?.type,
    formData?.configuration,
    formData?.block,
    formData?.unitNo,
    formData?.orgName,
  ]);

  useEffect(() => {
    if (data) {
      setFormData((prev) => ({
        ...prev, // Spread the previous state to retain other values

        unitNo: data?.Unit_No,
        ProjectName: data?.Project_Name,
        projectCategory: data?.Property_Type,
        type: data?.Type,
        configuration: data?.Configuration,
        // unitNo: data1?.Unit_No,
        block: data?.Block,
        Owner_Name: data?.Lead_owner,
        Lead_ID: data.Lead_ID,
        orgName: data?.Organization_Name_Leads,
      }));
    }
  }, [data]);

  return (
    <Modal
      transparent={true}
      visible={isOpen}
      animationType="slide"
      onRequestClose={onClose}
    >
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Customer Details</Text>
            {/* Uncomment these InputBoxes and implement their logic as needed
             */}
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
            <InputBox
              placeholder="List Price"
              style={styles.input}
              keyboardType="numeric"
              value={formData?.List_Price}
              onchange={(value) => handleInputChange(value, "List_Price")}
              label="List Price"
            />
            <InputBox
              placeholder="Purchase Price"
              style={styles.input}
              keyboardType="numeric"
              value={formData?.purchasePrice}
              onchange={(value) => handleInputChange(value, "purchasePrice")}
              label="Purchase Price"
            />
            <Dropdown
              label="Plan"
              name="plans"
              selectedValue={formData?.plans} // Current selected value
              handleInputChangeData={(value, name) => {
                handleInputChange(value, name);
              }}
              data={plans}
            />

            <GradientButton label="Submit" onClick={handleSubmit} />

            <CancelButton onClose={onClose} />
          </View>
        </View>
      </ScrollView>
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
  formContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
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
  button: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  newCustomerButton: {
    backgroundColor: "#808080", // Green shade
  },
  existingCustomerButton: {
    backgroundColor: "#808080", // Orange shade
  },
  submitButton: {
    backgroundColor: "#007BFF", // Blue shade
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#007BFF",
    fontSize: 14,
    fontWeight: "600",
  },
  bgChange: {
    backgroundColor: "blue",
  },
});

export default AdditionalDetails;
