const mySqlPool = require("../../config/db");
const {
  findAdditionalPrices,
} = require("../DashBoardControllers/OrganizationDashBoardController");
const customerById = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `
        SELECT 
          c.Customer_Id,
          c.First_Name,
          c.Last_Name,
          c.Contact_Number,
          c.Email_Address,
          c.Age,
          c.Gender,
          c.Address,
          c.Country,
          c.State,
          c.City,
          c.Zip_code,
          c.Lead_owner,
          c.Referrer,
          c.Source_of_Inquiry,
          c.Property_Type,
          c.Organization_Name,
          c.Project_Name AS ProjectId,
          c.Type AS typeId,
          c.Configuration,
          c.Unit_No,
          c.Block,
          c.Created_Date,
          c.Occupation,
          c.Flat_id,
          p.Name AS Project_Name,
          ca.Catagory AS Category_Name,
          ip.Type AS Type_Name
        FROM customer AS c
        JOIN project AS p ON c.Project_Name = p.Project_Code
        JOIN catagory AS ca ON c.Property_Type = ca.Id
        JOIN innerprojectview AS ip ON c.Type = ip.id
        WHERE c.Customer_Id = ?
        `,
      [id]
    );
    return rows;
  } catch (e) {
    console.log("There is some error in fetching customer by ID: " + e.message);
    throw e;
  }
};

const customerProperties = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT 
              f.Unit_No AS Unit_No, 
              f.Block,
              f.Configuration,
              f.Property_type AS Property_type, 
              f.Type_Flat AS Type_Flat, 
              f.List_Price AS List_Price, 
              f.Project_Name_flats As ProjectName,
              pc.Purchase_Price AS Purchase_Price,
              pc.Purchase_id AS Purchase_id,
              pc.Customer_id,
              p.Name AS Project_Name,
              c.Catagory AS Category_Name,
              ip.Type as Type_Name

            FROM purchaseorder AS pc 
            JOIN flat AS f ON pc.Main_Property_Id = f.Flat_id 
            JOIN project AS p ON pc.Project_Name=p.Project_Code
            JOIN catagory AS c ON pc.Project_Catagory=c.Id
            JOIN innerprojectview As ip ON pc.Type=ip.id
            WHERE pc.Customer_id = ?`,
      [id]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in fetching Cutomer Properties " + e);
    throw e;
  }
};

const propertDetailsCustomer = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT 
              f.Unit_No AS Unit_No, 
              f.Property_type AS Property_type, 
              f.Type_Flat AS Type_Flat, 
              f.List_Price AS List_Price, 
              f.Block AS Block,
              f.Configuration AS Configuration,
              pc.Purchase_Price AS Purchase_Price,
              pc.Purchase_id AS Purchase_id,
              f.Project_Name_flats AS Project_Name_flats,
              f.Org_Name AS Org_Name,
              pc.Purchase_date,
              pc.Plan,
               p.Name AS Project_Name,
              c.Catagory AS Category_Name,
              ip.Type as Type_Name,
              o.Organization_Name AS Main_Organization_Name,
              o.Website,
              o.Contact_Number As organization_Contact_Number,
              o.Address As Organization_Address,
              o.City AS Organization_City,
              o.Country AS Organization_Country,
              o.Company_Email

            FROM purchaseorder AS pc 
            JOIN flat AS f ON pc.Main_Property_Id = f.Flat_id 
             JOIN project AS p ON pc.Project_Name=p.Project_Code
            JOIN catagory AS c ON pc.Project_Catagory=c.Id
            JOIN innerprojectview As ip ON pc.Type=ip.id
            JOIN organization AS o ON pc.Purchase_org_Name=o.id
            WHERE pc.Purchase_id = ?`,
      [id]
    );
    const [totalPaid, additionalCost, status] = await findAdditionalPrices(
      rows[0]?.Purchase_id,
      rows[0]?.Purchase_Price
    );
    return [rows, totalPaid, additionalCost, status];
  } catch (e) {
    console.log(
      "There is Some error in Fetching the Customer property Deatils Data " + e
    );
    throw e;
  }
};

