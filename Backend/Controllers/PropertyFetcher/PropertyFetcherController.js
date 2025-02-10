const mySqlPool = require("../../config/db");
const propertyFetch = async (project, Ptype, id, orgName) => {
  try {
    const query = `
        SELECT flat_id, Unit_No, Block, Floor, Configuration, Area, Carpet, Super_Build_up, 
               List_Price, Status, Facing, Bedrooms, Bathrooms, Balcony,Lead_Arrived
        FROM flat
        WHERE Project_Name_flats = ? AND Property_type = ? And Type_Flat=? 
      `;

    const [flats] = await mySqlPool.query(query, [project, Ptype, id, orgName]);
    return flats;
  } catch (e) {
    console.log(
      "There is Some Error In Fetching Properties For A Particular Project " + e
    );
    throw e;
  }
};

const amnetiesFetch = async (project, Ptype, flat_type) => {
  try {
    const query = `
        SELECT *
        FROM amenities
        WHERE Amenities_Project = ? AND Property_Type = ? AND flat_Type=? 
      `;

    const [amenities] = await mySqlPool.query(query, [
      project,
      Ptype,
      flat_type,
    ]);
    return amenities;
  } catch (e) {
    console.log("There is Some Error In fetching Amenties for a Property " + e);
    throw e;
  }
};

