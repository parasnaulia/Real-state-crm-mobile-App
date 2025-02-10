const express = require("express");

const mySqlPool = require("../../config/db.js");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// const { error } = require("console");

const {
  MainProjectEditHelper,
  updateProjectOwnerHelper,
  insertProjectCategoryHelper,

  projectInsertionMainHelper,

  projectOwnerPostHelper,

  insertProjectCategory,
  insertToPaymentMain,
  AddPlan,
} = require("../../Controllers/ProjectController.js");

const {
  checkPackageValidity,
} = require("../../Middlewares/PackageCheckMiddleWare");

const {
  fetchFlats,
  propertyTypeList,
  projectCategory,
  projectFetcher,
  unitFetcherHelper,
  planFetcherHelper,
  configFetcherHelper,
  blockFetcherHelper,
  listPriceHelper,
  projectFetcherForSpecificProject,
} = require("../../Controllers/PropertyFetchController.js");
const {
  usersAssociatedWithProject,
  projectAssignToUser,
  propertySoldByUser,
  customerSelectionForAuser,
} = require("../../Controllers/UserFetcher/UserFetcher.js");
const {
  typePost,
  insertTypeData,
} = require("../../Controllers/ProjectFetcher/ProjectFetcher.js");
const {
  propertyFetch,
  amnetiesFetch,
  propertyInsert,
  dublicateHandling,
  propertyFetcher,
  amentiesPost,
  amenitiesUpdate,
  planUpdate,
  propertiesById,
  propertyPurchasedByCustomer,
  leadsArrivedAt,
  projectForUser,
  flatById,
  typesById,
  allProject,
  mainPaymentPlan,
  paymentBycategory,
  leadsArrivedAtProperty,
} = require("../../Controllers/PropertyFetcher/PropertyFetcherController.js");
const { authenticateToken } = require("../../Middlewares/RoutesAuth.js");
const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(__dirname, "../../Public/Image");

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
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

router.post("/propertyTypeList", authenticateToken, async (req, res) => {
  const { Type, Status, discription, Project_Name, Catagory, MainOrgName } =
    req.body;

  // Validate required fields and constraints
  if (!Type || !Status || !Project_Name || !Catagory) {
    return res.status(400).send({
      message: "Missing required fields",
      success: false,
    });
  }

  // Field length validations
  if (Type.length > 50) {
    return res.status(400).send({
      message: "Type must be 50 characters or fewer",
      success: false,
    });
  }
  if (discription.length > 1000) {
    return res.status(400).send({
      message: "Description must be 1000 characters or fewer",
      success: false,
    });
  }
  if (Project_Name.length > 50) {
    return res.status(400).send({
      message: "Project Name must be 50 characters or fewer",
      success: false,
    });
  }
  if (Catagory.length > 50) {
    return res.status(400).send({
      message: "Category must be 50 characters or fewer",
      success: false,
    });
  }
  if (
    !Number.isInteger(MainOrgName) ||
    MainOrgName < 0 ||
    MainOrgName > 4294967295
  ) {
    return res.status(400).json({
      success: false,
      message: "MainOrgName must be an integer between 0 and 4,294,967,295.",
    });
  }

  // Continue with the rest of your code

  try {
    // Check if entry already exists in the database

    const result = await insertTypeData(
      Type,
      Status,
      discription,
      Project_Name,
      Catagory,
      MainOrgName
    );

    if (result) {
      return res.status(201).send({
        message: "Property type successfully added",
        success: true,
        data: {
          id: result.insertId || null, // Assuming `insertId` is returned from the database
          Type,
          Status,
          discription,
          Project_Name,
          Catagory,
          MainOrgName,
        },
      });
    } else {
      return res.status(500).send({
        message: "Failed to add property type. Please try again.",
        success: false,
      });
    }
  } catch (e) {
    console.error("Error in PropertyTypeList Insertion:", e);
    return res.status(500).send({
      message: "Error in adding property type",
      success: false,
      error: e.message,
    });
  }
});

router.get(
  "/propertyTypeList/:ProjectName/:Category",
  authenticateToken,
  async (req, res) => {
    const { ProjectName, Category } = req.params;

    try {
      const rows = await propertyTypeList(ProjectName, Category);

      if (rows.length > 0) {
        return res.status(200).send({
          message: "Data fetched successfully",
          success: true,
          data: rows,
        });
      } else {
        return res.status(200).send({
          message: "No data found",
          success: true,
          data: [],
        });
      }
    } catch (e) {
      console.error("Error fetching data:", e);
      return res.status(500).send({
        message: "An error occurred while fetching data",
        success: false,
        data: [],
        error: e.message,
      });
    }
  }
);

router.post("/flat", authenticateToken, async (req, res) => {
  try {
    const result = await propertyInsert(req);

    return res.status(200).send({
      message: "The flat data has been inserted successfully.",
      success: true,
      flatId: result.insertId, // Use insertId from the result
    });
  } catch (e) {
    console.error("Database insertion error:", e.message);
    return res.status(500).send({
      message: "An error occurred while inserting the flat data.",
      success: false,
      error: e.message,
    });
  }
});
router.get("/flatById/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const flats = await propertiesById(id);

    // Respond with the retrieved data
    return res.status(200).send({
      message: "Flats data retrieved successfully.",
      success: true,
      data: flats,
    });
  } catch (e) {
    console.error("Error fetching flats data:", e);
    return res.status(500).send({
      message: "An error occurred while fetching flats data.",
      success: false,
      data: [],
    });
  }
});
router.get("/flatByIdStatus/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Query to fetch flat details by ID and filter out 'sold' status
    const query = `
      SELECT flat_id, Unit_No, Block, Floor, Configuration, Area, Carpet, Super_Build_up, 
             List_Price, Status, Facing, Bedrooms, Bathrooms, Balcony, Lead_Arrived
      FROM flat
      WHERE Flat_id = ? AND Status != ?
    `;

    const [flats] = await mySqlPool.query(query, [id, "sold"]);

    // Check if no data is returned
    if (flats.length === 0) {
      return res.status(404).send({
        message: "No flats found for the given ID and status.",
        success: false,
        data: [],
      });
    }

    // Respond with the retrieved data
    return res.status(200).send({
      message: "Flats data retrieved successfully.",
      success: true,
      data: flats,
    });
  } catch (error) {
    console.error("Error fetching flats data:", error);

    // Return a 500 status code with an error message
    return res.status(500).send({
      message: "An error occurred while fetching flats data.",
      success: false,
      data: [],
    });
  }
});

router.get("/flat/:project/:Ptype/:id", authenticateToken, async (req, res) => {
  const { project, Ptype, id, orgName } = req.params;
  try {
    // Correct the SQL query by adding a WHERE clause for filtering by project and property type

    const flats = await propertyFetch(project, Ptype, id, orgName);

    // Respond with the retrieved data
    return res.status(200).send({
      message: "Properties  data retrieved successfully.",
      success: true,
      data: flats,
    });
  } catch (e) {
    console.error("Error fetching flats data:", e);
    return res.status(500).send({
      message: "An error occurred while fetching Properties data.",
      success: false,
      data: [],
    });
  }
});
router.get(
  "/flat-1/:project/:Ptype/:id",
  authenticateToken,
  async (req, res) => {
    const { project, Ptype, id } = req.params;
    if (!project || !Ptype || !id) {
      return res.status(400).send({
        message: "Invalid parameters provided.",
        success: false,
      });
    }
    try {
      const flats = await fetchFlats(project, Ptype, id);

      // Respond with the retrieved data
      return res.status(200).send({
        message: "Flats data retrieved successfully.",
        success: true,
        data: flats,
      });
    } catch (e) {
      console.error("Error fetching flats data:", e);
      return res.status(500).send({
        message: "An error occurred while fetching flats data.",
        success: false,
        data: [],
      });
    }
  }
);

