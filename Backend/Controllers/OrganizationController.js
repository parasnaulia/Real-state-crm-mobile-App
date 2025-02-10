const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

const DataBaseEntryOfOrganization = async (req, connection) => {
  const Password = Math.floor(Math.random() * 900) + 100; // Generate 3-digit password
  req.Pass11 = Password;
  const dummyEmail = `Pop@${Password}`;

  try {
    // Check for Existing Organization
    const [existingRows] = await connection.query(
      `SELECT * FROM organization WHERE Company_Email = ? OR Organization_Name = ?`,
      [req.body.companyEmail, req.body.organizationName]
    );

    if (existingRows.length > 0) {
      throw new Error("Organization already exists.");
    }

    // Insert into Employee Table
    const [insertResult] = await connection.query(
      `INSERT INTO employee_info (Name, Email, Password, Role) VALUES (?, ?, ?, ?)`,
      [null, dummyEmail, Password, "Organization"]
    );

    console.log(
      "Organization data inserted successfully:",
      insertResult.insertId
    );
    return { pass: Password };
  } catch (error) {
    console.error("Error inserting organization data:", error.message);
    throw new Error("Error inserting organization data into the database.");
  }
};

// Helper Function: Store Main Organization Data
const DataOraganizatioMain = async (req, connection) => {
  const today = new Date();
  const dateString = today.toLocaleDateString(); // Format: MM/DD/YYYY
  const forwardedFor = req.headers["x-forwarded-for"];
  const clientIp = forwardedFor
    ? forwardedFor.split(",")[0]
    : req.ip || req.connection.remoteAddress;
  const status = "Active";
  const logo = req.file ? req.file.filename : ""; // Handle file upload
  const groupData = "Admin";

  try {
    await connection.query(
      `INSERT INTO organization 
          (Organization_Name, Company_Email, Contact_Number, Website, City, Country, Zip, Logo, Address, Ip, Status, Created_Date, State, Group1) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.body.organizationName,
        req.body.companyEmail,
        req.body.contact,
        req.body.website,
        req.body.city,
        req.body.country,
        req.body.zip,
        logo,
        req.body.Address,
        clientIp,
        status,
        dateString,
        req.body.State,
        groupData,
      ]
    );

    console.log("Main organization data inserted successfully.");
  } catch (error) {
    console.error("Error inserting main organization data:", error.message);
    throw new Error(
      "There was a problem storing organization data in the database."
    );
  }
};

// Helper Function: Send Welcome Email
const sendMailOrg = async (req) => {
  const Token = jwt.sign(
    {
      Name: req.body.organizationName,
      Password: "Encrypted",
      Email: req.body.companyEmail,
      Role: "Organization",
    },
    process.env.SECRET_KEY
  );

  const link = `${req.body.url}/authLogin/${Token}`;
  const passwordRandom = req.Pass11;

  try {
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

    // Email Content
    const info = await transporter.sendMail({
      from: { name: "Reality Realm", address: process.env.EMAIL_USER },
      to: `${req.body.companyEmail}`,
      subject: "Welcome to Reality Realm – Your Account Details",
      html: `
          <p>Dear Valued Partner,</p>
          <p>We are excited to welcome you to <strong>Reality Realm</strong>!</p>
          <p>You can create your account using the link below:</p>
          <p><a href="${link}" style="color: blue; text-decoration: underline;">Create Your Account</a></p>
          <p><strong>Your default password:</strong> ${passwordRandom}</p>
          <p>Please update your password after logging in to ensure the security of your account.</p>
          <p>Best regards,<br>The Reality Realm Team</p>
        `,
    });

    console.log("Welcome email sent successfully:", info.response);
  } catch (error) {
    console.error("Error sending welcome email:", error.message);
    throw new Error("There was a problem sending the welcome email.");
  }
};

const orgVerify = async (req, res, connection) => {
  const generatedEmail = `pop@${req.body.password.trim()}`;

  try {
    // Check if the user already exists
    const [userRows] = await connection.query(
      `SELECT * FROM users WHERE Email = ?`,
      [req.body.email]
    );

    if (userRows.length > 0) {
      throw new Error("User already exists for this organization.");
    }

    // Check if employee info exists
    const [employeeData] = await connection.query(
      `SELECT * FROM employee_info WHERE Email = ?`,
      [generatedEmail]
    );

    if (employeeData.length === 0) {
      throw new Error("No employee data found.");
    }

    return { mainData: employeeData[0] };
  } catch (error) {
    console.error("Error in orgVerify:", error.message);
    throw new Error("Failed to verify organization data.");
  }
};

const updateInfo = async (req, res, connection) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const data = await connection.query(
      `UPDATE employee_info 
       SET Name = ?, Email = ?, Password = ? 
       WHERE id = ?`,
      [req.body.name, req.body.email, hashedPassword, req.data1.id]
    );
    return { hashPassword: hashedPassword };
  } catch (error) {
    console.error("Error in updateInfo:", error.message);
    throw new Error("Failed to update employee info.");
  }
};

const addingIntoOrgTable = async (req, res, connection) => {
  try {
    const tokenData = jwt.verify(req.body.token, process.env.SECRET_KEY);

    const profilePicture = req.file ? req.file.filename : "";

    const [result] = await connection.query(
      `UPDATE organization 
       SET Admin_Email = ?, Admin_Name = ?, Verified = ?, Designation = ?, Admin_Contact_Number = ?, Admin_Address = ?, Profile = ?, Admin_Country = ?, Admin_State = ?, Admin_City = ?, Admin_Zip = ? 
       WHERE Company_Email = ?`,
      [
        req.body.email,
        req.body.name,
        "Yes",
        req.body.Designation,
        req.body.Contact,
        req.body.Address,
        profilePicture,
        req.body.Country,
        req.body.state1,
        req.body.city,
        req.body.zip,
        tokenData.Email,
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error("No organization record found with the specified email.");
    }

    const [updatedRow] = await connection.query(
      `SELECT id FROM organization WHERE Company_Email = ?`,
      [tokenData.Email]
    );

    if (!updatedRow.length) {
      throw new Error("Failed to retrieve updated organization ID.");
    }

    const token = jwt.sign(
      {
        Name: req.body.name,
        Email: req.body.email,
        Role: tokenData.Role,
      },
      process.env.SECRET_KEY
    );
    req.token = token;

    return {
      updateId: updatedRow[0].id,
      token1: token,
      // hashPass: hashedPassword,
    };
  } catch (error) {
    console.error("Error in addingIntoOrgTable:", error.message);
    throw new Error("Failed to update organization data.");
  }
};

const insertIntoUsersOfOrg = async (req, res, connection) => {
  try {
    const profilePicture = req.file?.filename || "";
    const clientIp = req.ip;
    const dateString = new Date().toISOString().split("T")[0]; // Use ISO format

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const [result] = await connection.query(
      `INSERT INTO users (Name, Email, Password, Designation, Group1, Phone, Address, Profile, Project, Ip, Status, Organization_Name_User, Country, State, City, Zip, Created_Date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.body.name,
        req.body.email,
        req.hashedPassword, // Default password placeholder
        "Organization", // Default designation
        "OrganizationAdmin", // Default group
        req.body.Contact,
        req.body.Address,
        profilePicture,
        "N/A", // Placeholder for project
        clientIp,
        "Active", // Default user status
        req.updatedId, // Refers to organization ID updated earlier
        req.body.Country,
        req.body.state1,
        req.body.city,
        req.body.zip,
        dateString, // Current date
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to insert user data into the database.");
    }

    req.userId = result.insertId; // Save the inserted user ID for further use

    return { hashPass: req.hashedPassword };

    // Generate and attach a token
  } catch (error) {
    console.error("Error in insertIntoUsersOfOrg:", error.message);
    throw new Error("Failed to insert user data into organization.");
  }
};

module.exports = {
  DataBaseEntryOfOrganization,
  DataOraganizatioMain,
  sendMailOrg,

  orgVerify,
  updateInfo,
  addingIntoOrgTable,
  insertIntoUsersOfOrg,
};
