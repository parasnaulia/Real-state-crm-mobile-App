const express = require("express");

const mySqlPool = require("../../config/db.js");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const dayjs = require("dayjs");
const moment = require("moment");

const {
  assignLeadsUpdate,
  updateActivityLogs,
  ActivityLogMiddleWareInsertion,
  insertInUserTask,

  customerInsertionHelper,
  purchaseOrderInsertionHelper,
  paymentPlanInsertion,
  deleteLeadsAndSoldStatus,

  leadsInsertionData,

  updateLeadsProeperty,
} = require("../../Controllers/LeadsController");

const {
  leadsAssociatedWithProperty,
  selctLedsByOrg,
  leadsStatusChange,
  deleteLeadData,
  leadForAGivenProperty,
  leadsWithUnsoldFlats,
  leadsByIDFether,
  leadById,
} = require("../../Controllers/LeadsFetcherController.js");
const {
  TaskCallFetcher,
  deleteCall,
  taskEdita,
  callEdit,
} = require("../../Controllers/TaskFetcher/TaskCall.js");
const {
  allLeadsofUser,
  leadsForaUser,
} = require("../../Controllers/UserFetcher/UserFetcher.js");
const {
  customerById,
  customerProperties,
  propertDetailsCustomer,
  customerEmailCheck,
  customerData,
  customerOfUsers,
  paymentPlanRecipt,
  customerEdit,
  purchasePaidPrice,
} = require("../../Controllers/Customerfetcher/CustomerFetcher.js");
const { authenticateToken } = require("../../Middlewares/RoutesAuth.js");
const {
  customerFetcher,
  customercheck,
  paymentPlanPurchase,
} = require("../../Controllers/PropertyFetcher/PropertyFetcherController.js");

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(__dirname, "../../Public/Image");
    // Check if directory exists, if not, create it
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true }); // Ensure all parent folders are created
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({
  storage: storage,
});

// Middleware to handle lead insertion
// const leadMiddleware = async (req, res, next) => {
//   try {
//     // Generate unique number and current date
//     const uniqueNumber = `${Date.now()}${Math.floor(
//       Math.random() * 1_000_000_000
//     )}`;
//     req.uniqueNumber = uniqueNumber;
//     const today = new Date();
//     const dateString = today.toLocaleDateString();

//     // Destructure data from request
//     const {
//       firstName,
//       lastName,
//       emailAddress,
//       contactNumber,
//       age,
//       gender,
//       Address,
//       country,
//       state,
//       city,
//       zipcode,
//       leadStatus,
//       referrerName,
//       sourceOfEnquiry,
//       budget,
//       projectCategory,
//       notes,
//       tentativePurchaseDate,
//       finance,
//       unitNo,
//       configuration,
//       type,
//       ProjectName,
//       block,
//       occupation,
//     } = req.body.data;

//     const { MainOrgName, MainOrgEmail, User_id } = req.body;

//     // Check if lead or user already exists
//     const [existingLeadRows] = await mySqlPool.query(
//       "SELECT * FROM leads WHERE Email_Address = ? AND Organization_Name_Leads = ?",
//       [emailAddress, MainOrgName]
//     );
//     const [existingUserRows] = await mySqlPool.query(
//       "SELECT * FROM users WHERE Email = ? AND Organization_Name_User = ?",
//       [emailAddress, MainOrgName]
//     );

//     if (existingLeadRows?.length > 0 || existingUserRows.length > 0) {
//       return res.status(400).send({
//         message: "User Already Present",
//         success: false,
//       });
//     }

//     let flatIdData = null;

//     // Check if flat data exists and get Flat_id
//     if (unitNo && configuration && block && projectCategory && ProjectName) {
//       const [flatRows] = await mySqlPool.query(
//         `SELECT Flat_id FROM flat WHERE Unit_No = ? AND Configuration = ? AND Block = ?
//          AND Project_Name_flats = ? AND Property_type = ? AND Type_Flat = ? AND Org_Name = ?`,
//         [
//           unitNo,
//           configuration,
//           block,
//           ProjectName,
//           projectCategory,
//           type,
//           MainOrgName,
//         ]
//       );
//       flatIdData = flatRows.length > 0 ? flatRows[0]?.Flat_id : null;
//     }

//     // Insert new lead data into the database
//     const [result] = await mySqlPool.query(
//       `INSERT INTO leads (
//          First_Name, Last_Name, Contact_Number, Email_Address, Age, Gender, Address, Country, State,
//          City, Zip_code, Lead_owner, Lead_Status, Referrer, Source_of_Inquiry, Date_Created,
//          Property_Type, Budget, Organization_Name_Leads, Organiztion_Email, Notes,
//          Tentative_Purchase_Date, Finance, Unit_No, Configuration, Type, Project_Name, Block,
//          Occupation, Created_Date, Flat_Id
//        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         firstName,
//         lastName,
//         contactNumber,
//         emailAddress,
//         age,
//         gender,
//         Address,
//         country,
//         state,
//         city,
//         zipcode,
//         User_id,
//         leadStatus,
//         referrerName,
//         sourceOfEnquiry,
//         dateString,
//         projectCategory || null,
//         budget,
//         MainOrgName,
//         MainOrgEmail,
//         notes,
//         tentativePurchaseDate,
//         finance,
//         unitNo,
//         configuration,
//         type || null,
//         ProjectName || null,
//         block,
//         occupation,
//         today,
//         flatIdData,
//       ]
//     );

//     // Store the inserted lead ID for further processing if necessary
//     req.insertedId = result.insertId;

//     next(); // Continue to main route handler
//   } catch (error) {
//     console.error("Error inserting lead data:", error);
//     return res.status(500).send({
//       message: "Error inserting lead data.",
//       success: false,
//     });
//   }
// };

// leadsInsertionData,

// updateLeadsProeperty,

// Main route to handle lead and flat updates in a transaction
router.post("/leads", authenticateToken, async (req, res) => {
  let connection;

  // console.log(req.body);

  try {
    // Validate request data
    const leadData = req.body.data;
    const { MainOrgName, MainOrgEmail, User_id, userData } = req.body;
    console.log(req.body);
    console.log("nicer");

    if (!leadData || !MainOrgName || !User_id) {
      throw new Error("Invalid request data.");
    }

    // Start transaction
    connection = await mySqlPool.getConnection();
    await connection.beginTransaction();

    const { insertId } = await leadsInsertionData(
      { ...leadData, MainOrgName, MainOrgEmail, User_id },
      connection
    );

    await updateLeadsProeperty(
      insertId,
      {
        ...leadData,
        userName: userData,
        userId: User_id,
        orgName: MainOrgName,
      },
      connection
    );

    await connection.commit();
    console.log("data saved");

    res
      .status(200)
      .send({ message: "Lead data processed successfully.", success: true });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Transaction failed:", error.message);
    res.status(500).send({ message: error.message, success: false });
  } finally {
    if (connection) connection.release();
  }
});
router.get(
  "/customerProperty/:name/:email",
  authenticateToken,

  async (req, res) => {
    const { name, email } = req.params;
    try {
      // Query the database for a customer with the provided email and organization name
      const rows = await customerFetcher(name, email);
      if (rows.length > 0) {
        // If a customer is found, proceed to the next middleware or route handler
        return res.status(200).send({
          message: "Already a Customer",
          success: true,
        });
      } else {
        // If no customer is found, return a 404 response
        return res.status(200).send({
          message: "No customer found he is a new customer",
          success: false,
        });
      }
    } catch (e) {
      console.log("Error searching for customer: " + e);
      // Catch any errors during the search and return a 500 response
      return res.status(500).send({
        message: "Error searching for customer",
        success: false,
      });
    }
  }
);

router.get(
  "/customerProperty1/:name/:email",

  async (req, res) => {
    const { name, email } = req.params;
    try {
      // Quey the database for a customer with the provided email and organization name
      const rows = await customercheck(name, email);

      if (rows.length > 0) {
        // If a customer is found, proceed to the next middleware or route handler
        return res.status(200).send({
          message: "Already a Customer",
          success: false,
        });
      } else {
        // If no customer is found, return a 404 response
        return res.status(200).send({
          message: "No customer found he is a new customer",
          success: true,
        });
      }
    } catch (e) {
      console.log("Error searching for customer: " + e);
      // Catch any errors during the search and return a 500 response
      return res.status(500).send({
        message: "Error searching for customer",
        success: false,
      });
    }
  }
);

router.get("/customer/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const rows = await customerById(id);

    if (rows.length > 0) {
      return res.status(200).send({
        message: "Customer data retrieved successfully.",
        success: true,
        data: rows,
      });
    } else {
      return res.status(404).send({
        message: "No customer data found.",
        success: false,
        data: [],
      });
    }
  } catch (e) {
    console.error("Error fetching customer data:", e);
    return res.status(500).send({
      message: "There was an error fetching customer data.",
      success: false,
      data: [],
    });
  }
});

router.get("/customer/:email/:orgName", async (req, res) => {
  const { email, orgName } = req.params;

  try {
    const [rows] = await mySqlPool.query(
      `SELECT * from customer Where Email_Address=? AND  Organization_Name=?`,
      [email, orgName]
    );
    if (rows.length > 0) {
      return res.status(200).send({
        message: "Data of Get Is Getted SucessFully",
        success: true,
        data: rows,
      });
    } else {
      return res.status(500).send({
        message: "Data of Get Is Getted SucessFully",
        success: false,
        data: [],
      });
    }
  } catch (e) {
    console.log("There is Some Error In Fetching Customer Data " + e);
    return res.status(500).send({
      message: "There is Some Error In Fetching Customer Data",
      success: false,
      data: [],
    });
  }
});

