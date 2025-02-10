const mySqlPool = require("../../config/db");
const typePost = async (
  Type,
  Status,
  discription,
  Project_Name,
  Catagory,
  MainOrgName
) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM innerprojectview WHERE Type = ? AND Project_Name_Plots = ? AND Org_Name_Flat_Unit = ? AND Property_Type_flat = ?`,
      [Type, Project_Name, MainOrgName, Catagory]
    );
    return rows;
  } catch (e) {
    console.log(
      "There is Some Error in Fetching Project Type Data For Project Details " +
        e
    );
    throw e;
  }
};

const insertTypeData = async (
  Type,
  Status,
  discription,
  Project_Name,
  Catagory,
  MainOrgName
) => {
  try {
    const query = `
        INSERT INTO innerprojectview (Type, Status, Discription, Project_Name_Plots, Org_Name_Flat_Unit, Property_Type_flat)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
    const values = [
      Type,
      Status,
      discription,
      Project_Name,
      MainOrgName,
      Catagory,
    ];

    const [result] = await mySqlPool.query(query, values);
    return result;
  } catch (e) {
    console.log("There is Some Error In inserting Project Type " + e);
    throw e;
  }
};



module.exports = {
  typePost,
  insertTypeData,
 
};
