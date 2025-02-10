const express = require("express");

const mySqlPool = require("../../config/db.js");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authenticateToken } = require("../../Middlewares/RoutesAuth.js");
// require("dotenv").config();

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
// {Done}
router.post("/package", authenticateToken, async (req, res) => {
  const { Name, Project, Discription } = req.body;

  try {
    // Check if a package with the same name already exists
    const [rows] = await mySqlPool.query(
      `SELECT * FROM package WHERE Name = ?`,
      [Name]
    );
    if (rows.length > 0) {
      return res.status(400).send({
        message: "Package Name Already Exists",
        success: false,
      });
    } else {
      // Insert the new package
      const [data] = await mySqlPool.query(
        `INSERT INTO package (Name, Project, Discription) VALUES (?, ?, ?)`,
        [Name, Project, Discription]
      );

      return res.status(200).send({
        name: "Paras",
        success: true,
        data: data,
      });
    }
  } catch (e) {
    console.error("There is an error in package insertion:", e);
    return res.status(500).send({
      message: "Something went wrong in package insertion",
      success: false,
    });
  }
});

// {Done}

router.get("/package", async (req, res) => {
  try {
    const [rows, fields] = await mySqlPool.query(`SELECT * FROM package`);

    return res.status(200).send({
      data: rows,
      success: true,
    });
  } catch (e) {
    console.log("there is an error in Package Data" + e);
    return res.status(500).send({
      message: "Something Went Wrong In fetching Data",
      sucess: false,
      error: e,
    });
  }
});

const deleteMiddleWarePacakage = async (req, res, next) => {
  try {
    const [result] = await mySqlPool.query(
      `DELETE FROM organization_package WHERE Package = ?`,
      [req.body.name]
    );

    next();
  } catch (e) {
    console.log("There is Some error In Deletion Of data " + e);
    return res.status(500).send({
      message: "There is Some Error In Deletion Of Org_package",
      sucess: false,
      error: e,
    });
  }
};

router.delete("/package", async (req, res) => {
  try {
    const { Id } = req.body; // Destructure Id from req.body
    if (!Id) {
      return res.status(400).send({
        message: "Id is required to delete a package",
        success: false,
      });
    }

    const query = `DELETE FROM package WHERE Id = ?`;
    const [result] = await mySqlPool.query(query, [Id]);

    if (result.affectedRows > 0) {
      return res.status(200).send({
        message: "Successfully Deleted",
        success: true,
      });
    } else {
      return res.status(404).send({
        message: "Package not found",
        success: false,
      });
    }
  } catch (e) {
    console.error("Error in delete API of package:", e); // Improved logging
    return res.status(500).send({
      message: "Error in deleting the package",
      success: false,
    });
  }
});

router.post("/package_org", async (req, res) => {
  const { Name, Package, startDate, endDate, Id } = req.body;

  // Check for required fields
  if (!Id || !Package) {
    return res.status(400).send({
      message: "Fields Missing",
      success: false,
    });
  }

  try {
    // Insert data into the database
    const [data] = await mySqlPool.query(
      `INSERT INTO organization_package (Organization_Name_package, Package, Start_Date, End_Date) VALUES (?, ?, ?, ?)`,
      [Id, Package, startDate, endDate]
    );

    // If data is successfully inserted, return success response
    return res.status(200).send({
      message: "Data Inserted In Db Of Org-pack",
      success: true,
      data: data,
    });
  } catch (e) {
    // Log the error and return a 500 response
    console.log("There is Some Error In Package-Org Insertion:", e);
    return res.status(500).send({
      message: "Something went wrong in Package Insertion",
      success: false,
    });
  }
});

