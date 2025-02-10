const express = require("express");

const mySqlPool = require("../../config/db.js");
// const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const {
  addDesignation,
  associateUserWithDesignation,
  insertGroup,

  associateUserWithGroup,
  groupsForUsers,
} = require("../../Controllers/GroupsController.js");
const {
  designationFetch,
  designationCheck,
  designationInsert,
  designationUpdate,
  designationDelete,
} = require("../../Controllers/SettingsFetcher/DesignationFetcher.js");
const {
  groupFetcher,
  checkGroupData,
  groupInsertForAdmin,
  updateGroup,
  deleteGroup,
} = require("../../Controllers/SettingsFetcher/GroupFetcher.js");
const {
  categorycheck,
  categoryUpdate,
  deleteCategories,
} = require("../../Controllers/SettingsFetcher/CategoryFetcher.js");
const { authenticateToken } = require("../../Middlewares/RoutesAuth.js");
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

router.post("/groupinsertion", authenticateToken, async (req, res) => {
  const permission1 = req.body.permission.toString();
  const { mainOrgName, name } = req.body;

  try {
    const rows = await checkGroupData(mainOrgName, name);
    if (rows.length > 0) {
      return res.status(400).send({
        message: "Group Already Pressent For this Organization",
        success: false,
      });
    }
    const data = await groupInsertForAdmin(mainOrgName, name, permission1);

    return res.status(200).send({
      message: "Data Of Group is Inserted To The DataBases",
      sucess: true,
    });
  } catch (e) {
    console.log(
      "There is Some Problem In insertion Of data to the database " + e
    );
    return res.status(400).send({
      message: "No data of Group is Inserted",
      sucess: false,
      error: e,
    });
  }
});

router.get("/groupinsertion/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const rows = await groupFetcher(id);

    if (rows.length > 0) {
      return res.status(200).send({
        message: "Group is sent and fetched",
        success: true,
        data: rows,
      });
    } else {
      return res.status(404).send({
        message: "No groups found for the given organization email",
        success: false,
        data: [],
      });
    }
  } catch (e) {
    console.error("Error fetching group data:", e);
    return res.status(500).send({
      message: "Error fetching group data",
      success: false,
      error: e.message,
    });
  }
});

router.delete("/groupinsertion", async (req, res) => {
  try {
    const [result] = await mySqlPool.query(
      `DELETE FROM \`groups\` WHERE \`Name\` = ?`,
      [req.body.name]
    );

    if (result.affectedRows > 0) {
      return res.status(200).send({
        message: "Group data deleted successfully",
        success: true,
      });
    } else {
      return res.status(404).send({
        message: "No group found with the given name",
        success: false,
      });
    }
  } catch (e) {
    console.log("Error deleting group data:", e);

    return res.status(500).send({
      message: "Error deleting group data",
      success: false,
      error: e.message,
    });
  }
});

const userGroupMiddleware = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [rows] = await mySqlPool.query(
      `SELECT Group1 FROM users WHERE Email = ?`,
      [id]
    );

    if (rows.length > 0) {
      req.userGroup = rows[0].Group1;
      return next();
    } else {
      return res.status(400).send({
        message: "No such group is assigned",
        success: false,
      });
    }
  } catch (e) {
    console.error("There is an error in fetching the user group:", e);
    return res.status(500).send({
      message: "API call failed",
      success: false,
    });
  }
};

// {This is For User Details To track manager}
router.get("/userGroup1/:id/:id2", async (req, res) => {
  const { id, id2 } = req.params;

  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM \`groups\` WHERE \`id\` = ? AND \`Orgnization_Name\` = ?`,
      [id, id2]
    );

    if (rows.length > 0) {
      return res.status(200).json({
        message: "Data fetched successfully",
        success: true,
        data: rows,
      });
    }

    // No rows found
    return res.status(404).json({
      message: "No group found for the given criteria",
      success: false,
      data: [],
    });
  } catch (error) {
    console.error("Error fetching user group data:", error.message);
    return res.status(500).json({
      message: "An error occurred while fetching user group data",
      success: false,
      error: error.message,
    });
  }
});

// Designation

router.post("/designations", authenticateToken, async (req, res) => {
  const { name, MainOrgName } = req.body;

  // Validate the input
  if (!name && !MainOrgName) {
    return res.status(400).json({ error: "Designation name is required" });
  }

  try {
    const rows = await designationCheck(MainOrgName, name);
    if (rows.length > 0) {
      return res.status(400).send({
        message: "Designation Already Pressent For this Organization",
        success: false,
      });
    }

    const result = await designationInsert(name, MainOrgName);

    return res.status(201).json({
      message: "Designation added successfully",
      designationId: result.insertId,
    });
  } catch (err) {
    console.error("Error inserting data:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

router.get("/designations/:orgName", authenticateToken, async (req, res) => {
  const { orgName } = req.params;
  try {
    const rows = await designationFetch(orgName);

    return res.status(200).send({
      data: rows,
      message: "Data of Designation is Fetched SucessFully",
      success: true,
    });
  } catch (err) {
    console.error("Error fetching data:", err);
    return res.status(500).send({
      data: [],
      message: "Data of Designation is not Fetched SucessFully",
      success: false,
    });
  }
});

router.delete("/designations/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await designationDelete(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Designation not found" });
    }

    return res
      .status(200)
      .json({ message: "Designation deleted successfully" });
  } catch (err) {
    console.error("Error deleting designation:", err);
    return res
      .status(500)
      .json({ error: "Database error while deleting the designation " });
  }
});

