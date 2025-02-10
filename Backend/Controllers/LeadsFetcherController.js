const mySqlPool = require("../config/db"); // Assuming you have a MySQL pool setup in a config file

const leadsAssociatedWithProperty = async (leadId, flatId) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM leads WHERE Flat_Id = ? AND Lead_ID != ?`,
      [flatId, leadId]
    );
    return rows;
  } catch (e) {
    console.log(
      "There Is Some Error In Fetching Leads Assocaited With Property" + e
    );
    throw e;
  }
};

const selctLedsByOrg = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT 
                   l.Lead_owner,
                   l.Organization_Name_Leads,
                   l.Lead_ID,
                   l.First_Name,
                   l.Last_Name,
                   l.Contact_Number,
                   l.Email_Address,
                   l.Age,
                   l.Gender,
                   l.Address,
                   l.Country,
                   l.State,
                   l.City,
                   l.Zip_code,
                   l.Lead_Status,
                   l.Referrer,
                   l.Source_of_Inquiry,
                   l.Date_Created,
                   l.Tentative_Purchase_Price,
                   l.Project_Name,
                   l.Property_Type,
                   l.Type,
                   l.Budget,
                   l.Finance,
                   l.Tentative_Purchase_Date,
                   l.Notes,
                  
                  
                   f.Unit_No,
                   f.Block,
                   f.Configuration,
                   c.Catagory AS Category_Name,
                   p.Name AS Project_Name_Data,
                   u.Name AS Owner,
                   f.Status AS Property_Status,
                   l.Flat_id
             FROM leads AS l
             LEFT JOIN flat AS f ON f.Flat_id = l.Flat_Id
             LEFT JOIN project AS p ON p.Project_Code = l.Project_Name
             LEFT JOIN catagory AS c ON c.Id = l.Property_Type
             JOIN users AS u ON u.User_Id = l.Lead_owner
             WHERE l.Organization_Name_Leads = ?
               AND l.Lead_Status != ?`,
      [id, "Closed Won-Converted"] // Ensure 'limit' is a valid integer
    );
    return rows;
  } catch (e) {
    console.log(
      "Error In Fetching The Leads For A Particular Organization" + e
    );
    throw e;
  }
};

const leadsStatusChange = async (Lead_id, status) => {
  try {
    const data = await mySqlPool.query(
      `UPDATE leads SET Lead_Status = ? WHERE Lead_ID = ?`,
      [status, Lead_id]
    );
    return data;
  } catch (e) {
    console.log("There is Some Error In Updating  The Leads Status " + e);
    throw e;
  }
};

const deleteLeadData = async (leadId) => {
  try {
    // Check if the lead exists
    const [existingLead] = await mySqlPool.query(
      `SELECT * FROM leads WHERE Lead_ID = ?`,
      [leadId]
    );

    if (existingLead.length === 0) {
      return { success: false, statusCode: 404, message: "Lead not found." };
    }

    // Delete the lead
    await mySqlPool.query(`DELETE FROM leads WHERE Lead_Id = ?`, [leadId]);

    return {
      success: true,
      statusCode: 200,
      message: "Lead deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting lead:", error.message);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to delete lead.",
    };
  }
};

const leadForAGivenProperty = async (address, orgName) => {
  try {
    const [rows] = await mySqlPool.query(
      `
      SELECT 
        l.Lead_ID,
        l.Type,
        l.Property_Type,
        l.Configuration,
        f.Unit_No,
        l.Project_Name,
        f.Block,
        f.Configuration,
        l.Organization_Name_Leads,
        l.Lead_owner
      FROM leads AS l
      JOIN flat AS f 
      ON l.Flat_Id = f.Flat_id 
      WHERE l.Lead_ID = ? 
        AND l.Organization_Name_Leads = ? 
        AND f.Status != ?
      `,
      [address, orgName, "sold"]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error In Fetching leads Of given Property " + e);
    throw e;
  }
};

const leadsWithUnsoldFlats = async (address) => {
  try {
    const [onlyLeads] = await mySqlPool.query(
      `SELECT Lead_ID, Organization_Name_Leads,Lead_owner
       FROM leads 
       WHERE Lead_ID = ?`,
      [address]
    );
    return onlyLeads;
  } catch (e) {
    console.log(
      "There is Some error in Fetching the Leads With Unsold Flats " + e
    );
    throw e;
  }
};

const leadsByIDFether = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT 
        l.Lead_ID, l.First_Name, l.Last_Name, l.Contact_Number, l.Email_Address, 
        l.Age, l.Gender, l.Address, l.Country, l.State, l.City, l.Zip_code, 
        l.Lead_owner, l.Lead_Status, l.Referrer, l.Source_of_Inquiry, 
        l.Date_Created, l.Property_Type AS Category_Id, l.Organization_Name_Leads, l.Type AS Type_Id, 
        f.Configuration, f.Unit_No, l.Budget, l.Finance, l.Tentative_Purchase_Date, 
        l.Notes, l.Project_Name AS Project_id, f.Block, l.Occupation, l.Created_Date, 
        l.Flat_Id, l.Tentative_Purchase_Price ,
        p.Name AS Project_Main_Name,
        c.Catagory AS Category_Name,
        ip.Type AS Type_Name

      FROM leads AS l 
     LEFT JOIN flat AS f  ON f.Flat_id = l.Flat_Id 
    LEFT  JOIN project AS p ON l.Project_Name=p.Project_Code
     LEFT JOIN catagory AS c ON l.Property_Type=c.Id
     LEFT JOIN innerprojectview AS ip ON l.Type=ip.id
     
      WHERE l.Lead_ID = ? 
      `,
      [id]
    );
    return rows;
  } catch (e) {
    console.log("There is Some error in Fetching leads By id " + e);
    throw e;
  }
};

const leadById = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * from leads Where Lead_ID=?`,
      [id]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in fetching Leads Data " + e);
    throw e;
  }
};

module.exports = {
  leadsAssociatedWithProperty,
  selctLedsByOrg,
  leadsStatusChange,
  deleteLeadData,
  leadForAGivenProperty,
  leadsWithUnsoldFlats,
  leadsByIDFether,
  leadById,
};
