const mySqlPool = require("../../config/db"); // Assuming you have a MySQL pool setup in a config file

const userFetcherByEmail = async (id) => {
  try {
    const [rows, fields] = await mySqlPool.query(
      `SELECT * FROM users WHERE Email = ?`,
      [id]
    );
    return rows;
  } catch (e) {
    console.log(
      "There is Some Error In Fetching User information Using email " + e
    );
    throw e;
  }
};

const usersByOrganization = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM users WHERE Organization_Name_User = ?`,
      [id]
    );
    return rows;
  } catch (e) {
    console.log("There is Some In Fetching Users By Organization " + e);
    throw e;
  }
};

const usersAssociatedWithProject = async (id, id1) => {
  try {
    const query = `
    SELECT 
      u.Name AS User_Name, 
      u.Email, 
      u.User_Id, 
      u.Designation, 
      d.Name AS Designation_Name
    FROM 
      users u
    JOIN 
      project_user pu ON pu.User_Id = u.User_Id
    JOIN 
      designations d ON d.id = u.Designation
    WHERE 
      pu.Project_Name_User = ? 
      AND pu.Organization_Name_Reported = ?;
  `;

    // Execute the query using the MySQL pool
    const [results] = await mySqlPool.query(query, [id, id1]);
    return results;
  } catch (e) {
    console.log(
      "There is Some Error in Fetching users Assocaiated with Projects " + e
    );
    throw e;
  }
};

const userDelete = async (connection, id) => {
  try {
    await connection.beginTransaction(); // Start transaction

    // Check if user exists
    const [userRows] = await connection.query(
      `SELECT * FROM users WHERE User_Id = ?`,
      [id]
    );

    if (userRows.length === 0) {
      await connection.rollback(); // Rollback transaction if no user found
      return { success: false, message: "User not found" };
    }

    // Delete user by ID
    await connection.query(`DELETE FROM users WHERE User_Id = ?`, [id]);

    // Optional: Delete user by email if required
    if (userRows[0]?.Email) {
      await connection.query(`DELETE FROM employee_info WHERE Email = ?`, [
        userRows[0].Email,
      ]);
    }

    await connection.commit(); // Commit transaction
    return { success: true, message: "User successfully deleted" };
  } catch (error) {
    await connection.rollback(); // Rollback on error
    console.error("Error in userDelete:", error);
    throw error; // Rethrow error to be handled by the controller
  }
};

const userDataFetch = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT 
        u.User_Id,
        u.Name,
        u.Email,
        u.Phone,
        u.Address,
        u.Profile,
        u.Status,
        u.Designation,
        u.Password,
        d.Name As Designation_Name,
        g.Name As Group1,
        u.Country,
        u.City,
        u.State,
        u.Zip,
        u.Created_Date,
        u.Ip,
        u.Group1 As Group_Id
      FROM users AS u
      LEFT JOIN designations AS d ON d.id = u.Designation
     LEFT JOIN groups AS g ON g.id=u.Group1
      WHERE u.Organization_Name_User = ? 
        AND u.Designation <> ?`,
      [id, "Organization"]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching User Data " + e);
    throw e;
  }
};

const userById = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT 
        u.User_Id,
        u.Name,
        u.Email,
        u.Phone,
        u.Address,
        u.Profile,
        u.Status,
        u.Designation,
        u.Password,
        d.Name As Designation_Name,
        g.Name As Group1,
        u.Country,
        u.City,
        u.State,
        u.Zip,
        u.Created_Date,
        u.Ip,
        u.Group1 As Group_Id,
        u.Organization_Name_User
      FROM users AS u
      LEFT JOIN designations AS d ON d.id = u.Designation
     LEFT JOIN groups AS g ON g.id=u.Group1
      WHERE  u.User_Id=?
        AND u.Designation <> ? `,
      [id, "Organization"]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching User Data " + e);
    throw e;
  }
};

const projectAssignToUser = async (userId) => {
  try {
    const query = `
    SELECT 
    p.Project_Code, 
    p.Name, 
    p.Project_Type, 
    p.Assign_To, 
    p.Address, 
    p.Discription, 
    p.Status, 
    p.Country, 
    p.City, 
    p.Zip, 
    p.State, 
    p.Owner, 
    p.Created_Date,
  
   
    o.Organization_Name AS Project_Owner_Name 
FROM 
    project AS p
 JOIN 
    project_user AS pu ON pu.Project_Name_User = p.Project_Code AND pu.User_Id = ?
 JOIN 
    organization AS o ON o.id = p.Owner


    `;

    const [rows] = await mySqlPool.query(query, [userId]);
    return rows;
  } catch (e) {
    console.log("There is Some error in Fetching project Assign to user " + e);
    throw e;
  }
};

const groupFetcherForUser = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT g.Name, g.Permission 
       FROM users AS u 
       JOIN \`groups\` AS g ON u.Group1 = g.id 
       WHERE u.User_Id = ?`,
      [id]
    );
    return rows;
  } catch (e) {
    console.log(
      "There is Some Error in Fetching User Group Permision for user " + e
    );
    throw e;
  }
};