router.patch("/designations/:id", authenticateToken, async (req, res) => {
  const { id } = req.params; // Extract the ID from the route params
  const { name, MainOrgName, oldName } = req.body; // Extract new data from the request body

  // SQL query to update the designation

  try {
    const rows = await designationCheck(MainOrgName, name);
    if (rows.length > 0 && oldName !== name) {
      return res.status(400).send({
        message: "Designation Already Pressent For this Organization",
        success: false,
      });
    }
    // Execute the query using async/await
    const result = await designationUpdate(name, MainOrgName, id);

    if (result.affectedRows === 0) {
      // If no rows were affected, the designation with the given ID wasn't found
      return res.status(404).json({ message: "Designation not found" });
    }

    // If the update was successful, return a success response
    return res
      .status(200)
      .json({ message: "Designation updated successfully" });
  } catch (error) {
    // Catch any errors during the query execution
    console.error("Error updating designation:", error);
    return res.status(500).json({ message: "Database error" });
  }
});

router.put("/groupupdate", authenticateToken, async (req, res) => {
  const { id, name, permission, mainOrgName, oldName } = req.body;

  try {
    const rows = await checkGroupData(mainOrgName, name);
    if (rows.length > 0 && oldName !== name) {
      return res.status(400).send({
        message: "Group Already Pressent For this Organization",
        success: false,
      });
    }
    const result = await updateGroup(id, name, permission, mainOrgName);

    if (result.affectedRows > 0) {
      return res.status(200).send({
        message: "Group updated successfully",
        success: true,
      });
    } else {
      return res.status(404).send({
        message: "No group found with the given ID",
        success: false,
      });
    }
  } catch (e) {
    console.log("Error updating group data:", e);

    return res.status(500).send({
      message: "Error updating group data ",
      success: false,
      error: e.message,
    });
  }
});
router.delete("/groupdelete", authenticateToken, async (req, res) => {
  // console.log("Attempting to delete group...");

  const { id } = req.body;

  try {
    const result = await deleteGroup(id);

    if (result.affectedRows > 0) {
      return res.status(200).send({
        message: "Group deleted successfully",
        success: true,
      });
    } else {
      return res.status(404).send({
        message: "No group found with the given ID",
        success: false,
      });
    }
  } catch (e) {
    console.log("Error deleting group data:", e);

    return res.status(500).send({
      message: "Error deleting group data",
      success: false,
      error: e.message,
    });
  }
});

router.put("/updateCategory", authenticateToken, async (req, res) => {
  const { id, category, MainOrgName, oldCatagory } = req.body;

  if (!id || !category || !MainOrgName) {
    return res.status(400).send({
      message:
        "Missing required fields: id, category, organizationNameCategory",
      success: false,
    });
  }
  try {
    const rows = await categorycheck(category, MainOrgName);
    if (rows.length > 0 && oldCatagory !== category) {
      return res.status(200).send({
        message: "Catagory Already Present For This Organization ",
        success: false,
      });
    }

    const result = await categoryUpdate(category, MainOrgName, id);

    if (result.affectedRows > 0) {
      return res.status(200).send({
        message: "Category updated successfully",
        success: true,
      });
    } else {
      return res.status(404).send({
        message: "Category not found",
        success: false,
      });
    }
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).send({
      message: "Error updating category",
      success: false,
      error: error.message,
    });
  }
});
router.delete("/deleteCategory/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).send({
      message: "Category ID is required",
      success: false,
    });
  }

  try {
    const result = await deleteCategories(id);

    if (result.affectedRows > 0) {
      return res.status(200).send({
        message: "Category deleted successfully",
        success: true,
      });
    } else {
      return res.status(404).send({
        message: "Category not found",
        success: false,
      });
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).send({
      message: "Error deleting category",
      success: false,
      error: error.message,
    });
  }
});

router.get("/groupsById/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Enclose `groups` table name in backticks to avoid issues on macOS/Linux
    const [rows] = await mySqlPool.query(
      "SELECT * FROM `groups` WHERE id = ?",
      [id]
    );

    // Check if data was found for the provided ID
    if (rows.length === 0) {
      return res.status(404).send({
        data: null,
        message: "Group not found with the provided ID",
        success: false,
      });
    }

    // Send the result if data is found
    return res.status(200).send({
      data: rows[0],
      message: "Group data fetched successfully",
      success: true,
    });
  } catch (err) {
    console.error("Error fetching group data:", err);
    return res.status(500).send({
      data: null,
      message: "An error occurred while fetching the group data",
      success: false,
    });
  }
});

