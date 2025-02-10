const express = require("express");

const mySqlPool = require("../../config/db.js");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  addCategory,
  associateUserWithCategory,
} = require("../../Controllers/SettingsController.js");
const {
  categoryFetch,
  fetchCategoryForUser,
  categorycheck,
  CategoryInsertForAdmin,
} = require("../../Controllers/SettingsFetcher/CategoryFetcher.js");
const {
  designationFetchUser,
} = require("../../Controllers/SettingsFetcher/DesignationFetcher.js");
const { authenticateToken } = require("../../Middlewares/RoutesAuth.js");
const {
  categoryProject,
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

router.post("/category", authenticateToken, async (req, res) => {
  const { name, MainOrgName } = req.body;

  try {
    // Check if the category already exists for the specified organization
    const existingRows = await categorycheck(name, MainOrgName);

    if (existingRows.length > 0) {
      return res.status(409).json({
        message: "Category already exists for this organization",
        success: false,
      });
    }

    // Insert new category if it doesn't exist
    const insertResult = await CategoryInsertForAdmin(name, MainOrgName);

    return res.status(201).json({
      message: "Category successfully inserted",
      success: true,
      categoryId: insertResult.insertId, // Include inserted ID for reference if needed
    });
  } catch (error) {
    console.error("Error inserting category:", error);
    return res.status(500).json({
      message: "Server error: unable to insert category",
      success: false,
    });
  }
});

router.get("/catagory/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await categoryFetch(id);
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

router.get("/catagoryById/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM catagory WHERE Id = ?`,
      [id]
    );

    if (rows.length > 0) {
      return res.status(200).send({
        message: "Data is fetched from Category",
        success: true,
        data: rows[0],
      });
    } else {
      return res.status(404).send({
        message: "No data found for the provided ID",
        success: false,
        data: [],
      });
    }
  } catch (e) {
    console.error("Error fetching category data:", e);

    return res.status(500).send({
      message: "Error fetching category data",
      success: false,
      data: [],
    });
  }
});

router.get(
  "/catagoryproject/:projectId",
  authenticateToken,
  async (req, res) => {
    const { projectId } = req.params;

    try {
      // Query to fetch category data based on the project ID and organization ID
      const rows = await categoryProject(projectId);
      return res.status(200).send({
        message: "Category data fetched successfully for the project",
        success: true,
        data: rows,
      });
    } catch (e) {
      console.log("Error in fetching category project data: " + e);

      return res.status(500).send({
        message: "Failed to fetch category data for the project",
        success: false,
      });
    }
  }
);

router.get("/getDesignation/:id", async (req, res) => {
  const { id } = req.params; // Extract the id from the request parameters

  try {
    // Query the designation table using the id
    const designationQuery = `SELECT * FROM designations WHERE id = ?`;

    // Execute the query
    const [rows] = await mySqlPool.query(designationQuery, [id]);

    // If no designation is found
    if (rows.length === 0) {
      return res.status(404).json({ message: "Designation not found" });
    }

    return res.status(200).send({
      message: "Desigantion fetched SucessFully",
      success: true,
      data: rows[0],
    });
  } catch (e) {
    console.error(e.message); // Log the error for debugging
    return res
      .status(500)
      .json({ message: "An error occurred while fetching designation data" });
  }
});

router.get("/getGroups/:id", async (req, res) => {
  const { id } = req.params; // Extract the id from the request parameters

  try {
    // Query the designation table using the id
    const designationQuery = `SELECT * FROM groups WHERE id = ?`;

    // Execute the query
    const [rows] = await mySqlPool.query(designationQuery, [id]);

    // If no designation is found
    if (rows.length === 0) {
      return res.status(404).json({ message: "Designation not found" });
    }

    return res.status(200).send({
      message: "Groups fetched SucessFully",
      success: true,
      data: rows[0],
    });
  } catch (e) {
    console.error(e.message); // Log the error for debugging
    return res
      .status(500)
      .json({ message: "An error occurred while fetching Groups data" });
  }
});

router.post("/designationsGet", async (req, res) => {
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
    // SQL query to fetch designation names for the given IDs
    const [rows] = await mySqlPool.query(
      `SELECT id, Name FROM designations WHERE id IN (?)`,
      [ids]
    );

    if (rows.length === 0) {
      return res.status(404).send({
        message: "Designations not found",
        success: false,
        data: {},
      });
    }

    // Map the rows into a key-value object: { id1: "designationName1", id2: "designationName2", ... }
    const designationNameMap = rows.reduce((acc, row) => {
      acc[row.id] = row.Name; // Assuming `Name` is the column name for designation name
      return acc;
    }, {});

    return res.status(200).send({
      message: "Designation data retrieved successfully",
      success: true,
      data: designationNameMap, // Return as a key-value pair object
    });
  } catch (error) {
    console.error("Error fetching designation names:", error);
    return res.status(500).send({
      message: "Server error",
      success: false,
      data: {},
    });
  }
});