const propertyInsert = async (req) => {
  //   console.log(req.body);
  try {
    const {
      unitNumber,
      block,
      floor,
      configuration,
      area,
      carpet,
      superBuiltUp,
      listPrice,
      status,
      facing,
      bedrooms,
      bathrooms,
      balcony,
      Project_Name,
      Property_Type,
      Type_flat,
      orgName,
    } = req.body;

    const query = `
            INSERT INTO flat (
              Unit_No, Block, Floor, Configuration, Area, Carpet, Super_Build_up, 
              List_Price, Status, Facing, Bedrooms, Bathrooms, Balcony, Project_Name_flats, Property_type, Type_Flat, Org_Name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

    const values = [
      unitNumber,
      block,
      floor,
      configuration,
      area,
      carpet,
      superBuiltUp,
      listPrice,
      status,
      facing,
      bedrooms,
      bathrooms,
      balcony,
      Project_Name,
      Property_Type,
      Type_flat,
      orgName,
    ];

    const [result] = await mySqlPool.query(query, values);
    return result;
  } catch (e) {
    console.log("There is Some Error in Inserting Properties " + e);
    throw e;
  }
};

const dublicateHandling = async (generatedArray) => {
  try {
    const query = `
    INSERT INTO flat (
       Unit_No, Block, Floor, Configuration, Area, Carpet, Super_Build_up, 
      List_Price, Status, Facing, Bedrooms, Bathrooms, Balcony, Project_Name_flats, Property_type,Type_Flat,Org_Name
    ) VALUES ?
  `;

    // Format data to insert multiple rows, generating unique flat_id for each row
    const values = generatedArray.map((item) => [
      item.unitNo,
      item.block,
      item.floor,
      item.configuration,
      item.area,
      item.carpet,
      item.superBuiltUpArea,
      item.listPrice,
      item.status,
      item.facing,
      item.Bedrooms,
      item.Bathrooms,
      item.Balcony,
      item.Project_Name_flats,
      item.Property_type,
      item.Type_flat,
      item.orgName,
    ]);

    const [result] = await mySqlPool.query(query, [values]);
    return result;
  } catch (e) {
    console.log(
      "There is Some Error in Inserting multiple (Dublicating) Properties " + e
    );
    throw e;
  }
};

const propertyFetcher = async (req) => {
  try {
    const { id } = req.params;
    const {
      Unit_No,
      Block,
      Floor,
      Configuration,
      Area,
      Carpet,
      Super_Build_up,
      List_Price,
      Status,
      Facing,
      Bedrooms,
      Bathrooms,
      Balcony,
      Project_Name,
      Ptype,
      flat_id,
      flatType,
    } = req.body;

    const [result] = await mySqlPool.query(
      `UPDATE flat SET Unit_No = ?, Block = ?, Floor = ?, Configuration = ?,Area=?, Carpet = ? ,Super_Build_up = ?, 
        List_Price = ?, Status = ?, Facing = ?, Bedrooms = ?, Bathrooms = ?, 
        Balcony = ?, Project_Name_flats = ?, Property_Type = ?,Type_Flat=?
        WHERE Flat_id = ?`,
      [
        Unit_No,
        Block,
        Floor,
        Configuration,
        Area,
        Carpet,
        Super_Build_up,
        List_Price,
        Status,
        Facing,
        Bedrooms,
        Bathrooms,
        Balcony,
        Project_Name,
        Ptype,
        flatType,
        id,
      ]
    );
    return result;
  } catch (e) {
    console.log("There is Some Error in Updating the Property " + e);
    throw e;
  }
};

const amentiesPost = async (req) => {
  try {
    const {
      name,
      description,
      status,
      Project_Name,
      Property_type,
      flat_type,
      orgName,
    } = req.body;
    const query = `
    INSERT INTO amenities (Name, Discription, Status, Amenities_Project,Property_Type,flat_Type,Org_Name)
    VALUES (?, ?, ?, ?, ?,?,?)
  `;

    const values = [
      name,
      description,
      status,
      Project_Name,
      Property_type,
      flat_type,
      orgName,
    ];
    const [result] = await mySqlPool.query(query, values);
    return result;
  } catch (e) {
    console.log("There is Some Error in Editing The Amenties " + e);
    throw e;
  }
};

const amenitiesUpdate = async (values) => {
  try {
    const query = `UPDATE amenities SET Name = ?, Discription = ?, Status = ? WHERE Id = ?`;

    const [result] = await mySqlPool.query(query, values);
    return result;
  } catch (e) {
    console.log("There is Some Error in Editing Amenities " + e);
    throw e;
  }
};

const planUpdate = async (req) => {
  const { Plan_Size, plans, Project_Name, Property_Name, Flat_Name, orgName } =
    req.body;
  const PlansNames = req.body.Name;
  try {
    const [deleteRows] = await mySqlPool.query(
      `DELETE FROM basic_additional_plans 
             WHERE Project_Name_A_P = ? AND Property_Type_Plans = ? AND Plan_Name = ? AND Flat_Name = ?`,
      [Project_Name, Property_Name, PlansNames, Flat_Name]
    );
    let result;

    // Using a loop to insert each plan
    for (const plan of plans) {
      if (plan.type === "Basic") {
        // Insert Basic plan
        [result] = await mySqlPool.query(
          `INSERT INTO basic_additional_plans 
                  (Discription, Type, Percentage_Amount, Project_Name_A_P, Property_Type_Plans, Plan_Name, Flat_Name, Org_Name) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            plan.description,
            plan.type,
            plan.percentage,
            Project_Name,
            Property_Name,
            PlansNames,
            Flat_Name,
            orgName,
          ]
        );
      } else if (plan.type === "Additional") {
        // Insert Additional plan
        [result] = await mySqlPool.query(
          `INSERT INTO basic_additional_plans 
                  (Discription, Type, Amount, Project_Name_A_P, Property_Type_Plans, Plan_Name, Flat_Name, Org_Name) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            plan.description,
            plan.type,
            plan.amount,
            Project_Name,
            Property_Name,
            PlansNames,
            Flat_Name,
            orgName,
          ]
        );
      }
    }
    return result;
  } catch (e) {
    console.log("There is Some Error in Updating the Amenities " + e);
    throw e;
  }
};

const propertiesById = async (id) => {
  try {
    const query = `
        SELECT Flat_id, Unit_No, Block, Floor, Configuration, Area, Carpet, Super_Build_up, 
               List_Price, Status, Facing, Bedrooms, Bathrooms, Balcony,Lead_Arrived,Project_Name_flats,Property_type,Type_Flat
        FROM flat
        WHERE Flat_id=?
      `;

    const [flats] = await mySqlPool.query(query, [id]);
    return flats;
  } catch (e) {
    console.log("There is Some error in fetching Properties By Id " + e);
    throw e;
  }
};

const propertyPurchasedByCustomer = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `
            SELECT 
              p.Purchase_id, 
              p.Customer_id, 
              c.First_Name, 
              c.Last_Name ,
              c.Contact_Number,
              c.Email_Address,
              c.Address
            FROM 
              purchaseorder AS p 
            JOIN 
              customer AS c 
            ON 
              p.Customer_id = c.Customer_Id 
            WHERE 
              p.Main_Property_Id = ?`,
      [id]
    );
    return rows;
  } catch (e) {
    console.log(
      "There is Some Error in Fetching Property Sold To Customer Data " + e
    );
    throw e;
  }
};

const leadsArrivedAt = async (flatId) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM leads WHERE Flat_Id = ?`,
      [flatId]
    );
    return rows;
  } catch (e) {
    console.log("There is Some error in Fetching Leads arrived At " + e);
    throw e;
  }
};
const projectForUser = async (userId) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT p.Project_Code, p.Name 
       FROM project_user AS pu 
       JOIN project AS p 
       ON pu.Project_Name_User = p.Project_Code 
       WHERE pu.User_Id = ?`,
      [userId]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching Users property " + e);
    throw e;
  }
};
const customerFetcher = async (email, name) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM customer WHERE Email_Address = ? AND Organization_Name = ?`,
      [email, name]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error In Fetching Customer Data " + e);
    throw e;
  }
};
const customercheck = async (email, name) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM customer WHERE Email_Address = ? AND Organization_Name = ?`,
      [email, name]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching customer data " + e);
    throw e;
  }
};

const fetchCategory = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * From catagory Where Organization_Name_Catagories=?`,
      [id]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in fetching category " + e);
    throw e;
  }
};
const flatById = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM flat WHERE Flat_id = ?`,
      [id]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching Flats By Id " + e);
    throw e;
  }
};

const projectReporting = async (id) => {
  try {
    const [projects] = await mySqlPool.query(
      "SELECT * FROM project_user WHERE User_Id = ?",
      [id]
    );
    const query = `
    SELECT 
      u.User_Id AS Id, 
      u.name, 
      u.Designation, 
      u.email, 
      d.Name AS Designation_Name
    FROM 
      users u
    JOIN 
      project_user pu ON u.User_Id = pu.User_Id
    JOIN 
      designations d ON d.id = u.Designation
    WHERE 
      pu.Project_Name_User = ? 
      AND u.User_Id != ?;
  `;
    const reportingData = await Promise.all(
      projects.map(async (project) => {
        // Fetch other users working on the same project
        const [projectUsers] = await mySqlPool.query(query, [
          project.Project_Name_User,
          id,
        ]);

        return {
          project: project.Project_Name_User,
          reportedTo: projectUsers, // Array of users working on the project
          selectedReportedTo: project.Reporting_Manager || "", // Pre-selected manager if any
        };
      })
    );
    return reportingData;
  } catch (e) {
    console.log(
      "There is Some Error in Fetching Reporting Manager during Project Selection " +
        e
    );
    throw e;
  }
};

const typesById = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM innerprojectview WHERE id = ?`,
      [id]
    );

    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching Types for Properties " + e);
    throw e;
  }
};
const paymentPlanPurchase = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM perchaseorderpayment WHERE Purchase_Id = ?`,
      [id]
    );
    // console.log(rows);
    // console.log("niceeee");

    //  const filterData = rows.filter((item) => {
    //   if (item?.Type === "Additional") {
    //     return item?.Amount > item?.Paid_Amount;
    //   } else if (item?.Type === "Basic") {
    //     const totalAmount = Math.round(
    //       (Number(item.Percentage_Amount) / 100) *
    //         Number(property.Purchase_Price)
    //     );
    //   }
    // });
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching Payment plan Purchase " + e);
    throw e;
  }
};
const paymentPlanRecipt = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `
      SELECT * 
      FROM perchaseorderpayment 
      WHERE Purchase_Id = ? AND CAST(Remain_Amount AS DECIMAL) > 0
      `,
      [id]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching Recipt Data " + e);
    throw e;
  }
};
const allProject = async () => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT p.Project_Code,p.Name,p.Project_Type,p.Assign_To,p.Address,p.Discription,p.Status,p.Country,p.City,p.Zip,p.State,p.Created_Date,o.Organization_Name AS Project_Owner_Name ,p.Owner FROM project AS p JOIN organization AS o ON p.Owner=o.id`
    );

    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching All Projects " + e);
    throw e;
  }
};
const categoryProject = async (projectId) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT c.* 
       FROM project_catagory pc
       INNER JOIN catagory c ON pc.Catagory = c.Id
       INNER JOIN project p ON pc.Project_Name_Catagory = p.Project_Code
       WHERE p.Project_Code = ? 
       `,
      [projectId]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching Project Categories " + e);
    throw e;
  }
};

const mainPaymentPlan = async (project, category, flat, name) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM basic_additional_plans WHERE Project_Name_A_P = ? AND Property_Type_Plans = ? AND Plan_Name = ? AND Flat_Name = ?`,
      [project, category, name, flat]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching main Payment Plan " + e);
    throw e;
  }
};

