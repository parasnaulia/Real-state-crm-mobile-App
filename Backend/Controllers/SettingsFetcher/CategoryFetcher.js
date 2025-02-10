const mySqlPool = require("../../config/db");
const categoryFetch = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * From catagory Where Organization_Name_Catagories=?`,
      [id]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching Category Data " + e);
    throw e;
  }
};

const fetchCategoryForUser = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `
        SELECT  c.Organization_Name_Catagories, c.Catagory,c.Id
        FROM \`catagory\` AS c
        JOIN UserACategory AS uc ON uc.Category_UserA = c.Id
        WHERE uc.User_id_CA = ?
        `,
      [id]
    );
    return rows;
  } catch (e) {
    console.log("There is some Error in Fetching Category for a User " + e);
    throw e;
  }
};

const categorycheck = async (name, MainOrgName) => {
  try {
    const [existingRows] = await mySqlPool.query(
      `SELECT * FROM catagory WHERE Catagory = ? AND Organization_Name_Catagories = ?`,
      [name, MainOrgName]
    );
    return existingRows;
  } catch (e) {
    console.log("There is Some Error in fetching The categories " + e);
    throw e;
  }
};
const CategoryInsertForAdmin = async (name, MainOrgName) => {
  try {
    // Insert new category if it doesn't exist
    const [insertResult] = await mySqlPool.query(
      `INSERT INTO catagory (Catagory, Organization_Name_Catagories) VALUES (?, ?)`,
      [name, MainOrgName]
    );
    return insertResult;
  } catch (e) {
    console.log(
      "There is Some Error in Inserting The Categories for Admin " + e
    );
    throw e;
  }
};

const categoryUpdate = async (category, MainOrgName, id) => {
  try {
    const query = `UPDATE \`catagory\` 
        SET \`Catagory\` = ?, \`Organization_Name_Catagories\` = ? 
        WHERE \`Id\` = ?`;
    const values = [category, MainOrgName, id];

    const [result] = await mySqlPool.query(query, values);
    return result;
  } catch (e) {
    console.log("There is An error in Updating the Categories " + e);
    throw e;
  }
};

const deleteCategories = async (id) => {
  try {
    const query = `DELETE FROM \`catagory\` WHERE \`Id\` = ?`;
    const [result] = await mySqlPool.query(query, [id]);
    return result;
  } catch (e) {
    console.log("There is Some error in Deleting The Categories " + e);
    throw e;
  }
};
module.exports = {
  categoryFetch,
  fetchCategoryForUser,
  categorycheck,
  CategoryInsertForAdmin,
  categoryUpdate,
  deleteCategories,
};