router.get("/flat/:project/:Ptype/:id/:orgName/:block", async (req, res) => {
  const { project, Ptype, id, orgName, block } = req.params;
  try {
    // Correct the SQL query by adding a WHERE clause for filtering by project and property type
    const query = `
      SELECT flat_id, Unit_No, Block, Floor, Configuration, Area, Carpet, Super_Build_up, 
             List_Price, Status, Facing, Bedrooms, Bathrooms, Balcony,Lead_Arrived
      FROM flat
      WHERE Project_Name_flats = ? AND Property_type = ? And Type_Flat=? AND Org_Name=? AND Block=?
    `;

    const [flats] = await mySqlPool.query(query, [
      project,
      Ptype,
      id,
      orgName,
      block,
    ]);

    // Respond with the retrieved data
    return res.status(200).send({
      message: "Flats data retrieved successfully.",
      success: true,
      data: flats,
    });
  } catch (e) {
    console.error("Error fetching flats data:", e);
    return res.status(500).send({
      message: "An error occurred while fetching flats data.",
      success: false,
      data: [],
    });
  }
});
router.post("/amenities", authenticateToken, async (req, res) => {
  try {
    // Call the service function to handle the amenities insertion
    const result = await amentiesPost(req);

    // Check if rows were successfully affected (inserted)
    if (result?.affectedRows > 0) {
      return res.status(201).json({
        message: "Amenities data has been added successfully.",
        success: true,
      });
    }

    // If no rows were affected, return a meaningful error response
    return res.status(400).json({
      message: "Failed to add amenities. Please check the input data.",
      success: false,
    });
  } catch (error) {
    // Log the error details for debugging purposes
    console.error("Error adding amenities:", error.message);

    // Return a structured error response with a proper status code
    return res.status(500).json({
      message: "An unexpected error occurred while adding amenities.",
      success: false,
      error: error.message, // Include the error message for debugging (optional)
    });
  }
});

router.get(
  "/amenities/:project/:Ptype/:flat_type",
  authenticateToken,
  async (req, res) => {
    const { project, Ptype, flat_type } = req.params;
    try {
      const amenities = await amnetiesFetch(project, Ptype, flat_type);

      // Respond with the retrieved data
      return res.status(200).send({
        message: "Amenities data retrieved successfully.",
        success: true,
        data: amenities,
      });
    } catch (e) {
      console.error("Error fetching amenities data:", e);
      return res.status(500).send({
        message: "An error occurred while fetching amenities data.",
        success: false,
        data: [],
      });
    }
  }
);

// const insertToPaymentMain = async (req, res, next) => {
//   const { Project_Name, Property_Name, Plan_Size, Flat_Name, orgName } =
//     req.body;
//   const PlansNames = `Plan-${Plan_Size}`;

//   try {
//     const data = await mySqlPool.query(
//       `INSERT INTO payment_plan (Name, Project_Name_Plan, Property_Type,Flat_Name,Org_Name) VALUES (?, ?, ?,?,?)`,
//       [PlansNames, Project_Name, Property_Name, Flat_Name, orgName]
//     );

//     if (data) {
//       next();
//     } else {
//       return res.status(500).send({
//         message: "There is some problem in insertion of data to payment_plan.",
//         success: false,
//       });
//     }
//   } catch (e) {
//     console.error("Error inserting into payment_plan:", e);
//     return res.status(500).send({
//       message: "There is some problem in insertion of data to payment_plan.",
//       success: false,
//     });
//   }
// };

// insertToPaymentMain,
// AddPlan,
router.post("/payment_plan", authenticateToken, async (req, res) => {
  let connection;

  try {
    // Step 1: Get a connection and start a transaction
    connection = await mySqlPool.getConnection();
    await connection.beginTransaction();
    console.log("Transaction started.");

    // Step 2: Insert Payment Plan Data
    const paymentPlanId = await insertToPaymentMain(req, connection); // Returns the ID of the inserted plan

    // Step 3: Insert Basic and Additional Plans
    await AddPlan(req, connection, paymentPlanId);

    // Step 4: Commit the transaction
    await connection.commit();
    console.log("Transaction committed successfully.");

    // Final Response
    return res.status(200).send({
      message: "Payment Plan data processed successfully.",
      success: true,
    });
  } catch (err) {
    // Rollback transaction on error
    if (connection) {
      await connection.rollback();
      console.error("Transaction rolled back due to error:", err.message);
    }
    return res.status(500).send({
      message: err.message || "Failed to process Payment Plan data.",
      success: false,
    });
  } finally {
    // Release the connection back to the pool
    if (connection) connection.release();
  }
});

// Getting plan Size
router.get(
  "/planSize/:project/:PType/:Flat_Name",
  authenticateToken,
  async (req, res) => {
    const { project, PType, Flat_Name } = req.params;

    try {
      const rows = await planFetcherHelper(project, PType, Flat_Name);

      return res.status(200).send({
        message:
          "The data has been retrieved successfully for Paln For Customer During Lead Conversion.",
        data: rows,
        success: true,
      });
    } catch (e) {
      console.error("Error fetching the plan size:", e);
      return res.status(500).send({
        message: "There was an error fetching the plan size.",
        data: [],
        success: false,
      });
    }
  }
);

router.get(
  "/paymentByCatagory/:Project/:PType/:Plan/:Flat_Name/",
  authenticateToken,
  async (req, res) => {
    const { Project, PType, Plan, Flat_Name } = req.params;

    try {
      const rows = await paymentBycategory(Project, PType, Plan, Flat_Name);
      return res.status(200).send({
        message: "This is Payemt Catagory details",
        success: true,
        data: rows,
      });
    } catch (e) {
      return res.status(500).send({
        message:
          "There is Some Error In Fetching The Data of Payment Catatgory",
        success: false,
      });
    }
  }
);
router.post("/insert-flatsArray", authenticateToken, async (req, res) => {
  const generatedArray = req.body.generatedArray;
  // console.log("nice");

  // SQL query to insert data

  try {
    // Using async/await for the MySQL query
    const result = await dublicateHandling(generatedArray);

    // Return success response if query is successful
    return res.status(201).json({
      message: "Data inserted successfully",
      success: true,
      result,
    });
  } catch (err) {
    // Handle any errors
    console.error(
      "Error inserting data: of Array flats While Dublicating properties ",
      err
    );
    return res.status(500).json({
      error: "Failed to insert data while dublicating Property Data",
      details: err.message, // Provide more details in the error response
      success: false,
    });
  }
});
router.get(
  "/MainPaymentPlan/:project/:category/:flat/:name",
  authenticateToken,
  async (req, res) => {
    const { project, category, flat, name } = req.params;

    try {
      const rows = await mainPaymentPlan(project, category, flat, name);

      if (rows.length === 0) {
        return res.status(404).send({
          message: "No Payment Plan found for the specified criteria.",
          success: false,
        });
      }

      return res.status(200).send({
        message: "The Payment Plan has been fetched successfully.",
        success: true,
        data: rows,
      });
    } catch (e) {
      console.log("Error fetching Payment Plan: " + e);
      return res.status(500).send({
        message: "An error occurred while fetching the Payment Plan.",
        success: false,
      });
    }
  }
);

router.put("/flat/:id", authenticateToken, async (req, res) => {
  try {
    const result = await propertyFetcher(req);

    if (result.affectedRows === 0) {
      return res.status(404).send({
        message: "Flat not found.",
        success: false,
      });
    }

    return res.status(200).send({
      message: "Flat updated successfully.",
      data: req.body, // Return the updated data to frontend
      success: true,
    });
  } catch (error) {
    console.error("Error updating flat:", error);
    return res.status(500).send({
      message: "Error updating flat data.",
      success: false,
    });
  }
});

router.put("/amenities/:id", authenticateToken, async (req, res) => {
  const amenityId = req.params.id;

  // Validate input
  const { Name, Discription, Status } = req.body;
  console.log(req.body);

  if (!Name || !Discription || Status === undefined) {
    return res.status(400).json({
      message: "Invalid input. Please provide Name, Description, and Status.",
      success: false,
    });
  }

  const values = [Name, Discription, Status, amenityId];

  try {
    // Call the service function to handle the database update
    const result = await amenitiesUpdate(values);

    // Check if any rows were updated
    if (result.affectedRows > 0) {
      return res.status(200).json({
        message: "Amenity updated successfully.",
        success: true,
        updatedAmenityId: amenityId,
      });
    }

    // Handle the case where no rows were affected (e.g., invalid ID)
    return res.status(404).json({
      message: "Amenity not found or no changes made.",
      success: false,
    });
  } catch (error) {
    console.error("Error updating amenity:", error);

    return res.status(500).json({
      message: "An unexpected error occurred while updating the amenity.",
      success: false,
      error: error.message, // Optional: include error details
    });
  }
});

