const mySqlPool = require("../../config/db"); // Assuming you have a MySQL pool setup in a config file

const groupFetcher = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM \`groups\` WHERE \`Orgnization_Name\` = ?`,
      [id]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching Groups for a User " + e);
    throw e;
  }
};

const checkGroupData = async (mainOrgName, name) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * from  groups where Orgnization_Name=? AND Name=?`,
      [mainOrgName, name]
    );
    return rows;
  } catch (e) {
    console.log("There is some Error in Fetching Groups " + e);
    throw e;
  }
};
const groupInsertForAdmin = async (mainOrgName, name, permission1) => {
  try {
    const data = await mySqlPool.query(
      `INSERT INTO \`groups\` (Name, Permission, Orgnization_Name) VALUES (?, ?, ?)`,
      [name, permission1, mainOrgName]
    );
    return data;
  } catch (e) {
    console.log("There is Some Error in Inserting Group " + e);
    throw e;
  }
};

const updateGroup = async (id, name, permission, mainOrgName) => {
  try {
    const [result] = await mySqlPool.query(
      `UPDATE \`groups\` SET \`Name\` = ?, \`Permission\` = ?, \`Orgnization_Name\` = ? WHERE \`id\` = ?`,
      [name, permission.toString(), mainOrgName, id] // assuming you store permissions as JSON
    );
    return result;
  } catch (e) {
    console.log("There is Some error in Updating Group " + e);
    throw e;
  }
};

const deleteGroup = async (id) => {
  try {
    const [result] = await mySqlPool.query(
      `DELETE FROM \`groups\` WHERE \`id\` = ?`,
      [id]
    );
    return result;
  } catch (e) {
    console.log("There is Some Error in deleting Group " + e);
    throw e;
  }
};

module.exports = {
  groupFetcher,
  checkGroupData,
  groupInsertForAdmin,
  updateGroup,
  deleteGroup,
};