// const middlewareCustomer = async (req, res, next) => {
//   try {
//     const { data, formData } = req.body;

//     // Destructure necessary fields from request body

//     const {
//       Email_Address,
//       First_Name,
//       Last_Name,
//       Contact_Number,
//       Age,
//       Gender,
//       Address,
//       Country,
//       State,
//       City,
//       Zip_code,
//       Lead_owner,
//       Referrer,
//       Source_of_Inquiry,
//       Lead_ID,
//       Property_Type,
//       Project_Name,
//       Type,
//       Configuration,
//       Unit_No,
//       Block,
//       Owner_Email,
//       Occupation,
//     } = data;

//     const {
//       projectCategory,
//       type,
//       configuration,
//       unitNo,

//       ProjectName,
//       orgName,

//       block,
//     } = formData;

//     // Ensure Created_Date for new records
//     const Created_Date = new Date();

//     // Check if the property exists
//     const [mainData] = await mySqlPool.query(
//       `SELECT * FROM flat WHERE Org_Name=? AND Type_Flat=? AND Property_type=? AND Project_Name_flats=? AND Unit_No=? AND Block=? AND Configuration=?`,
//       [
//         orgName,
//         type,
//         projectCategory,
//         ProjectName,
//         unitNo,
//         block,
//         configuration,
//       ]
//     );

//     if (mainData.length === 0) {
//       return res.status(400).send({
//         message: "Sorry, Property is Not Available",
//         success: false,
//       });
//     }

//     // Attach the flat ID to the request object
//     req.flatdata = mainData[0]?.Flat_id;

//     // Check if customer already exists in the database
//     const [rows] = await mySqlPool.query(
//       `SELECT * FROM customer WHERE Email_Address = ? AND Organization_Name = ?`,
//       [Email_Address, orgName]
//     );

//     if (rows.length > 0) {
//       // Customer exists, update their details
//       const [result] = await mySqlPool.query(
//         `UPDATE customer
//          SET Property_Type = ?, Project_Name = ?, Type = ?, Configuration = ?, Unit_No = ?, Created_Date = ?, Block = ?, Lead_owner = ?, Lead_ID = ?, Referrer = ?, Source_of_Inquiry = ?,Occupation = ?,Flat_id=?
//          WHERE Email_Address = ? AND Organization_Name = ?`,
//         [
//           projectCategory,
//           ProjectName,
//           type,
//           Configuration,
//           Unit_No,
//           Created_Date,
//           Block,
//           Lead_owner,
//           Lead_ID,
//           Referrer,
//           Source_of_Inquiry,
//           Occupation,
//           mainData[0]?.Flat_id,
//           Email_Address, // Use email from the request body
//           orgName, // Use organization name from the request body
//         ]
//       );

//       if (result.affectedRows > 0) {
//         req.uniqueCustomer = rows[0].Customer_Id; // Attach existing Customer ID to request object
//         next();
//       } else {
//         return res.status(500).send({
//           message: "Failed to update customer",
//           success: false,
//         });
//       }
//     } else {
//       // Customer doesn't exist, insert a new record
//       const [result] = await mySqlPool.query(
//         `INSERT INTO customer (First_Name, Last_Name, Contact_Number, Email_Address, Age, Gender, Address, Country, State, City, Zip_code, Lead_owner, Referrer, Source_of_Inquiry, Lead_ID, Property_Type, Organization_Name, Owner_Email, Project_Name, Type, Configuration, Unit_No, Block, Created_Date,Occupation,Flat_id)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)`,
//         [
//           First_Name,
//           Last_Name,
//           Contact_Number,
//           Email_Address,
//           Age,
//           Gender,
//           Address,
//           Country,
//           State,
//           City,
//           Zip_code,
//           Lead_owner,
//           Referrer,
//           Source_of_Inquiry,
//           Lead_ID,
//           projectCategory,
//           orgName,
//           Owner_Email,
//           ProjectName,
//           type,
//           Configuration,
//           Unit_No,
//           Block,
//           Created_Date,
//           Occupation,
//           mainData[0]?.Flat_id,
//         ]
//       );

//       if (result.affectedRows > 0) {
//         const insertedCustomerId = result.insertId; // Get the inserted Customer ID

//         req.uniqueCustomer = insertedCustomerId; // Attach the inserted customer ID to the request object
//         next();
//       } else {
//         return res.status(500).send({
//           message: "Failed to insert customer",
//           success: false,
//         });
//       }
//     }
//   } catch (e) {
//     console.log("Error searching for customer: " + e);
//     return res.status(500).send({
//       message: "Error occurred during customer processing",
//       success: false,
//       error: e.message, // Provide the error message for more clarity
//     });
//   }
// };

// const middleWareForPurchase = async (req, res, next) => {
//   // Function to generate a unique number (timestamp in milliseconds)
//   const generateUniqueNumber = () => {
//     return Date.now();
//   };

//   // Call the function to get the unique number
//   const uniquePurchaseId = generateUniqueNumber();

//   const generateDateOfIssue = () => {
//     return dayjs().format("YYYY-MM-DD");
//   };

//   // Attach the generated unique number to the request object
//   req.generateUniqueNumber = uniquePurchaseId;

//   const {
//     projectCategory,
//     type,
//     configuration,
//     unitNo,
//     ProjectName,
//     orgName,

//     purchasePrice,
//     List_Price,
//     plans,
//     block,
//     customer_Id,
//     Owner_Email,
//     Owner_Name,
//   } = req.body.formData;

//   const today = new Date();
//   const dateString = today.toLocaleDateString(); // Format: MM/DD/YYYY

//   try {
//     // Execute the SQL INSERT query
//     const [result] = await mySqlPool.query(
//       `INSERT INTO purchaseorder
//         ( Customer_id, List_Price, Purchase_Price, Project_Name, Project_Catagory, Type, Configuration, Unit_No, Plan, Block, Purchase_org_Name,Purchase_date,Lead_Owner_Email,Lead_Owner_Name,Date_Created,Main_Property_Id)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?)`,
//       [
//         req.uniqueCustomer, // Customer ID
//         List_Price, // List Price
//         purchasePrice, // Purchase Price

//         ProjectName, // Project Name
//         projectCategory, // Project Category
//         type, // Type
//         configuration, // Configuration
//         unitNo, // Unit Number
//         plans, // Plan
//         block, // Block
//         orgName, // Organization Name`
//         generateDateOfIssue(),
//         Owner_Email,
//         Owner_Name,
//         req.body.data.Date_Created,
//         req.flatdata,
//       ]
//     );

//     // Check if the row was inserted successfully
//     if (result.affectedRows > 0) {
//       const insertedCustomerId = result.insertId; // Get the inserted Customer ID

//       req.propertyId = insertedCustomerId; // Attach the inserted customer ID to the request object
//       // Log the success message

//       next(); // Proceed to the next middleware
//     } else {
//       return res.status(500).send({
//         message: "Something went wrong in insertion",
//         success: false,
//         data: [],
//       });
//     }
//   } catch (e) {
//     // Handle any errors during the insertion
//     console.log("There was an error in the insertion process: " + e);
//     return res.status(500).send({
//       message: "Something went wrong in insertion",
//       success: false,
//       data: [],
//     });
//   }
// };

// const middlewareToInsertPaymentPlan = async (req, res, next) => {
//   // const { plans, type, projectCategory, ProjectName, orgName } =
//   //   req.body.formData;

//   const {
//     projectCategory,
//     type,
//     configuration,
//     unitNo,
//     ProjectName,
//     orgName,

//     purchasePrice,
//     List_Price,
//     plans,
//     block,
//     customer_Id,
//     Owner_Email,
//     Owner_Name,
//   } = req.body.formData;

//   // Function to generate today's date in the format YYYY-MM-DD

//   const generateDateOfIssue = () => {
//     return dayjs().format("YYYY-MM-DD");
//   };
//   // Lead_Owner
//   try {
//     // Fetch relevant plans data from the database
//     const [rows] = await mySqlPool.query(
//       `SELECT Discription, Amount, Percentage_Amount, Type
//        FROM basic_additional_plans
//        WHERE Plan_Name = ?
//        AND Flat_Name = ?
//        AND Property_Type_Plans = ?
//        AND Project_Name_A_P = ?
//        AND Org_Name = ?`,
//       [plans, type, projectCategory, ProjectName, orgName]
//     );

//     // Check if any rows are returned
//     if (rows.length === 0) {
//       return res.status(404).send({
//         message: "No plans found for the provided details",
//         success: false,
//         data: [],
//       });
//     }

//     // Loop through the retrieved plans
//     for (const row of rows) {
//       let amountToInsert = null;
//       let percentageAmountToInsert = null;

//       // Based on the plan type, determine which value to insert
//       if (row.Type === "Basic") {
//         percentageAmountToInsert = row.Percentage_Amount;
//       } else if (row.Type === "Additional") {
//         amountToInsert = row.Amount;
//       }