router.post("/designationsGetAllDesig/:orgName", async (req, res) => {
  const { ids } = req.body; // Destructure ids from request body
  const { orgName } = req.params; // Get orgName from the URL parameter

  try {
    // SQL query to fetch designation names for the given organization
    // If `ids` are provided, filter by those IDs; otherwise, fetch all designations
    const query =
      ids && ids.length > 0
        ? `SELECT id, Name FROM designations WHERE Organization_Name = ? AND id IN (?)`
        : `SELECT id, Name FROM designations WHERE Organization_Name = ?`;

    const params = ids && ids.length > 0 ? [orgName, ids] : [orgName];

    const [rows] = await mySqlPool.query(query, params);

    if (rows.length === 0) {
      return res.status(200).send({
        message: "No designations found for the given criteria",
        success: true,
        data: {}, // Return an empty object for no results
      });
    }

    // Map the rows into a key-value object: { id1: "designationName1", id2: "designationName2", ... }
    const designationNameMap = rows.reduce((acc, row) => {
      acc[row.id] = row.Name; // Assuming `Name` is the column name for designation name
      return acc;
    }, {});

    return res.status(200).send({
      message: "Designation data retrieved successfully",
      success: true,
      data: designationNameMap, // Return as a key-value pair object
    });
  } catch (error) {
    console.error("Error fetching designation names:", error);
    return res.status(500).send({
      message: "Server error",
      success: false,
      data: {},
    });
  }
});

const middleWareCategoryUser = async (req, res, next) => {
  const { name, MainOrgName } = req.body;

  if (!name || !MainOrgName) {
    return res.status(400).json({
      message: "Category name and organization name are required.",
      success: false,
    });
  }

  try {
    // Check if the category already exists for the organization
    const [existingRows] = await mySqlPool.query(
      `SELECT * FROM catagory WHERE Catagory = ? AND Organization_Name_Catagories = ?`,
      [name, MainOrgName]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({
        message: "Category already exists for this organization.",
        success: false,
      });
    }

    // Insert new category
    const [insertResult] = await mySqlPool.query(
      `INSERT INTO catagory (Catagory, Organization_Name_Catagories) VALUES (?, ?)`,
      [name, MainOrgName]
    );

    // Pass the newly inserted category ID to the next middleware
    req.categoryId = insertResult.insertId;
    next();
  } catch (error) {
    console.error("Error inserting category:", error);
    return res.status(500).json({
      message: "Server error: Unable to insert category.",
      success: false,
      error: error.message,
    });
  }
};

// CategoryUserHelper,
// insertUserCategory,
router.post("/categoryUser", authenticateToken, async (req, res) => {
  let connection;

  try {
    // Step 1: Get a connection and start a transaction
    connection = await mySqlPool.getConnection();
    await connection.beginTransaction();
    console.log("Transaction started.");

    // Step 2: Add Category Data
    const categoryData = await addCategory(req, connection); // Insert category
    req.categoryId = categoryData.categoryId; // Attach category ID for further processing

    // Step 3: Associate User with Category
    await associateUserWithCategory(req, connection);

    // Step 4: Commit Transaction
    await connection.commit();
    console.log("Transaction committed successfully.");

    // Success Response
    return res.status(200).send({
      message: "Category and user association processed successfully.",
      success: true,
    });
  } catch (err) {
    // Rollback Transaction on Error
    if (connection) {
      await connection.rollback();
      console.error("Transaction rolled back due to error:", err.message);
    }
    return res.status(500).send({
      message:
        err.message || "Failed to process category and user association.",
      success: false,
    });
  } finally {
    // Release Connection
    if (connection) connection.release();
  }
});

router.get(
  "/categoryinsertionFetchUser/:id",
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;

    // Validate input
    if (!id) {
      return res.status(400).send({
        message: "User ID is required.",
        success: false,
      });
    }

    try {
      // Query to fetch group details for the given user ID
      const rows = await fetchCategoryForUser(id);

      // Check if any groups are associated with the user

      return res.status(200).send({
        message: "Groups fetched successfully.",
        success: true,
        data: rows,
      });
    } catch (error) {
      console.error("Error fetching group data:", error.message);
      return res.status(500).send({
        message: "An error occurred while fetching group data.",
        success: false,
        error: error.message,
      });
    }
  }
);

router.get("/designationsUser/:id", async (req, res) => {
  const { id } = req.params;

  // Validate input
  if (!id) {
    return res.status(400).send({
      message: "User ID is required.",
      success: false,
    });
  }

  try {
    // Query to fetch group details for the given user ID
    const rows = await designationFetchUser(id);

    // Check if any groups are associated with the user

    return res.status(200).send({
      message: "Groups fetched successfully.",
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching group data for a user:", error.message);
    return res.status(500).send({
      message: "An error occurred while fetching group data dor a User.",
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