const customerEmailCheck = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT Customer_Id FROM customer WHERE Email_Address = ?`,
      [id]
    );
    return rows;
  } catch (e) {
    console.log(
      "There is Some error in Fetching customer Data for a given Email " + e
    );
    throw e;
  }
};
const customerData = async (org_Name) => {
  try {
    const [rows] = await mySqlPool.query(
      `
     SELECT 
    c.Customer_Id,
    c.First_Name,
    c.Last_Name,
    c.Contact_Number,
    c.Email_Address,
    c.Age,
    c.Gender,
    c.Address,
    c.Country,
    c.State,
    c.City,
    c.Zip_code,
    c.Lead_owner,
    c.Referrer,
    c.Source_of_Inquiry,
    c.Lead_ID,
    c.Property_Type,
    c.Organization_Name,
    c.Created_Date,
    c.Occupation,
    c.Flat_id,
    f.Unit_No,
    f.Block,
    c.Project_Name AS Customer_Project_Name,
    p.Name AS Project_Name_Customer
FROM 
    customer AS c
JOIN 
    project AS p ON p.Project_Code = c.Project_Name
JOIN 
    flat AS f ON f.Flat_id = c.Flat_id
WHERE 
    c.Organization_Name = ?;

      `,
      [org_Name]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching Customer Data " + e);
    throw e;
  }
};
const customerOfUsers = async (userId) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT 
        c.Customer_Id,
        c.First_Name,
        c.Last_Name,
        c.Contact_Number,
        c.Email_Address,
        c.Age,
        c.Gender,
        c.Address,
        c.Country,
        c.State,
        c.City,
        c.Zip_code,
        c.Lead_owner,
        c.Referrer,
        c.Source_of_Inquiry,
        c.Lead_ID,
        c.Property_Type,
        c.Organization_Name,
        c.Project_Name,
        p.Name AS Project_Name_Customer,
        c.Created_Date,
        c.Occupation,
        c.Flat_id,
        f.Unit_No,
        f.Block
      FROM 
        customer AS c
      JOIN 
        project AS p ON p.Project_Code = c.Project_Name
      JOIN 
        flat AS f ON f.Flat_id = c.Flat_id
      WHERE 
        c.Lead_owner = ?; `,
      [userId]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in fetching Customer " + e);
    throw e;
  }
};
const paymentPlanRecipt = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM Recipt WHERE Purchase_Id_Recipt = ?`,
      [id]
    );
    return rows;
  } catch (e) {
    console.log("There is Some error in Fetching Recipt Data " + e);
    throw e;
  }
};

const customerEdit = async (
  firstName,
  lastName,
  emailAddress,
  contactNumber,
  age,
  gender,
  address,
  country,
  state,
  city,
  zipcode,
  Occupation,
  id
) => {
  try {
    const [result] = await mySqlPool.query(
      `UPDATE customer
        SET First_Name = ?, Last_Name = ?, Email_Address= ?, Contact_Number = ?,  Age = ?, Gender= ?, Address = ?, Country = ?, State = ?, City = ?,Zip_code=?,Occupation=?
        WHERE Customer_Id = ?`, // We use the taskId to update the correct row
      [
        firstName,
        lastName,
        emailAddress,
        contactNumber,
        age,
        gender,
        address,
        country,
        state,
        city,
        zipcode,
        Occupation,
        id,
      ]
    );
    return result;
  } catch (e) {
    console.log("There is Some error in editing Customer  " + e);
    throw e;
  }
};
const purchasePaidPrice = async (id, Disc, type) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM perchaseorderpayment WHERE Purchase_id = ? AND Discription = ? AND Type = ?`,
      [id, Disc, type]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching purchasePaidProce " + e);
    throw e;
  }
};
module.exports = {
  customerById,
  customerProperties,
  propertDetailsCustomer,
  customerEmailCheck,
  customerData,
  customerOfUsers,
  paymentPlanRecipt,
  customerEdit,
  purchasePaidPrice,
};