const paymentBycategory = async (Project, PType, Plan, Flat_Name) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM basic_additional_plans WHERE Project_Name_A_P = ? AND Property_Type_Plans = ? AND Plan_Name=? AND Flat_Name=?`,
      [Project, PType, Plan, Flat_Name]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching Payment By category " + e);
    throw e;
  }
};

const leadsArrivedAtProperty = async (orgName, pName) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT Flat_Id FROM leads WHERE Organization_Name_Leads = ? AND Project_Name=?`,
      [orgName, pName]
    );
    return rows;
  } catch (e) {
    console.log(
      "There is Some Error in Fetching Leads Arrived At Property " + e
    );
    throw e;
  }
};
module.exports = {
  propertyFetch,
  amnetiesFetch,
  propertyInsert,
  dublicateHandling,
  propertyFetcher,
  amentiesPost,
  amenitiesUpdate,
  planUpdate,
  propertiesById,
  propertyPurchasedByCustomer,
  leadsArrivedAt,
  projectForUser,
  customerFetcher,
  customercheck,
  fetchCategory,
  flatById,
  projectReporting,
  typesById,
  paymentPlanPurchase,
  paymentPlanRecipt,
  allProject,
  categoryProject,
  mainPaymentPlan,
  paymentBycategory,
  leadsArrivedAtProperty,
};
