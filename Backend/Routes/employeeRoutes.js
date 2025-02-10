const express = require("express");
const bcrypt = require("bcrypt");
const moment = require("moment");
const loginData = require("../Controllers/login");
const mySqlPool = require("../config/db");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  DataBaseEntryOfOrganization,
  DataOraganizatioMain,
  sendMailOrg,

  orgVerify,
  updateInfo,
  addingIntoOrgTable,
  insertIntoUsersOfOrg,
} = require("../Controllers/OrganizationController");

const {
  middleWareCheckForPackageSubscription,
} = require("../Middlewares/MiddleWareCheckForSubscription");
const { usersForAmin } = require("../Controllers/UserFetcher/UserFetcher");
const { authenticateToken } = require("../Middlewares/RoutesAuth");
const {
  fetchCategory,
} = require("../Controllers/PropertyFetcher/PropertyFetcherController");
// .use(express.json());

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(__dirname, "../Public/Image");
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

router.post(
  "/login",
  middleWareCheckForPackageSubscription,
  async (req, res) => {
    console.log("Login endpoint triggered...");
    try {
      const [userQuery] = await mySqlPool.query(
        `SELECT * FROM employee_info WHERE Email = ? LIMIT 1`,
        [req.body.email]
      );

      if (!userQuery || userQuery.length === 0) {
        return res.status(404).send({
          success: false,
          message: "Email not found",
        });
      }

      const user = userQuery[0];

      const [userData] = await mySqlPool.query(
        `SELECT u.User_Id,u.Name,u.Email,u.Designation,u.Group1,u.Phone,u.Address,u.Profile,u.Country,u.City,u.State,u.Zip,u.Created_Date,u.Status,u.Organization_Name_User As Organizatio_Id,u.Age,o.Organization_Name from users AS u JOIN organization AS o ON o.id=u.Organization_Name_User WHERE u.Email=?`,
        [user.Email]
      );

      // Verify the password
      const isMatch = await bcrypt.compare(req.body.password, user.Password);

      if (!isMatch) {
        return res.status(401).send({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Generate JWT
      const token = jwt.sign(
        {
          Name: user.Name,
          Email: user.Email,
          Role: user.Role,
        },
        process.env.SECRET_KEY
      );

      // Check subscription status passed by the middleware
      if (req.subscriptionExpired) {
        return res.status(200).send({
          success: false,
          message:
            "Login Successful, but the subscription plan has expired. Please renew.",
          data: {
            Name: user.Name,
            Email: user.Email,
            Role: user.Role,
            userData: userData,
            token,
          },
          isExpired: true,
        });
      }

      // Login successful with active subscription
      return res.status(200).send({
        success: true,
        message: "Login Successful",
        data: {
          Name: user.Name,
          Email: user.Email,
          Role: user.Role,
          userData: userData,
          token,
        },
        isExpired: false,
      });
    } catch (error) {
      console.error("Error occurred during login:", error);
      res.status(500).send({
        success: false,
        message: "An internal server error occurred.",
      });
    }
  }
);

router.get("/signupCheck", async (req, res) => {
  const adminData = "Admin";
  try {
    const [rows] = await mySqlPool.query(
      `SELECT Role FROM employee_info WHERE Role = ?`,
      [adminData]
    );

    if (rows.length > 0) {
      // Check if any rows were returned
      return res.status(200).send({
        success: true,
        message: "Admin role exists",
      });
    } else {
      // If no rows were found
      return res.status(404).send({
        success: false,
        message: "Admin role not found",
      });
    }
  } catch (e) {
    console.error("Error during signupCheck:", e.message);
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
});

const signupMiddle = async (req, res, next) => {
  const connection = await mySqlPool.getConnection();
  await connection.beginTransaction();

  try {
    const [existingUsers] = await connection.query(
      `SELECT * FROM users WHERE Email = ?`,
      [req.body.email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(409).send({
        message: "User already exists in the specified organization.",
        success: false,
      });
    }

    const today = new Date();
    const dateString = today.toISOString().slice(0, 19).replace("T", " ");
    const forwardedFor = req.headers["x-forwarded-for"];
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0]
      : req.ip || req.connection.remoteAddress;
    const status = "Active";
    const profileFile = req.file ? req.file.filename : null;

    // Insert into admin table
    const [result] = await connection.query(
      `INSERT INTO admin (Name, Email, Password, Designation, Phone, Address, Country, State, City, Zip, Profile, Created_Date, Ip, Status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.body.Name,
        req.body.email,
        req.body.Password, // Insert plain text password
        req.body.Designation,
        req.body.Phone,
        req.body.Address,
        req.body.Country,
        req.body.State,
        req.body.City,
        req.body.Zip,
        profileFile,
        dateString,
        clientIp,
        status,
      ]
    );

    req.insertId = result.insertId;

    await connection.commit();
    next();
  } catch (e) {
    console.log("Error in signup middleware:", e.message);
    await connection.rollback();
    return res.status(500).send({
      message: "Failed to insert admin data.",
      success: false,
    });
  } finally {
    connection.release();
  }
};

const AdminUser = async (req, res, next) => {
  const connection = await mySqlPool.getConnection();
  await connection.beginTransaction();

  try {
    const [existingUsers] = await connection.query(
      `SELECT * FROM users WHERE Email = ?`,
      [req.body.email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(409).send({
        message: "User already exists in the specified organization.",
        success: false,
      });
    }

    const clientIp = req.ip;
    const dateString = new Date().toISOString().slice(0, 19).replace("T", " ");
    const profileFile = req.file ? req.file.filename : null;
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Insert user data into users table
    const [result] = await connection.query(
      `INSERT INTO users (Name, Email, Password, Designation, Group1, Phone, Address, Profile, Project, Ip, Status, Organization_Name_User, Country, State, City, Zip, Created_Date, Organization_Email) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.body.Name,
        req.body.email,
        hashedPassword, // Insert plain text password
        req.body.Designation,
        null,
        req.body.Phone,
        req.body.Address,
        profileFile,
        null,
        clientIp,
        "Active",
        null,
        req.body.Country,
        req.body.State,
        req.body.City,
        req.body.Zip,
        dateString,
        null,
      ]
    );

    req.userId = result.insertId;
    req.hashedPassword = hashedPassword;

    await connection.commit();
    next();
  } catch (err) {
    console.error("Error in AdminUser middleware:", err.message);
    await connection.rollback();
    return res.status(500).send({
      message: "An error occurred while inserting user data.",
      success: false,
    });
  } finally {
    connection.release();
  }
};

router.post(
  "/signup",
  upload.single("file"),
  signupMiddle,
  AdminUser,
  async (req, res) => {
    const connection = await mySqlPool.getConnection();
    await connection.beginTransaction();

    try {
      const role = "Admin";

      const [data] = await connection.query(
        `INSERT INTO employee_info (Name, Email, Password, Role) VALUES (?, ?, ?, ?)`,
        [req.body.Name, req.body.email, req.hashedPassword, role] // Insert plain text password
      );

      if (!data) {
        await connection.rollback();
        return res.status(404).send({
          success: false,
          message: "Something went wrong.",
        });
      }

      const token = jwt.sign(
        {
          Name: req.body.Name,
          Email: req.body.email,
          Role: role,
        },
        process.env.SECRET_KEY
      );

      await connection.commit();

      return res.status(200).send({
        success: true,
        message: "You are signed in",
        data: {
          Name: req.body.Name,
          Email: req.body.email,
          token: token,
          role: role,
        },
      });
    } catch (e) {
      console.log("Error in final signup handler:", e.message);
      await connection.rollback();
      return res.status(500).send({
        success: false,
        message: "An error occurred during signup.",
        error: e.message,
      });
    } finally {
      connection.release();
    }
  }
);

// const DataBaseEntryOfOrganization = async (req, res, next) => {
//   // Generate a random 3-digit password
//   const Password = Math.floor(Math.random() * 900) + 100;
//   req.Pass11 = Password;

//   // Generate a dummy email using the password
//   const dummyEmail = `Pop@${Password}`;

//   try {
//     // Check if the organization already exists
//     const [rows] = await mySqlPool.query(
//       `SELECT * FROM organization WHERE Company_Email = ? OR Organization_Name=?`,
//       [req.body.companyEmail, req.body.organizationName]
//     );

//     // If the organization exists, return a 400 error
//     if (rows.length > 0) {
//       return res.status(400).send({
//         message: "Organization already exists",
//         success: false,
//       });
//     }

//     // Insert data into the employee_info table
//     const data = await mySqlPool.query(
//       `INSERT INTO employee_info (Name, Email, Password, Role) VALUES (?, ?, ?, ?)`,
//       [null, dummyEmail, Password, "Organization"]
//     );

//     // Pass control to the next middleware or route handler
//     next();
//   } catch (e) {
//     console.error("Error inserting data into the database:", e);

//     return res.status(500).send({
//       message: "Error storing data",
//       success: false,
//     });
//   }
// };

// const DataOraganizatioMain = async (req, res, next) => {
//   const today = new Date();
//   const dateString = today.toLocaleDateString(); // Format: MM/DD/YYYY

//   const forwardedFor = req.headers["x-forwarded-for"];
//   const clientIp = forwardedFor
//     ? forwardedFor.split(",")[0]
//     : req.ip || req.connection.remoteAddress;

//   const status = "Active";

//   // Check if the file is provided, if not set logo as empty string
//   const logo = req.file ? req.file.filename : "";

//   let groupData = "Admin";

//   try {
//     const data = await mySqlPool.query(
//       `INSERT INTO organization (Organization_Name,Company_Email,Contact_Number,Website,City,Country,Zip,Logo,Address,Ip,Status,Created_Date,State,Group1) VALUES (?, ?, ?, ?,?,?,?,?,?,?,?,?,?,?)`,
//       [
//         req.body.organizationName,
//         req.body.companyEmail,
//         req.body.contact,
//         req.body.website,
//         req.body.city,
//         req.body.country,
//         req.body.zip,
//         logo, // Use the logo variable here
//         req.body.Address,
//         clientIp,
//         status,
//         dateString,
//         req.body.State,
//         groupData,
//       ]
//     );

//     // Pass control to the next middleware or route handler
//     next();
//   } catch (e) {
//     console.error("Data of Organization Not Inserted to Database 2:", e);
//     return res.status(500).send({
//       message: "There was a problem storing data in the database",
//       success: "false",
//     });
//   }
// };

// DataBaseEntryOfOrganization,
// DataOraganizatioMain,
// sendMailOrg,
router.post("/organizationU/:id", upload.single("file"), async (req, res) => {
  let connection;

  try {
    // Step 1: Start Transaction
    connection = await mySqlPool.getConnection();
    await connection.beginTransaction();
    console.log("Transaction started for organization creation.");

    // Step 2: Insert Organization into Database
    const organizationData = await DataBaseEntryOfOrganization(req, connection);
    req.Pass11 = organizationData.pass;

    // Step 3: Store Additional Organization Data
    await DataOraganizatioMain(req, connection);

    // Step 4: Send Welcome Email
    await sendMailOrg(req);

    // Step 5: Commit Transaction
    await connection.commit();
    console.log(
      "Transaction committed successfully for organization creation."
    );

    return res.status(200).send({
      message: "Organization creation processed successfully.",
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
        "An error occurred while processing the organization data.",
      success: false,
    });
  } finally {
    // Release Connection
    if (connection) connection.release();
  }
});

// {Organization Data Fetching}

router.get("/organizationget/:id", async (req, res) => {
  const { id } = req.params;
  // console.log(object);

  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM organization WHERE Admin_Email = ?`,
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

router.get("/adminget/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM admin WHERE Email = ?`,
      [id]
    );

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

router.post("/auth", async (req, res) => {
  // console.log(proc);

  const tokenData = jwt.verify(req.body.token, process.env.SECRET_KEY);

  try {
    if (tokenData) {
      return res.status(200).send({
        message: "Auth SucessFully",
        data: tokenData,
        success: true,
      });
    }

    return res.status(400).send({
      message: "Auth is not  SucessFully",
      data: {},
      success: false,
    });
  } catch (e) {
    console.log("There is Some Problem in Authenticating user" + e);

    return res.status(500).send({
      message: "Auth is not  SucessFully",
      data: {},
      success: false,
    });
  }

  // console.log(tokenData);
  // console.log("This is token data");

  // return res.status(200).send({ message: "Done" });
});
const dataMiddle = async (req, res, next) => {
  try {
    const [findData] = await mySqlPool.query(
      "SELECT * FROM employee_info WHERE Email = ?",
      [req.body.email]
    );

    if (findData.length > 0) {
      // User exists, return an error
      // console.log("User already present");
      return res.status(409).send({
        message: "User already exists",
        success: false,
        error: "User already exists",
      });
    }

    // User does not exist, proceed to the next middleware/route handler
    next();
  } catch (err) {
    console.log("Error in dataMiddle: " + err);
    return res.status(500).send({
      message: "Database query failed",
      success: false,
      error: err.message,
    });
  }
};

router.post("/signupD/:id", dataMiddle, async (req, res) => {
  const urlData = req.body;

  const obj = {
    Name: urlData.name,
    Email: urlData.email,
    Password: urlData.password,
    token: "",
    role: "",
  };

  const tokenVerify = jwt.verify(req.params.id, process.env.SECRET_KEY);

  obj.role = tokenVerify.role;

  try {
    const data = await mySqlPool.query(
      `INSERT INTO employee_info (Name,Email,Password,Role) VALUES (?,?,?,?)`,
      [obj.Name, obj.Email, obj.Password, obj.role]
    );

    if (!data) {
      return res.status(404).send({
        sucess: false,
        message: "Something Went Wrong",
        err: e,
      });
    }

    const Ctoken = jwt.sign(
      { Name: obj.Name, Email: obj.Email, Role: tokenVerify.role },
      process.env.SECRET_KEY
    );
    obj.token = Ctoken;

    return res.status(200).send({
      sucess: true,
      message: "You Are Sign In",
      data: obj,
    });
  } catch (e) {
    console.log("There is an error in Sign up " + e);
    return res.status(500).send({
      sucess: false,
      message: "Something Went Wrong",
      err: e,
    });
  }
});

router.post("/loginD/:id", async (req, res) => {
  const obj = {
    Name: urlData.name,
    Email: urlData.email,

    token: "",
    role: "",
  };

  const tokenVerify = jwt.verify(req.params.id, process.env.SECRET_KEY);

  obj.role = tokenVerify.role;

  try {
    const data = await mySqlPool.query(
      `SELECT * from employe_info where Email=?`,
      [obj.Email]
    );

    if (!data) {
      return res.status(404).send({
        sucess: false,
        message: "Something Went Wrong",
        err: e,
      });
    }

    const Ctoken = jwt.sign(
      { Name: obj.Name, Email: obj.Email, Role: tokenVerify.role },
      process.env.SECRET_KEY
    );
    obj.token = Ctoken;

    return res.status(200).send({
      sucess: true,
      message: "You Are Sign In",
      data: obj,
    });
  } catch (e) {
    console.log("There is an error in Sign up " + e);
    return res.status(500).send({
      sucess: false,
      message: "Something Went Wrong",
      err: e,
    });
  }
});

router.patch("/newpass", async (req, res) => {
  const { pass, name } = req.body;
  console.log(pass);
  console.log(name);

  // Validate input to ensure required fields are present
  if (!pass || !name || !pass.pass) {
    return res.status(400).send({
      message: "Invalid request, missing required fields",
      success: false,
    });
  }

  const connection = await mySqlPool.getConnection();

  try {
    // Begin transaction
    await connection.beginTransaction();

    const hashedPassword = await bcrypt.hash(pass.pass, 10);

    // First update query
    const userUpdate = await connection.query(
      `UPDATE users SET Password = ? WHERE Email = ?`,
      [hashedPassword, name]
    );

    // Second update query
    const employeeUpdate = await connection.query(
      `UPDATE employee_info SET Password = ? WHERE Email = ?`,
      [hashedPassword, name]
    );

    // Check if both updates were successful
    if (userUpdate.affectedRows === 0 || employeeUpdate.affectedRows === 0) {
      throw new Error("Update failed, no rows affected");
    }

    // Commit transaction if both updates succeeded
    await connection.commit();

    return res.status(200).send({
      message: "Password updated successfully",
      success: true,
    });
  } catch (error) {
    // Rollback transaction in case of error
    await connection.rollback();
    console.error("Error updating password:", error);
    return res.status(500).send({
      message: "Failed to update password",
      success: false,
    });
  } finally {
    // Release the connection back to the pool
    connection.release();
  }
});

router.get("/organization", authenticateToken, async (req, res) => {
  try {
    // Fetch all organizations
    const [rows] = await mySqlPool.query(`SELECT * FROM organization`);
    // console.log(rows);

    // Prepare the data with user count for each organization
    const mainData = await Promise.all(
      rows.map(async (row) => {
        // Fetch user count for the organization
        const [userCountResult] = await mySqlPool.query(
          `SELECT COUNT(*) AS userCount FROM users WHERE Organization_Name_User = ?`,
          [row.id]
        );
        const [userCountResult1] = await mySqlPool.query(
          `SELECT p.Name, p.id AS pId,op.Organization_Name_package
      FROM organization_package op
      JOIN package p ON op.Package = p.id
      WHERE op.Organization_Name_package =?
        AND op.Active = 'Yes'`,
          [row.id]
        );

        // Add user count to the organization data
        return {
          ...row,
          userCount: userCountResult[0].userCount,
          package: userCountResult1[0]?.Name,
        };
      })
    );

    console.log(mainData);

    return res.send({
      message: "Elements of Organization",
      data: mainData,
      success: true,
    });
  } catch (e) {
    console.error("There is an error in fetching the data:", e);
    return res.status(500).send({
      success: false,
      message: "Error in Fetching the Organization",
    });
  }
});

const deleorgmiddleWare = async (req, res, next) => {
  try {
    const [result] = await mySqlPool.query(
      `DELETE FROM employee_info WHERE Name=?`,
      [req.body.Organization_Name] // Correct the access here
    );

    // If the organization is deleted, you can proceed to delete employee info
    if (result.affectedRows > 0) {
      next(); // Proceed to the next middleware
    } else {
      return res.status(404).send({
        message: "Organization not found",
        success: false,
      });
    }
  } catch (err) {
    console.log("Error in deleorgmiddleWare: " + err);
    return res.status(500).send({
      message: "Database query failed",
      success: false,
      error: err.message,
    });
  }
};

router.delete("/organization", async (req, res) => {
  try {
    const [result] = await mySqlPool.query(
      `DELETE FROM organization WHERE Organization_Name=?`,
      [req.body.name] // Make sure this is correct
    );

    return res.status(200).send({
      message: "Organization and associated employee data deleted successfully",
      success: true,
    });
  } catch (e) {
    console.log("Error deleting employee data:", e);
    return res.status(500).send({
      message: "Failed to delete associated employee data",
      success: false,
    });
  }
});

//This is THe sign UP api For Auth
// const middleWare = async (req, res, next) => {
//   // Ensure that the password is trimmed and is a valid input.
//   const gerEmail = `pop@${req.body.password.trim()}`;

//   try {
//     // Check if the user already exists in the users table.
//     const [userRows] = await mySqlPool.query(
//       `SELECT * FROM users WHERE Email = ?`,
//       [req.body.email]
//     );

//     if (userRows.length > 0) {
//       return res.status(400).send({
//         // Corrected 'satus' to 'status'
//         message: "User already exists for this organization",
//         success: false,
//       });
//     }

//     // Check if employee info exists for the generated email.
//     const [employeeData] = await mySqlPool.query(
//       `SELECT * FROM employee_info WHERE Email = ?`,
//       [gerEmail]
//     );

//     if (employeeData.length === 0) {
//       return res.status(404).send({
//         // Return a 404 if no employee data is found.
//         message: "No employee data found",
//         success: false,
//       });
//     }

//     req.data1 = employeeData[0]; // Assuming you want the first row of employee data.

//     next(); // Proceed to the next middleware or route handler.
//   } catch (error) {
//     console.error("Error occurred while querying the database: ", error);
//     return res.status(500).send({
//       // Return a 500 status code for server errors.
//       message: "Internal server error",
//       success: false,
//     });
//   }
// };

// const middleWare2 = async (req, res, next) => {
//   try {
//     const data = await mySqlPool.query(
//       `UPDATE employee_info
//        SET Name = ?, Email = ?, Password = ?
//        WHERE id = ?`,
//       [req.body.name, req.body.email, req.body.password, req.data1.id]
//     );

//     next();
//   } catch (e) {
//     console.log("There is Some Error In Insertion of Data into database2");
//     return res.status(400).send({
//       message: "Sorry there is an insertion of data to loginPass",
//       success: false,
//     });
//   }
// };

// const userMiddleWareUser = async (req, res, next) => {
//   try {
//     // Verify the token
//     const tokenVerification = jwt.verify(
//       req.body.token,
//       process.env.SECRET_KEY
//     );

//     // Set profile picture based on file upload
//     const profilePicture = req.file ? req.file.filename : "";

//     // Execute the UPDATE query
//     const [result] = await mySqlPool.query(
//       `UPDATE organization
//        SET Admin_Email = ?, Admin_Name = ?, Verified = ?, Designation = ?, Admin_Contact_Number = ?, Admin_Address = ?, Profile = ?, Admin_Country = ?, Admin_State = ?, Admin_City = ?, Admin_Zip = ?
//        WHERE Company_Email = ?`,
//       [
//         req.body.email,
//         req.body.name,
//         "Yes",
//         req.body.Designation,
//         req.body.Contact,
//         req.body.Address,
//         profilePicture,
//         req.body.Country,
//         req.body.state1,
//         req.body.city,
//         req.body.zip,
//         tokenVerification.Email,
//       ]
//     );

//     // Check if any rows were affected
//     if (result.affectedRows === 0) {
//       return res.status(404).send({
//         message: "No record found with the specified email.",
//         success: false,
//       });
//     }

//     // Fetch the updated row ID
//     const [updatedRow] = await mySqlPool.query(
//       `SELECT id FROM organization WHERE Company_Email = ?`,
//       [tokenVerification.Email]
//     );

//     const updatedId = updatedRow.length > 0 ? updatedRow[0].id : null;

//     // If no ID found, send an error response
//     if (!updatedId) {
//       return res.status(404).send({
//         message: "Failed to retrieve updated ID",
//         success: false,
//       });
//     }

//     // Generate a new token with updated info
//     const token = jwt.sign(
//       {
//         Name: req.body.name,
//         Email: req.body.email,
//         Role: tokenVerification.Role,
//       },
//       process.env.SECRET_KEY
//     );
//     req.token = token;

//     // Attach the updatedId to the request object for further processing
//     req.updatedId = updatedId;

//     next();
//   } catch (e) {
//     console.error("Error in userMiddleWareUser:", e.message);
//     return res.status(500).send({
//       message: "An error occurred during the update.",
//       success: false,
//     });
//   }
// };

// orgVerify,
//   updateInfo,
//   addingIntoOrgTable,
//   insertIntoUsersOfOrg,

router.patch("/loginPass", upload.single("file"), async (req, res) => {
  let connection;

  try {
    // Step 1: Get a connection and start a transaction
    connection = await mySqlPool.getConnection();
    await connection.beginTransaction();
    console.log("Transaction started.");

    // Step 2: Add user data
    const userResult = await orgVerify(req, res, connection);
    req.data1 = userResult.mainData; // Set the user data for subsequent steps

    // Step 3: Update designation and employee info
    const updateUser = await updateInfo(req, res, connection);
    req.hashedPassword = updateUser.hashPass;

    // Step 4: Update organization table and assign projects
    const projectResult = await addingIntoOrgTable(req, res, connection);
    req.token = projectResult.token1;
    req.updatedId = projectResult.updateId;

    // Step 5: Insert user into `users` table
    const usersOrg = await insertIntoUsersOfOrg(req, res, connection);

    // Commit the transaction
    await connection.commit();
    console.log("Transaction committed successfully.");

    // Final response
    return res.status(200).send({
      message: "Organization data processed successfully.",
      success: true,
      data: projectResult.token1,
    });
  } catch (err) {
    // Rollback transaction on error
    if (connection) {
      await connection.rollback();
      console.error("Transaction rolled back due to error:", err.message);
    }
    return res.status(500).send({
      message: err.message || "Failed to process organization data.",
      success: false,
    });
  } finally {
    // Release the connection back to the pool
    if (connection) connection.release();
  }
});
router.post("/groupinsertion", async (req, res) => {
  const permission1 = req.body.permission.toString();

  try {
    const data = await mySqlPool.query(
      `INSERT INTO \`groups\` (Name, Permission, Orgnization_Email, Orgnization_Name) VALUES (?, ?, ?, ?)`,
      [req.body.name, permission1, req.body.MainOrgEmail, req.body.mainOrgName]
    );

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

router.get("/groupinsertion/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Use backticks for table name and column name in case of case sensitivity issues
    const data = await mySqlPool.query(
      `SELECT * FROM \`groups\` WHERE \`Orgnization_Email\` = ?`,
      [id]
    );

    const [rows, fields] = data; // Destructure result after ensuring format

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
      error: e.message, // Optional: Include error message for better debugging
    });
  }
});

router.delete("/groupinsertion", async (req, res) => {
  try {
    const [result] = await mySqlPool.query(
      `DELETE FROM \`groups\` WHERE \`Name\` = ?`,
      [req.body.name] // Ensure that req.body.name exists and is valid
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
      error: e.message, // Include error message for debugging
    });
  }
});

// const userMiddleWare1 = async (req, res, next) => {
//   // Extract projectTypes directly from the request body
//   const projectTypes = req.body.projectTypes || [];

//   try {
//     const data = await mySqlPool.query(
//       `INSERT INTO employee_info (Name,Email,Password,Role) VALUES (?, ?,?,?)`,
//       [req.body.name, req.body.email, req.body.password, req.body.designation]
//     );

//     next();
//   } catch (err) {
//     console.error("Error in userMiddleware:", err);
//     res.status(500).send({
//       message: "Database query failed during user insertion",
//       success: false,
//       error: err.message,
//     });
//   }
// };

// const userMiddleWare2 = async (req, res, next) => {
//   try {
//     const clientIp = req.ip;

//     const today = new Date();
//     const dateString = today.toLocaleDateString(); // Format: MM/DD/YYYY

//     const status = "Active";
//     // const projectTypes = req.body.projectTypes;

//     const projectTypes = JSON.parse(req.body.projectTypes);

//     let profilePicture = "";

//     // Check if file exists before accessing filename
//     if (req.file && req.file.filename) {
//       profilePicture = req.file.filename;
//     }

//     const projectData = [];

//     // Extract project names and push them into the projectData array
//     for (const projectType of projectTypes) {
//       const projectName = projectType.project.trim();
//       projectData.push(projectName);
//     }

//     // Convert the array to a comma-separated string
//     const projectDataString = projectData.join(", ");

//     // Convert the comma-separated string back to an array
//     const projectArray = projectDataString.split(", ");

//     // Insert data into the database
//     const data = await mySqlPool.query(
//       `INSERT INTO users (Name,Email,Password,Designation,Group1,Phone,Address,Profile,Project,Ip,Status,Organization_Name,Country,State,City,Zip,Created_Date,Organization_Email) VALUES (?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
//       [
//         req.body.name,
//         req.body.email,
//         req.body.password,
//         req.body.designation,
//         req.body.group,
//         req.body.phone,
//         req.body.address,
//         profilePicture, // This will be empty if no file was uploaded
//         projectDataString,

//         clientIp,
//         status,
//         req.body.orgName,
//         req.body.country,
//         req.body.state,
//         req.body.city,
//         req.body.zip,
//         dateString,
//         req.body.orgEmail,
//       ]
//     );

//     next();
//   } catch (e) {
//     console.log("Error in hitting the API: " + e.message);
//     return res.status(500).send({
//       message: "API request failed",
//       success: false, // Change success to false in error cases
//     });
//   }
// };

// const userMiddleWare3 = async (req, res, next) => {
//   // Parse projectTypes from string to array
//   let projectTypes;
//   try {
//     projectTypes = JSON.parse(req.body.projectTypes); // Convert the string to JSON array
//   } catch (e) {
//     console.error("Failed to parse projectTypes:", e);
//     return res.status(400).send({
//       message: "Invalid projectTypes format.",
//       success: false,
//     });
//   }

//   try {
//     // Prepare the SQL statement
//     const query = `
//       INSERT INTO project_user
//       (Project_Name, User_Email, User_Name, Organization_Name, Organization_Email, Reporting_Manager)
//       VALUES (?, ?, ?, ?, ?, ?)`;

//     // Iterate over the projectTypes array
//     for (const projectType of projectTypes) {
//       const projectName = projectType.project.trim() || "";
//       const reportingManager = projectType.selectedReportedTo.trim() || ""; // Use the selectedReportedTo as Reporting_Manager

//       try {
//         // Insert each row into the database
//         await mySqlPool.query(query, [
//           projectName,
//           req.body.email,
//           req.body.name,
//           req.body.orgName,
//           req.body.orgEmail,
//           reportingManager, // Insert Reporting_Manager into the row
//         ]);
//       } catch (dbError) {
//         console.error(
//           `Failed to insert data for project ${projectName}:`,
//           dbError
//         );
//         return res.status(500).send({
//           message: `Failed to insert data for project ${projectName}.`,
//           success: false,
//         });
//       }
//     }

//     next(); // Proceed to the next middleware or route handler
//   } catch (e) {
//     console.error("Error in hitting the API middleware 3:", e); // Log the error for debugging
//     return res.status(500).send({
//       message: "There was an error processing your request.",
//       success: false, // Indicate failure
//     });
//   }
// };

// orgVerify,
//   updateInfo,
//   addingIntoOrgTable,
//   insertIntoUsersOfOrg

// router.post(
//   "/usersData",
//   upload.single("profilePicture"),
//   userMiddleWare1,
//   userMiddleWare2,
//   userMiddleWare3,

//   async (req, res) => {
//     // console.log(req.file);
//     try {
//       const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//           user: "parasnaulia88@gmail.com",
//           pass: "yyxz zpqm xqcl pzeo",
//         },
//       });
//       // send mail with defined transport object
//       const info = await transporter.sendMail({
//         from: {
//           name: req.body.orgName,
//           address: req.body.OrgEmail,
//         },
//         to: `${req.body.email}`, // List of receivers
//         subject: `Welcome to ${req.body.orgName}`, // Subject line
//         text: "Hello", // Plain text body
//         html: `We Welcome You With Greetings`, // HTML body
//       });
//       console.log("Mail sent:", info.response);
//       return res.status(200).send({ message: "Mail sent successfully" });
//     } catch (error) {
//       console.error("Error sending mail:", error);
//       return res.status(500).send({ error: "Internal server error" });
//     }
//   }
// );

router.get("/getUserCount/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM users WHERE Organization_Name = ?`,
      [id]
    );

    if (rows.length > 0) {
      return res.status(200).send({
        message: "Data fetched successfully",
        success: true,
        data: rows,
        userCount: rows.length, // Optionally return the count of users
      });
    } else {
      return res.status(404).send({
        message: "No users found for the given organization",
        success: false,
      });
    }
  } catch (e) {
    console.error("Error fetching user data: ", e);
    return res.status(500).send({
      message: "There was an error fetching user data",
      success: false,
      error: e.message, // Send the error message for better debugging
    });
  }
});