router.get(
  "/catagoryFetch/:project/:catagory/:type/:orgName",
  async (req, res) => {
    const { project, catagory, type, orgName } = req.params;

    try {
      const query = `SELECT * FROM flat WHERE Project_Name_flats = ? AND Property_type = ? AND Type_Flat = ? AND Org_Name = ?`;

      // Ensure you are using the correct method to run queries
      const [rows] = await mySqlPool.query(query, [
        project,
        catagory,
        type,
        orgName,
      ]);

      return res.status(200).send({
        message: "Data of category is fetched",
        success: true,
        data: rows,
      });
    } catch (e) {
      console.error("There is some error in fetching the user data: " + e);
      return res.status(500).send({
        message: "Error in fetching data",
        success: false,
        error: e.message,
      });
    }
  }
);
router.get(
  "/configFetch-1/:project/:category/:type/:orgName",
  authenticateToken,
  async (req, res) => {
    const { project, category, type, orgName } = req.params;

    try {
      // Query to fetch data based on project, category, type, orgName, and exclude sold status

      const rows = await configFetcherHelper(project, category, type, orgName);

      return res.status(200).send({
        message: "Data of category fetched successfully.",
        success: true,
        data: rows,
      });
    } catch (e) {
      console.error("Error fetching category data:", e.message);
      return res.status(500).send({
        message: "Error in fetching data",
        success: false,
        error: e.message,
      });
    }
  }
);

router.get(
  "/BlockFetch/:project/:catagory/:type/:orgName/:config",
  authenticateToken,
  async (req, res) => {
    const { project, catagory, type, orgName, config } = req.params;

    try {
      // Ensure you are using the correct method to run queries
      const rows = await blockFetcherHelper(
        project,
        catagory,
        type,
        orgName,
        config
      );

      return res.status(200).send({
        message: "Data of Block  is fetched",
        success: true,
        data: rows,
      });
    } catch (e) {
      console.error(
        "There is some Error in fetching data of Block For Customer: " + e
      );
      return res.status(500).send({
        message: "Error in fetching data of Block For Customer ",
        success: false,
        error: e.message,
      });
    }
  }
);

router.get(
  "/UnitFetch/:project/:catagory/:type/:orgName/:config/:block",
  async (req, res) => {
    const { project, catagory, type, orgName, config, block } = req.params;

    try {
      // const query = `SELECT * FROM flat WHERE Project_Name_flats = ? AND Property_type = ? AND Type_Flat = ? AND Org_Name = ? AND Configuration=? AND Block=? AND Status!=?`;

      // Ensure you are using the correct method to run queries
      const rows = await unitFetcherHelper(
        project,
        catagory,
        type,
        orgName,
        config,
        block
      );

      return res.status(200).send({
        message: "Unit Number is Fetched For a Customer or a Lead",
        success: true,
        data: rows,
      });
    } catch (e) {
      console.error(
        "There is some error inFetching Unit Number for  Customer or a Lead: " +
          e
      );
      return res.status(500).send({
        message:
          "There is some error inFetching Unit Number for  Customer or a Lead:",
        success: false,
        error: e.message,
      });
    }
  }
);

router.get(
  "/ListPriceFetch/:project/:category/:type/:orgName/:config/:block/:unitNo",
  authenticateToken,
  async (req, res) => {
    // Destructure parameters from req.params
    const { project, category, type, orgName, config, block, unitNo } =
      req.params;

    try {
      const rows = await listPriceHelper(
        project,
        category,
        type,
        orgName,
        config,
        block,
        unitNo
      );

      // Check if any rows were returned and respond accordingly
      if (rows.length === 0) {
        return res.status(404).send({
          message:
            "No data found for the specified Custmer or no list price Found",
          success: false,
          data: [],
        });
      }

      // Send a successful response with fetched data
      return res.status(200).send({
        message: "List price for a Customer is Fetched",
        success: true,
        data: rows,
      });
    } catch (e) {
      console.error("Error in  fetching List price for a Customer:", e.message);

      // Send an error response with details
      return res.status(500).send({
        message: "Error in  fetching List price for a Customer:",
        success: false,
        error: e.message,
      });
    }
  }
);