router.get("/organization-package/:organizationId", async (req, res) => {
  const { organizationId } = req.params;

  try {
    const query = `
      SELECT 
        organization_package.Start_Date,
        organization_package.End_Date,
        package.Name AS Package_Name,
        package.Id AS Package_Id,
        organization_package.Active AS Active,
        organization_package.Id AS Id
        
        
      FROM 
        organization_package
      INNER JOIN 
        package ON organization_package.Package = package.Id
      WHERE 
        organization_package.Organization_Name_package = ?
    `;

    const [rows] = await mySqlPool.query(query, [organizationId]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No data found for this organization." });
    }

    res.status(200).send({
      message: "Data of Package is Fetched",
      sucess: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching organization package data: ", error);
    res.status(500).json({ message: "An error occurred while fetching data." });
  }
});

router.get("/organization-package-1/:organizationId", async (req, res) => {
  const { organizationId } = req.params;

  try {
    const query = `
      SELECT 
        organization_package.Start_Date,
        organization_package.End_Date,
        package.Name AS Package_Name,
        package.Id AS Package_Id,
        organization_package.Active AS Active,
        organization_package.Id AS Id,
        package.Project
      FROM 
        organization_package
      INNER JOIN 
        package 
      ON 
        organization_package.Package = package.Id
      WHERE 
        organization_package.Organization_Name_package = ? 
        AND organization_package.Active = ?
    `;

    const [rows] = await mySqlPool.query(query, [organizationId, "Yes"]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        message: "No data found for this organization.",
      });
    }

    return res.status(200).json({
      message: "Data of Package is Fetched",
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching organization package data:", error);
    res.status(500).json({
      message: "An error occurred while fetching data.",
    });
  }
});

router.patch("/package_orgEdit", async (req, res) => {
  const { Name, Package, startDate, endDate, Id } = req.body;

  // Input validation
  if (!Name || !Package || !startDate || !endDate) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // SQL query to update the organization's package information
    const updateQuery = `
      UPDATE organization_package
      SET Package = ?, Start_Date = ?, End_Date = ? 
      WHERE Id = ?
    `;

    // Using promise-based pool.query wrapped with async/await
    const [result] = await mySqlPool.query(updateQuery, [
      Package,
      startDate,
      endDate,
      Id,
    ]);

    // Check if any rows were updated
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .send({ error: "Organization not found", success: false });
    }

    // Success response

    return res
      .status(200)
      .send({ message: "Package updated successfully", success: true });
  } catch (error) {
    // Error handling
    console.error("Error updating package: ", error);
    return res
      .status(500)
      .send({ error: "Internal server error", success: false });
  }
});