router.get("/usersData/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows, fields] = await mySqlPool.query(
      `SELECT * FROM users WHERE Organization_Email = ? OR Organization_Name=?`,
      [id, id]
    );

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

router.get("/usersDataAdmin", authenticateToken, async (req, res) => {
  // let newArray = [];
  try {
    const newArray = await usersForAmin();

    // console.log(newArray);

    return res.status(200).send({
      message: "Successfully retrieved user data for Admin.",
      success: true,
      data: newArray || [], // Send rows if available, otherwise an empty array
    });
  } catch (e) {
    console.error("Error fetching user data:", e.message);
    return res.status(500).send({
      message: "Internal Server Error. Could not retrieve user data. for admin",
      success: false,
      error: e.message,
    });
  }
});

// {Fetching User Data Accroding to Reported to}
router.get(`/userReportedTo/:id`, async (req, res) => {
  const { id } = req.params; // Destructure `id` from request parameters

  // Check if `id` is provided
  if (!id) {
    return res.status(400).send({
      message: "Email ID is required.",
      success: false,
      data: [],
    });
  }

  try {
    // Execute the SQL query
    const [rows] = await mySqlPool.query(
      `SELECT * FROM users WHERE Email = ?`,
      [id]
    );

    if (rows.length > 0) {
      return res.status(200).send({
        message: "Data fetched successfully",
        success: true,
        data: rows,
      });
    } else {
      return res.status(404).send({
        message: "No data found for this email",
        success: false,
        data: [],
      });
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).send({
      message: "There was an error fetching user data.",
      success: false,
      data: [],
    });
  }
});