//       // Insert each row into the `purchaseorderpayment` table
//       const [result] = await mySqlPool.query(
//         `INSERT INTO perchaseorderpayment
//           (Purchase_Id, Issue_Date, Discription, Type, Amount, Percentage_Amount, PoP_OrgName,Project_id_code,Catagory_Plan,Type_Plan,Plans)
//           VALUES (?, ?, ?, ?, ?, ?, ?,?,?,?,?)`,
//         [
//           req.propertyId,
//           generateDateOfIssue(),
//           row.Discription,
//           row.Type,
//           amountToInsert,
//           percentageAmountToInsert,
//           orgName,
//           ProjectName,
//           projectCategory,
//           type,
//           plans,
//         ]
//       );

//       // Check if the insert was successful
//       if (result.affectedRows === 0) {
//         return res.status(500).send({
//           message: "Error inserting data into payment plan",
//           success: false,
//           data: [],
//         });
//       }
//     }

//     // If all rows are inserted successfully, continue to the next middleware
//     next();
//   } catch (e) {
//     console.error("Error inserting data into payment plan: ", e);
//     return res.status(500).send({
//       message: "Something went wrong during the insertion of payment plan data",
//       success: false,
//       data: [],
//     });
//   }
// };

router.post(
  "/propertyPlan",

  async (req, res) => {
    console.log("transisiotion started");
    let connection;
    try {
      // Step 1: Get a connection and start a transaction
      connection = await mySqlPool.getConnection();
      await connection.beginTransaction();
      console.log("Transaction started.");

      // Step 2: Insert customer data
      const customerData = await customerInsertionHelper(req, connection);
      req.uniqueCustomer = customerData.customerId;
      req.flatData = customerData.flatId;

      // Step 3: Insert purchase order data
      const purchaseOrderData = await purchaseOrderInsertionHelper(
        req,
        connection
      );
      req.generateUniqueNumber = purchaseOrderData.propertyId;

      // Step 4: Insert payment plan data
      await paymentPlanInsertion(req, connection);

      // Step 5: Update lead status and delete lead
      await deleteLeadsAndSoldStatus(req, connection);

      // Step 6: Commit the transaction
      await connection.commit();
      console.log("Transaction committed successfully.");

      return res.status(200).send({
        message: "Lead conversion processed successfully.",
        success: true,
      });
    } catch (error) {
      // Rollback transaction on error
      if (connection) {
        await connection.rollback();
        console.error("Transaction rolled back due to error:", error.message);
      }
      return res.status(500).send({
        message: error.message || "Failed to process lead conversion.",
        success: false,
      });
    } finally {
      // Release the connection back to the pool
      if (connection) connection.release();
    }
  }
);

router.get("/leads/:Address/:Org_Name", async (req, res) => {
  const { Address, Org_Name } = req.params;

  try {
    const [rows] = await mySqlPool.query(
      `SELECT * from leads Where Lead_ID=? AND Organization_Name_Leads=? `,
      [Address, Org_Name]
    );

    if (rows.length > 0) {
      return res.status(200).send({
        message: "The Data is Fetched Sucessfully",
        data: rows,
      });
    } else {
      return res.status(500).send({
        message: "The Data is Fetched Sucessfully",
        data: [],
      });
    }
  } catch (e) {
    console.log("This is The data of Leads Insertion " + e);

    return res.status(500).send({
      message: "data is not Fetched of Leads",
      data: [],
      success: false,
    });
  }
});

router.get(
  "/leads-1/:address/:orgName",
  authenticateToken,
  async (req, res) => {
    const { address, orgName } = req.params;

    try {
      // Fetch leads associated with the given address and organization, excluding sold flats
      const rows = await leadForAGivenProperty(address, orgName);

      if (rows.length > 0) {
        // If leads with associated unsold flats are found
        return res.status(200).send({
          message: "Data fetched successfully.",
          success: true,
          data: rows,
        });
      } else {
        // If no leads with unsold flats are found
        const onlyLeads = await leadsWithUnsoldFlats(address);

        if (onlyLeads.length > 0) {
          return res.status(200).send({
            message:
              "Leads found, but property is either sold or not assigned to this lead.",
            success: true,
            data: onlyLeads,
          });
        }

        // If no leads are found at all
        return res.status(404).send({
          message: "No matching leads found.",
          success: false,
          data: [],
        });
      }
    } catch (error) {
      // Error handling
      console.error("Error fetching leads data:", error);

      return res.status(500).send({
        message: "An error occurred while fetching leads data.",
        success: false,
        error: error.message,
      });
    }
  }
);

router.get("/customer1/:org_Name", authenticateToken, async (req, res) => {
  const { org_Name } = req.params;

  try {
    const rows = await customerData(org_Name);

    if (rows.length > 0) {
      return res.status(200).send({
        message: "The Data is Fetched Sucessfully",
        data: rows,
      });
    } else {
      return res.status(500).send({
        message: "The Data is Fetched Sucessfully",
        data: [],
      });
    }
  } catch (e) {
    console.log("This is The data of Leads Insertion " + e);

    return res.status(500).send({
      message: "data is not Fetched of Leads",
      data: [],
      success: false,
    });
  }
});
router.get("/customerOfUsers/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const rows = await customerOfUsers(userId);

    if (rows.length > 0) {
      return res.status(200).send({
        message: "The Data is Fetched Sucessfully",
        data: rows,
        success: true,
      });
    } else {
      return res.status(500).send({
        message: "The Data is Fetched Sucessfully",
        data: [],
        success: false,
      });
    }
  } catch (e) {
    console.log("This is The data of Leads Insertion " + e);

    return res.status(500).send({
      message: "data is not Fetched of Leads",
      data: [],
      success: false,
    });
  }
});

router.get("/propertyData/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params; // Extract id from request parameters

    const rows = await customerProperties(id);
    if (rows?.length > 0) {
      return res.status(200).send({
        message: "Data of Customer Fetched Successfully",
        success: true,
        data: rows,
      });
    } else {
      return res.status(404).send({
        message: "Customer has Not Buyed Any Property Previously",
        success: false,
      });
    }
  } catch (e) {
    console.log("There is Some Error in Getting the Property Data: " + e);
    return res.status(500).send({
      message: "There is some error in getting the Flat of Customer",
      success: false,
    });
  }
});

router.get("/propertyPlan/:id", async (req, res) => {
  const { id } = req.params;

  try {
    //yha par i have join three table data ko fetch krne ke liye  to get payment plan details for the properties the customer has shown interest in

    const [rows] = await mySqlPool.query(
      `SELECT c.First_Name,c.Last_Name, p.Purchase_id, p.Unit_No,p.Configuration,p.Project_Catagory,p.Purchase_Price, pp.PoP_Id, pp.Purchase_Id, pp.Issue_Date,pp.Discription,pp.Type,pp.Percentage_Amount,pp.Amount,pp.Paid_Amount
       FROM customer c
       JOIN purchaseorder p ON c.Customer_Id = p.Customer_id
       JOIN perchaseorderpayment pp ON p.Purchase_id = pp.Purchase_Id
       WHERE c.Customer_Id = ?`,
      [id]
    );

    if (rows.length > 0) {
      return res.status(200).json({
        message: "Found Payment Plan.",
        success: true,
        data: rows,
      });
    } else {
      res.status(404).json({
        message: "No properties or payment plans found for this customer.",
      });
    }
  } catch (e) {
    console.log("Error fetching property and payment data: ", e);
    res
      .status(500)
      .json({ message: "An error occurred while fetching the data." });
  }
});

router.get(
  "/propertyDetailsCustomer/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params; // Extract id from request parameters

      const [rows, totalPaid, additionalCost, status] =
        await propertDetailsCustomer(id);

      return res.status(200).send({
        message: "Data of Customer Fetched Successfully",
        success: true,
        data: { rows, totalPaid, additionalCost, status },
      });
    } catch (e) {
      console.log("There is some error in getting the property data: " + e);
      return res.status(500).send({
        message: "There is some error in getting the flat of customer",
        success: false,
      });
    }
  }
);

// router.get(
//   "/paymentPlanRecipt/:projectName/:pType/:type/:plan/:Plantype/:pid/:disc",
//   async (req, res) => {
//     const { projectName, pType, type, plan, Plantype, disc, pid } = req.params;
//     console.log("Fetching data for Purchase ID:", id);

//     try {
//       const [rows] = await mySqlPool.query(
//         `SELECT * FROM perchaseorderpayment WHERE Project_id_code = ? AND Catagory_Plan=? AND Type_Plan=? AND Plans=? AND Type=? AND Purchase_Id=? and Discription=?`,
//         [projectName, pType, type, plan, Plantype, disc, pid]
//       );

//       console.log(
//         "This is The Main Payemnt data bhaiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii"
//       );
//       console.log(rows);

//       if (rows.length === 0) {
//         return res.status(404).send({
//           message: "No data found for the provided ID",
//           success: false,
//           data: [],
//         });
//       }

//       return res.status(200).send({
//         message: "Data Fetched",
//         success: true,
//         data: rows,
//       });
//     } catch (e) {
//       console.error("Error fetching data:", e);
//       return res.status(500).send({
//         message: "There is some error in fetching the data",
//         success: false,
//         data: [],
//       });
//     }
//   }
// );

router.get("/paymentPlanRecipt/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const rows = await paymentPlanPurchase(id);

    if (rows.length === 0) {
      return res.status(404).send({
        message: "No data found for the provided ID",
        success: false,
        data: [],
      });
    }

    return res.status(200).send({
      message: "Data Fetched",
      success: true,
      data: rows,
    });
  } catch (e) {
    console.error("Error fetching data:", e);
    return res.status(500).send({
      message: "There is some error in fetching the data",
      success: false,
      data: [],
    });
  }
});