router.delete(
  "/flat/:orgName/:flat_id",
  authenticateToken,
  async (req, res) => {
    const { orgName, flat_id } = req.params;

    try {
      // Execute the MySQL query to delete the property
      const deleteQuery = `DELETE FROM flat WHERE Org_Name = ? AND Flat_id=?`;
      const [result] = await mySqlPool.query(deleteQuery, [orgName, flat_id]);

      if (result.affectedRows > 0) {
        return res.status(200).json({
          message: "Property deleted successfully",
          success: true,
        });
      } else {
        return res.status(404).json({
          message: "Property not found",
          success: false,
        });
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      return res.status(500).json({
        message: "Internal server error",
        success: false,
      });
    }
  }
);

router.get(
  "/propertyByUser/:id/:orgName",
  authenticateToken,
  async (req, res) => {
    const { id, orgName } = req.params;

    // Validate input (to prevent SQL injection and ensure data is expected)
    if (!id || !orgName) {
      return res.status(400).send({
        message: "Email and organization name are required",
        success: false,
      });
    }

    try {
      const rows = await propertySoldByUser(id, orgName);

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
  }
);

//Project Section

router.get(
  "/project-owner/:projectName/:organizationName",

  async (req, res) => {
    const { projectName, organizationName } = req.params; // Get parameters from route

    if (!projectName || !organizationName) {
      return res.status(400).json({
        error: "Both projectName and organizationName are required",
      });
    }

    try {
      // SQL Query to fetch project owner details
      const query = `
      SELECT * FROM projectowner 
      WHERE Project_Name_Owner=? AND Organization_Name_Owner=?;
    `;

      // Execute the query
      const [rows] = await mySqlPool.query(query, [
        projectName,
        organizationName,
      ]);

      // Send the result back as JSON
      return res.json({ success: true, data: rows });
    } catch (error) {
      console.error("Error retrieving data:", error);
      return res
        .status(500)
        .json({ success: false, error: "Error retrieving data" });
    }
  }
);

// const projectMiddle = async (req, res, next) => {
//   const {
//     name,
//     // Pcode,
//     projectTypes,
//     Address,
//     discription,
//     status,
//     country,
//     city,
//     zip,
//     state,
//     Owner_Name,
//   } = req.body;

//   const randomNum = Math.floor(10000 + Math.random() * 90000);

//   const Pcode = req.body.name + randomNum;

//   const today = new Date();
//   const dateString = today.toLocaleDateString(); // Format: MM/DD/YYYY

//   try {
//     const [existingProject] = await mySqlPool.query(
//       `SELECT * FROM project WHERE Name = ? AND Owner=?`,
//       [name, req.body.Owner_Name]
//     );

//     if (existingProject.length > 0) {
//       return res
//         .status(400)
//         .send({ message: "Project name already present", success: false });
//     }

//     // }
//     const ptype = projectTypes.toString();

//     // Using destructured variables for clarity
//     const [result] = await mySqlPool.query(
//       `INSERT INTO project (Name, Project_Type, Assign_To,Address,Discription,Status,Country,City,Zip,State,Owner,Created_Date) VALUES (?, ?, ?,?,?,?,?,?,?,?,?,?)`,
//       [
//         name,

//         ptype,
//         "No one",
//         Address,
//         discription,
//         status,
//         country,
//         city,
//         zip,
//         state,
//         Owner_Name,
//         dateString,
//       ]
//     );

//     if (result.affectedRows > 0) {
//       const primaryKey = result.insertId;
//       req.primaryKey = primaryKey;

//       next();
//     } else {
//       throw new Error("Failed to insert project");
//     }
//   } catch (error) {
//     // Log the error message for debugging
//     console.error("Error inserting project:", error.message);
//     return res.status(500).send({
//       message: "Project section data insertion problem",
//       success: false,
//     });
//   }
// };

// const projectOwnerMiddleware = async (req, res, next) => {
//   const { multiuser, name, Owner_Name } = req.body;

//   const values = multiuser.map((owner) => [
//     owner.name,
//     owner.email,
//     owner.mobile,
//   ]);

//   try {
//     // Insert query with multiple rows
//     const [result] = await mySqlPool.query(
//       `INSERT INTO projectowner (Name, Email, Mobile, Project_Name_Owner, Organization_Name_Owner) VALUES ?`, // Bulk insert using `?`
//       [values.map((value) => [...value, req.primaryKey, Owner_Name])] // Adding Project_Name and Organization_Name to each row
//     );

//     next();
//   } catch (e) {
//     console.error("Error inserting data:", e);
//     return res.status(500).json({ message: "Internal server error." });
//   }
// };

// projectInsertionMainHelper,

// projectOwnerPostHelper,

// insertProjectCategory,

router.post("/project", checkPackageValidity, async (req, res) => {
  let connection;

  console.log(req.body);

  try {
    // Start transaction
    connection = await mySqlPool.getConnection();
    await connection.beginTransaction();

    // Step 1: Insert main project
    const { pKey } = await projectInsertionMainHelper(req, connection);
    req.primaryKey = pKey;

    // Step 2: Insert project categories
    await insertProjectCategory(req, connection);

    // Step 3: Insert project owners
    await projectOwnerPostHelper(req, connection);

    // Commit transaction
    await connection.commit();
    console.log("Transaction committed successfully.");

    res.status(200).send({
      message: "Project data processed successfully.",
      success: true,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Transaction rolled back due to error:", error.message);

    res.status(500).send({
      message: error.message || "Failed to process project data.",
      success: false,
    });
  } finally {
    if (connection) connection.release();
  }
});

router.get("/projectOwner/:ProjectName", async (req, res) => {
  const { ProjectName, ProjectOwner } = req.params;

  try {
    // Ensure parameters are present
    if (!ProjectName) {
      return res.status(400).send({
        message: "Project Name and Project Owner are required",
        success: false,
        data: [],
      });
    }

    // Sanitize inputs if needed (you may have more advanced sanitation methods)
    const sanitizedProjectName = ProjectName.trim();
    // const sanitizedProjectOwner = ProjectOwner.trim();

    // Fetch data from the database
    const [rows] = await mySqlPool.query(
      `SELECT * FROM projectowner WHERE Project_Name_Owner = ?`,
      [ProjectName]
    );

    // If no data found
    if (rows.length === 0) {
      return res.status(404).send({
        message:
          "No project owner found for the given project and organization",
        success: false,
        data: [],
      });
    }

    // If data is found
    return res.status(200).send({
      message: "Successfully fetched data",
      success: true,
      data: rows,
    });
  } catch (error) {
    // Log detailed error for better debugging
    console.error("Error fetching project owner data: ", error);

    // Return server error response
    return res.status(500).send({
      message: "An error occurred while fetching the project owner data",
      success: false,
      data: [],
    });
  }
});
// properties

router.get("/catagoryFetch/:Project/:OrgName", async (req, res) => {
  try {
    const { Project, OrgName } = req.params; // Extract the route parameters

    // Ensure both Project and OrgName are present
    if (!Project || !OrgName) {
      return res.status(400).send({
        message: "Project and OrgName are required parameters.",
        success: false,
      });
    }

    // SQL query to fetch category details
    const [rows] = await mySqlPool.query(
      `SELECT Catagory FROM project_catagory WHERE Project_Name_Catagory = ? AND Organization_Name_catagory = ?`,
      [Project, OrgName] // Pass parameters to avoid SQL injection
    );

    // Check if any data is returned
    if (rows.length === 0) {
      return res.status(404).send({
        message:
          "No categories found for the provided Project and Organization.",
        success: false,
      });
    }

    // Return the fetched data
    next();
  } catch (e) {
    console.error("There is some error in fetching the category data:", e);

    // Return an error response
    return res.status(500).send({
      message: "An error occurred while fetching category data",
      success: false,
    });
  }
});
// const MainProjectEdit = async (req, res, next) => {
//   const {
//     name,
//     projectTypes,
//     Address,
//     discription,
//     status,
//     country,
//     city,
//     zip,
//     state,
//     Owner_Name,
//     OldPName,
//     dateCreated,
//     Id,
//   } = req.body;

//   const ptype = projectTypes.toString(); // Assuming projectTypes is an array

//   try {
//     // Check if the project with the given name and owner already exists
//     const [rows1] = await mySqlPool.query(
//       `SELECT * FROM project WHERE Name = ? AND Owner = ?`, // Query string
//       [name, Owner_Name] // Array of parameters to be passed
//     );

//     if (rows1.length > 0 && OldPName !== name) {
//       return res.status(400).send({
//         message: "The Project name Alredy Present For This Organization", // Using 'Alredy' spelling as requested
//         success: false,
//       });
//     }

//     // Update the project details
//     const [rows] = await mySqlPool.query(
//       `UPDATE project
//        SET Name = ?,
//            Project_Type = ?,
//            Address = ?,
//            Discription = ?,
//            Status = ?,
//            Country = ?,
//            City = ?,
//            Zip = ?,
//            State = ?,
//            Owner = ?,
//            Created_Date = ?
//        WHERE Project_Code = ? AND Owner = ?`, // Query for updating
//       [
//         name,
//         ptype, // Assuming projectTypes is an array and converted to a string
//         Address,
//         discription, // Keeping 'discription' spelling
//         status,
//         country,
//         city,
//         zip,
//         state,
//         Owner_Name,
//         dateCreated,
//         Id, // Assuming this is the Project_Code
//         Owner_Name,
//       ]
//     );

//     if (rows.affectedRows === 0) {
//       return res
//         .status(404)
//         .json({ message: "Project not found or no changes made." });
//     }

//     next();
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ error: "An error occurred while updating the project." });
//   }
// };

// const updateProjectOwnerMiddleware = async (req, res, next) => {
//   const { multiuser, Owner_Name, Id } = req.body;

//   // Start a transaction to ensure atomicity
//   const connection = await mySqlPool.getConnection();
//   try {
//     await connection.beginTransaction();

//     // Step 1: Delete existing records
//     await connection.query(
//       `DELETE FROM projectowner
//        WHERE Project_Name_Owner = ? AND Organization_Name_Owner = ?`,
//       [Id, Owner_Name]
//     );

//     // Step 2: Prepare values for batch insertion
//     const insertValues = multiuser.map((owner) => [
//       owner.name,
//       owner.email,
//       owner.mobile,
//       Id,
//       Owner_Name,
//     ]);

//     // Step 3: Insert new records in a batch
//     await connection.query(
//       `INSERT INTO projectowner (Name, Email, Mobile, Project_Name_Owner, Organization_Name_Owner)
//        VALUES ?`,
//       [insertValues]
//     );

//     // Commit the transaction if all queries succeed
//     await connection.commit();

//     next(); // Continue to next middleware or response
//   } catch (e) {
//     // Rollback the transaction in case of an error
//     await connection.rollback();
//     console.error("Error updating data:", e);
//     return res.status(500).json({ message: "Internal server error." });
//   } finally {
//     // Release the connection back to the pool
//     connection.release();
//   }
// };

// MainProjectEditHelper,
//   updateProjectOwnerHelper,
//   c,
router.patch("/projectEdit", authenticateToken, async (req, res) => {
  let connection;

  try {
    // Start transaction
    connection = await mySqlPool.getConnection();
    await connection.beginTransaction();

    // Update project details
    await MainProjectEditHelper(req, connection);

    // Update project owners
    await updateProjectOwnerHelper(req, connection);

    // Update project categories
    await insertProjectCategoryHelper(req, connection);

    // Commit transaction
    await connection.commit();
    res.status(200).send({
      message: "Project updated successfully.",
      success: true,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Transaction failed:", error.message);
    res.status(500).send({
      message: error.message || "Failed to update project.",
      success: false,
    });
  } finally {
    if (connection) connection.release();
  }
});

router.get("/projectCategories/:pId/:Oid", async (req, res) => {
  const { pId, Oid } = req.params; // Extract the project ID from the URL

  try {
    const [rows] = await mySqlPool.query(
      `SELECT 
          c.Id AS Category_ID,
          c.Catagory AS Category_Name
       FROM 
          project_catagory pc
       JOIN 
          catagory c ON pc.Catagory = c.Id
       WHERE 
          pc.Project_Name_Catagory = ? AND Organization_Name_catagory=?`,
      [pId, Oid]
    );

    if (rows.length === 0) {
      return res.status(400).send({
        message: "No categories found for this project",
        success: false,
        data: [],
      });
    }

    return res.status(200).send({
      message: "Categories linked to project retrieved successfully",
      data: rows,
      success: true,
    });
  } catch (e) {
    console.log("Error fetching categories for project", e);
    return res.status(500).send({
      message: "Server error while fetching categories for project",
      success: false,
      data: [],
    });
  }
});

router.delete("/delete-project", async (req, res) => {
  const { Project_Code, Owner } = req.body;

  try {
    // Check if the project exists with the given Project_Code and Owner
    const [rows1] = await mySqlPool.query(
      `SELECT * FROM project WHERE Project_Code = ? AND Owner = ?`,
      [Project_Code, Owner]
    );

    if (rows1.length === 0) {
      return res.status(404).send({
        message: "Project not found for the given Owner",
        success: false,
      });
    }

    // Proceed with deletion if the project exists
    const [rows] = await mySqlPool.query(
      `DELETE FROM project WHERE Project_Code = ? AND Owner = ?`,
      [Project_Code, Owner]
    );

    if (rows.affectedRows === 0) {
      return res.status(404).send({
        message: "No project deleted, it may not exist.",
        success: false,
      });
    }

    return res.status(200).send({
      message: "Project deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "An error occurred while deleting the project.",
    });
  }
});

router.post("/organizations", async (req, res) => {
  const { ids } = req.body;

  // Check if the ids array is provided
  if (!ids || ids.length === 0) {
    return res.status(400).send({
      message: "No IDs provided",
      success: false,
      data: [],
    });
  }

  try {
    // SQL query to fetch organization names for the given IDs
    const [rows] = await mySqlPool.query(
      `SELECT id, Organization_Name FROM organization WHERE id IN (?)`,
      [ids]
    );

    if (rows.length === 0) {
      return res.status(404).send({
        message: "Organizations not found",
        success: false,
        data: [],
      });
    }

    // Map the rows into a key-value object: { id1: "orgName1", id2: "orgName2", ... }
    const orgNameMap = rows.reduce((acc, row) => {
      acc[row.id] = row.Organization_Name;
      return acc;
    }, {});

    return res.status(200).send({
      message: "Organization data retrieved successfully",
      success: true,
      data: orgNameMap, // Return as a key-value pair object
    });
  } catch (error) {
    console.error("Error fetching organization names:", error);
    return res.status(500).send({
      message: "Server error",
      success: false,
      data: {},
    });
  }
});

router.get("/userpro/:id/:id1", async (req, res) => {
  const { id, id1 } = req.params; // Extract project ID and organization ID from route parameters

  try {
    // Prepare the SQL query with a JOIN to fetch User_Name and Email from the users table

    // Execute the query using the MySQL pool
    const results = await usersAssociatedWithProject(id, id1);

    // console.log(results);
    // console.log("Project users");

    // Check if any results are found

    if (results.length > 0) {
      return res.status(200).json({
        message: "User details retrieved successfully",
        success: true,
        data: results,
      });
    } else {
      return res.status(404).json({
        message:
          "No user details found with the given Project_Name_User and Organization_Name_Reported",
        success: false,
        data: [],
      });
    }
  } catch (error) {
    console.log("Error while executing SELECT query:", error);
    return res.status(500).json({
      message:
        "There was an error processing your request. while Fetching User Associated with the Project",
      success: false,
      data: [],
    });
  }
});

router.get("/category/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * From catagory Where Organization_Name_Catagories=?`,
      [id]
    );

    if (rows.length > 0) {
      return res.status(200).send({
        message: "Data is Fetched From Catagory",
        success: true,
        data: rows,
      });
    } else {
      return res.status(200).send({
        message: "Data is not Fetched From Catagory",
        success: false,
        data: [],
      });
    }
  } catch (e) {
    console.log("There is Some Error In Fetching the catagory data " + e);

    return res.status(200).send({
      message: "Data is not  Fetched From Catagory",
      success: false,
      data: [],
    });
  }
});

router.get(
  "/catagoryproject/:id/:orgName",
  authenticateToken,
  async (req, res) => {
    const { id, orgName } = req.params;

    try {
      // Ensure both id and orgName are present
      if (!id || !orgName) {
        return res.status(400).send({
          message: "Project category ID and Organization name are required.",
          success: false,
        });
      }

      const rows = await projectCategory(id, orgName);

      return res.status(200).send({
        message: "Category project data retrieved successfully.",
        success: true,
        data: rows,
      });
    } catch (e) {
      console.error("Database query error:", e);
      return res.status(500).send({
        message:
          "An error occurred while retrieving the category project data.",
        success: false,
      });
    }
  }
);

router.get("/project/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  // console.log(`Fetching project details for ID: ${id}`);

  try {
    const projectData = await projectFetcher(id);

    if (!projectData.length) {
      return res.status(404).json({
        message: "No projects found for the specified organization",
        success: false,
        data: [],
      });
    }

    return res.status(200).json({
      message: "Project data retrieved successfully",
      success: true,
      data: projectData,
      // category: categoryData,
    });
  } catch (error) {
    console.error("Error fetching project data:", error.message);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
      error: error.message, // Include the error message for debugging
    });
  }
});
router.get("/flatsById/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // SQL query to get flat details based on Flat_id
    const rows = await flatById(id);

    if (rows.length > 0) {
      // If flat data is found, send it with a success message
      return res.status(200).json({
        message: "Flat data retrieved successfully",
        success: true,
        data: rows[0],
      });
    } else {
      // If no data found for the provided Flat_id
      return res.status(404).json({
        message: "Flat not found",
        success: false,
        data: {},
      });
    }
  } catch (error) {
    console.error("Error fetching flat data:", error);
    return res.status(500).json({
      message: "Server error on Fetching the leads Property",
      success: false,
      data: {},
    });
  }
});