// Middleware to Insert Group
// const middlewareToInsertGroup = async (req, res, next) => {
//   const { mainOrgName, name, permission, userId } = req.body;

//   if (!mainOrgName || !name || !permission || !userId) {
//     return res.status(400).send({
//       message:
//         "Missing required fields: mainOrgName, name, permission, or userId.",
//       success: false,
//     });
//   }

//   try {
//     // Check if the group already exists
//     const [existingGroup] = await mySqlPool.query(
//       `SELECT * FROM \`groups\` WHERE Orgnization_Name = ? AND Name = ?`,
//       [mainOrgName, name]
//     );

//     if (existingGroup.length > 0) {
//       return res.status(400).send({
//         message: "Group already exists for this organization.",
//         success: false,
//       });
//     }

//     // Insert the new group
//     const [insertResult] = await mySqlPool.query(
//       `INSERT INTO \`groups\` (Name, Permission, Orgnization_Name) VALUES (?, ?, ?)`,
//       [name, permission.toString(), mainOrgName]
//     );

//     // Attach the newly created group ID to the request object
//     req.groupId = insertResult.insertId;
//     next();
//   } catch (error) {
//     console.error("Error inserting group into database:", error.message);
//     return res.status(500).send({
//       message: "Error inserting group into the database.",
//       success: false,
//       error: error.message,
//     });
//   }
// };

// Route to associate a user with a group
router.post("/groupinsertionUser", authenticateToken, async (req, res) => {
  let connection;

  try {
    // Step 1: Start Transaction
    connection = await mySqlPool.getConnection();
    await connection.beginTransaction();
    console.log("Transaction started.");

    // Step 2: Add Group
    const groupData = await insertGroup(req, connection);
    req.groupId = groupData.groupId;

    // Step 3: Associate User with Group
    await associateUserWithGroup(req, connection);

    // Step 4: Commit Transaction
    await connection.commit();
    console.log("Transaction committed successfully.");

    // Final Response
    return res.status(200).send({
      message: "Group creation and user association processed successfully.",
      success: true,
    });
  } catch (error) {
    // Rollback Transaction on Error
    if (connection) {
      await connection.rollback();
      console.error("Transaction rolled back due to error:", error.message);
    }
    return res.status(500).send({
      message:
        error.message || "An error occurred while processing the request.",
      success: false,
    });
  } finally {
    // Release the Connection
    if (connection) connection.release();
  }
});

router.get(
  "/groupinsertionFetchUser/:id",
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
      const rows = await groupsForUsers(id);

      // Check if any groups are associated with the user
      if (rows.length > 0) {
        return res.status(200).send({
          message: "Groups fetched successfully.",
          success: true,
          data: rows,
        });
      } else {
        return res.status(404).send({
          message: "No groups found for the given user.",
          success: false,
          data: [],
        });
      }
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
// const designationMiddleWareUser = async (req, res, next) => {
//   const { name, MainOrgName } = req.body;

//   // Validate input
//   if (!name || !MainOrgName) {
//     return res.status(400).json({
//       message: "Missing required fields: 'name' and 'MainOrgName'.",
//       success: false,
//     });
//   }

//   try {
//     // Check if the designation already exists
//     const [existingRows] = await mySqlPool.query(
//       `SELECT * FROM designations WHERE Organization_Name = ? AND Name = ?`,
//       [MainOrgName, name]
//     );

//     if (existingRows.length > 0) {
//       return res.status(409).json({
//         message: "Designation already exists for this organization.",
//         success: false,
//       });
//     }

//     // Insert the new designation
//     const [insertResult] = await mySqlPool.query(
//       `INSERT INTO designations (Name, Organization_Name) VALUES (?, ?)`,
//       [name, MainOrgName]
//     );

//     // Attach the inserted designation ID to the request
//     req.desigId = insertResult.insertId;
//     next();
//   } catch (error) {
//     console.error("Error in designation middleware:", error.message);
//     return res.status(500).json({
//       message: "An error occurred while processing the designation.",
//       success: false,
//       error: error.message,
//     });
//   }
// };

// designationHelperUser,
//   insertInUserADesig,

router.post("/designationsUser", authenticateToken, async (req, res) => {
  let connection;

  try {
    // Step 1: Get a connection and start a transaction
    connection = await mySqlPool.getConnection();
    await connection.beginTransaction();
    console.log("Transaction started.");

    // Step 2: Add Designation Data
    const designationData = await addDesignation(req, connection); // Add designation
    req.desigId = designationData.designationId; // Attach designation ID for subsequent processing

    // Step 3: Associate User with Designation
    await associateUserWithDesignation(req, connection);

    // Step 4: Commit Transaction
    await connection.commit();
    console.log("Transaction committed successfully.");

    // Success Response
    return res.status(200).send({
      message: "Designation and user association processed successfully.",
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
        err.message ||
        "An error occurred while processing the designation and user association.",
      success: false,
    });
  } finally {
    // Release Connection
    if (connection) connection.release();
  }
});
module.exports = router;