const reportingManager = async (id) => {
  try {
    // Query to find the reporting manager for the specified user
    const [rows] = await mySqlPool.query(
      `SELECT u.User_Id, u.Name, u.Email ,u.Address,u.Designation,u.Group1,u.Profile,u.Country,u.City,u.State,u.Zip,u.Created_Date,u.Age,u.Status
       FROM project_user AS pu 
       JOIN users AS u ON pu.Reporting_Manager = u.User_Id 
       WHERE pu.User_Id = ?`,
      [id]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching Reporting Mnager " + e);
    throw e;
  }
};

const getProjectsByUserId = async (connection, userId) => {
  const [projects] = await connection.query(
    `SELECT Project_Name_User 
     FROM project_user 
     WHERE User_Id = ?`,
    [userId]
  );
  return projects;
};
const getUserIdsByProjectNames = async (connection, projectNames) => {
  const [userIds] = await connection.query(
    `SELECT DISTINCT User_Id 
     FROM project_user 
     WHERE Project_Name_User IN (?)`,
    [projectNames]
  );
  return userIds;
};

const getUserDetailsByIds = async (connection, userIds, excludeUserId) => {
  const [userDetails] = await connection.query(
    `SELECT 
       u.User_Id,
       u.Name,
       u.Email,
       u.Phone,
       u.Address,
       u.Profile,
       u.Status,
       u.Designation,
       d.Name AS Designation_Name,
       g.Name AS Group1,
       u.Country,
       u.City,
       u.State,
       u.Zip,
       u.Created_Date,
       u.Ip
     FROM users AS u
     JOIN designations AS d ON d.id = u.Designation
     JOIN groups AS g ON g.id = u.Group1
     WHERE u.User_Id IN (?) AND u.User_Id != ?`,
    [userIds, excludeUserId]
  );
  return userDetails;
};

const propertySoldByUser = async (id, orgName) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM purchaseorder WHERE Lead_Owner_Name = ? AND Purchase_org_Name = ?`,
      [id, orgName]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching Propertyu sold By User " + e);
    throw e;
  }
};
const allLeadsofUser = async (id, orgName) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM leads WHERE Lead_owner = ? AND Organization_Name_Leads= ? `,
      [id, orgName]
    );
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching User Leads  " + e);
    throw e;
  }
};
const salesTagetByUser = async (userId) => {
  try {
    const sqlQuery = `
    SELECT 
      SUM(CAST(Purchase_Price AS DECIMAL(10, 2))) AS total_sales
    FROM purchaseorder 
    WHERE Lead_Owner_Name = ?;`;
    const [rows] = await mySqlPool.query(sqlQuery, [userId]);
    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching Salaes Target user  " + e);
    throw e;
  }
};

const averageDealClosureTime = async (organization) => {
  try {
    const query = `
    SELECT 
      AVG(DATEDIFF(Converted_Date, Date_Created)) AS averageClosureTimeInDays
    FROM leads
    WHERE Lead_Status = 'Closed Won-Converted'
      AND Lead_owner = ?
  `;

    const [results] = await mySqlPool.query(query, [organization]);
    return results;
  } catch (e) {
    console.log(
      "There is some Error in Fetching the Avergae Deal closure time " + e
    );
    throw e;
  }
};

const revenueInPipeLine = async (userId) => {
  const sqlQuery = `
  SELECT 
    SUM(CAST(f.List_Price AS DECIMAL(10, 2))) AS total_sales
  FROM 
    leads AS p
  JOIN 
    flat AS f 
  ON 
    f.Flat_id = p.Flat_Id
  WHERE 
    p.Lead_owner = ? AND p.Lead_Status!=? ;`; // Combine WHERE conditions properly
  try {
    const [rows] = await mySqlPool.query(sqlQuery, [
      userId,
      "Closed Won-Converted",
    ]);
    return rows;
  } catch (e) {
    console.log(
      "There is Some Error in Fetching User Revenue in Pipeline " + e
    );
    throw e;
  }
};