router.get("/projectById/:id/:pId", async (req, res) => {
  const { id, pId } = req.params;

  try {
    const [rows, fields] = await mySqlPool.query(
      `SELECT * FROM project Where Owner=? AND Project_Code=?`,
      [id, pId]
    );

    if (!rows) {
      return res.status(400).send({
        message: "Not Found",
        success: false,
        data: [],
      });
    }
    // console.log(rows);
    // console.log("data is Found and it is send to Frontend");

    return res.status(200).send({
      message: "Data is send",
      data: rows[0],
      success: true,
    });
  } catch (e) {
    console.log("There is Problem in Gettind data of PRojects");
    return res.status(500).send({
      message: "Server Problem in project get Api",
      success: false,
      data: [],
    });
  }
});

router.get("/projectById/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // SQL query to get project details based on Project_id
    const rows = await projectFetcherForSpecificProject(id);
    // console.log(rows);
    // console.log("This is Project By Id");

    if (rows.length > 0) {
      // If project data is found, send it with a success message
      return res.status(200).json({
        message: "Project data retrieved successfully",
        success: true,
        data: rows[0],
      });
    } else {
      // If no data found for the provided Project_id
      return res.status(404).json({
        message: "Project not found",
        success: false,
        data: {},
      });
    }
  } catch (error) {
    console.error("Error fetching project data:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
      data: {},
    });
  }
});
router.get("/catagoryById/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // SQL query to get project details based on Project_id
    const [rows] = await mySqlPool.query(
      `SELECT * FROM catagory WHERE Id = ?`,
      [id]
    );

    if (rows.length > 0) {
      // If project data is found, send it with a success message
      return res.status(200).json({
        message: "Project data retrieved successfully",
        success: true,
        data: rows[0],
      });
    } else {
      // If no data found for the provided Project_id
      return res.status(404).json({
        message: "Project not found",
        success: false,
        data: {},
      });
    }
  } catch (error) {
    console.error("Error fetching project data:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
      data: {},
    });
  }
});

