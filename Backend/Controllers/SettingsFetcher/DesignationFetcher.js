const mySqlPool = require("../../config/db"); // Assuming you have a MySQL pool setup in a config file

const designationFetch = async (orgName) => {
  try {
    const [rows] = await mySqlPool.query(
      "SELECT * FROM designations WHERE Organization_Name=?",
      [orgName]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in fetching designation for a Users " + e);
    throw e;
  }
};

const designationFetchUser = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `
      SELECT  d.Name, d.Organization_Name,d.id
      FROM \`designations\` AS d
      JOIN UserADesignation AS ud ON ud.DesignationAD = d.id
      WHERE ud.UserAD_id = ?
      `,
      [id]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching designation For User " + e);
    throw e;
  }
};

const designationCheck = async (MainOrgName, name) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * from  designations where Organization_Name=? AND Name=?`,
      [MainOrgName, name]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fecthing Designation Data " + e);
    throw e;
  }
};

const designationInsert = async (name, MainOrgName) => {
  try {
    const sql =
      "INSERT INTO designations (Name,Organization_Name) VALUES (?,?)";
    const [result] = await mySqlPool.query(sql, [name, MainOrgName]); // Using async/await for MySQL query
    return result;
  } catch (e) {
    console.log(
      "There is Some Error in inserting The data to Designation " + e
    );
    throw e;
  }
};
const designationUpdate = async (name, MainOrgName, id) => {
  try {
    const updateQuery =
      "UPDATE designations SET Name = ?, Organization_Name = ? WHERE id = ?";

    const [result] = await mySqlPool.query(updateQuery, [
      name,
      MainOrgName,
      id,
    ]);
    return result;
  } catch (e) {
    console.log("There is Some Error in Updating The Designation " + e);
    throw e;
  }
};

const designationDelete = async (id) => {
  try {
    const [result] = await mySqlPool.query(
      "DELETE FROM designations WHERE id = ?",
      [id]
    );
    return result;
  } catch (e) {
    console.log("There is Some Error in Deleting Designation Data " + e);
    throw e;
  }
};

module.exports = {
  designationFetch,
  designationFetchUser,

  designationCheck,
  designationInsert,
  designationUpdate,
  designationDelete,
};