router.delete("/deletePackage/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Package ID is required" });
  }

  try {
    // SQL query to delete the package by ID
    const deleteQuery = `DELETE FROM organization_package WHERE Id = ?`;

    const [result] = await mySqlPool.query(deleteQuery, [id]);

    // Check if any rows were affected (i.e., package was deleted)
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Package not found" });
    }

    // Success response
    res.status(200).json({ message: "Package deleted successfully" });
  } catch (error) {
    console.error("Error deleting package: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const packageMiddleWare = async (req, res, next) => {
  const activeStatus = "Yes";

  try {
    // Ensure the table name is specified in the query
    const [rows] = await mySqlPool.query(
      `SELECT * FROM organization_package WHERE Organization_Name_package = ? AND Active = ?`,
      [req.body.Name, activeStatus]
    );

    // Check if any rows were returned
    if (rows.length > 0) {
      return res.status(200).send({
        message: "Already Subscribed To One Package",
        success: false,
      });
    } else {
      // No packages found, proceed to the next middleware/route handler
      next();
    }
  } catch (err) {
    // Error handling
    console.log("Error in Package Middleware: " + err);
    return res.status(500).send({
      message: "Some Error In Getting Package Data",
      success: false,
      error: err.message,
    });
  }
};

// const packageMiddleWare2 = async (req, res, next) => {
//   console.log("This is Middle waer 2");
//   try {
//     // Validate that Package and Name are provided
//     const { Package, Name } = req.body;
//     if (!Package || !Name) {
//       return res.status(400).send({
//         message: "Package and Organization Name are required",
//         success: false,
//       });
//     }
//     console.log(req.body.Package);
//     console.log(req.body.Name);

//     // Update the organization's package based on Organization_Name
//     const [result] = await mySqlPool.query(
//       `UPDATE organization SET Package = ? WHERE Organization_Name=?`,
//       [Package, Name]
//     );
//     console.log(result);

//     // Check if any rows were affected (i.e., if the update was successful)
//     if (result.affectedRows > 0) {
//       console.log("Comingggggggggggggggggg");
//       // Proceed to the next middleware or route handler
//       next();
//     } else {
//       console.log("Not commmmmmmmmingggggggg");
//       // If no rows were updated, the organization name was likely not found
//       return res.status(404).send({
//         message:
//           "Organization not found or already has the same package, update failed",
//         success: false,
//       });
//     }
//   } catch (err) {
//     // Error handling
//     console.error("Error in Package Middleware:", err);
//     return res.status(500).send({
//       message: "Some error occurred while updating the package data",
//       success: false,
//       error: err.message,
//     });
//   }
// };
router.patch(
  "/package_org",
  packageMiddleWare,

  async (req, res) => {
    const activeStatus = "Yes";

    try {
      // Construct the SQL update query
      const [result] = await mySqlPool.query(
        `UPDATE organization_package
         SET Active = ? 
         WHERE Id= ?`,
        [activeStatus, req.body.Package]
      );

      // Check if any rows were affected
      if (result.affectedRows > 0) {
        return res.status(200).send({
          message: "Package status updated successfully",
          success: true,
        });
      } else {
        return res.status(404).send({
          message: "No matching records found to update",
          success: false,
        });
      }
    } catch (err) {
      // Error handling
      console.log("Error in updating package status: " + err);
      return res.status(500).send({
        message: "Error updating package status",
        success: false,
        error: err.message,
      });
    }
  }
);

router.put("/package_org", async (req, res) => {
  const activeStatus = "No";

  try {
    // Construct the SQL update query
    const [result] = await mySqlPool.query(
      `UPDATE organization_package
         SET Active = ? 
         WHERE Id= ?`,
      [activeStatus, req.body.Package]
    );

    // Check if any rows were affected
    if (result.affectedRows > 0) {
      return res.status(200).send({
        message: "Package status updated successfully",
        success: true,
      });
    } else {
      return res.status(404).send({
        message: "No matching records found to update",
        success: false,
      });
    }
  } catch (err) {
    // Error handling
    console.log("Error in updating package status: " + err);
    return res.status(500).send({
      message: "Error updating package status",
      success: false,
      error: err.message,
    });
  }
});

router.get("/packageStatus/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await mySqlPool.query(
      `SELECT * from organizatio_package Where Package=? And Active=? `,
      [id, "Yes"]
    );

    if (rows.length > 0) {
      return res.status(200).send({
        message: "data Of Packaeg is There",
        data: "Active",
      });
    } else {
      return res.status(200).send({
        message: "data Of Packaeg is There",
        data: "InActive",
      });
    }
  } catch (e) {
    console.log("There is an Error In fetching Data" + e);
    return res.status(500).send({
      message: "data Of Package  is not There",
      data: "InActive",
    });
  }
});
router.patch("/package", async (req, res) => {
  const { Name, Project, Discription, Id, oldName } = req.body;

  // Validate incoming data
  if (!Name || !Project || !Id) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const query =
    "UPDATE package SET Project = ?, Discription = ?,Name=? WHERE Id = ?";

  try {
    // Use mysqlPool.query() directly with async/await
    const [result] = await mySqlPool.query(query, [
      Project,
      Discription,
      Name,
      Id,
    ]);

    // Check if rows were affected
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Package not found" });
    }

    res.json({ message: "Package updated successfully" });
  } catch (error) {
    console.error("Error updating package:", error);
    res.status(500).json({ error: "Failed to update package" });
  }
});

