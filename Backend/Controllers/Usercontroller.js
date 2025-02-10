// controllers/userController.js

const mySqlPool = require("../config/db");
const bcrypt = require("bcrypt");

const nodemailer = require("nodemailer");

const checkUserExists = async (email, orgName) => {
  const [existingUser] = await mySqlPool.query(
    `SELECT id FROM users WHERE Email = ? AND Organization_Name_User = ?`,
    [email, orgName]
  );
  return existingUser.length > 0 ? existingUser[0].id : null;
};
const addUserData = async (req, connection) => {
  try {
    const { email, orgName } = req.body;

    // Check if the user already exists
    const [existingUsers] = await connection.query(
      `SELECT User_Id FROM users WHERE Email = ? AND Organization_Name_User = ?`,
      [email, orgName]
    );

    if (existingUsers.length > 0) {
      throw new Error("User already exists.");
    }

    // Insert new user
    const {
      name,
      password,
      designation,
      group,
      phone,
      address,
      country,
      state,
      city,
      zip,
      orgEmail,
    } = req.body;
    const profilePicture = req.file?.filename || "";
    const clientIp = req.ip;
    const dateString = new Date().toLocaleDateString();

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const [userResult] = await connection.query(
      `INSERT INTO users (Name, Email, Password, Designation, Group1, Phone, Address, Profile, Ip, Status, Organization_Name_User, Country, State, City, Zip, Created_Date, Organization_Email) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        hashedPassword,
        designation,
        group,
        phone,
        address,
        profilePicture,
        clientIp,
        "Active",
        orgName,
        country,
        state,
        city,
        zip,
        dateString,
        orgEmail,
      ]
    );

    return {
      success: true,
      userId: userResult.insertId,
      hashPass: hashedPassword,
    };
  } catch (err) {
    console.error("Error in addUserData:", err.message);
    throw err; // Pass the error to the calling function
  }
};
const addDesignationAndEmployee = async (req, connection) => {
  try {
    const { designation, orgName, name, email, password } = req.body;

    console.log(designation);
    console.log(orgName);

    // Retrieve designation name
    const [rows] = await connection.query(
      `SELECT Name FROM designations WHERE id = ? AND Organization_Name = ?`,
      [designation, orgName]
    );

    if (rows.length === 0) {
      throw new Error("No designation found.");
    }

    const newDesignation = rows[0]?.Name;

    // Insert employee data
    const [employeeResult] = await connection.query(
      `INSERT INTO employee_info (Name, Email, Password, Role) VALUES (?, ?, ?, ?)`,
      [name, email, req.hashPassword, newDesignation]
    );

    return { success: true, employeeId: employeeResult.insertId };
  } catch (err) {
    console.error("Error in addDesignationAndEmployee:", err.message);
    throw err; // Pass the error to the calling function
  }
};
const assignProjects = async (req, connection) => {
  try {
    const { projectTypes = "[]", name, orgName, orgEmail } = req.body;

    // Ensure `req.userId` is set
    if (!req.userId) {
      throw new Error("User ID is not set. Cannot assign projects.");
    }

    // Parse project types
    const parsedProjects = JSON.parse(projectTypes);
    if (!parsedProjects.length) {
      console.log("No projects to assign.");
      return { success: true }; // No projects to assign
    }

    // Assign each project
    const query = `
        INSERT INTO project_user 
        (Project_Name_User, User_Id, User_Name, Organization_Name_Reported, Organization_Email, Reporting_Manager) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;

    for (const projectType of parsedProjects) {
      const projectName = projectType.project.trim();
      const reportingManager = projectType.selectedReportedTo?.trim() || null;

      await connection.query(query, [
        projectName,
        req.userId,
        name,
        orgName,
        orgEmail,
        reportingManager,
      ]);
    }

    return { success: true };
  } catch (err) {
    console.error("Error in assignProjects:", err.message);
    throw err; // Pass the error to the calling function
  }
};

const sendMail = async (req, connection) => {
  try {
    // Validate recipient email
    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    if (!isValidEmail(req.body.email)) {
      throw new Error("Invalid email address.");
    }

    // Retrieve organization and admin details
    const [rows] = await connection.query(
      `SELECT 
          u.Name AS AdminName, 
          o.Organization_Name AS OrganizationName, 
          o.Contact_Number AS OrganizationContact, 
          u.Phone AS AdminPhone,
          o.Website
        FROM users AS u 
        JOIN organization AS o 
        ON o.id = u.Organization_Name_User 
        WHERE u.Group1 = ? AND u.Organization_Name_User = ?`,
      ["OrganizationAdmin", req.body.orgName]
    );

    if (rows.length === 0) {
      throw new Error("No organization or admin details found.");
    }

    const organizationName = rows[0].OrganizationName;
    const adminName = rows[0].AdminName;
    const adminPhone = rows[0].AdminPhone;
    const website = rows[0].Website;

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
        name: "Reality Realm",
        address: process.env.EMAIL_USER,
      },
      to: req.body.email,
      subject: "Welcome to Reality Realm!", // Subject line
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
          <!-- Header Section -->
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Welcome to ${organizationName}!</h1>
          </div>
          
          <!-- Body Section -->
          <div style="padding: 20px;">
            <p style="font-size: 18px;">Dear <strong>${
              req.body.name
            }</strong>,</p>
            <p>We're thrilled to welcome you to the <strong>${organizationName}</strong> family! We're here to support you with all your real estate needs, offering exceptional service and guidance throughout your journey.</p>
            <p>Feel free to explore our services and don't hesitate to reach out if you have any questions or need assistance.</p>
            <p style="font-size: 18px; color: #4CAF50;">Looking forward to working with you!</p>
            
            <div style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px;">
              <p style="margin: 0; font-weight: bold;">Best Regards,</p>
              <p style="margin: 0;">${adminName}</p>
              <p style="margin: 0;">Admin</p>
              <p style="margin: 0;">${organizationName}</p>
              <p style="margin: 0;">Phone: ${adminPhone}</p>
            </div>
          </div>
    
          <!-- Footer Section -->
          <div style="background-color: #f7f7f7; color: #777; text-align: center; padding: 10px;">
            <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} Reality Realm. All Rights Reserved.</p>
            <p style="margin: 0; font-size: 12px;">
              <a href=${website} style="color: #4CAF50; text-decoration: none;">Visit our website</a> | 
              <a href="mailto:support@realityrealm.com" style="color: #4CAF50; text-decoration: none;">Contact Support</a>
            </p>
          </div>
        </div>
        `,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    // Log success info
    console.log("Email sent successfully:", info.response);

    return { success: true, message: "Email sent successfully." };
  } catch (err) {
    console.error("Error sending email:", err.message);
    throw new Error(`Failed to send email: ${err.message}`);
  }
};

const userUpdateMain = async (req, connection) => {
  try {
    const userId = req.body.userId;

    // console.log(req.body);

    // Check if email already exists
    const [existingUsers] = await connection.query(
      `SELECT * FROM users WHERE Email = ? AND Organization_Name_User = ?`,
      [req.body.email, req.body.orgName]
    );

    const [leadUsers] = await connection.query(
      `SELECT * FROM leads WHERE Email_Address = ? AND Organization_Name_Leads = ?`,
      [req.body.email, req.body.orgName]
    );

    if (
      (existingUsers.length > 0 || leadUsers.length > 0) &&
      req.body.OldEmail !== req.body.email
    ) {
      throw new Error(
        "Another user with the same email already exists in the organization."
      );
    }

    // Prepare data
    const profilePicture = req.file?.filename || req.body.profilePicture;
    const clientIp = req.ip;
    const projectTypes = JSON.parse(req.body.projectTypes || "[]");

    // Convert projectTypes array to a comma-separated string
    const projectDataString = projectTypes
      .map((pt) => (typeof pt.project === "string" ? pt.project.trim() : ""))
      .filter(Boolean) // Remove empty entries
      .join(", ");
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Update user data
    await connection.query(
      `UPDATE users 
          SET Name = ?, Email = ?, Password = ?, Designation = ?, Group1 = ?, Phone = ?, 
              Address = ?, Profile = ?, Project = ?, Ip = ?, Status = ?, Organization_Name_User = ?, 
              Country = ?, State = ?, City = ?, Zip = ?, Organization_Email = ?
          WHERE User_Id = ?`,
      [
        req.body.name,
        req.body.email,
        hashedPassword,
        req.body.designation,
        req.body.group,
        req.body.phone,
        req.body.address,
        profilePicture,
        projectDataString,
        clientIp,
        "Active",
        req.body.orgName,
        req.body.country,
        req.body.state,
        req.body.city,
        req.body.zip,
        req.body.orgEmail,
        userId,
      ]
    );

    return { hashPass: hashedPassword };
  } catch (err) {
    console.error("Error in userUpdateMain:", err.message);
    throw err;
  }
};

// Helper function to update employee data
const userUpdateEmp = async (req, connection) => {
  try {
    const [rows] = await connection.query(
      `SELECT Name FROM designations WHERE id = ? AND Organization_Name = ?`,
      [req.body.designation, req.body.orgName]
    );

    if (rows.length === 0) {
      throw new Error("No designation found.");
    }

    const newDesignation = rows[0].Name;

    const [result] = await connection.query(
      `UPDATE employee_info 
          SET Name = ?, Password = ?, Role = ?, Email = ? 
          WHERE Email = ?`,
      [
        req.body.name,
        req.hashPassword,
        newDesignation,
        req.body.email,
        req.body.OldEmail,
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error("Employee with the specified email not found.");
    }
  } catch (err) {
    console.error("Error in userUpdateEmp:", err.message);
    throw err;
  }
};

// Helper function to assign projects
const addingUpdatedUser = async (req, connection) => {
  try {
    const userId = req.body.userId;
    const projectTypes = JSON.parse(req.body.projectTypes || "[]");

    // Delete existing records for the user
    await connection.query(`DELETE FROM project_user WHERE User_Id = ?`, [
      userId,
    ]);

    // Insert new project-user assignments
    for (const projectType of projectTypes) {
      const projectName =
        typeof projectType.project === "string"
          ? projectType.project.trim()
          : projectType.project?.toString() || "";

      const reportingManager = projectType.selectedReportedTo
        ? parseInt(projectType.selectedReportedTo, 10)
        : null;

      await connection.query(
        `INSERT INTO project_user 
            (Project_Name_User, User_Id, User_Name, Organization_Name_Reported, Organization_Email, Reporting_Manager) 
            VALUES (?, ?, ?, ?, ?, ?)`,
        [
          projectName,
          userId,
          req.body.name,
          req.body.orgName,
          req.body.orgEmail,
          reportingManager,
        ]
      );
    }
  } catch (err) {
    console.error("Error in addingUpdatedUser:", err.message);
    throw err;
  }
};

module.exports = {
  addDesignationAndEmployee,
  addUserData,
  assignProjects,
  sendMail,
  userUpdateMain,
  userUpdateEmp,
  addingUpdatedUser,
};