router.get(
  "/paymentPlanReciptData/:id",
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;

    try {
      const rows = await paymentPlanRecipt(id);

      if (rows.length === 0) {
        return res.status(404).send({
          message: "No data found for the provided ID",
          success: false,
          data: [],
        });
      }

      return res.status(200).send({
        message: "Data Fetched",
        success: true,
        data: rows,
      });
    } catch (e) {
      console.error("Error fetching data:", e);
      return res.status(500).send({
        message: "There is some error in fetching the data",
        success: false,
        data: [],
      });
    }
  }
);

router.get("/paymentPlanRecipt1/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  // Validate input
  if (!id) {
    return res.status(400).send({
      message: "Purchase ID is required.",
      success: false,
      data: [],
    });
  }

  try {
    // Fetch records from the database
    const rows = await paymentPlanRecipt(id);

    if (!rows || rows.length === 0) {
      return res.status(404).send({
        message: "No data found for the provided Purchase ID.",
        success: false,
        data: [],
      });
    }

    console.log(rows);
    console.log("This is Recipt plan");

    return res.status(200).send({
      message: "Data fetched successfully.",
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching data:", error);

    return res.status(500).send({
      message: "An error occurred while fetching the data.",
      success: false,
      error: error.message, // Providing the actual error message for debugging
    });
  }
});

router.get("/paymentPlansData/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM perchaseorderpayment WHERE Purchase_Id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).send({
        message: "No data found for the provided ID",
        success: false,
        data: [],
      });
    }

    return res.status(200).send({
      message: "Data Fetched",
      success: true,
      data: rows,
    });
  } catch (e) {
    console.error("Error fetching data:", e);
    return res.status(500).send({
      message: "There is some error in fetching the data",
      success: false,
      data: [],
    });
  }
});
router.patch("/planUpdate", authenticateToken, async (req, res) => {
  const { amount, poNumber, poppayement, purchased_Price } = req.body;
  // console.log(req.body);

  // Validate required fields
  if (!amount || !poNumber || !poppayement) {
    return res.status(400).json({
      message: "Amount, PO Number, Description, and Total Amount are required.",
      success: false,
    });
  }

  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0]; // Format as yyyy-mm-dd

  const connection = await mySqlPool.getConnection();

  try {
    await connection.beginTransaction();

    // Fetch the existing record
    const [rows] = await connection.query(
      `SELECT * FROM perchaseorderpayment WHERE Purchase_Id = ? AND Discription = ?`,
      [poNumber, poppayement]
    );

    if (!rows || rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: "No record found for the given PO Number and Description.",
        success: false,
      });
    }

    const existingRecord = rows[0];
    const previousPaidAmount = Number(existingRecord.Paid_Amount || 0);

    // Calculate new paid amount and total amount
    const paidAmount = previousPaidAmount + Number(amount);

    let totalAmount = 0;
    if (existingRecord.Type === "Basic") {
      totalAmount = Math.round(
        (Number(existingRecord.Percentage_Amount) / 100) *
          Number(purchased_Price)
      );
    } else if (existingRecord.Type === "Additional") {
      totalAmount = Number(existingRecord.Amount);
    }

    // Calculate remaining amount
    const remainingAmount = totalAmount - paidAmount;

    // Determine payment status
    let status = "Due";
    if (remainingAmount <= 0) {
      status = "Paid";
    } else if (remainingAmount > 0) {
      status = "Partially Paid";
    }

    // Update the record in perchaseorderpayment
    const updateQuery = `
      UPDATE perchaseorderpayment
      SET Paid_Amount = ?, Status = ?, Date_Payment = ?, Remain_Amount = ?
      WHERE Purchase_Id = ? AND Discription = ?
    `;

    const [updateResult] = await connection.query(updateQuery, [
      paidAmount,
      status,
      formattedDate,
      remainingAmount,
      poNumber,
      poppayement,
    ]);

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: "No record found to update.",
        success: false,
      });
    }

    // Insert a new record into the Receipt table
    const receiptInsertQuery = `
      INSERT INTO Recipt (Purchase_Id_Recipt, Discription, Paid_Amount, Payment_Date)
      VALUES (?, ?, ?, ?)
    `;

    const [receiptResult] = await connection.query(receiptInsertQuery, [
      poNumber,
      poppayement,
      amount,
      formattedDate,
    ]);

    if (receiptResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(500).json({
        message: "Failed to insert receipt record.",
        success: false,
      });
    }

    // Commit the transaction
    await connection.commit();

    // Return success response
    return res.status(200).json({
      message: "Plan updated successfully.",
      success: true,
      data: {
        Paid_Amount: paidAmount,
        Remain_Amount: remainingAmount,
        Status: status,
        Date_Payment: formattedDate,
      },
    });
  } catch (error) {
    // Rollback the transaction in case of an error
    await connection.rollback();
    console.error("Error updating plan:", error);
    return res.status(500).json({
      message: "An error occurred while updating the plan.",
      success: false,
      error: error.message,
    });
  } finally {
    // Release the connection back to the pool
    if (connection) connection.release();
  }
});

// [Patch Of Status Change]

router.put("/tasksComplete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Update the status to 'completed' for the task with the given ID
    const [result] = await mySqlPool.query(
      `UPDATE activity_logs SET Status = ? WHERE Task_ID = ?`,
      [req.body.status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (req.body.status === "completed") {
      res.status(200).send({
        message: "Status updated SucessFully",
        sucess: true,
      });
    } else {
      return res.status(200).json({ message: "Updated" });
    }
  } catch (error) {
    // Handle errors
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the task" });
  }
});

// const HistoryInsertionDataActivity = async (req, res, next) => {
//   try {
//     const { leadId, notes, dueDate } = req.body;

//     // Validate required fields
//     if (!leadId) {
//       return res.status(400).send({
//         message: "Missing leadId in the request",
//         success: false,
//       });
//     }

//     // Fetch lead information
//     const [leadRows] = await mySqlPool.query(
//       `SELECT * FROM leads WHERE Lead_ID = ?`,
//       [leadId]
//     );

//     if (leadRows.length > 0) {
//       const lead = leadRows[0];
//       const name = `${lead.First_Name} ${lead.Last_Name}`;
//       const leadOwner = lead.Lead_owner;
//       const leadStage = lead.Lead_Status;
//       const expectedRevenue = lead.Expected_revenue;

//       // Fetch call duration
//       const [callRows] = await mySqlPool.query(
//         `SELECT SUM(Call_Duration) AS total_duration FROM call_task WHERE Lead_ID_Call = ?`,
//         [leadId]
//       );

//       // Format current date and time
//       const currentDate = moment().format("YYYY-MM-DD");
//       const currentTime = moment().format("hh:mm:ss A");
//       const callDateAndTime = `${currentDate}, ${currentTime}`;

//       const totalCallDurationHours = callRows[0]?.total_duration || 0;

//       // Fetch flat details based on lead information
//       const {
//         Project_Name,
//         Property_Type,
//         Type,
//         Unit_No: unit,
//         Block,
//         Configuration: config,
//         Organization_Name: orgName,
//       } = lead;

//       const [flatData] = await mySqlPool.query(
//         `SELECT * FROM flat WHERE Project_Name_flats = ? AND Property_type = ? AND Type_Flat = ? AND Unit_No = ? AND Configuration = ? AND Block = ? AND Org_Name = ?`,
//         [Project_Name, Property_Type, Type, unit, config, Block, orgName]
//       );

//       // Check if flat data exists
//       if (flatData.length === 0) {
//         return res.status(404).send({
//           message: "No matching flat found for the given criteria.",
//           success: false,
//         });
//       }

//       const List_Price = flatData[0]?.List_Price || expectedRevenue; // Default to expected revenue if List_Price is missing

//       // Insert into the history table
//       const [insertResult] = await mySqlPool.query(
//         `INSERT INTO history (Updated_username, updated_date, Time_taken, Lead_owner, Lead_stage, Expected_revenue, Next_follow, notes, Lead_id_History)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           name,
//           callDateAndTime,
//           totalCallDurationHours,
//           leadOwner,
//           leadStage,
//           List_Price,
//           dueDate,
//           notes,
//           leadId,
//         ]
//       );

//       if (insertResult.affectedRows > 0) {
//         next(); // Proceed to the next middleware
//       } else {
//         return res.status(400).send({
//           message: "Failed to insert into history",
//           success: false,
//         });
//       }
//     } else {
//       return res.status(404).send({
//         message: "Lead not found",
//         success: false,
//       });
//     }
//   } catch (e) {
//     console.error("Error in HistoryInsertionDataActivity:", e);
//     return res.status(500).send({
//       message: "Error inserting data into history",
//       success: false,
//     });
//   }
// };

// const ActivityLogMiddleWare = async (req, res, next) => {
//   const {
//     taskTitle,
//     taskType,
//     description,
//     dueDate,
//     priority,
//     AssignedUser,
//     status,
//     leadId,
//     reminders,
//     notes,
//     assignedTo,
//     next_follow_date,
//     MainName,
//   } = req.body;

//   let connection;

//   // Format current date and time to 'YYYY-MM-DD HH:MM:SS'
//   const dateCreated = new Date().toISOString().slice(0, 19).replace("T", " ");

//   try {
//     // Start a new connection for the transaction
//     connection = await mySqlPool.getConnection();

//     // Begin transaction
//     await connection.beginTransaction();