router.get("/typesById/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // SQL query to get project details based on Project_id
    const rows = await typesById(id);

    if (rows.length > 0) {
      // If project data is found, send it with a success message
      return res.status(200).json({
        message: "Project data retrieved successfully",
        success: true,
        data: rows[0],
      });
    } else {
      // If no data found for the provided Project_id
      return res.status(404).json({
        message: "Project not found",
        success: false,
        data: {},
      });
    }
  } catch (error) {
    console.error("Error fetching project data:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
      data: {},
    });
  }
});
// router.get("/project/:id", async (req, res) => {
//   // console.log("Get Api Of project is hitted ");
//   const { id } = req.params;

//   try {
//     const [rows, fields] = await mySqlPool.query(
//       `SELECT p.Project_Code,p.Name,p.Project_Type,p.Assign_To,p.Address,p.Discription,p.Status,p.Country,p.City,p.Zip,p.State,p.Created_Date,o.Organization_Name AS Project_Owner_Name ,p.Owner FROM project AS p JOIN organization AS o ON p.Owner=o.id Where Owner=?`,
//       [id]
//     );

//     if (!rows) {
//       return res.status(400).send({
//         message: "Not Found",
//         success: false,
//         data: [],
//       });
//     }
//     // console.log(rows);
//     // console.log("data is Found and it is send to Frontend");

//     return res.status(200).send({
//       message: "Data is send",
//       data: rows,
//       success: true,
//     });
//   } catch (e) {
//     console.log("There is Problem in Gettind data of PRojects");
//     return res.status(500).send({
//       message: "Server Problem in project get Api",
//       success: false,
//       data: [],
//     });
//   }
// });

router.post("/projectsMap", async (req, res) => {
  const { ids } = req.body;

  // Check if the ids array is provided
  if (!ids || ids.length === 0) {
    return res.status(400).send({
      message: "No IDs provided",
      success: false,
      data: [],
    });
  }

  try {
    // SQL query to fetch organization names for the given IDs
    const [rows] = await mySqlPool.query(
      `SELECT Project_Code, Name FROM project WHERE Project_Code IN (?)`,
      [ids]
    );

    if (rows.length === 0) {
      return res.status(404).send({
        message: "Organizations not found",
        success: false,
        data: [],
      });
    }

    // Map the rows into a key-value object: { id1: "orgName1", id2: "orgName2", ... }
    const orgNameMap = rows.reduce((acc, row) => {
      acc[row.Project_Code] = row.Name;
      return acc;
    }, {});

    return res.status(200).send({
      message: "Organization data retrieved successfully",
      success: true,
      data: orgNameMap, // Return as a key-value pair object
    });
  } catch (error) {
    console.error("Error fetching organization names:", error);
    return res.status(500).send({
      message: "Server error",
      success: false,
      data: {},
    });
  }
});
router.post("/flatMap", async (req, res) => {
  const { ids } = req.body;

  // Validate if the `ids` array is provided and not empty
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).send({
      message: "No valid IDs provided",
      success: false,
      data: [],
    });
  }

  try {
    // SQL query to fetch flat details for the given IDs
    const [rows] = await mySqlPool.query(
      `SELECT Flat_id, Unit_No,Status, Block FROM flat WHERE Flat_id IN (?)`,
      [ids]
    );

    // If no rows are found, return a 404 response
    if (rows.length === 0) {
      return res.status(404).send({
        message: "Flats not found for the provided IDs",
        success: false,
        data: [],
      });
    }

    // Map the rows into a key-value object: { id1: { Unit_No, Block }, id2: { Unit_No, Block }, ... }
    const flatMap = rows.reduce((acc, row) => {
      acc[row.Flat_id] = {
        Unit_No: row.Unit_No,
        Block: row.Block,
        status: row.Status,
      };
      return acc;
    }, {});

    // Send the response with the mapped data
    return res.status(200).send({
      message: "Flat data retrieved successfully",
      success: true,
      data: flatMap, // Return the key-value pair object
    });
  } catch (error) {
    // Log and return a server error response
    console.error("Error fetching flat data:", error);
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      data: {},
    });
  }
});

router.get("/projectUser/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const rows = await projectAssignToUser(userId);

    if (rows.length > 0) {
      return res.status(200).send({
        data: rows,
        message: "data For Project fetched SucessFully",
        success: true,
      });
    } else {
      res.status(404).json({ message: "No projects found for this user." });
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/projectAll", authenticateToken, async (req, res) => {
  // console.log("Get Api Of project is hitted ");

  try {
    const rows = await allProject();

    if (!rows) {
      return res.status(400).send({
        message: "Not Found",
        success: false,
        data: [],
      });
    }
    // console.log(rows);
    // console.log("data is Found and it is send to Frontend");

    return res.status(200).send({
      message: "Data is send",
      data: rows,
      success: true,
    });
  } catch (e) {
    console.log("There is Problem in Gettind data of PRojects");
    return res.status(500).send({
      message: "Server Problem in project get Api",
      success: false,
      data: [],
    });
  }
});

router.get("/projectForUser/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const rows = await projectForUser(userId);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "No projects found for this user.",
        success: false,
        data: [],
      });
    }

    return res.status(200).json({
      message: "Projects retrieved successfully of a Particular User.",
      data: rows,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching project data for user:", error);

    return res.status(500).json({
      message: "Internal server error while fetching project data.",
      success: false,
      data: [],
    });
  }
});

router.patch("/payment_plan/:id", async (req, res) => {
  const { id } = req.params;
  const { plans, Project_Name, Property_Name, Flat_Name, orgName, PlansNames } =
    req.body;

  if (!id || !plans || !Array.isArray(plans)) {
    return res.status(400).send({
      message: "Invalid input: Ensure 'id' and 'plans' are provided correctly.",
      success: false,
    });
  }

  try {
    // Validate that the Purchase_Id exists
    const [[existingPurchaseOrder]] = await mySqlPool.query(
      "SELECT * FROM purchaseorder WHERE Purchase_id = ?",
      [id]
    );

    if (!existingPurchaseOrder) {
      return res.status(400).send({
        message: `Purchase_Id ${id} does not exist in the purchaseorder table.`,
        success: false,
      });
    }

    // Proceed with deleting and inserting rows...
    const filterData = plans.map((item) => item?.description).filter(Boolean);

    const [deleteRows] = await mySqlPool.query(
      `DELETE FROM perchaseorderpayment WHERE Purchase_Id = ? AND Paid_Amount IS NULL`,
      [id]
    );

    for (const plan of plans) {
      if (plan.type === "Basic") {
        await mySqlPool.query(
          `INSERT INTO perchaseorderpayment
           (Purchase_Id, Discription, Type, Percentage_Amount, Project_id_code, Catagory_Plan, Plans, Type_Plan, PoP_OrgName) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, // Use the validated Purchase_Id
            plan.description,
            plan.type,
            plan.percentage || 0,
            Project_Name || "",
            Property_Name || "",
            PlansNames || "",
            Flat_Name || "",
            orgName || "",
          ]
        );
      } else if (plan.type === "Additional") {
        await mySqlPool.query(
          `INSERT INTO perchaseorderpayment
           (Purchase_Id, Discription, Type, Amount, Project_id_code, Catagory_Plan, Plans, Type_Plan, PoP_OrgName) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, // Use the validated Purchase_Id
            plan.description,
            plan.type,
            plan.amount || 0,
            Project_Name || "",
            Property_Name || "",
            PlansNames || "",
            Flat_Name || "",
            orgName || "",
          ]
        );
      } else {
        console.warn(`Unknown plan type '${plan.type}' for plan:`, plan);
      }
    }

    return res.status(200).send({
      message: "Plans processed successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error processing payment plans:", error);
    return res.status(500).send({
      message: "An error occurred while processing payment plans.",
      success: false,
      error: error.message,
    });
  }
});

router.patch("/payment_plan-1", authenticateToken, async (req, res) => {
  try {
    // Delete existing plans for the specified criteria

    const result = await planUpdate(req);
    if (result.affectedRows > 0) {
      return res.status(200).send({
        message: "Plans inserted successfully",
        success: true,
      });
    } else {
      return res.status(400).send({
        message: "Problem in Updating Plan",
        success: false,
      });
    }
  } catch (error) {
    // Respond with success after all inserts
    console.error("Error inserting plans:", error);
    return res.status(500).send({
      message: "Error inserting plans into the database",
      success: false,
      error: error.message,
    });
  }
});