const leadsForaUser = async (userId) => {
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
      f.Unit_No,
      f.Block,
      c.Catagory,
      p.Name AS Project_Name_Data,
      u.Name AS Owner,
      f.Status AS Property_Status,
      l.Flat_id,f.Configuration
    FROM leads AS l
    LEFT JOIN flat AS f ON f.Flat_id = l.Flat_Id
    LEFT JOIN project AS p ON p.Project_Code = l.Project_Name
    LEFT JOIN catagory AS c ON c.Id = l.Property_Type
    JOIN users AS u ON u.User_Id = l.Lead_owner
    WHERE l.Lead_owner = ?
      AND l.Lead_Status != ?`,
      [userId, "Closed Won-Converted"]
    );
    return rows;
  } catch (e) {
    console.log(
      "There is Some Error in Fetching Leads for a Particular User " + e
    );
    throw e;
  }
};

const customerSelectionForAuser = async (userId) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT 
         c.First_Name, 
         c.Last_Name, 
         c.Email_Address, 
         pro.Name AS Project_Name_Main, 
         f.Unit_No As Unit_No, 
         f.Block AS Block ,
         p.Purchase_date,
         p.Purchase_id,
         p.Customer_id,
         p.List_Price,
         p.Purchase_Price,
         p.Additional_Cost,
         p.Project_Name ,
         p.Project_Catagory,
         p.Type,
         f.Configuration,
         p.Plan,
         p.Purchase_org_Name,
         p.Lead_Owner_Name,
         p.Date_Created,
         p.Main_Property_Id

       FROM purchaseorder AS p
       JOIN customer AS c ON p.Customer_id = c.Customer_Id
       JOIN project AS pro ON p.Project_Name = pro.Project_Code
       JOIN flat AS f ON p.Main_Property_Id = f.Flat_id
       WHERE p.Lead_Owner_Name = ?`,
      [userId]
    );

    return rows;
  } catch (e) {
    console.log(
      "There is Some Error in Fetching Customer for a Particular user " + e
    );
    throw e;
  }
};

const usersForAmin = async () => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT   u.User_Id,
         u.Name,
         u.Email,
         u.Phone,
         u.Address,
         u.Profile,
         u.Status,
         u.Designation,
         d.Name AS Designation_Name,
         g.Name As Group1,
        u.Country,
        u.City,
        u.State,
        u.Zip,
        u.Created_Date,
        u.Ip
            FROM users AS u
       JOIN designations AS d ON d.id = u.Designation
       JOIN groups AS g ON g.id = u.Group1  WHERE u.Designation != ?`,
      ["Admin"]
    );

    const [rows2] = await mySqlPool.query(
      `SELECT   User_Id,
         Name,
         Email,
         Phone,
         Address,
        Profile,
         Status,
        Designation,
        Group1,
         Country,
        City,
        State,
        Zip,
        Created_Date,
        Ip
        FROM users
       
        WHERE Designation != ? AND Designation=?`,
      ["Admin", "Organization"]
    );

    newArray = [...rows2, ...rows];
    return newArray;
  } catch (e) {
    console.log("There is Some Error in fetching Data For Admin  " + e);
    throw e;
  }
};

const UserWorkingOnProjects = async (userId) => {
  try {
    const [projectRows] = await mySqlPool.query(
      `SELECT Project_Name_User 
       FROM project_user 
       WHERE User_Id = ?`,
      [userId]
    );

    // If no projects are found, respond with a 404
    if (projectRows.length === 0) {
      return res.status(404).json({
        message: "No projects found for the specified user.",
        success: false,
        data: [],
      });
    }

    // Extract project names for the next query
    const projectNames = projectRows.map((row) => row.Project_Name_User);

    // Step 2: Fetch all user IDs working on the same projects
    const [userRows] = await mySqlPool.query(
      `SELECT DISTINCT User_Id 
       FROM project_user 
       WHERE Project_Name_User IN (?)`,
      [projectNames]
    );

    // Extract user IDs
    const userIds = userRows.map((row) => row.User_Id);

    // If no other users are found, respond with user-only details
    if (userIds.length === 0) {
      return res.status(200).json({
        message:
          "The user is not collaborating with other users on these projects.",
        success: true,
        data: [],
      });
    }

    // Step 3: Fetch user details for all users involved in these projects
    const [userDetails] = await mySqlPool.query(
      `SELECT 
         u.User_Id,
         u.Name,
         u.Email,
         u.Phone,
         u.Address,
         u.Profile,
         u.Status,
         u.Designation,
         d.Name AS Designation_Name,
         g.Name As Group1,
        u.Country,
        u.City,
        u.State,
        u.Zip,
        u.Created_Date,
        u.Ip
       FROM users AS u
       JOIN designations AS d ON d.id = u.Designation
       JOIN groups AS g ON g.id = u.Group1
       WHERE u.User_Id IN (?) `,
      [userIds]
    );

    return userDetails;
  } catch (e) {
    console.log(
      "There is Some Error in fetching user Working on a project " + e
    );
    throw e;
  }
};

const userByIdNormal = async (id) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM users WHERE User_Id = ?`,
      [id]
    );
    return rows;
  } catch (e) {
    console.log("There is some error in fetching user By Id " + e);
    throw e;
  }
};

module.exports = {
  userFetcherByEmail,
  usersByOrganization,
  usersAssociatedWithProject,
  userDelete,
  userDataFetch,
  userById,
  projectAssignToUser,
  groupFetcherForUser,
  reportingManager,
  getProjectsByUserId,
  getUserIdsByProjectNames,
  getUserDetailsByIds,
  propertySoldByUser,
  allLeadsofUser,
  salesTagetByUser,
  averageDealClosureTime,
  revenueInPipeLine,
  leadsForaUser,
  customerSelectionForAuser,
  usersForAmin,
  UserWorkingOnProjects,
  userByIdNormal,
};