//     // Insert data into activity_logs
//     const [result] = await connection.query(
//       `INSERT INTO activity_logs
//         (Task_Title, Task_Type, Description, Due_Date, Priority, Assigned_To, Status, Lead_Id, Reminders, Notes, Next_follow_up_date, Organization_Name_Activity, Assign_To_Email, Created_Date)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         taskTitle,
//         taskType,
//         description,
//         dueDate,
//         priority,
//         assignedTo,
//         status,
//         leadId,
//         reminders,
//         notes,
//         next_follow_date,
//         MainName,
//         assignedTo,
//         dateCreated,
//       ]
//     );

//     // Capture the inserted row's ID
//     const insertedId = result.insertId;

//     req.insertedLogId = insertedId;

//     // Move to next middleware or route function to continue the transaction
//     req.transactionConnection = connection; // Pass connection to next handler
//     next();
//   } catch (error) {
//     // Rollback transaction in case of error
//     if (connection) await connection.rollback();
//     console.error("Error inserting activity log:", error);
//     return res.status(500).send({
//       message: "Error inserting activity log",
//       success: false,
//       error: error.message,
//     });
//   }
// };

// ActivityLogMiddleWareInsertion,
//   insertInUserTask,
// Activity Logs Insertion
router.post("/activitylogs", async (req, res) => {
  let connection;

  try {
    // Step 1: Get a connection and start a transaction
    connection = await mySqlPool.getConnection();
    await connection.beginTransaction();
    console.log("Transaction started for activity logs insertion.");

    // Step 2: Insert activity log data
    const activityLogResult = await ActivityLogMiddleWareInsertion(
      req,
      connection
    );
    req.insertedLogId = activityLogResult.insertedId; // Pass the inserted ID for use in subsequent steps

    // Step 3: Insert data into user task activity logs
    await insertInUserTask(req, connection);

    // Step 4: Commit the transaction
    await connection.commit();
    console.log("Transaction committed successfully.");

    // Step 5: Send success response
    res.status(200).send({
      message: "Activity logs inserted successfully.",
      success: true,
    });
  } catch (err) {
    // Rollback transaction on error
    if (connection) {
      await connection.rollback();
      console.error("Transaction rolled back due to error:", err.message);
    }
    res.status(500).send({
      message: err.message || "Failed to process activity log insertion.",
      success: false,
    });
  } finally {
    // Release the connection back to the pool
    if (connection) connection.release();
  }
});

router.get("/history/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await mySqlPool.query(
      `SELECT * from history Where Lead_id_History=?`,
      [id]
    );

    if (rows.length > 0) {
      return res.status(200).send({
        message: "Data of History is Fetched",
        success: true,
        data: rows,
      });
    } else {
      return res.status(400).send({
        message: "No Data is There",
        sucess: false,
        data: [],
      });
    }
  } catch (e) {
    console.log("There is Some Error in Insertion Of Data" + e);
    return res.status(500).send({
      message: "There is Some Error In Insertion of data",
      success: false,
      data: [],
    });
  }
});

router.get("/activitylogs/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Fetching activity logs
    const [activityLogs, callTasks] = await TaskCallFetcher(id);

    // Fetching call tasks

    // Return data if any logs or call tasks are found
    if (activityLogs.length > 0 || callTasks?.length > 0) {
      return res.status(200).send({
        message: "Activity log (Task And Call) data fetched successfully",
        success: true,
        data: activityLogs,
        data1: callTasks,
      });
    }

    // Return empty arrays if no data found
    return res.status(200).send({
      message: "No Activity log (Task And Call) found",
      success: true,
      data: [],
      data1: [],
    });
  } catch (error) {
    console.error("No Activity log (Task And Call) found:", error);

    // Return 500 for internal server error
    return res.status(500).send({
      message:
        "An error occurred while fetching activity log (Task And Call) data",
      success: false,
      data: [],
      data1: [],
    });
  }
});

