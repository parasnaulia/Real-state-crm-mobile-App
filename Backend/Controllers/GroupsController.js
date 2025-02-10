const mySqlPool = require("../config/db");
const addDesignation = async (req, connection) => {
  const { name, MainOrgName } = req.body;

  if (!name || !MainOrgName) {
    throw new Error("Missing required fields: 'name' and 'MainOrgName'.");
  }

  try {
    // Check if the designation already exists
    const [existingRows] = await connection.query(
      `SELECT * FROM designations WHERE Organization_Name = ? AND Name = ?`,
      [MainOrgName, name]
    );

    if (existingRows.length > 0) {
      console.warn("Designation already exists:", name);
      throw new Error("Designation already exists for this organization.");
    }

    // Insert new designation
    const [insertResult] = await connection.query(
      `INSERT INTO designations (Name, Organization_Name) VALUES (?, ?)`,
      [name, MainOrgName]
    );

    console.log("Designation inserted with ID:", insertResult.insertId);
    return { designationId: insertResult.insertId };
  } catch (error) {
    console.error("Error adding designation:", error.message);
    throw new Error("Unable to add designation. Please try again.");
  }
};

// Helper Function to Associate User with Designation
const associateUserWithDesignation = async (req, connection) => {
  const { userId } = req.body;
  const { desigId } = req;

  if (!userId || !desigId) {
    throw new Error("Missing required fields: 'userId' or 'desigId'.");
  }

  try {
    // Associate User with Designation
    await connection.query(
      `INSERT INTO UserADesignation (UserAD_id, DesignationAD) VALUES (?, ?)`,
      [userId, desigId]
    );
    console.log(
      "User successfully associated with designation:",
      userId,
      desigId
    );
  } catch (error) {
    console.error("Error associating user with designation:", error.message);
    throw new Error(
      "Unable to associate user with designation. Please try again."
    );
  }
};
const insertGroup = async (req, connection) => {
  const { mainOrgName, name, permission, userId } = req.body;

  // Validate Required Fields
  if (!mainOrgName || !name || !permission || !userId) {
    throw new Error(
      "Missing required fields: 'mainOrgName', 'name', 'permission', or 'userId'."
    );
  }

  try {
    // Check if the Group Already Exists
    const [existingGroup] = await connection.query(
      `SELECT * FROM \`groups\` WHERE Orgnization_Name = ? AND Name = ?`,
      [mainOrgName, name]
    );

    if (existingGroup.length > 0) {
      throw new Error("Group already exists for this organization.");
    }

    // Insert New Group
    const [insertResult] = await connection.query(
      `INSERT INTO \`groups\` (Name, Permission, Orgnization_Name) VALUES (?, ?, ?)`,
      [name, permission.toString(), mainOrgName]
    );

    console.log("Group inserted successfully with ID:", insertResult.insertId);
    return { groupId: insertResult.insertId };
  } catch (error) {
    console.error("Error inserting group into database:", error.message);
    throw new Error("Unable to create group. Please try again later.");
  }
};

// Helper Function to Associate User with Group
const associateUserWithGroup = async (req, connection) => {
  const { userId } = req.body;
  const { groupId } = req;

  // Validate Required Fields
  if (!userId || !groupId) {
    throw new Error("Missing required fields: 'userId' or 'groupId'.");
  }

  try {
    // Associate User with Group
    await connection.query(
      `INSERT INTO UsersAGroup (UserA_id, Group_A) VALUES (?, ?)`,
      [userId, groupId]
    );
    console.log("User associated with group successfully:", userId, groupId);
  } catch (error) {
    console.error("Error associating user with group:", error.message);
    throw new Error(
      "Unable to associate user with group. Please try again later."
    );
  }
};

const groupsForUsers = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `
      SELECT g.Name, g.Permission, g.Orgnization_Name,g.id
      FROM \`groups\` AS g
      JOIN UsersAGroup AS ug ON ug.Group_A = g.id
      WHERE ug.UserA_id = ?
      `,
      [id]
    );
    return rows;
  } catch (e) {
    console.log(
      "There is Some Error in fetching Groups For a Particular users " + e
    );
    throw e;
  }
};

module.exports = {
  addDesignation,
  associateUserWithDesignation,

  insertGroup,

  associateUserWithGroup,
  groupsForUsers,
};