router.post("/packageOrg", async (req, res) => {
  const { ids } = req.body;

  // Validate the input
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      message: "Invalid input: 'ids' must be a non-empty array.",
      success: false,
      data: {},
    });
  }

  try {
    // Construct a parameterized query for the IN clause
    const placeholders = ids.map(() => "?").join(", ");
    const query = `
      SELECT p.Name, p.id AS pId,op.Organization_Name_package
      FROM organization_package op
      JOIN package p ON op.Package = p.id
      WHERE op.Organization_Name_package IN (${placeholders})
        AND op.Active = 'Yes'
    `;

    const [rows] = await mySqlPool.query(query, ids);

    // Transform rows into an object with id as key and name as value
    const transformedData = rows.reduce((acc, item) => {
      acc[item.Organization_Name_package] = item.Name;
      return acc;
    }, {});

    // Respond with the transformed data
    if (Object.keys(transformedData).length > 0) {
      return res.status(200).json({
        message: "Active package(s) found",
        data: transformedData,
        success: true,
      });
    } else {
      return res.status(204).json({
        message: "No active packages found for the provided IDs.",
        data: {},
        success: false,
      });
    }
  } catch (error) {
    console.error("Error retrieving package data:", error);
    return res.status(500).json({
      message: "Internal server error",
      data: {},
      success: false,
    });
  }
});

//Check  Package Activeness

router.get("/packageOrgActive/:packageId", async (req, res) => {
  const { packageId } = req.params;
  try {
    const [rows] = await mySqlPool.query(
      `SELECT Active FROM organization_package WHERE Package = ?`,
      [packageId]
    );

    // Filter rows where Active is "Yes"
    const filterActive = rows.filter((item) => item.Active === "Yes");

    if (filterActive.length > 0) {
      return res.status(200).send({
        message: "There is an active package",
        data: filterActive,
        success: true,
      });
    }

    return res.status(200).send({
      message: "No active package found",
      data: [],
      success: false,
    });
  } catch (e) {
    console.error("Error retrieving package:", e);
    return res.status(500).send({
      message: "An error occurred while retrieving the package",
      data: [],
      success: false,
    });
  }
});