router.get("/calltask/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Assuming 'call_tasks' is the table name and 'call_task_id' is the column name
    const [rows] = await mySqlPool.query(
      `SELECT * FROM call_task WHERE Lead_ID_Call = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).send({
        message: "No data found for the specified call task ID",
        success: false,
        data: [],
      });
    }

    return res.status(200).send({
      message: "Data of call task is found",
      success: true,
      data: rows,
    });
  } catch (e) {
    console.error("Error fetching call task data:", e); // Logging the error
    return res.status(500).send({
      message: "An error occurred while fetching data of call task",
      success: false,
      data: [],
    });
  }
});

// const HistoryInsertionData = async (req, res, next) => {
//   try {
//     // Validate required fields
//     const { leadId, callerName, callerPhoneNumber, callDuration, notes } =
//       req.body;

//     if (!leadId || !callerName || !callerPhoneNumber) {
//       console.log("Yha Aagyaa");
//       return res.status(400).send({
//         message:
//           "Missing required fields: leadId, callerName, or callerPhoneNumber",
//         success: false,
//       });
//     }

//     // Fetch lead information
//     const [leadRows] = await mySqlPool.query(
//       `SELECT * FROM leads WHERE Lead_ID = ?`,
//       [leadId]
//     );

//     if (leadRows.length === 0) {
//       return res.status(404).send({
//         message: "Lead not found",
//         success: false,
//       });
//     }

//     const lead = leadRows[0];
//     const name = `${lead.First_Name} ${lead.Last_Name}`;
//     const leadOwner = lead.Lead_owner;
//     const leadStatus = lead.Lead_Status;

//     // Fetch total call duration from call_task table
//     const [callRows] = await mySqlPool.query(
//       `SELECT SUM(Call_Duration) AS total_duration FROM call_task WHERE Lead_ID_Call = ?`,
//       [leadId]
//     );

//     const totalCallDuration = callRows[0]?.total_duration || 0;
//     const updatedCallDuration =
//       totalCallDuration + (parseFloat(callDuration) || 0);

//     // Format current date and time
//     const currentDate = moment().format("YYYY-MM-DD");
//     const currentTime = moment().format("hh:mm:ss A");
//     const callDateAndTime = `${currentDate}, ${currentTime}`;

//     // Fetch flat data for calculating the expected revenue (List_Price)
//     const {
//       Project_Name,
//       Property_Type,
//       Type,
//       Unit_No: unit,
//       Block,
//       Configuration: config,
//       Organization_Name: orgName,
//     } = lead;

//     const [flatData] = await mySqlPool.query(
//       `SELECT * FROM flat WHERE Project_Name_flats = ? AND Property_type = ? AND Type_Flat = ? AND Unit_No = ? AND Configuration = ? AND Block = ? AND Org_Name = ?`,
//       [Project_Name, Property_Type, Type, unit, config, Block, orgName]
//     );

//     const List_Price = flatData.length > 0 ? flatData[0].List_Price : null;

//     // Insert data into the history table
//     const [insertResult] = await mySqlPool.query(
//       `INSERT INTO history (Updated_username, updated_date, Time_taken, Lead_owner, Lead_stage, Expected_revenue, notes, Lead_id_History)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         name,
//         callDateAndTime,
//         updatedCallDuration,
//         leadOwner,
//         leadStatus,
//         List_Price || 0, // Use 0 as fallback if List_Price is null
//         notes || "",
//         leadId,
//       ]
//     );

//     if (insertResult.affectedRows > 0) {
//       // Proceed to the next middleware if successfully inserted
//       next();
//     } else {
//       return res.status(400).send({
//         message: "Failed to insert data into history",
//         success: false,
//       });
//     }
//   } catch (error) {
//     console.error("Error in HistoryInsertionData:", error);
//     return res.status(500).send({
//       message: "Internal server error while inserting data into history",
//       success: false,
//       error: error.message,
//     });
//   }
// };

router.post(
  "/calltask",

  // HistoryInsertionData,
  async (req, res) => {
    // console.log(req.file);

    const {
      callDate,

      callerName,
      callerPhoneNumber,
      callDuration,
      notes,

      leadId,
      reminders,
    } = req.body;

    // const scdulePooinement = req.body.appointmentDate
    //   ? req.body.appointmentDate[0]
    //   : "";
    // console.log(scdulePooinement);

    const dateCreated = new Date().toISOString().slice(0, 19).replace("T", " ");

    try {
      const data = await mySqlPool.query(
        `INSERT INTO call_task (Call_Date,Caller_Name,Caller_Phone_Number,Call_Duration,Notes,Lead_ID_Call,User_Email,Reminder,Created_date) VALUES (?, ?, ?,?,?,?,?,?,?)`,
        [
          callDate,

          callerName,
          callerPhoneNumber,
          callDuration,
          notes,

          leadId,

          req.body.credOrg,
          reminders,
          dateCreated,
        ]
      );

      return res.status(200).send({
        message: "Data is inserted Sucessfully of Call",
        sucess: true,
      });
    } catch (e) {
      console.log("there is some error in insertion on call data to db " + e);
      return res.status(500).send({
        message: "Data is not inserted Sucessfully of Call",
        sucess: false,
      });
    }
  }
);

router.get("/leadsData/:id", authenticateToken, async (req, res) => {
  // console.log("This is The Leads Get");
  const { id } = req.params;

  try {
    const rows = await selctLedsByOrg(id);

    if (rows.length > 0) {
      return res.status(200).send({
        message: "The Data is Fetched Sucessfully",
        data: rows,
        success: true,
      });
    } else {
      return res.status(400).send({
        message: "The Data is Fetched Sucessfully",
        data: [],
        success: false,
      });
    }
  } catch (e) {
    console.log("This is The data of Leads Insertion " + e);

    return res.status(500).send({
      message: "data is not Fetched of Leads",
      data: [],
      success: false,
    });
  }
});

router.patch("/leadsstatus", authenticateToken, async (req, res) => {
  try {
    const { Lead_id, status } = req.body;

    // Ensure that both Lead_id and status are provided
    if (!Lead_id || !status) {
      return res.status(400).send({
        message: "Lead_id and status are required",
        success: false,
      });
    }

    const data = await leadsStatusChange(Lead_id, status);

    if (data.affectedRows === 0) {
      return res.status(404).send({
        message: "Lead not found or no change in status",
        success: false,
      });
    }

    return res.status(200).send({
      message: "Data is updated successfully",
      success: true,
    });
  } catch (e) {
    console.error("Error updating lead status:", e);
    return res.status(500).send({
      message: "Internal server error",
      success: false,
    });
  }
});

router.get("/leadsByIdOrg/:id", authenticateToken, async (req, res) => {
  const { id, org } = req.params;

  try {
    const rows = await leadsByIDFether(id, org);

    if (rows.length > 0) {
      return res.status(200).send({
        message: "The Data is Fetched Sucessfully",
        data: rows[0],
        success: true,
      });
    } else {
      return res.status(500).send({
        message: "The Data is Fetched Sucessfully",
        data: [],
        success: false,
      });
    }
  } catch (e) {
    console.log("This is The data of Leads Insertion " + e);

    return res.status(500).send({
      message: "data is not Fetched of Leads",
      data: [],
      success: false,
    });
  }
});

router.get("/leadsById/:id", authenticateToken, async (req, res) => {
  // console.log("This is The Leads Get");
  const { id } = req.params;

  try {
    const rows = await leadById(id);

    if (rows.length > 0) {
      return res.status(200).send({
        message: "The Data is Fetched Sucessfully",
        data: rows[0],
        success: true,
      });
    } else {
      return res.status(500).send({
        message: "The Data is Fetched Sucessfully",
        data: [],
        success: false,
      });
    }
  } catch (e) {
    console.log("This is The data of Leads Insertion " + e);

    return res.status(500).send({
      message: "data is not Fetched of Leads",
      data: [],
      success: false,
    });
  }
});

// const assignLeadsUpdate = async (req, res, next) => {
//   const {
//     Task_id,
//     user_id, // Task ID to identify the log to update
//   } = req.body;

//   let connection;

//   try {
//     // Start a new connection for the transaction
//     connection = await mySqlPool.getConnection();

//     // Begin transaction
//     await connection.beginTransaction();

//     // Update the existing activity log with provided details
//     const [result] = await connection.query(
//       `UPDATE activity_logs
//         SET Assigned_To = ?
//         WHERE Task_ID = ?`, // We use the taskId to update the correct row
//       [
//         user_id,
//         Task_id, // The task ID to locate the correct row to update
//       ]
//     );

//     // Check if the row was updated
//     if (result.affectedRows === 0) {
//       throw new Error(`No task found with ID: ${Task_id}`);
//     }

//     // Commit transaction
//     await connection.commit();

//     // Log success and pass the updated task ID
//     // console.log("Updated activity log with ID:", taskId);
//     // req.updatedLogId = taskId;

//     // Move to next middleware or route function
//     req.transactionConnection = connection; // Pass connection to next handler
//     next();
//   } catch (error) {
//     // Rollback transaction in case of error
//     if (connection) await connection.rollback();
//     console.error("Error updating activity log:", error);
//     return res.status(500).send({
//       message: "Error updating activity log",
//       success: false,
//       error: error.message,
//     });
//   }
// };

// PATCH /AssignTask/:id
router.patch("/AssignTask/:id", async (req, res) => {
  let connection;

  try {
    // Step 1: Get a connection and start a transaction
    connection = await mySqlPool.getConnection();
    await connection.beginTransaction();
    console.log("Transaction started for AssignTask.");

    // Step 2: Update the activity log
    await assignLeadsUpdate(req, connection);

    // Step 3: Update additional task activity logs
    await updateActivityLogs(req, connection);

    // Step 4: Commit the transaction
    await connection.commit();
    console.log("Transaction committed successfully.");

    // Final response
    res.status(200).send({
      message: "Task assignment updated successfully.",
      success: true,
    });
  } catch (err) {
    // Rollback transaction on error
    if (connection) {
      await connection.rollback();
      console.error("Transaction rolled back due to error:", err.message);
    }
    res.status(500).send({
      message: err.message || "Failed to process task assignment.",
      success: false,
    });
  } finally {
    // Release the connection back to the pool
    if (connection) connection.release();
  }
});

router.get("/leadsAdmin", authenticateToken, async (req, res) => {
  // console.log("This is The Leads Get");
  const { id } = req.params;

  try {
    const [rows] = await mySqlPool.query(
      `SELECT 
  l.First_Name, 
  l.Last_Name, 
  l.Lead_owner, 
  l.Lead_Status, 
  f.Block, 
  f.Unit_No, 
  u.Name As Lead_Owner_Name
FROM 
  leads AS l 
JOIN 
  users AS u ON l.Lead_owner = u.User_Id 
LEFT JOIN 
  flat AS f ON l.Flat_Id = f.Flat_id`
    );

    if (rows.length > 0) {
      return res.status(200).send({
        message: "The Data is Fetched Sucessfully",
        data: rows,
      });
    } else {
      return res.status(500).send({
        message: "The Data is Fetched Sucessfully",
        data: [],
      });
    }
  } catch (e) {
    console.log("This is The data of Leads Insertion " + e);

    return res.status(500).send({
      message: "data is not Fetched of Leads",
      data: [],
      success: false,
    });
  }
});

router.post("/delete-leads", async (req, res) => {
  const { leadIds, orgName } = req.body;

  if (!leadIds || !orgName) {
    return res
      .status(400)
      .json({ error: "Lead IDs and Organization name are required" });
  }

  // SQL query to delete leads based on leadIds and organization name
  const query = `DELETE FROM leads WHERE Lead_ID IN (?) AND Organization_Name_Leads = ?`;

  try {
    // Use the promise-based query execution
    const [results] = await mySqlPool.query(query, [leadIds, orgName]);

    // Respond with success and the number of affected rows
    res.status(200).json({
      message: "Leads deleted successfully",
      affectedRows: results.affectedRows,
    });
  } catch (error) {
    // Catch and handle any errors during the database operation
    res.status(500).json({ error: "Failed to delete leads", details: error });
  }
});

router.put("/update-lead-owner", authenticateToken, async (req, res) => {
  try {
    const { leadArray, leadOwner } = req.body;
    console.log(req.body);

    // Validate leadArray and leadOwner
    if (
      !leadArray ||
      !leadOwner ||
      !Array.isArray(leadArray) ||
      leadArray.length === 0
    ) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Prepare a single SQL query for updating `leads`
    await mySqlPool.query(
      `UPDATE leads SET Lead_owner = ? WHERE Lead_Id IN (?)`,
      [leadOwner, leadArray]
    );

    // Prepare a single SQL query for updating `lead_user`
    await mySqlPool.query(
      `UPDATE lead_user SET User_Id_User_Lead = ? WHERE Lead_ID_User IN (?)`,
      [leadOwner, leadArray]
    );

    // Respond with success message
    return res.status(200).json({ message: "Lead owner updated successfully" });
  } catch (error) {
    console.error("Error updating Lead Owner:", error);
    return res.status(500).json({ message: "Failed to update Lead Owner" });
  }
});

// leadsAdmin

router.get("/leadOfUser/:id/:orgName", authenticateToken, async (req, res) => {
  const { id, orgName } = req.params;

  // Validate input (to prevent SQL injection and ensure data is expected)
  if (!id || !orgName) {
    return res.status(400).send({
      message: "Email and organization name are required",
      success: false,
    });
  }

  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM leads WHERE Lead_owner = ? AND Organization_Name_Leads= ? AND Lead_Status!=?`,
      [id, orgName, "Closed Won-Converted"]
    );

    if (!rows.length) {
      // If no data is found for the query
      return res.status(404).send({
        message: "No properties found for the provided user and organization",
        success: false,
      });
    }

    return res.status(200).send({
      message: "Property data fetched successfully",
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching user property data:", error);
    return res.status(500).send({
      message: "There was an error fetching the property data",
      success: false,
    });
  }
});

router.get("/leadOfUserAll/:id/:orgName", async (req, res) => {
  const { id, orgName } = req.params;

  // Validate input (to prevent SQL injection and ensure data is expected)
  if (!id || !orgName) {
    return res.status(400).send({
      message: "Email and organization name are required",
      success: false,
    });
  }

  try {
    const rows = await allLeadsofUser(id, orgName);
    if (!rows.length) {
      // If no data is found for the query
      return res.status(404).send({
        message: "No properties found for the provided user and organization",
        success: false,
      });
    }

    return res.status(200).send({
      message: "Property data fetched successfully",
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching user property data:", error);
    return res.status(500).send({
      message: "There was an error fetching the property data",
      success: false,
    });
  }
});

router.get("/leadsUser/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM users WHERE Email = ?`,
      [email]
    );

    if (rows.length > 0) {
      // If user data is found, send it back
      return res.status(200).send({
        message: "User data retrieved successfully.",
        success: true,
        data: rows[0], // Assuming we want to return a single user object
      });
    } else {
      // If no user data is found
      return res.status(404).send({
        message: "No user found with the given email.",
        success: false,
        data: null,
      });
    }
  } catch (e) {
    // Handle any errors that occur during the query
    console.error("Error fetching user data:", e.message);
    return res.status(500).send({
      message: "Internal Server Error. Could not retrieve user data.",
      success: false,
      error: e.message,
    });
  }
});