// router.get("/project/:id", async (req, res) => {
//   // console.log("Get Api Of project is hitted ");
//   const { id } = req.params;

//   try {
//     const [rows, fields] = await mySqlPool.query(
//       `SELECT * FROM project Where Owner=?`,
//       [id]
//     );

//     if (!rows) {
//       return res.status(400).send({
//         message: "Not Found",
//         success: false,
//         data: [],
//       });
//     }
//     // console.log(rows);
//     // console.log("data is Found and it is send to Frontend");

//     return res.status(200).send({
//       message: "Data is send",
//       data: rows,
//       success: true,
//     });
//   } catch (e) {
//     console.log("There is Problem in Gettind data of PRojects");
//     return res.status(500).send({
//       message: "Server Problem in project get Api",
//       success: false,
//       data: [],
//     });
//   }
// });

router.get("/purchaseOfPayment/:id", async (req, res) => {
  // console.log("Get Api Of project is hitted ");
  const { id } = req.params;

  try {
    const [rows, fields] = await mySqlPool.query(
      `SELECT * FROM perchaseorderpayment Where Purchase_Id=?`,
      [id]
    );

    if (!rows) {
      return res.status(400).send({
        message: "Server Problem in Fetching Payment Details ",
        success: false,
        data: [],
      });
    }
    // console.log(rows);
    // console.log("data is Found and it is send to Frontend");

    return res.status(200).send({
      message: "Data is send",
      data: rows,
      success: true,
    });
  } catch (e) {
    console.log("Server Problem in Fetching Payment Details " + e);
    return res.status(500).send({
      message: "Server Problem in Fetching Payment Details ",
      success: false,
      data: [],
    });
  }
});

router.get("/purchaseOfPayment-1/:id", async (req, res) => {
  // console.log("Get Api Of project is hitted ");
  const { id } = req.params;

  try {
    const [rows, fields] = await mySqlPool.query(
      `SELECT * FROM perchaseorderpayment Where PoP_OrgName=?`,
      [id]
    );

    if (!rows) {
      return res.status(400).send({
        message: "Server Problem in Fetching Payment Details ",
        success: false,
        data: [],
      });
    }
    // console.log(rows);
    // console.log("data is Found and it is send to Frontend");

    return res.status(200).send({
      message: "Data is send",
      data: rows,
      success: true,
    });
  } catch (e) {
    console.log("Server Problem in Fetching Payment Details " + e);
    return res.status(500).send({
      message: "Server Problem in Fetching Payment Details ",
      success: false,
      data: [],
    });
  }
});
router.get("/projectFilterId/:projectName", async (req, res) => {
  const { projectName } = req.params;

  try {
    // Query to fetch project data
    const [rows] = await mySqlPool.query(
      `
      SELECT 
        u.User_Id, 
        u.Name, 
        u.Email, 
        u.Password, 
        u.Designation, 
        u.Group1, 
        u.Phone, 
        u.Address, 
        u.Profile, 
        u.Project, 
        u.Country, 
        u.City, 
        u.Logo, 
        u.State, 
        u.Zip, 
        u.Created_Date, 
        u.Ip, 
        u.Status, 
        u.Organization_Name_User, 
        u.Age 
      FROM 
        project_user AS pu 
      JOIN 
        users AS u 
      ON 
        pu.User_Id = u.User_Id 
      WHERE 
        pu.Project_Name_User = ?
      `,
      [projectName]
    );

    // Handle no data found
    if (rows.length === 0) {
      return res.status(404).send({
        message: "No records found for the specified project.",
        success: false,
        data: [],
      });
    }

    // Successful response
    return res.status(200).send({
      message: "Data fetched successfully.",
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching project data:", error.message);
    return res.status(500).send({
      message: "Internal server error while fetching project data.",
      success: false,
      data: [],
    });
  }
});

router.get(
  "/propertyFromPuyrchase/:id",
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;

    try {
      // Query to fetch purchase and customer details based on the Main_Property_Id
      const rows = await propertyPurchasedByCustomer(id);
      if (rows.length === 0) {
        // No data found for the given property ID
        return res.status(404).json({
          message: "No property data found for the given ID",
          success: false,
          data: [],
        });
      }

      // Data found, sending response
      return res.status(200).json({
        message: "Data retrieved successfully",
        success: true,
        data: rows[0],
      });
    } catch (error) {
      console.error("Error fetching property data:", error.message);

      // Internal server error response
      return res.status(500).json({
        message: "Server error while retrieving property data",
        success: false,
        data: [],
      });
    }
  }
);

router.get("/leadsArrived/:flatId", authenticateToken, async (req, res) => {
  const { flatId } = req.params;

  try {
    // Query to fetch leads for the given flatId
    const rows = await leadsArrivedAt(flatId);

    // If no leads found
    if (rows.length === 0) {
      return res.status(404).send({
        message: "No leads found for the given property ID.",
        success: false,
        data: [],
      });
    }

    // Success response with leads data
    return res.status(200).send({
      message: "Data of leads interested in the property is fetched.",
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching leads data:", error);

    // Error response
    return res.status(500).send({
      message: "Error fetching data of leads interested in the property.",
      success: false,
      error: error.message,
    });
  }
});
router.get(
  "/leadsArrivedproperty/:pName/:orgName",
  authenticateToken,
  async (req, res) => {
    const { orgName, pName } = req.params;

    try {
      // Query to fetch leads for the given organization
      const rows = await leadsArrivedAtProperty(orgName, pName);

      if (!rows.length) {
        // Return early if no leads are found
        return res.status(404).json({
          message: "No leads found for the given organization.",
          success: false,
          data: {},
        });
      }

      // Create a mapping of Flat IDs with their count
      const flatCountMap = {};

      rows.forEach(({ Flat_Id }) => {
        flatCountMap[Flat_Id] = (flatCountMap[Flat_Id] || 0) + 1;
      });

      // Success response with flatCountMap
      return res.status(200).json({
        message: "Leads data fetched successfully.",
        success: true,
        data: flatCountMap, // Returning the map directly
      });
    } catch (error) {
      console.error("Error fetching leads data:", error.message);

      // Return a proper error response
      return res.status(500).json({
        message: "An error occurred while fetching leads data.",
        success: false,
        error: error.message,
      });
    }
  }
);

router.get("/propertysellByUser/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const rows = await customerSelectionForAuser(userId);
    if (rows.length > 0) {
      return res.status(200).send({
        message: "Data fetched successfully",
        success: true,
        data: rows,
      });
    } else {
      return res.status(200).send({
        message: "No data found",
        success: true,
        data: [],
      });
    }
  } catch (e) {
    console.error("Error fetching data:", e);
    return res.status(500).send({
      message: "An error occurred while fetching data",
      success: false,
      data: [],
      error: e.message,
    });
  }
});

router.get("/flatDataMap/:orgName", async (req, res) => {
  const { orgName } = req.params; // Access route parameter

  // Check if the orgName is provided
  if (!orgName) {
    return res.status(400).send({
      message: "Organization name not provided",
      success: false,
      data: [],
    });
  }

  try {
    // SQL query to fetch user IDs and names for the given organization name
    const [rows] = await mySqlPool.query(
      `SELECT Unit_No, Block, Flat_id FROM flat WHERE Org_Name = ?`,
      [orgName]
    );

    // Check if the query returned any results
    if (rows.length === 0) {
      return res.status(404).send({
        message: "No flats found for the given organization name",
        success: false,
        data: [],
      });
    }

    // Map the rows into a key-value object: { id1: { unitNo: "value", block: "value" }, ... }
    const flatDataMap = rows.reduce((acc, row) => {
      acc[row.Flat_id] = { unitNo: row.Unit_No, block: row.Block };
      return acc;
    }, {});

    return res.status(200).send({
      message: "Flat data retrieved successfully",
      success: true,
      data: flatDataMap, // Return the key-value pair object
    });
  } catch (error) {
    console.error("Error fetching flat data:", error);
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      data: {},
    });
  }
});