router.get(`/userManagerData/:id`, async (req, res) => {
  const { id } = req.params; // Destructure `id` from request parameters

  // Check if `id` is provided
  if (!id) {
    return res.status(400).send({
      message: "Manager ID is required.",
      success: false,
      data: [],
    });
  }

  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM users WHERE Report = ?`,
      [id]
    );

    if (rows.length > 0) {
      return res.status(200).send({
        message: "Data fetched successfully",
        success: true,
        data: rows,
      });
    } else {
      return res.status(404).send({
        message: "No data found for this manager",
        success: false,
        data: [],
      });
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).send({
      message: "There was an error fetching user data for the manager.",
      success: false,
      data: [],
    });
  }
});

// const deleteMiddleWare = async (req, res, next) => {
//   try {
//     const [result] = await mySqlPool.query(
//       `DELETE FROM employee_info WHERE Email=?`,
//       [req.body.email] // Make sure this is correct
//     );

//     next();
//   } catch (e) {
//     console.log("There is an error in hitting the api");
//     return res.status(500).send({
//       message: " Api is Not Hitted",
//       success: true,
//     });
//   }
// };

// router.delete("/userData", deleteMiddleWare, async (req, res) => {
//   // console.log("This is The delete user");

//   try {
//     const [result] = await mySqlPool.query(
//       `DELETE FROM users WHERE Email=?`,
//       [req.body.email] // Make sure this is correct
//     );

//     return res.status(200).send({
//       message: "This is The data that is deleted of Gruop",
//       success: true,
//     });
//   } catch (e) {
//     console.log("data is Not Deleted on Groups " + e);

//     return res.status(400).send({
//       message: "This is The data that is deleted of Gruop",
//       success: true,
//       error: e,
//     });
//   }
// });

router.get("/projectAdmin", authenticateToken, async (req, res) => {
  // console.log("Get Api Of project is hitted ");

  try {
    const [rows, fields] = await mySqlPool.query(`SELECT * FROM project`);

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

router.get("/project/:id", async (req, res) => {
  // console.log("Get Api Of project is hitted ");
  const { id } = req.params;

  try {
    const [rows, fields] = await mySqlPool.query(
      `SELECT p.Project_Code,p.Name,p.Project_Type,p.Assign_To,p.Address,p.Discription,p.Status,p.Country,p.City,p.Zip,p.State,p.Created_Date,o.Organization_Name AS Project_Owner_Name ,p.Owner FROM project AS p JOIN organization AS o ON p.Owner=o.id Where Owner=?`,
      [id]
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
router.delete("/project", async (req, res) => {
  // console.log(req.body.Name);
  try {
    const [result] = await mySqlPool.query(
      `DELETE FROM project WHERE Name=?`,
      [req.body.Name] // Make sure this is correct
    );
    // console.log(result);
    // console.log("data is Deleted here of Project");
    return res.status(200).send({
      message: "This is The data that is deleted of Gruop",
      success: true,
    });
  } catch (e) {
    console.log("data is Not Deleted on  Users " + e);

    return res.status(400).send({
      message: "This is The data that is deleted of Users",
      success: true,
      error: e,
    });
  }
});

router.post("/usersparas", upload.single("file"), async (req, res) => {
  try {
    const [result] = await mySqlPool.query(
      `INSERT INTO test1 (Image) VALUES (?)`,
      [req.file.filename]
    );

    // const filePath = path.join(__dirname, "uploads", req.file.filename);
    // fs.unlink(filePath, (err) => {
    //   if (err) {
    //     console.error("Error deleting file:", err);
    //     return res
    //       .status(500)
    //       .json({ error: "Failed to delete file from server" });
    //   }
    //   console.log("File successfully deleted from server");
    // });

    // // Send a response back to the client
    // return res.status(200).json({
    //   message: "File uploaded and saved to database successfully",
    //   data: result,
    // });
  } catch (e) {
    console.log("error In file upload");
    return res.status(400).send({
      message: "file uplaod failed",
      sucess: false,
    });
  }
});

// {This is Catagory Section}

router.get("/catagory/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await fetchCategory(id);

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

router.patch("/leadsstatus", async (req, res) => {
  try {
    const { Lead_id, status } = req.body;

    // Ensure that both Lead_id and status are provided
    if (!Lead_id || !status) {
      return res.status(400).send({
        message: "Lead_id and status are required",
        success: false,
      });
    }

    // Corrected SQL syntax for updating the lead status
    const data = await mySqlPool.query(
      `UPDATE leads SET Lead_Status = ? WHERE Lead_ID = ?`,
      [status, Lead_id]
    );

    // Check if any rows were affected by the update
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

router.get("/leadsbyId/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await mySqlPool.query(
      `SELECT * from leads Where Lead_ID=?`,
      [id]
    );
    if (rows.length > 0) {
      return res.status(200).send({
        message: "This is Leads Details",
        sucess: true,
        data: rows,
      });
    } else {
      return res.status(400).send({
        message: "This is Leads Details",
        sucess: false,
        data: [],
      });
    }
  } catch (e) {
    console.log("There is Some Error In Fetching the Lead Data" + e);
    return res.status(500).send({
      message: "No Leads Are Found",
      sucess: false,
      data: [],
    });
  }
});

// {user Dashbord Leads}

router.get("/leadsusersData/:userEmail", async (req, res) => {
  const { userEmail } = req.params; // Get the email from the query parameter

  if (!userEmail) {
    return res.status(400).send({
      message: "Please provide a valid email.",
      success: false,
    });
  }

  try {
    // Step 1: Get all projects associated with the given user email
    const [projectsResult] = await mySqlPool.query(
      `SELECT Project_Name_User 
       FROM project_user 
       WHERE User_Id = ?`,
      [userEmail]
    );

    if (projectsResult.length === 0) {
      return res.status(404).send({
        message: "No projects found for the given email.",
        success: false,
      });
    }

    // Step 2: Extract project names from the result
    const projectNames = projectsResult.map(
      (project) => project.Project_Name_User
    );

    // Step 3: Get all users working on the same projects
    const [userEmailsResult] = await mySqlPool.query(
      `SELECT DISTINCT User_Id 
       FROM project_user 
       WHERE Project_Name_User IN (?)`,
      [projectNames]
    );

    if (userEmailsResult.length === 0) {
      return res.status(404).send({
        message: "No users found associated with the same projects.",
        success: false,
        data: [],
      });
    }

    // Step 4: Extract user emails from the result

    const userEmails = userEmailsResult.map((user) => user.User_Id);

    // Step 5: Get all lead IDs associated with these users
    const [leadIdsResult] = await mySqlPool.query(
      `SELECT DISTINCT Lead_ID_User
       FROM lead_user 
       WHERE User_Id_User_Lead IN (?)`,
      [userEmails]
    );

    if (leadIdsResult.length === 0) {
      return res.status(404).send({
        message: "No leads found for the users in these projects.",
        success: false,
        data: [],
      });
    }

    // Step 6: Extract lead IDs from the result
    const leadIds = leadIdsResult.map((lead) => lead.Lead_ID_User);

    // Step 7: Get details of leads whose Lead_ID matches the Lead_IDs found
    const [leadDetailsResult] = await mySqlPool.query(
      `SELECT * 
       FROM leads 
       WHERE Lead_ID IN (?)`,
      [leadIds]
    );

    if (leadDetailsResult.length === 0) {
      return res.status(404).send({
        message: "No leads found with the given Lead IDs.",
        success: false,
        data: [],
      });
    }

    // Final Response: Return lead details
    return res.status(200).send({
      message: "Leads found successfully.",
      success: true,
      data: leadDetailsResult,
    });
  } catch (e) {
    console.error("Error occurred while fetching data:", e);
    return res.status(500).send({
      message: "An error occurred while fetching data.",
      success: false,
      data: [],
    });
  }
});

// {Project Seaarch Query}

router.get("/userDataProject/:userEmail", async (req, res) => {
  const { userEmail } = req.params;

  if (!userEmail) {
    return res.status(400).send({
      message: "Please provide a valid email.",
      success: false,
      data: [],
    });
  }

  try {
    // Step 1: Get the list of project names associated with the given email from project_user
    const [projectUserResult] = await mySqlPool.query(
      `SELECT Project_Name 
       FROM project_user 
       WHERE User_Email = ?`,
      [userEmail]
    );

    if (projectUserResult.length === 0) {
      return res.status(404).send({
        message: "No projects found for the given email.",
        success: false,
        data: [],
      });
    }

    // Step 2: Extract the list of project names from the projectUserResult
    const projectNames = projectUserResult.map(
      (project) => project.Project_Name
    );

    // Step 3: Get project details from the project table based on the project names
    const [projectDetailsResult] = await mySqlPool.query(
      `SELECT *
       FROM project 
       WHERE Name IN (?)`,
      [projectNames]
    );

    if (projectDetailsResult.length === 0) {
      return res.status(404).send({
        message: "No project details found for the associated projects.",
        success: false,
        data: [],
      });
    }

    // Step 4: Send the project details as the response
    return res.status(200).send({
      message: "Project details found successfully.",
      success: true,
      data: projectDetailsResult,
    });
  } catch (e) {
    console.error("Error occurred while fetching data:", e);
    return res.status(500).send({
      message: "An error occurred while fetching data.",
      success: false,
      data: [],
    });
  }
});
router.post("/auth/validate", (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Extract token from "Bearer token"

  if (!token) {
    return res.status(401).json({ isAuthenticated: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    return res.json({ isAuthenticated: true, user: decoded });
  } catch (err) {
    res
      .status(401)
      .json({ isAuthenticated: false, message: "Not A valid USer" });
  }
});

module.exports = router;

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJOYW1lIjoiTXVrZXNoIiwiRW1haWwiOiJwYXJhc0BnbWFpbC5jb20iLCJpYXQiOjE3MjM1NTg3NDh9.fZhX5od_5yxrEZGfdSX1o_dA6C7t7b2AVByTQuyRd2w