router.patch("/leads/:Lead_ID", authenticateToken, async (req, res) => {
  try {
    // Get the Lead ID from the request body
    const { Lead_ID } = req.params;
    if (!Lead_ID) {
      return res.status(400).send({
        message: "Lead ID is required for update.",
        success: false,
      });
    }

    // Generate unique number and current date for updates if necessary
    const uniqueNumber = `${Date.now()}${Math.floor(
      Math.random() * 1_000_000_000
    )}`;
    req.uniqueNumber = uniqueNumber;
    const today = new Date();
    const dateString = today.toLocaleDateString();

    // Destructure data from request body
    const {
      firstName,
      lastName,
      emailAddress,
      contactNumber,
      age,
      gender,
      Address,
      country,
      state,
      city,
      zipcode,
      leadStatus,
      referrerName,
      sourceOfEnquiry,
      budget,
      projectCategory,
      notes,
      tentativePurchaseDate,
      finance,
      unitNo,
      configuration,
      type,
      ProjectName,
      block,
      occupation,
      tentativePrice,
    } = req.body.data;

    let flatIdData = null;

    const [rows] = await mySqlPool.query(
      `SELECT * from leads where Email_Address=? AND Organization_Name_Leads=? AND Lead_Status!=? `,
      [emailAddress, req.body.MainOrgName, "Closed Won-Converted"]
    );
    const [existingUserRows] = await mySqlPool.query(
      "SELECT * FROM users WHERE Email = ? AND Organization_Name_User = ?",
      [emailAddress, req.body.MainOrgName]
    );

    if (
      (rows?.length > 0 || existingUserRows.length > 0) &&
      req.body.oldEmail !== emailAddress
    ) {
      return res.status(400).send({
        message: "Leads Already Present",
        sucess: false,
      });
    }

    // Check if flat data exists and get Flat_id if needed
    if (unitNo && configuration && block && projectCategory && ProjectName) {
      const [rows] = await mySqlPool.query(
        `SELECT Flat_id FROM flat WHERE Unit_No = ? AND Configuration = ? AND Block = ? 
         AND Project_Name_flats = ? AND Property_type = ? AND Type_Flat = ? AND Org_Name = ?`,
        [
          unitNo,
          configuration,
          block,
          ProjectName,
          projectCategory,
          type,
          req.body.MainOrgName,
        ]
      );
      if (rows.length > 0) flatIdData = rows[0]?.Flat_id;
    }

    // Construct the UPDATE query and data array
    const updateQuery = `
      UPDATE leads 
      SET 
        First_Name = ?, Last_Name = ?, Contact_Number = ?, Email_Address = ?, Age = ?, Gender = ?, Address = ?, 
        Country = ?, State = ?, City = ?, Zip_code = ?, Lead_owner = ?, Lead_Status = ?, Referrer = ?, 
        Source_of_Inquiry = ?, Property_Type = ?, Budget = ?, Organization_Name_Leads = ?, 
        Organiztion_Email = ?, Notes = ?, Tentative_Purchase_Date = ?, Finance = ?, Unit_No = ?, Configuration = ?, 
        Type = ?, Project_Name = ?, Block = ?, Occupation = ?, Flat_Id = ?,Tentative_Purchase_Price=?
      WHERE Lead_ID = ?
    `;

    // Prepare values for the query
    const updateData = [
      firstName || null,
      lastName || null,
      contactNumber || null,
      emailAddress || null,
      age || null,
      gender || null,
      Address || null,
      country || null,
      state || null,
      city || null,
      zipcode || null,
      req.body.User_id || null,
      leadStatus || null,
      referrerName || null,
      sourceOfEnquiry || null,

      projectCategory || null,
      budget || null,
      req.body.MainOrgName || null,
      req.body.MainOrgEmail || null,
      notes || null,
      tentativePurchaseDate || null,
      finance || null,
      unitNo || null,
      configuration || null,
      type || null,
      ProjectName || null,
      block || null,
      occupation || null,

      flatIdData,
      tentativePrice,
      Lead_ID, // Include Lead_ID as the last parameter for the WHERE clause
    ];

    // Execute the update query
    const [result] = await mySqlPool.query(updateQuery, updateData);
    if (result.affectedRows > 0) {
      return res.status(200).send({
        message: "Leads Updated SucessFully",
        success: true,
      });
    } else {
      return res.status(404).send({
        message: "Lead not found or no changes made.",
        success: false,
      });
    }
  } catch (e) {
    console.error("Error updating lead data:", e);
    return res.status(500).send({
      message: "Error updating lead data.",
      success: false,
    });
  }
});

router.delete("/deleteLeadData/:id", authenticateToken, async (req, res) => {
  const leadId = req.params.id;

  // Delegate the logic to the controller
  const result = await deleteLeadData(leadId);

  // Send the response based on the result from the controller
  return res.status(result.statusCode).json({
    message: result.message,
    success: result.success,
  });
});

router.post("/usersGet", async (req, res) => {
  const { ids } = req.body;

  // Check if the ids array is provided
  if (!ids || ids.length === 0) {
    return res.status(400).send({
      message: "No IDs provided",
      success: false,
      data: {},
    });
  }

  try {
    // SQL query to fetch user IDs and names for the provided IDs
    const [rows] = await mySqlPool.query(
      `SELECT User_Id, Name FROM users WHERE User_Id IN (?)`,
      [ids]
    );

    if (rows.length === 0) {
      return res.status(404).send({
        message: "Users not found",
        success: false,
        data: {},
      });
    }

    // Map the rows into a key-value object: { User_Id1: "Name1", User_Id2: "Name2", ... }
    const userNameMap = rows.reduce((acc, row) => {
      acc[row.User_Id] = row.Name;
      return acc;
    }, {});

    return res.status(200).send({
      message: "User data retrieved successfully",
      success: true,
      data: userNameMap, // Return as a key-value pair object
    });
  } catch (error) {
    console.error("Error fetching user names:", error);
    return res.status(500).send({
      message: "Server error",
      success: false,
      data: {},
    });
  }
});

router.post("/CatagoryGet", async (req, res) => {
  const { ids } = req.body;

  // Check if the ids array is provided
  if (!ids || ids.length === 0) {
    return res.status(400).send({
      message: "No IDs provided",
      success: false,
      data: {},
    });
  }

  try {
    // SQL query to fetch user IDs and names for the provided IDs
    const [rows] = await mySqlPool.query(
      `SELECT Id, Catagory FROM catagory WHERE Id IN (?)`,
      [ids]
    );

    if (rows.length === 0) {
      return res.status(404).send({
        message: "Users not found",
        success: false,
        data: {},
      });
    }

    // Map the rows into a key-value object: { User_Id1: "Name1", User_Id2: "Name2", ... }
    const userNameMap = rows.reduce((acc, row) => {
      acc[row.Id] = row.Catagory;
      return acc;
    }, {});

    return res.status(200).send({
      message: "User data retrieved successfully",
      success: true,
      data: userNameMap, // Return as a key-value pair object
    });
  } catch (error) {
    console.error("Error fetching user names:", error);
    return res.status(500).send({
      message: "Server error",
      success: false,
      data: {},
    });
  }
});
router.patch("/leadOwnerChange", authenticateToken, async (req, res) => {
  const { leadId, leadOwner } = req.body;

  // Validate the request body
  if (!leadId || !leadOwner) {
    return res
      .status(400)
      .json({ message: "Lead ID and Lead Owner are required." });
  }

  const connection = await mySqlPool.getConnection();

  try {
    await connection.beginTransaction();

    // Update lead owner in the leads table
    const [leadUpdateResult] = await connection.query(
      `UPDATE leads SET Lead_owner = ? WHERE Lead_Id = ?`,
      [Number(leadOwner), leadId]
    );

    // Check if the lead in the leads table was updated
    if (leadUpdateResult.affectedRows === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ message: "Lead not found or no changes made in leads table." });
    }

    // Update the user ID associated with the lead in lead_user table
    const [userUpdateResult] = await connection.query(
      `UPDATE lead_user SET User_Id_User_Lead = ? WHERE Lead_ID_User = ?`,
      [leadOwner, leadId]
    );

    // Check if the row in the lead_user table was updated
    if (userUpdateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        message:
          "Lead user record not found or no changes made in lead_user table.",
      });
    }

    console.log("Transistion of assign leads completed");

    // Commit the transaction
    await connection.commit();

    // Both updates were successful
    return res
      .status(200)
      .json({ message: "Lead Owner updated successfully in both tables." });
  } catch (error) {
    // Rollback the transaction in case of an error
    await connection.rollback();
    console.error("Error updating Lead Owner:", error);
    res.status(500).json({ message: "Failed to update Lead Owner" });
  } finally {
    // Release the connection back to the pool
    connection.release();
  }
});