router.get(
  "/sendMailToAdmin/:orgId/:newPackage/:currentPackage",
  async (req, res) => {
    const { orgId, newPackage, currentPackage, url } = req.params;

    try {
      // Validate inputs
      if (!orgId || !newPackage || !currentPackage) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required parameters." });
      }

      // Fetch admin email
      const [adminRows] = await mySqlPool.query(
        "SELECT Email FROM users WHERE Designation = ?",
        ["Admin"]
      );
      if (!adminRows.length) {
        return res
          .status(404)
          .json({ success: false, message: "Admin not found." });
      }

      const adminEmail = adminRows[0].Email;
      // const adminEmail = "parasnaulia645@gmail.com";

      // Fetch organization details
      const [orgRows] = await mySqlPool.query(
        "SELECT Organization_Name FROM organization WHERE id = ?",
        [orgId]
      );
      if (!orgRows.length) {
        return res
          .status(404)
          .json({ success: false, message: "Organization not found." });
      }

      const organizationName = orgRows[0].Organization_Name;

      console.log(process.env.EMAIL_PORT);
      console.log(process.env.EMAIL_USER);

      // Configure transporter
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: process.env.EMAIL_PORT || 465,
        secure: true, // Use SSL/TLS
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.USER_PASS,
        },
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates
        },
      });

      // Prepare email options
      const mailOptions = {
        from: {
          name: "Reality Realm Support",
          address: process.env.EMAIL_USER,
        },
        to: adminEmail,
        subject: "Request to Change Subscription Plan",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #007BFF;">Subscription Plan Change Request</h2>
            <p>Dear Admin,</p>
            <p>The organization <strong>${organizationName}</strong> has requested to change their subscription plan.</p>
            <p><strong>Requested Plan:</strong> ${newPackage}</p>
            <p><strong>Current Plan:</strong> ${currentPackage}</p>
            <p>Please review and take the necessary action.</p>
            <hr style="border: 1px solid #ccc; margin: 20px 0;">
            <p><strong>Link to Organization:</strong></p>
            <a href="${url}/organization/Organization_Details/${orgId}" style="color: #007BFF; text-decoration: none;">
              Click here to view details
            </a>
            <p style="font-size: 0.9em; color: #555;">This is an automated email. Please do not reply directly to this email.</p>
          </div>
        `,
      };

      // Send the email
      const info = await transporter.sendMail(mailOptions);

      // Log success and respond
      console.log("Email sent successfully:", info.response);
      return res
        .status(200)
        .json({ success: true, message: "Email sent successfully." });
    } catch (err) {
      console.error("Error sending email:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to send email. Please try again later.",
      });
    }
  }
);

router.get("/ActivePlanUpdate/:orgId/:newPackage", async (req, res) => {
  const { orgId, newPackage } = req.params;

  try {
    // Validate inputs
    if (!orgId || !newPackage) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required parameters." });
    }

    // Fetch admin email
    const [adminRows] = await mySqlPool.query(
      "SELECT Email FROM users WHERE Designation = ?",
      ["Admin"]
    );
    if (!adminRows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found." });
    }

    const adminEmail = adminRows[0].Email;
    // const adminEmail = "parasnaulia645@gmail.com";

    // Fetch organization details
    const [orgRows] = await mySqlPool.query(
      "SELECT Organization_Name FROM organization WHERE id = ?",
      [orgId]
    );
    if (!orgRows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found." });
    }

    const organizationName = orgRows[0].Organization_Name;

    // console.log(process.env.EMAIL_PORT);
    // console.log(process.env.EMAIL_USER);

    // Configure transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || 465,
      secure: true, // Use SSL/TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.USER_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    });

    // Prepare email options
    const mailOptions = {
      from: {
        name: "Reality Realm Support",
        address: process.env.EMAIL_USER,
      },
      to: adminEmail,
      subject: "Request to Change Subscription Plan",
      html: `
         <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2 style="color: #007BFF;">Subscription Plan Renewal Request</h2>
  <p>Dear Admin,</p>
  <p>The organization <strong>${organizationName}</strong> has requested to renew their current subscription plan.</p>
  <p><strong>Renewal Plan:</strong> ${newPackage}</p>
  <p>Please review and process the renewal request at your earliest convenience.</p>
  <hr style="border: 1px solid #ccc; margin: 20px 0;">
  <p style="font-size: 0.9em; color: #555;">This is an automated email. Please do not reply directly to this email.</p>
</div>

        `,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    // Log success and respond
    console.log("Email sent successfully:", info.response);
    return res
      .status(200)
      .json({ success: true, message: "Email sent successfully." });
  } catch (err) {
    console.error("Error sending email:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send email. Please try again later.",
    });
  }
});

router.patch("/statusUpdate/:opId/:orgName/:pkgId", async (req, res) => {
  const { opId, orgName, pkgId } = req.params;

  const currentDate = new Date().toISOString().split("T")[0]; // Format to YYYY-MM-DD

  try {
    // Update rows where Active is "Yes" and End_Date is earlier than current date
    const [result] = await mySqlPool.query(
      `UPDATE organization_package 
       SET Active = ? 
       WHERE Id = ? AND End_Date < ?`,
      ["No", opId, currentDate]
    );

    // Check if any rows were affected
    if (result.affectedRows > 0) {
      return res.status(200).send({
        message: "Plan is expired",
        success: true,
      });
    } else {
      return res.status(400).send({
        message: "Plan is not expired yet or does not exist",
        success: false,
      });
    }
  } catch (error) {
    console.error("Error while checking the plan status:", error);
    return res.status(500).send({
      message: "Something went wrong while checking the plan status",
      success: false,
    });
  }
});

module.exports = router;