router.get("/catagoryMap/:orgName", async (req, res) => {
  const { orgName } = req.params; // Access route parameter

  // Check if the orgName is provided
  if (!orgName) {
    return res.status(400).send({
      message: "Organization name not provided",
      success: false,
      data: [],
    });
  }

  try {
    // SQL query to fetch user IDs and names for the given organization name
    const [rows] = await mySqlPool.query(
      `SELECT Catagory, Id FROM catagory WHERE Organization_Name_Catagories = ?`,
      [orgName]
    );

    // Check if the query returned any results
    if (rows.length === 0) {
      return res.status(404).send({
        message: "No flats found for the given organization name",
        success: false,
        data: [],
      });
    }

    // Map the rows into a key-value object: { id1: { unitNo: "value", block: "value" }, ... }
    const flatDataMap = rows.reduce((acc, row) => {
      acc[row?.Id] = row.Catagory;
      return acc;
    }, {});

    return res.status(200).send({
      message: "Catagory data retrieved successfully",
      success: true,
      data: flatDataMap, // Return the key-value pair object
    });
  } catch (error) {
    console.error("Error fetching flat data:", error);
    return res.status(500).send({
      message: "Internal  server error for Category Data",
      success: false,
      data: {},
    });
  }
});

router.get("/projectMap/:orgName", async (req, res) => {
  const { orgName } = req.params; // Access route parameter

  // Check if the orgName is provided
  if (!orgName) {
    return res.status(400).send({
      message: "Organization name not provided",
      success: false,
      data: [],
    });
  }

  try {
    // SQL query to fetch user IDs and names for the given organization name
    const [rows] = await mySqlPool.query(
      `SELECT Name, Project_Code FROM project WHERE Owner = ?`,
      [orgName]
    );

    // Check if the query returned any results
    if (rows.length === 0) {
      return res.status(404).send({
        message: "Project Map found for the given organization name",
        success: false,
        data: [],
      });
    }

    // Map the rows into a key-value object: { id1: { unitNo: "value", block: "value" }, ... }
    const flatDataMap = rows.reduce((acc, row) => {
      acc[row?.Project_Code] = row.Name;
      return acc;
    }, {});

    return res.status(200).send({
      message: "Project Map data retrieved successfully",
      success: true,
      data: flatDataMap, // Return the key-value pair object
    });
  } catch (error) {
    console.error("Error fetching flat data:", error);
    return res.status(500).send({
      message: "Internal  server error for Project Map Data",
      success: false,
      data: {},
    });
  }
});

router.get("/usersMainMap/:orgName", async (req, res) => {
  const { orgName } = req.params; // Access route parameter

  // Check if the orgName is provided
  if (!orgName) {
    return res.status(400).send({
      message: "Organization name not provided",
      success: false,
      data: [],
    });
  }

  try {
    // SQL query to fetch user IDs and names for the given organization name
    const [rows] = await mySqlPool.query(
      `SELECT Name, User_Id FROM users WHERE Organization_Name_User = ?`,
      [orgName]
    );

    // Check if the query returned any results
    if (rows.length === 0) {
      return res.status(404).send({
        message: "No users Found found for the given organization name",
        success: false,
        data: [],
      });
    }

    // Map the rows into a key-value object: { id1: { unitNo: "value", block: "value" }, ... }
    const flatDataMap = rows.reduce((acc, row) => {
      acc[row?.User_Id] = row.Name;
      return acc;
    }, {});

    return res.status(200).send({
      message: " data retrieved of users  successfully",
      success: true,
      data: flatDataMap, // Return the key-value pair object
    });
  } catch (error) {
    console.error("Error fetching flat data:", error);
    return res.status(500).send({
      message: "Internal  server error for Project Map Data",
      success: false,
      data: {},
    });
  }
});

router.get("/typedataMap/:orgName", async (req, res) => {
  const { orgName } = req.params; // Access route parameter

  // Check if the orgName is provided
  if (!orgName) {
    return res.status(400).send({
      message: "Organization name not provided",
      success: false,
      data: [],
    });
  }

  try {
    // SQL query to fetch user IDs and names for the given organization name
    const [rows] = await mySqlPool.query(
      `SELECT Type, id FROM innerprojectview WHERE Org_Name_Flat_Unit = ?`,
      [orgName]
    );

    // Check if the query returned any results
    if (rows.length === 0) {
      return res.status(404).send({
        message: "No Type  found for the given organization name",
        success: false,
        data: [],
      });
    }

    // Map the rows into a key-value object: { id1: { unitNo: "value", block: "value" }, ... }
    const flatDataMap = rows.reduce((acc, row) => {
      acc[row?.id] = row.Type;
      return acc;
    }, {});

    return res.status(200).send({
      message: " data retrieved of Types  successfully",
      success: true,
      data: flatDataMap, // Return the key-value pair object
    });
  } catch (error) {
    console.error("Error fetching flat data:", error);
    return res.status(500).send({
      message: "Internal  server error in Retriveing Type Data",
      success: false,
      data: {},
    });
  }
});

router.post("/leadsAssociateProject", async (req, res) => {
  const { ids } = req.body;

  // Check if the ids array is provided
  if (!ids || ids.length === 0) {
    return res.status(400).send({
      message: "No IDs provided",
      success: false,
      data: [],
    });
  }

  try {
    // SQL query to fetch organization names for the given IDs
    const [rows] = await mySqlPool.query(
      `SELECT Project_Name FROM leads WHERE Project_Name IN (?)`,
      [ids]
    );

    if (rows.length === 0) {
      return res.status(404).send({
        message: "leads not Associated With The Project",
        success: false,
        data: [],
      });
    }

    // Map the rows into a key-value object: { id1: "orgName1", id2: "orgName2", ... }
    const orgNameMap = rows.reduce((acc, row) => {
      acc[row.Project_Name] = true;
      return acc;
    }, {});

    return res.status(200).send({
      message: "leads project data retrieved successfully",
      success: true,
      data: orgNameMap, // Return as a key-value pair object
    });
  } catch (error) {
    console.error("Error fetching leads Associate with property:", error);
    return res.status(500).send({
      message: "Server error in fetching leads associated with project",
      success: false,
      data: {},
    });
  }
});

router.post("/leadsAssociateProperty", async (req, res) => {
  const { ids } = req.body;

  // Check if the ids array is provided
  if (!ids || ids.length === 0) {
    return res.status(400).send({
      message: "No IDs provided",
      success: false,
      data: [],
    });
  }

  try {
    // SQL query to fetch organization names for the given IDs
    const [rows] = await mySqlPool.query(
      `SELECT Flat_Id FROM leads WHERE Flat_Id IN (?)`,
      [ids]
    );

    if (rows.length === 0) {
      return res.status(404).send({
        message: "leads not Associated With The Property",
        success: false,
        data: [],
      });
    }

    // Map the rows into a key-value object: { id1: "orgName1", id2: "orgName2", ... }
    const orgNameMap = rows.reduce((acc, row) => {
      acc[row.Flat_Id] = true;
      return acc;
    }, {});

    return res.status(200).send({
      message: "leads property data retrieved successfully",
      success: true,
      data: orgNameMap, // Return as a key-value pair object
    });
  } catch (error) {
    console.error("Error fetching leads Associate with property:", error);
    return res.status(500).send({
      message: "Server error in fetching leads associated with project",
      success: false,
      data: {},
    });
  }
});

router.post("/categoryMapData", async (req, res) => {
  const { ids } = req.body;

  // Check if the ids array is provided
  if (!ids || ids.length === 0) {
    return res.status(400).send({
      message: "No IDs provided",
      success: false,
      data: [],
    });
  }

  try {
    // SQL query to fetch organization names for the given IDs
    const [rows] = await mySqlPool.query(
      `SELECT Id, Catagory FROM catagory WHERE Id IN (?)`,
      [ids]
    );

    if (rows.length === 0) {
      return res.status(404).send({
        message: "Organizations not found",
        success: false,
        data: [],
      });
    }

    // Map the rows into a key-value object: { id1: "orgName1", id2: "orgName2", ... }
    const orgNameMap = rows.reduce((acc, row) => {
      acc[row.Id] = row.Catagory;
      return acc;
    }, {});

    return res.status(200).send({
      message: "Organization data retrieved successfully",
      success: true,
      data: orgNameMap, // Return as a key-value pair object
    });
  } catch (error) {
    console.error("Error fetching organization names:", error);
    return res.status(500).send({
      message: "Server error in Fetching Organization Names",
      success: false,
      data: {},
    });
  }
});

module.exports = router;