router.patch("/leadsActivityLogs", async (req, res) => {
  const {
    taskId, // Task ID to identify the log to update
    taskTitle,
    taskType,
    description,
    dueDate,
    priority,
    assignedTo,
    status,
    leadId,
    reminders,
    notes,
    next_follow_date,
    MainName,
  } = req.body;

  let connection;

  try {
    // Start a new connection for the transaction
    connection = await mySqlPool.getConnection();

    // Begin transaction
    await connection.beginTransaction();

    // Update the existing activity log with provided details
    const [result] = await connection.query(
      `UPDATE activity_logs
        SET Task_Title = ?, Task_Type = ?, Description = ?, Due_Date = ?, Priority = ?, Status = ?, Lead_Id = ?, Reminders = ?, Notes = ?, Next_follow_up_date = ?, Organization_Name_Activity = ?
        WHERE Task_ID = ?`, // We use the taskId to update the correct row
      [
        taskTitle,
        taskType,
        description,
        dueDate,
        priority,

        status,
        leadId,
        reminders,
        notes,
        next_follow_date,
        MainName,

        taskId, // The task ID to locate the correct row to update
      ]
    );

    // Check if the row was updated
    if (result.affectedRows === 0) {
      throw new Error(`No task found with ID: ${taskId}`);
    }

    // Commit transaction
    await connection.commit();

    // Log success and pass the updated task ID

    req.updatedLogId = taskId;

    // Move to next middleware or route function
    req.transactionConnection = connection; // Pass connection to next handler
    return res.status(200).send({
      message: "Task Updated SucessFully",
      success: true,
    });
  } catch (error) {
    // Rollback transaction in case of error
    if (connection) await connection.rollback();
    console.error("Error updating activity log:", error);
    return res.status(500).send({
      message: "Error updating activity log",
      success: false,
      error: error.message,
    });
  }
});

router.delete("/activityLogDelete/:taskId", async (req, res) => {
  const { taskId } = req.params;

  let connection;

  try {
    // Start a new connection for the transaction
    connection = await mySqlPool.getConnection();

    // Begin transaction
    await connection.beginTransaction();

    // Delete the activity log based on taskId
    const [result] = await connection.query(
      `DELETE FROM activity_logs WHERE Task_ID = ?`,
      [taskId]
    );

    // Check if the row was deleted
    if (result.affectedRows === 0) {
      throw new Error(`No task found with ID: ${taskId}`);
    }

    // Commit transaction
    await connection.commit();

    // Send success response
    res.status(200).send({
      message: `Task with ID: ${taskId} deleted successfully.`,
      success: true,
    });
  } catch (error) {
    // Rollback transaction in case of error
    if (connection) await connection.rollback();
    console.error("Error deleting task:", error);
    return res.status(500).send({
      message: "Error deleting task",
      success: false,
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});
router.put(
  "/calltask/:callId",
  authenticateToken, // Use PUT for update operations, and accept callId as a URL param
  async (req, res) => {
    const {
      callDate,
      callerName,
      callerPhoneNumber,
      callDuration,
      notes,
      leadId,
      reminders,
    } = req.body;

    const { callId } = req.params; // Get callId from URL params

    try {
      const data = await callEdit(
        callDate,
        callerName,
        callerPhoneNumber,
        callDuration,
        notes,
        leadId,
        reminders,
        callId,
        req
      );

      return res.status(200).send({
        message: "Data updated successfully for the call task",
        success: true,
      });
    } catch (e) {
      console.log("Error updating call data in the database: " + e);
      return res.status(500).send({
        message: "Data was not updated successfully for the call task",
        success: false,
        error: e.message,
      });
    }
  }
);

router.delete(
  "/calltask/:callId",
  authenticateToken, // Use DELETE for deletion
  async (req, res) => {
    const { callId } = req.params; // Get callId from URL params

    try {
      // Execute SQL query to delete the record
      const result = await deleteCall(callId);
      // Check if a row was actually deleted
      if (result.affectedRows === 0) {
        return res.status(404).send({
          message: "Call task not found",
          success: false,
        });
      }

      return res.status(200).send({
        message: "Call task deleted successfully",
        success: true,
      });
    } catch (e) {
      console.log("Error deleting call task: " + e);
      return res.status(500).send({
        message: "Failed to delete call task",
        success: false,
      });
    }
  }
);

router.get("/leadsOfUsers/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const rows = await leadsForaUser(userId);

    if (rows.length === 0) {
      return res.status(200).json({
        message: "No lead data found for the specified user.",
        data: [],
        success: true,
      });
    }

    return res.status(200).json({
      message:
        "Lead data for the specified user has been successfully fetched.",
      data: rows,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching leads for user:", error);

    return res.status(500).json({
      message: "An error occurred while fetching lead data for the user.",
      success: false,
      error: error.message, // Remove in production for security
    });
  }
});

router.get(
  "/getPaymentData/:projectName/:pType/:type/:plan",
  async (req, res) => {
    const { projectName, pType, type, plan } = req.params;
    // if (!projectName || !pType || !type || !plan) {
    //   console.log("Niceeeeeeeeeeeeeeeeeeeeeeeeeeee");
    // }
    try {
      const [rows] = await mySqlPool.query(
        `SELECT * FROM basic_additional_plans WHERE Project_Name_A_P = ? AND Property_Type_Plans = ? AND Flat_Name = ? AND Plan_Name = ?`,
        [projectName, pType, type, plan]
      );

      return res.status(200).send({
        message: "This is the Payment of Property",
        success: true,
        data: rows,
      });
    } catch (e) {
      console.error("Error fetching payment data:", e);
      return res.status(500).send({
        message:
          "There was an error fetching the payment data for the project.",
        success: false,
      });
    }
  }
);
router.get("/getMainPlan/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM purchaseorder WHERE Purchase_id=?`,
      [id]
    );

    return res.status(200).send({
      message: "This is the Payment of Property",
      success: true,
      data: rows,
    });
  } catch (e) {
    console.error("Error fetching payment data:", e);
    return res.status(500).send({
      message: "There was an error fetching the payment data for the project.",
      success: false,
    });
  }
});

router.get(
  "/purchasePaidPrice/:id/:Disc/:type",
  authenticateToken,
  async (req, res) => {
    const { id, Disc, type } = req.params;

    try {
      // Query the database
      const rows = await purchasePaidPrice(id, Disc, type);

      // Check if data was found
      if (rows.length > 0) {
        return res.status(200).send({
          message: "This is the Payment of Property",
          success: true,
          data: rows,
        });
      } else {
        return res.status(404).send({
          message: "No payment data found for the given parameters.",
          success: false,
        });
      }
    } catch (error) {
      console.error("Error fetching payment data:", error);
      return res.status(500).send({
        message:
          "There was an error fetching the payment data for the project.",
        success: false,
      });
    }
  }
);

router.get("/customerEmail/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Updated SQL query with the correct syntax
    const rows = await customerEmailCheck(id);
    // Checking if any data was found
    if (rows.length === 0) {
      return res.status(404).send({
        message: "No customer found with the provided ID",
        success: false,
        data: [],
      });
    }

    // Successfully fetched data
    return res.status(200).send({
      message: "The data of the customer's email is fetched successfully",
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error(
      "There is an error in fetching the customer's email by ID:",
      error
    );
    return res.status(500).send({
      message: "There was an error fetching the customer's Id",
      success: false,
    });
  }
});

router.patch("/customer/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  const {
    firstName,
    lastName,
    emailAddress,
    contactNumber,
    age,
    gender,
    address,
    country,
    state,
    city,
    zipcode,
    Occupation,
  } = req.body.data;

  console.log(req.body.data);

  try {
    // Start a new connection for the transaction

    // Update the existing activity log with provided details
    const result = await customerEdit(
      firstName,
      lastName,
      emailAddress,
      contactNumber,
      age,
      gender,
      address,
      country,
      state,
      city,
      zipcode,
      Occupation,
      id
    );

    // Check if the row was updated
    if (result.affectedRows === 0) {
      throw new Error(`No task found with ID: ${id}`);
    }

    // Move to next middleware or route function

    return res.status(200).send({
      message: "Task Updated SucessFully",
      success: true,
    });
  } catch (error) {
    console.error("Error updating Customer:", error);
    return res.status(500).send({
      message: "Error updating Customer",
      success: false,
      error: error.message,
    });
  }
});

// router.get("/leadsAssociatedWithFlat/:id", async (req, res) => {
//   const { id } = req.params;

//   try {
//     const [rows] = await mySqlPool.query(
//       `SELECT * FROM leads  WHERE Flat_Id = ?`,
//       [id]
//     );

//     if (rows.length === 0) {
//       return res.status(404).send({
//         message: "No data found for the provided ID",
//         success: false,
//         data: [],
//       });
//     }

//     return res.status(200).send({
//       message: "Data Fetched of Property Associated With Leads",
//       success: true,
//       data: rows?.length,
//     });
//   } catch (e) {
//     console.error("Error fetching data:", e);
//     return res.status(500).send({
//       message:
//         "There is some error in Data Fetched of Property Associated With Leads",
//       success: false,
//       data: [],
//     });
//   }
// });

router.get("/getAssociated/:leadId/:flatId", async (req, res) => {
  const { leadId, flatId } = req.params;

  try {
    // Fetch leads associated with the specified flat, excluding the provided lead

    const rows = await leadsAssociatedWithProperty(leadId, flatId);

    if (rows.length === 0) {
      return res.status(404).send({
        message: "No other leads are associated with the specified property.",
        success: true,
        data: [],
      });
    }

    return res.status(200).send({
      message: "Associated leads retrieved successfully.",
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching associated leads:", error);

    return res.status(500).send({
      message: "An error occurred while retrieving associated leads.",
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
