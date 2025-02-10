const express = require("express");

const mySqlPool = require("../../config/db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { userDetailsPage } = require("../../Middlewares/UserMiddleWare.js");

const { generateRandomNumber } = require("../../Services/FourDigitOtp.js");

const {
  addDesignationAndEmployee,
  addUserData,
  assignProjects,
  sendMail,
  userUpdateMain,
  userUpdateEmp,
  addingUpdatedUser,
} = require("../../Controllers/Usercontroller");
const {
  userFetcherByEmail,
  usersByOrganization,
  userDelete,
  userDataFetch,
  userById,
  groupFetcherForUser,
  reportingManager,
  getProjectsByUserId,
  getUserIdsByProjectNames,
  getUserDetailsByIds,
  salesTagetByUser,
  averageDealClosureTime,
  revenueInPipeLine,
  UserWorkingOnProjects,
  userByIdNormal,
} = require("../../Controllers/UserFetcher/UserFetcher.js");
const { authenticateToken } = require("../../Middlewares/RoutesAuth.js");
const {
  projectReporting,
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

router.put(
  "/profile/uploadUser/:userId", // Fixed the route by adding a `/` before `:userId`
  upload.single("profileImage"),
  async (req, res) => {
    const userId = req.params.userId;

    try {
      // If no file is uploaded
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const profilePicture = req.file.filename; // get filename
      const profileImagePath = `${profilePicture}`;

      // SQL query to update the profile picture path in the users table
      const updateQuery = "UPDATE users SET Profile = ? WHERE Id = ?";

      // Execute query with async/await
      const result = await mySqlPool.query(updateQuery, [
        profileImagePath,
        userId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json({
        message: "Profile Picture Updated Successfully",
        profileImagePath,
      });
    } catch (err) {
      console.error("Error processing profile upload", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.put(
  "/profile/uploadOrg/:userId", // Fixed the route by adding a `/` before `:userId`
  upload.single("profileImage"),
  async (req, res) => {
    const userId = req.params.userId;

    try {
      // If no file is uploaded
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const profilePicture = req.file.filename; // get filename
      const profileImagePath = `${profilePicture}`;

      // SQL query to update the profile picture path in the users table
      const updateQuery = "UPDATE users SET Profile = ? WHERE User_Id = ?";

      // Execute query with async/await
      const result = await mySqlPool.query(updateQuery, [
        profileImagePath,
        userId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Users not found" });
      }

      return res.status(200).json({
        message: "Profile Picture Updated Successfully",
        profileImagePath,
      });
    } catch (err) {
      console.error("Error processing profile upload", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.put(
  "/profile/uploadAdmin/:userId", // Fixed the route by adding a `/` before `:userId`
  upload.single("profileImage"),
  async (req, res) => {
    const userId = req.params.userId;

    try {
      // If no file is uploaded
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const profilePicture = req.file.filename; // get filename
      const profileImagePath = `${profilePicture}`;

      // SQL query to update the profile picture path in the users table
      const updateQuery = "UPDATE admin SET Profile = ? WHERE Email = ?";

      // Execute query with async/await
      const result = await mySqlPool.query(updateQuery, [
        profileImagePath,
        userId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Users not found" });
      }

      return res.status(200).json({
        message: "Profile Picture Updated Successfully",
        profileImagePath,
      });
    } catch (err) {
      console.error("Error processing profile upload", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.delete("/profile/uploadOrg/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Step 1: Get the current profile picture path from the database
    const selectQuery = "SELECT Profile FROM organization WHERE id = ?";
    const user = await mySqlPool.query(selectQuery, [userId]);

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const profilePicture = user[0][0]?.Profile;

    // Step 2: Check if the profile picture exists on the server
    if (profilePicture) {
      // Fixing the path issue by ensuring it's pointing to Public/Image folder
      const profileImagePath = path.join(
        __dirname,
        "../../Public/Image",
        path.basename(profilePicture)
      );

      if (fs.existsSync(profileImagePath)) {
        // Step 3: Delete the file from the server
        fs.unlinkSync(profileImagePath);
      } else {
        console.log("File does not exist on server:", profileImagePath);
      }
    }

    // Step 4: Update the database to remove the profile picture reference (set it to NULL or empty string)
    const updateQuery = "UPDATE organization SET Profile = NULL WHERE id = ?";
    await mySqlPool.query(updateQuery, [userId]);

    return res
      .status(200)
      .json({ message: "Profile Picture Deleted Successfully" });
  } catch (err) {
    console.error("Error deleting profile picture", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/profile/uploadAdmin/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Step 1: Get the current profile picture path from the database
    const selectQuery = "SELECT Profile FROM admin WHERE Email = ?";
    const user = await mySqlPool.query(selectQuery, [userId]);

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const profilePicture = user[0][0]?.Profile;

    // Step 2: Check if the profile picture exists on the server
    if (profilePicture) {
      // Fixing the path issue by ensuring it's pointing to Public/Image folder
      const profileImagePath = path.join(
        __dirname,
        "../../Public/Image",
        path.basename(profilePicture)
      );

      if (fs.existsSync(profileImagePath)) {
        // Step 3: Delete the file from the server
        fs.unlinkSync(profileImagePath);
        console.log("File deleted successfully:", profileImagePath);
      } else {
        console.log("File does not exist on server:", profileImagePath);
      }
    }

    // Step 4: Update the database to remove the profile picture reference (set it to NULL or empty string)
    const updateQuery = "UPDATE admin SET Profile = NULL WHERE Email = ?";
    await mySqlPool.query(updateQuery, [userId]);

    return res
      .status(200)
      .json({ message: "Profile Picture Deleted Successfully" });
  } catch (err) {
    console.error("Error deleting profile picture", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/profile/uploadUser/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Step 1: Get the current profile picture path from the database
    const selectQuery = "SELECT Profile FROM users WHERE User_Id = ?";
    const user = await mySqlPool.query(selectQuery, [userId]);

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const profilePicture = user[0][0]?.Profile;

    // Step 2: Check if the profile picture exists on the server
    if (profilePicture) {
      // Fixing the path issue by ensuring it's pointing to Public/Image folder
      const profileImagePath = path.join(
        __dirname,
        "../../Public/Image",
        path.basename(profilePicture)
      );

      if (fs.existsSync(profileImagePath)) {
        // Step 3: Delete the file from the server
        fs.unlinkSync(profileImagePath);
        console.log("File deleted successfully:", profileImagePath);
      } else {
        console.log("File does not exist on server:", profileImagePath);
      }
    }

    // Step 4: Update the database to remove the profile picture reference (set it to NULL or empty string)
    const updateQuery = "UPDATE users SET Profile = NULL WHERE User_Id = ?";
    await mySqlPool.query(updateQuery, [userId]);

    return res
      .status(200)
      .json({ message: "Profile Picture Deleted Successfully" });
  } catch (err) {
    console.error("Error deleting profile picture", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/updatePassword", async (req, res) => {
  const { userEmail, oldPassword, newPassword } = req.body;

  const connection = await mySqlPool.getConnection();
  await connection.beginTransaction();

  try {
    // Step 1: Retrieve the current password from the database
    const selectQuery = "SELECT Password FROM employee_info WHERE Email = ?";
    const [rows] = await connection.query(selectQuery, [userEmail]);

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "User not found" });
    }

    const storedPassword = rows[0].Password;

    console.log(oldPassword);
    console.log(storedPassword);

    const isMatch = await bcrypt.compare(oldPassword, storedPassword);
    console.log(isMatch);

    // Step 2: Validate the old password
    if (!isMatch) {
      await connection.rollback();
      return res.status(400).json({ error: "Invalid old password" });
    }

    // Step 3: Update the password in both tables

    const hashedPassword = await bcrypt.hash(newPassword, 10); // Salt rounds: 10

    const updateEmployeeInfoQuery =
      "UPDATE employee_info SET Password = ? WHERE Email = ?";
    const updateUsersQuery = "UPDATE users SET Password = ? WHERE Email = ?";

    await connection.query(updateEmployeeInfoQuery, [
      hashedPassword,
      userEmail,
    ]);
    await connection.query(updateUsersQuery, [hashedPassword, userEmail]);

    await connection.commit();
    return res.status(200).json({ message: "Password updated successfully!" });
  } catch (err) {
    await connection.rollback();
    console.error("Error updating password:", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    connection.release();
  }
});

router.get("/usersData/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Corrected SQL query with proper JOIN and WHERE clauses
    const rows = await userDataFetch(id);

    // Check if data exists and send appropriate response
    if (rows.length > 0) {
      return res.status(200).send({
        message: "Successfully retrieved user data.",
        success: true,
        data: rows,
      });
    }

    return res.status(404).send({
      message: "No users found for the given organization ",
      success: false,
      data: [],
    });
  } catch (e) {
    console.error("Error fetching user data:", e.message);
    return res.status(500).send({
      message: "Internal Server Error. Could not retrieve user data.",
      success: false,
      error: e.message,
    });
  }
});

// const userMiddleWare1 = async (req, res, next) => {
//   try {
//     // Ensure we await the result of the query
//     const [rows] = await mySqlPool.query(
//       `SELECT Name FROM designations WHERE id = ? AND Organization_Name = ?`,
//       [req.body.designation, req.body.orgName]
//     );

//     // Check if the designation was found
//     if (rows.length === 0) {
//       return res.status(400).send({
//         message: "No designation found",
//         success: false,
//       });
//     }

//     const newDesignation = rows[0]?.Name; // Assuming 'Name' is the column storing the designation

//     // Insert employee data using the retrieved designation
//     await mySqlPool.query(
//       `INSERT INTO employee_info (Name, Email, Password, Role) VALUES (?, ?, ?, ?)`,
//       [req.body.name, req.body.email, req.body.password, newDesignation]
//     );

//     next();
//   } catch (err) {
//     console.error("Error in userMiddleWare1:", err.message);
//     return res.status(500).send({
//       message: "Failed to insert employee data.",
//       success: false,
//     });
//   }
// };

// // Middleware 2: User data insertion
// const userMiddleWare2 = async (req, res, next) => {
//   try {
//     // Check if user with the same email and organization already exists
//     const [existingUsers] = await mySqlPool.query(
//       `SELECT * FROM users WHERE Email = ? `,
//       [req.body.email]
//     );
//     const [rows] = await mySqlPool.query(
//       `SELECT * from leads where Email_Address=? AND Organization_Name_Leads=?`,
//       [req.body.email, req.body.orgName]
//     );

//     if (existingUsers.length > 0 || rows.length > 0) {
//       return res.status(409).send({
//         message: "User already exists ",
//         success: false,
//       });
//     }

//     const clientIp = req.ip;
//     const dateString = new Date().toLocaleDateString();
//     const profilePicture = req.file?.filename || ""; // Set to an empty string if no file uploaded

//     // Parse projectTypes and handle invalid JSON
//     let projectTypes;
//     try {
//       projectTypes = JSON.parse(req.body.projectTypes || "[]");
//     } catch (err) {
//       return res.status(400).send({
//         message: "Invalid projectTypes format. Must be a valid JSON array.",
//         success: false,
//       });
//     }

//     // Convert projectTypes array to a comma-separated string for insertion
//     const projectDataString = projectTypes
//       .map((pt) => pt.project?.trim())
//       .join(", ");

//     // Insert user data into the `users` table
//     const [result] = await mySqlPool.query(
//       `INSERT INTO users (Name, Email, Password, Designation, Group1, Phone, Address, Profile, Project, Ip, Status, Organization_Name_User, Country, State, City, Zip, Created_Date, Organization_Email)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         req.body.name,
//         req.body.email,
//         req.body.password,
//         req.body.designation,
//         req.body.group,
//         req.body.phone,
//         req.body.address,
//         profilePicture,
//         projectDataString,
//         clientIp,
//         "Active",
//         req.body.orgName,
//         req.body.country,
//         req.body.state,
//         req.body.city,
//         req.body.zip,
//         dateString,
//         req.body.orgEmail,
//       ]
//     );

//     req.userId = result.insertId;

//     next();
//   } catch (err) {
//     console.error("Error in userMiddleWare2:", err.message);
//     return res.status(500).send({
//       message: "An error occurred while inserting user data.",
//       success: false,
//     });
//   }
// };

// // Middleware 3: Project assignment for user
// const userMiddleWare3 = async (req, res, next) => {
//   try {
//     const projectTypes = JSON.parse(req.body.projectTypes || "[]");

//     const query = `
//       INSERT INTO project_user
//       (Project_Name_User, User_Id, User_Name, Organization_Name_Reported, Organization_Email, Reporting_Manager)
//       VALUES (?, ?, ?, ?, ?, ?)`;

//     for (const projectType of projectTypes) {
//       const projectName = projectType.project.trim();
//       const reportingManager = projectType.selectedReportedTo?.trim() || null;

//       await mySqlPool.query(query, [
//         projectName,
//         req.userId,
//         req.body.name,
//         req.body.orgName,
//         req.body.orgEmail,
//         reportingManager,
//       ]);
//     }

//     next();
//   } catch (err) {
//     console.error("Error in userMiddleWare3:", err.message);
//     return res.status(500).send({
//       message: "Failed to assign projects to the user.",
//       success: false,
//     });
//   }
// };

// Final route handler with email sending

// router.post(
//   "/usersData",
//   upload.single("profilePicture"),
//   userMiddleWare2,
//   userMiddleWare1,
//   userMiddleWare3,
//   async (req, res) => {
//     let connection;
//     try {
//       // Get a connection and start transaction
//       connection = await mySqlPool.getConnection();
//       await connection.beginTransaction();

//       // Create transporter with environment variables for security
//       const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.USER_PASS,
//         },
//       });

//       // console.log(req.body.orgEmail);
//       // console.log("Org Email");

//       const info = await transporter.sendMail({
//         from: { name: req.body.orgName, address: req.body.orgEmail },
//         to: req.body.email,
//         subject: `Welcome `,
//         html: `<p>Welcome  We are excited to have you on board.</p>`,
//       });

//       // Commit transaction if email was sent successfully and middlewares passed
//       await connection.commit();

//       res.status(200).send({
//         message: "User data processed successfully, email sent.",
//         success: true,
//       });
//     } catch (err) {
//       if (connection) await connection.rollback(); // Rollback in case of failure
//       console.error(
//         "Error in user registration or email sending:",
//         err.message
//       );
//       res.status(500).send({
//         message: "Failed to process user data or send email.",
//         success: false,
//       });
//     } finally {
//       if (connection) connection.release(); // Release connection back to pool
//     }
//   }
// );

// router.get("/usersData1/:id", async (req, res) => {
//   console.log("Received request to fetch user data.");
//   const { id } = req.params;

//   try {
//     const [rows, fields] = await mySqlPool.query(
//       `SELECT * FROM users WHERE Email = ? `,
//       [id]
//     );

//     if (rows.length > 0) {
//       console.log("This is userrrrrrrrrrrrrrrrrrrrrrr");
//       return res.status(200).send({
//         message: "Successfully retrieved user data.",
//         success: true,
//         data: rows,
//       });
//     }
//     console.log("Errorrrrrrrrrrrrrr");

//     return res.status(404).send({
//       message: "No users found with the given email.",

//       success: false,
//       data: [],
//     });
//   } catch (e) {
//     console.error("Error fetching user data:", e.message);
//     return res.status(500).send({
//       message: "Internal Server Error. Could not retrieve user data.",
//       success: false,
//       error: e.message,
//     });
//   }
// });

router.post(
  "/usersData",
  authenticateToken,
  upload.single("profilePicture"),
  async (req, res) => {
    let connection;
    console.log(req.body);
    try {
      // Step 1: Get a connection and start a transaction
      connection = await mySqlPool.getConnection();
      await connection.beginTransaction();
      console.log("Transaction started.");

      // Step 2: Add user data
      const userResult = await addUserData(req, connection); // Pass connection for transaction
      req.userId = userResult.userId;
      req.hashPassword = userResult.hashPass; // Set the userId for subsequent controllers

      // Step 3: Add designation and employee data
      const designationResult = await addDesignationAndEmployee(
        req,
        connection
      ); // Pass connection

      // Step 4: Assign projects
      const projectResult = await assignProjects(req, connection); // Pass connection
      const sendMail1 = await sendMail(req, connection);

      // Step 5: Commit the transaction
      await connection.commit();
      console.log("Transaction committed successfully.");

      // Final response
      return res.status(200).send({
        message: "User data Inserted Sucessfully",
        success: true,
      });
    } catch (err) {
      // Rollback transaction on error
      if (connection) {
        await connection.rollback();
        console.error("Transaction rolled back due to error:", err.message);
      }
      return res.status(500).send({
        message: err.message || "Failed to process user data.",
        success: false,
      });
    } finally {
      // Release the connection back to the pool
      if (connection) connection.release();
    }
  }
);
// Update your existing endpoint to also fetch managers for each project
router.get("/getReportingTo/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch projects linked to the user

    const reportingData = await projectReporting(id);
    return res.status(200).send({
      message: "The Reporting To data is fetched successfully",
      success: true,
      data: reportingData,
    });
  } catch (e) {
    console.log("There was an error fetching Reporting To data: " + e);
    return res.status(500).send({
      message: "Failed to fetch Reporting To data",
      success: false,
    });
  }
});
// const userUpdateMiddleware = async (req, res, next) => {
//   try {
//     const userId = req.body.userId; // Assuming `userId` is sent from the frontend

//     // Check if user with the same email and organization already exists (excluding the current user)
//     const [existingUsers] = await mySqlPool.query(
//       `SELECT * FROM users WHERE Email = ? AND Organization_Name_User = ?`,
//       [req.body.email, req.body.orgName]
//     );
//     const [rows] = await mySqlPool.query(
//       `SELECT * from leads where Email_Address=? AND Organization_Name_Leads=?`,
//       [req.body.email, req.body.orgName]
//     );

//     if (
//       (existingUsers.length > 0 || rows.length > 0) &&
//       req.body.OldEmail !== req.body.email
//     ) {
//       return res.status(409).send({
//         message:
//           "Another user with the same email already exists in the specified organization.",
//         success: false,
//       });
//     }

//     const clientIp = req.ip;
//     const dateString = new Date().toLocaleDateString();
//     let profilePicture = ""; // Set to an empty string if no file uploaded
//     if (req.file?.filename) {
//       profilePicture = req.file?.filename;
//     } else {
//       profilePicture = req.body.profilePicture;
//     }

//     // Parse projectTypes and handle invalid JSON
//     let projectTypes;
//     try {
//       projectTypes = JSON.parse(req.body.projectTypes || "[]");
//     } catch (err) {
//       return res.status(400).send({
//         message: "Invalid projectTypes format. Must be a valid JSON array.",
//         success: false,
//       });
//     }

//     // Convert projectTypes array to a comma-separated string for updating
//     const projectDataString = projectTypes
//       .map((pt) => {
//         if (typeof pt.project === "string") {
//           return pt.project.trim();
//         } else if (typeof pt.project === "number") {
//           return pt.project.toString(); // Convert number to string
//         } else {
//           return ""; // Handle unexpected types
//         }
//       })
//       .filter((project) => project) // Filter out any empty or invalid entries
//       .join(", ");

//     // Update user data in the `users` table
//     const [result] = await mySqlPool.query(
//       `UPDATE users
//       SET Name = ?, Email = ?, Password = ?, Designation = ?, Group1 = ?, Phone = ?, Address = ?, Profile = ?, Project = ?, Ip = ?, Status = ?, Organization_Name_User = ?, Country = ?, State = ?, City = ?, Zip = ?, Organization_Email = ?
//       WHERE User_Id = ?`,
//       [
//         req.body.name,
//         req.body.email,
//         req.body.password,
//         req.body.designation,
//         req.body.group,
//         req.body.phone,
//         req.body.address,
//         profilePicture,
//         projectDataString,
//         clientIp,
//         "Active",
//         req.body.orgName,
//         req.body.country,
//         req.body.state,
//         req.body.city,
//         req.body.zip,
//         req.body.orgEmail,
//         userId,
//       ]
//     );

//     next();
//   } catch (err) {
//     console.error("Error in userUpdateMiddleware:", err.message);
//     return res.status(500).send({
//       message: "An error occurred while updating user data.",
//       success: false,
//     });
//   }
// };

// const userUpdateMiddleware1 = async (req, res, next) => {
//   try {
//     // Retrieve the designation name based on the provided designation ID and organization name
//     const [rows] = await mySqlPool.query(
//       `SELECT Name FROM designations WHERE id = ? AND Organization_Name = ?`,
//       [req.body.designation, req.body.orgName]
//     );

//     // Check if the designation was found
//     if (rows.length === 0) {
//       return res.status(400).send({
//         message: "No designation found",
//         success: false,
//       });
//     }

//     const newDesignation = rows[0].Name; // Assuming 'Name' is the column storing the designation

//     // Update employee data using the retrieved designation, matching by email
//     const [result] = await mySqlPool.query(
//       `UPDATE employee_info SET Name = ?, Password = ?, Role = ?,Email=? WHERE Email = ?`,
//       [
//         req.body.name,
//         req.body.password,
//         newDesignation,
//         req.body.email,
//         req.body.OldEmail,
//       ]
//     );

//     // Check if any rows were affected (i.e., the email existed)
//     if (result.affectedRows === 0) {
//       return res.status(404).send({
//         message: "Employee with the specified email not found.",
//         success: false,
//       });
//     }

//     next();
//   } catch (err) {
//     console.error("Error in userUpdateMiddleware1:", err.message);
//     return res.status(500).send({
//       message: "Failed to update employee data.",
//       success: false,
//     });
//   }
// };

router.patch(
  "/usersData",
  authenticateToken,
  upload.single("profilePicture"),
  async (req, res, next) => {
    let connection;
    console.log(req.body);

    try {
      connection = await mySqlPool.getConnection();
      await connection.beginTransaction(); // Start transaction
      console.log("Transaction started.");

      // Step 1: Update user data
      const userUpadte = await userUpdateMain(req, connection);
      req.hashPassword = userUpadte.hashPass;

      // Step 2: Update designation and employee data
      await userUpdateEmp(req, connection);

      // Step 3: Assign projects to the user
      await addingUpdatedUser(req, connection);

      // Step 4: Commit transaction
      await connection.commit();
      console.log("Transaction committed successfully.");

      // Success response
      res.status(200).send({
        message: "User data updated successfully.",
        success: true,
      });
    } catch (err) {
      // Rollback on error
      if (connection) {
        await connection.rollback();
        console.error("Transaction rolled back:", err.message);
      }
    } finally {
      if (connection) connection.release();
    }
  }
);
router.get("/usersByOrganization/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // SQL query to get project details based on Project_id
    const rows = await usersByOrganization(id);

    if (rows.length > 0) {
      // If project data is found, send it with a success message
      return res.status(200).json({
        message: "Project data retrieved successfully",
        success: true,
        data: rows,
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

router.get(
  "/usersByIdPage/:id/:groupName/:Org",
  userDetailsPage,
  async (req, res) => {
    const { id, groupName, Org } = req.params;
    // console.log(id);
    // console.log(groupName);
    // console.log(Org);

    try {
      // SQL query to get project details based on Project_id
      const [rows] = await mySqlPool.query(
        `SELECT * FROM users WHERE User_Id = ? AND Organization_Name_User=?`,
        [id, Org]
      );

      console.log(rows);

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
  }
);

router.get("/usersById/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // SQL query to get project details based on Project_id
    const rows = await userByIdNormal(id);

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

router.get("/usersByOrg/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // SQL query to get project details based on Project_id
    const [rows] = await mySqlPool.query(
      `SELECT * FROM users WHERE Email = ?`,
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
router.get("/usersById-1/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // SQL query to get project details based on Project_id
    const rows = await userById(id);

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
router.get("/usersByIdGroup/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Use backticks around 'groups' to prevent issues with reserved words
    const rows = await groupFetcherForUser(id);

    // Check if any records were found
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No groups found for this user." });
    }

    // Send successful response
    return res.status(200).json({ data: rows, success: true });
  } catch (error) {
    // Enhanced error logging for debugging
    console.error("Error in fetching user groups:", error);

    // Send error response
    return res.status(500).json({
      message: "An error occurred while fetching user groups.",
      success: false,
    });
  }
});

router.get("/usersData1/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const rows = await userFetcherByEmail(id);

    if (rows.length > 0) {
      return res.status(200).send({
        message: "Successfully retrieved user data.",
        success: true,
        data: rows,
      });
    }

    return res.status(404).send({
      message: "No users found with the given email.",

      success: false,
      data: [],
    });
  } catch (e) {
    console.error("Error fetching user data:", e.message);
    return res.status(500).send({
      message: "Internal Server Error. Could not retrieve user data.",
      success: false,
      error: e.message,
    });
  }
});

router.get("/usersDatagetOrgName/:id", async (req, res) => {
  const { id } = req.params;

  // Validate the email parameter
  if (!id) {
    return res.status(400).send({
      message: "Invalid email parameter.",
      success: false,
    });
  }

  try {
    const [rows] = await mySqlPool.query(
      `
      SELECT o.Organization_Name AS organizationName
      FROM users AS u
      JOIN organization AS o ON o.id = u.Organization_Name_User
      WHERE u.Email = ?
      `,
      [id]
    );

    if (rows.length > 0) {
      return res.status(200).send({
        message: "Successfully retrieved organization name.",
        success: true,
        data: rows[0], // Return the first match (assuming email is unique)
      });
    }

    return res.status(404).send({
      message: "No users found with the given email.",
      success: false,
      data: [],
    });
  } catch (e) {
    console.error("Error fetching user data:", e.message);
    return res.status(500).send({
      message: "Internal Server Error. Could not retrieve user data.",
      success: false,
      error: e.message,
    });
  }
});

router.get("/organizationgetAll/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  // console.log(object);

  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM users WHERE Email = ?`,
      [id]
    );
    // console.log("data of Orggggggggggggg");
    if (rows.length > 0) {
      return res.status(200).send({
        message: "Data of Organization is fetched successfully",
        success: true,
        data: rows,
      });
    } else {
      return res.status(404).send({
        message: "Organization not found",
        success: false,
        data: [],
      });
    }
  } catch (e) {
    console.error("Error fetching organization data:", e);
    return res.status(500).send({
      message: "There was an error fetching the organization data",
      success: false,
      error: e.message, // Include the error message for debugging
      data: [],
    });
  }
});
router.delete("/deleteUser/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  const connection = await mySqlPool.getConnection(); // Get DB connection

  try {
    const result = await userDelete(connection, id);

    if (!result.success) {
      return res.status(404).json({
        message: result.message,
        success: false,
      });
    }

    return res.status(200).json({
      message: result.message,
      success: true,
    });
  } catch (error) {
    console.error("Error during user deletion:", error);

    return res.status(500).json({
      message: "Internal server error in Deleting the User",
      success: false,
    });
  } finally {
    connection.release(); // Release DB connection
  }
});

router.post("/forgotPassword", async (req, res) => {
  const { email, url } = req.body; // Get dynamic URL and email from the request

  console.log("forgot api hitted");

  try {
    // Check if the user exists in the database
    const [rows] = await mySqlPool.query(
      `SELECT * FROM users WHERE Email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).send({
        message: "No users exist with this email",
        success: false,
      });
    }

    // Generate a JWT token for password reset
    const token = jwt.sign(
      {
        Email: email,
      },
      process.env.SECRET_KEY, // Ensure SECRET_KEY is in your environment variables
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    // Dynamic URL for the password reset link
    const resetLink = `${url}/forgotPassword/${token}`;
    // console.log(u);

    // Setup email transport configuration
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.USER_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Send email with the password reset link
    const info = await transporter.sendMail({
      from: {
        name: "Reality Realm",
        address: process.env.EMAIL_USER,
      },
      to: email, // Receiver
      subject: "Reset Your Password", // Subject line
      text: `Dear User,
  
  We received a request to reset your password. Click the link below to proceed:
  ${resetLink}
  
  If you did not request this change, you can safely ignore this email.
  
  Best regards,
  The Reality Realm Team`, // Plain text body
      html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #4CAF50;">Password Reset Request</h2>
              <p>Dear User,</p>
              <p>We received a request to reset your password. Please click the button below to proceed:</p>
              <div style="text-align: center; margin: 20px 0;">
                  <a href="${resetLink}" 
                     style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; font-size: 16px; border-radius: 5px;">
                      Reset Password
                  </a>
              </div>
              <p>If you did not request this password reset, you can safely ignore this email.</p>
              <p>Best regards,<br><strong>The Reality Realm Team</strong></p>
          </div>
      `, // HTML body
    });
    console.log("Email is send");

    return res.status(200).send({
      message: "Password reset link sent successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send({
      message: "There was an error processing your request",
      success: false,
    });
  }
});

router.post("/forgotPasswordMobile", async (req, res) => {
  const { email, url } = req.body; // Get dynamic URL and email from the request

  console.log("Forgot password API hit");

  try {
    // Check if the user exists in the database
    const [rows] = await mySqlPool.query(
      `SELECT * FROM users WHERE Email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).send({
        message: "No user exists with this email address.",
        success: false,
      });
    }

    const user = rows[0];

    // Generate a JWT token for password reset
    const token = jwt.sign({ Email: email }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    // Generate a 4-digit OTP
    const fourDigitOtp = Math.floor(1000 + Math.random() * 9000); // Generate a random 4-digit number
    console.log("Generated OTP:", fourDigitOtp);

    // Update the database with the token and OTP
    await mySqlPool.query(
      `UPDATE users SET TokenData = ?, VerificationCode = ? WHERE Email = ?`,
      [token, fourDigitOtp, email]
    );
    console.log("Not herere");

    // Email setup
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.USER_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Dynamic email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
          <h2 style="text-align: center; color: #4CAF50;">Password Reset Request</h2>
          <p>Hello <strong>${user.Name || "User"}</strong>,</p>
          <p>We received a request to reset your password. Please use the OTP below to verify your identity:</p>
          <div style="text-align: center; margin: 20px 0;">
              <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #4CAF50; border: 2px dashed #4CAF50; padding: 10px; border-radius: 8px;">
                  ${fourDigitOtp}
              </span>
          </div>
          <p style="text-align: center; font-size: 14px; color: #888;">This OTP is valid for 1 hour.</p>
          <p>If you did not request this password reset, you can safely ignore this email.</p>
          <p>Best regards,<br><strong>The Reality Realm Team</strong></p>
      </div>
    `;

    // Send the email
    const info = await transporter.sendMail({
      from: {
        name: "Reality Realm",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: "Reset Your Password",
      html: emailHtml,
    });

    console.log("Email sent successfully:", info.messageId);

    return res.status(200).send({
      message: "Password reset OTP sent successfully to your email.",
      success: true,
    });
  } catch (error) {
    console.error("Error in forgot password API:", error.message);
    return res.status(500).send({
      message: "There was an error processing your request. Please try again.",
      success: false,
    });
  }
});

router.get("/forgotPasswordTokenVerification/:token", async (req, res) => {
  const { token } = req.params; // Get the token from the route parameter

  try {
    // Verify the token
    const tokenData = jwt.verify(token, process.env.SECRET_KEY);

    // Send the email (contained in the token) back to the frontend
    return res.status(200).json({
      message: "Token verified successfully",
      success: true,
      email: tokenData.Email,
    });
  } catch (error) {
    // Handle token verification error (e.g., invalid or expired token)
    console.error("Token verification failed:", error.message);
    return res.status(400).json({
      message: "Token is invalid or expired",
      success: false,
    });
  }
});

router.put("/updateForgotPassword", async (req, res) => {
  const { userEmail, CPassword, newPassword } = req.body;

  if (!userEmail || !CPassword || !newPassword) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Step 1: Check if the new password and confirm password match
  if (newPassword !== CPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const connection = await mySqlPool.getConnection();
  await connection.beginTransaction();

  try {
    // Step 2: Retrieve the user by email to ensure the user exists
    const [rows] = await connection.query(
      `SELECT Email FROM users WHERE Email = ?`,
      [userEmail]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "No user present with this email",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Step 3: Update the password in both tables
    const updateEmployeeInfoQuery =
      "UPDATE employee_info SET Password = ? WHERE Email = ?";
    const updateUsersQuery = "UPDATE users SET Password = ? WHERE Email = ?";

    await connection.query(updateEmployeeInfoQuery, [
      hashedPassword,
      userEmail,
    ]);
    await connection.query(updateUsersQuery, [hashedPassword, userEmail]);

    await connection.commit();
    return res.status(200).json({ message: "Password updated successfully!" });
  } catch (err) {
    await connection.rollback();
    console.error("Error updating password:", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    connection.release();
  }
});

router.put("/updateForgotPasswordMobile", async (req, res) => {
  const { userEmail, CPassword, newPassword, fourDigitCode } = req.body;

  console.log(userEmail);
  console.log(fourDigitCode);

  // Validate required fields
  if (!userEmail || !CPassword || !newPassword || !fourDigitCode) {
    return res.status(400).json({ message: "All fields are required." });
  }

  // Ensure new password and confirm password match
  if (newPassword !== CPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  let connection;
  try {
    // Get a database connection
    connection = await mySqlPool.getConnection();
    await connection.beginTransaction();

    // Verify if the user exists and retrieve necessary data
    const [rows] = await connection.query(
      `SELECT Email, VerificationCode, TokenData FROM users WHERE Email = ?`,
      [userEmail]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "User not found.", success: false });
    }

    const { VerificationCode: storedCode, TokenData: tokenData } = rows[0];

    // Validate the four-digit code and token
    let isTokenValid = false;
    if (tokenData) {
      try {
        isTokenValid = jwt.verify(tokenData, process.env.SECRET_KEY);
      } catch (err) {
        console.error("Invalid token:", err.message);
        return res
          .status(400)
          .json({ message: "Invalid token.", success: false });
      }
    }

    // console.log(isTokenValid);
    // console.log(storedCode === Number(fourDigitCode));

    if (!isTokenValid || storedCode !== Number(fourDigitCode)) {
      return res.status(400).json({
        message: "Invalid verification code or token.",
        success: false,
      });
    }

    // Hash the new password

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in both tables and clear sensitive fields
    const updateEmployeeInfoQuery =
      "UPDATE employee_info SET Password = ? WHERE Email = ?";
    const updateUsersQuery =
      "UPDATE users SET Password = ?, VerificationCode = NULL, TokenData = NULL WHERE Email = ?";

    await connection.query(updateEmployeeInfoQuery, [
      hashedPassword,
      userEmail,
    ]);
    await connection.query(updateUsersQuery, [hashedPassword, userEmail]);

    // Commit the transaction
    await connection.commit();

    // Respond with success
    return res.status(200).json({
      message: "Password updated successfully!",
      success: true,
    });
  } catch (error) {
    // Rollback transaction in case of error
    if (connection) {
      await connection.rollback();
    }
    console.error("Error updating password:", error.message);
    return res.status(500).json({ message: "Internal server error." });
  } finally {
    // Release the connection
    if (connection) {
      connection.release();
    }
  }
});

router.patch("/organizationEdit", upload.single("file"), async (req, res) => {
  const {
    organizationName,
    country,
    zip,
    companyEmail,
    contact,
    city,
    website,
    Address,
    State,
    id,
  } = req.body;

  const logo = req.file ? req.file.filename : "";

  let connection;

  try {
    // Step 1: Get a connection and start a transaction
    connection = await mySqlPool.getConnection();
    await connection.beginTransaction();
    console.log("Transaction started for organization edit.");

    // Step 2: Check if the organization exists
    const [existingOrganization] = await connection.query(
      "SELECT id FROM organization WHERE id = ?",
      [id]
    );

    if (existingOrganization.length === 0) {
      throw new Error("Organization not found.");
    }

    // Step 3: Update organization details
    const [updateResult] = await connection.query(
      `UPDATE organization SET 
        Organization_Name = ?, 
        Country = ?, 
        Zip = ?, 
        Company_Email = ?, 
        Contact_Number = ?, 
        City = ?, 
        Website = ?, 
        Address = ?, 
        State = ? ,
        Logo=?
      WHERE id = ?`,
      [
        organizationName,
        country,
        zip,
        companyEmail,
        contact,
        city,
        website,
        Address,
        State,
        logo,
        id,
      ]
    );

    if (updateResult.affectedRows === 0) {
      throw new Error("Failed to update organization.");
    }

    // Step 4: Commit the transaction
    await connection.commit();
    console.log("Transaction committed successfully for organization edit.");

    // Final response
    return res.status(200).json({
      success: true,
      message: "Organization updated successfully.",
    });
  } catch (error) {
    // Rollback transaction on error
    if (connection) {
      await connection.rollback();
      console.error("Transaction rolled back due to error:", error.message);
    }
    return res.status(500).json({
      success: false,
      message:
        error.message || "An error occurred while updating the organization.",
    });
  } finally {
    // Release the connection
    if (connection) connection.release();
  }
});

router.get(
  "/UserWorkingOnProjects/:userId",
  authenticateToken,
  async (req, res) => {
    const { userId } = req.params;

    const connection = await mySqlPool.getConnection();

    try {
      // Step 1: Fetch all projects the user is associated with
      const projects = await getProjectsByUserId(connection, userId);

      if (projects.length === 0) {
        return res.status(404).json({
          message: "No projects found for the specified user.",
          success: false,
          data: [],
        });
      }

      const projectNames = projects.map((row) => row.Project_Name_User);

      // Step 2: Fetch all user IDs working on the same projects
      const userIdsResult = await getUserIdsByProjectNames(
        connection,
        projectNames
      );
      const userIds = userIdsResult.map((row) => row.User_Id);

      if (userIds.length === 0) {
        return res.status(200).json({
          message:
            "The user is not collaborating with other users on these projects.",
          success: true,
          data: [],
        });
      }

      // Step 3: Fetch user details for all users involved in these projects
      const userDetails = await getUserDetailsByIds(
        connection,
        userIds,
        userId
      );

      return res.status(200).json({
        message:
          "Successfully fetched user details for the specified projects.",
        success: true,
        data: userDetails,
      });
    } catch (error) {
      console.error("Error fetching user project data:", error);

      return res.status(500).json({
        message:
          "An internal server error occurred while fetching project data.",
        success: false,
        error: error.message, // Include detailed error messages only in development
      });
    } finally {
      connection.release();
    }
  }
);

router.get(
  "/UserWorkingOnProjectsWithoutUser/:userId",
  authenticateToken,
  async (req, res) => {
    const { userId } = req.params;

    try {
      // Step 1: Fetch all projects the user is associated with

      // Step 3: Fetch user details for all users involved in these projects
      const userDetails = await UserWorkingOnProjects(userId);

      // console.log(userDetails);
      // console.log("This is details");

      // Respond with user details
      return res.status(200).json({
        message:
          "Successfully fetched user details for the specified projects.",
        success: true,
        data: userDetails,
      });
    } catch (error) {
      console.error("Error fetching user project data:", error);

      return res.status(500).json({
        message:
          "An internal server error occurred while fetching project data for a Particular user who is working on Projects.",
        success: false,
        error: error.message, // Include detailed error messages only in development
      });
    }
  }
);

router.get("/reportingManager/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Query to find the reporting manager for the specified user
    const rows = await reportingManager(id);

    // Check if a reporting manager exists
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No reporting manager found for this user." });
    }

    // Send successful response with reporting manager details
    return res.status(200).json({ reportingManager: rows });
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Error fetching reporting manager:", error);

    // Send a generic error response
    return res.status(500).json({
      message: "An error occurred while fetching the reporting manager.",
    });
  }
});

router.get("/salesTargetByUser/:userId", async (req, res) => {
  const { userId } = req.params; // Extract userId from route params

  try {
    // Execute the query with the userId as a parameter
    const rows = await salesTagetByUser(userId);
    console.log(rows);

    // If no data is found, handle it gracefully
    if (!rows || rows.length === 0 || rows[0].total_sales === null) {
      return res.status(404).send({
        data: [],
        message: "No sales data found for the specified user",
        success: false,
      });
    }

    // Send the total sales data as the response
    return res.status(200).send({
      data: rows[0], // Access the first row, as SUM produces a single result
      message: "User sales data fetched successfully",
      success: true,
    });
  } catch (err) {
    console.error("Error in fetching user sales data:", err);

    // Return an appropriate error response
    return res.status(500).send({
      message: "An error occurred while retrieving user sales data",
      success: false,
      data: [],
    });
  }
});

router.get("/salesTargetByUser/:userId", async (req, res) => {
  const { userId } = req.params; // Extract userId from route params

  // SQL query to calculate total sales for the given userId
  const sqlQuery = `
    SELECT 
      SUM(CAST(Purchase_Price AS DECIMAL(10, 2))) AS total_sales
    FROM purchaseorder 
    WHERE Lead_Owner_Name = ?;`;

  try {
    // Execute the query with the userId as a parameter
    const [rows] = await mySqlPool.query(sqlQuery, [userId]);

    // If no data is found, handle it gracefully
    if (!rows || rows.length === 0 || rows[0].total_sales === null) {
      return res.status(404).send({
        data: [],
        message: "No sales data found for the specified user",
        success: false,
      });
    }

    // Send the total sales data as the response
    return res.status(200).send({
      data: rows[0], // Access the first row, as SUM produces a single result
      message: "User sales data fetched successfully",
      success: true,
    });
  } catch (err) {
    console.error("Error in fetching user sales data:", err);

    // Return an appropriate error response
    return res.status(500).send({
      message: "An error occurred while retrieving user sales data",
      success: false,
      data: [],
    });
  }
});

router.get("/salesTargetByUserForLeads/:userId", async (req, res) => {
  const { userId } = req.params; // Extract userId from route params

  try {
    // Execute the query with the userId as a parameter
    const rows = await revenueInPipeLine(userId);

    console.log("nice");
    console.log(rows);

    // If no data is found, handle it gracefully
    if (!rows || rows.length === 0 || rows[0].total_sales === null) {
      return res.status(404).send({
        data: [],
        message:
          "No sales data found for the specified user (No revneue in Pipeline Found for the given user)",
        success: false,
      });
    }

    // Send the total sales data as the response
    return res.status(200).send({
      data: rows[0], // Access the first row, as SUM produces a single result
      message: "User sales for leads data fetched successfully",
      success: true,
    });
  } catch (err) {
    console.error("Error in fetching user sales data:", err);

    // Return an appropriate error response
    return res.status(500).send({
      message:
        "An error occurred while retrieving user sales data for leads (No revneue in Pipeline Found for the given user)",
      success: false,
      data: [],
    });
  }
});

router.get("/average-closure-time/:organization", async (req, res) => {
  const { organization } = req.params;

  // Validate organization name
  if (!organization) {
    return res.status(400).json({
      success: false,
      message: "Organization name (Lead owner) is required.",
    });
  }

  try {
    // Query to calculate the average deal closure time

    const results = await averageDealClosureTime(organization);

    // Fetch the result and handle null values
    const averageClosureTimeInDays = results[0]?.averageClosureTimeInDays;

    // If no valid data is found, handle appropriately
    if (averageClosureTimeInDays === null) {
      return res.status(404).json({
        success: false,
        message: "No closed leads found for the specified organization.",
      });
    }

    // Respond with the calculated average closure time
    return res.json({
      success: true,
      data: {
        organization,
        averageClosureTimeInDays: Number(averageClosureTimeInDays).toFixed(2), // Round to 2 decimal places
      },
    });
  } catch (error) {
    console.error("Error calculating average closure time:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in fetching the average closure time for user.",
    });
  }
});

router.get("/usermap/:orgName", async (req, res) => {
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
      `SELECT User_Id, Name FROM users WHERE Organization_Name_User = ?`,
      [orgName]
    );

    // Check if the query returned any results
    if (rows.length === 0) {
      return res.status(404).send({
        message: "No users found for the given organization name",
        success: false,
        data: [],
      });
    }

    // Map the rows into a key-value object: { id1: "name1", id2: "name2", ... }
    const userMap = rows.reduce((acc, row) => {
      acc[row.User_Id] = row.Name;
      return acc;
    }, {});

    return res.status(200).send({
      message: "User data retrieved successfully",
      success: true,
      data: userMap, // Return the key-value pair object
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      data: {},
    });
  }
});

router.get("/getUserGroup/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  // Validate user ID parameter
  if (!id) {
    return res.status(400).json({
      message: "User Email is required.",
      success: false,
    });
  }

  try {
    // Query to find the group details for the specified user
    const [rows] = await mySqlPool.query(
      `
      SELECT g.Permission, g.Name,u.User_Id,u.Organization_Name_User
      FROM users AS u 
      JOIN \`groups\` AS g ON g.id = u.Group1 
      WHERE u.Email = ?
      `,
      [id]
    );

    console.log("User groups query result:", rows);

    // Check if any group is associated with the user
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        message: "No group found for this user.",
        success: false,
        data: [],
      });
    }

    // Return group details
    return res.status(200).json({
      message: "User group retrieved successfully.",
      success: true,
      data: rows[0], // Return the first matching group
    });
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Error retrieving user group:", error);

    // Return a generic server error
    return res.status(500).json({
      message: "An error occurred while retrieving the user group.",
      success: false,
      error: error.message,
    });
  }
});

router.get("/validationSubscription/:orgName", async (req, res) => {
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
    const [packageQuery] = await mySqlPool.query(
      `SELECT * 
       FROM organization_package 
       WHERE Organization_Name_package = ? AND Active = ?`,
      [orgName, "Yes"]
    );
    // Check if the query returned any results
    if (!packageQuery || packageQuery.length === 0) {
      return res.status(403).send({
        success: false,
        message: "No active subscription found for the organization.",
        isExpired: true,
      });
    }

    const packageDetails = packageQuery[0];
    const expiryDate = new Date(packageDetails.End_Date);
    const currentDate = new Date();

    let isSubscription;

    console.log(packageQuery);

    if (expiryDate <= currentDate) {
      console.log("Middleware: Subscription has expired.");
      isSubscription = true; // Pass subscription status to the next handler
    } else {
      isSubscription = false; // Active subscription
    }
    return res.status(200).send({
      success: true,
      isExpired: isSubscription,
      message: "package Subscription is Feteched SucessFully",
    });
  } catch (error) {
    console.error(
      "An internal server error occurred while validating subscription data.",
      error
    );
    return res.status(500).send({
      success: false,
      message:
        "An internal server error occurred while validating subscription data.",
    });
  }
});

module.exports = router;
