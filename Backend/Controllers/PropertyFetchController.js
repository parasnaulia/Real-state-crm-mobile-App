const mySqlPool = require("../config/db"); // Assuming you have a MySQL pool setup in a config file

const fetchFlats = async (project, Ptype, id) => {
  try {
    const query = `
      SELECT flat_id, Unit_No, Block, Floor, Configuration, Area, Carpet, Super_Build_up, 
             List_Price, Status, Facing, Bedrooms, Bathrooms, Balcony, Lead_Arrived
      FROM flat
      WHERE Project_Name_flats = ? 
        AND Property_type = ? 
        AND Type_Flat = ? 
        AND Status != ?
    `;

    // Execute the query and return the data
    const [flats] = await mySqlPool.query(query, [project, Ptype, id, "sold"]);
    return flats;
  } catch (e) {
    console.error("Error in flatService:", e);
    throw e;
  }
};

const propertyTypeList = async (ProjectName, Category) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM innerprojectview WHERE Project_Name_Plots = ? AND Property_Type_flat = ?`,
      [ProjectName, Category]
    );
    return rows;
  } catch (e) {
    console.error("Error in fetching  PropertyTypeList:", e);
    throw e;
  }
};

const projectCategory = async (id, orgName) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT c.Catagory AS Catagory, c.Id AS Id 
       FROM project_catagory AS pc 
       JOIN catagory AS c ON pc.Catagory = c.Id 
       WHERE pc.Project_Name_Catagory = ? AND pc.Organization_Name_catagory = ?`,
      [id, orgName] // Pass both parameters correctly here
    );
    return rows;
  } catch (e) {
    console.error("There is Some Error In Fetching Project category:", e);
    throw e;
  }
};
const projectFetcher = async (id) => {
  try {
    // Fetch project details
    const [projects] = await mySqlPool.query(
      `SELECT 
        p.Project_Code, p.Name, p.Project_Type, p.Assign_To, 
        p.Address, p.Discription, p.Status, p.Country, 
        p.City, p.Zip, p.State, p.Created_Date, 
        o.Organization_Name AS Project_Owner_Name, p.Owner 
      FROM project AS p
      JOIN organization AS o ON p.Owner = o.id
      WHERE p.Owner = ?`,
      [id]
    );

    if (projects.length === 0) {
      return []; // Return an empty array if no projects are found
    }

    // Fetch category details for all projects
    const [categories] = await mySqlPool.query(
      `SELECT 
        pc.Project_Name_Catagory AS Project_Code, 
        c.Catagory AS Category_Name, 
        c.Id AS Category_Id 
      FROM catagory AS c
      JOIN project_catagory AS pc ON pc.Catagory = c.Id
      WHERE pc.Project_Name_Catagory IN (?)`,
      [projects.map((project) => project.Project_Code)]
    );

    // Fetch owner details for all projects
    const [owners] = await mySqlPool.query(
      `SELECT 
        pc.Project_Name_Owner AS Project_Code, 
        pc.Name AS Project_Owner_Name, 
        pc.Email AS Owner_Email, 
        pc.Mobile AS Owner_Mobile 
      FROM projectowner AS pc
      WHERE pc.Project_Name_Owner IN (?)`,
      [projects.map((project) => project.Project_Code)]
    );

    // Map categories and owners to their respective projects
    const projectData = projects.map((project) => {
      return {
        ...project,
        Categories: categories
          .filter((category) => category.Project_Code === project.Project_Code)
          .map((category) => ({
            Category_Id: category.Category_Id,
            Category_Name: category.Category_Name,
          })),
        ProjectOwner: owners
          .filter((owner) => owner.Project_Code === project.Project_Code)
          .map((owner) => ({
            ownerName: owner.Project_Owner_Name,
            ownerEmail: owner.Owner_Email,
            ownerMobile: owner.Owner_Mobile,
          })),
      };
    });

    return projectData;
  } catch (error) {
    console.error("Error in projectFetcher function:", error.message);
    throw new Error("Database query failed");
  }
};
const projectFetcherForSpecificProject = async (id) => {
  try {
    // Fetch project details
    const [projects] = await mySqlPool.query(
      `SELECT 
        p.Project_Code, p.Name, p.Project_Type, p.Assign_To, 
        p.Address, p.Discription, p.Status, p.Country, 
        p.City, p.Zip, p.State, p.Created_Date, 
        o.Organization_Name AS Project_Owner_Name, p.Owner 
      FROM project AS p
      JOIN organization AS o ON p.Owner = o.id
      WHERE p.Project_Code = ?`,
      [id]
    );

    if (projects.length === 0) {
      return []; // Return an empty array if no projects are found
    }

    // Fetch category details for all projects
    const [categories] = await mySqlPool.query(
      `SELECT 
        pc.Project_Name_Catagory AS Project_Code, 
        c.Catagory AS Category_Name, 
        c.Id AS Category_Id 
      FROM catagory AS c
      JOIN project_catagory AS pc ON pc.Catagory = c.Id
      WHERE pc.Project_Name_Catagory IN (?)`,
      [projects.map((project) => project.Project_Code)]
    );

    // Fetch types associated with categories
    const categoriesWithTypes = await Promise.all(
      categories.map(async (category) => {
        const [types] = await mySqlPool.query(
          `SELECT id AS Type_Id, Type AS Type_Name ,Status
          FROM innerprojectview 
          WHERE Property_Type_flat = ?`,
          [category.Category_Id]
        );
        return { ...category, Types: types };
      })
    );

    // Fetch owner details for all projects
    const [owners] = await mySqlPool.query(
      `SELECT 
        pc.Project_Name_Owner AS Project_Code, 
        pc.Name AS Project_Owner_Name, 
        pc.Email AS Owner_Email, 
        pc.Mobile AS Owner_Mobile 
      FROM projectowner AS pc
      WHERE pc.Project_Name_Owner IN (?)`,
      [projects.map((project) => project.Project_Code)]
    );

    // Map categories and owners to their respective projects
    const projectData = projects.map((project) => {
      return {
        ...project,
        Categories: categoriesWithTypes
          .filter((category) => category.Project_Code === project.Project_Code)
          .map((category) => ({
            Category_Id: category.Category_Id,
            Category_Name: category.Category_Name,
            Types: category.Types.map((type) => ({
              Type_Id: type.Type_Id,
              Type_Name: type.Type_Name,
              status: type.Status,
            })),
          })),
        ProjectOwner: owners
          .filter((owner) => owner.Project_Code === project.Project_Code)
          .map((owner) => ({
            ownerName: owner.Project_Owner_Name,
            ownerEmail: owner.Owner_Email,
            ownerMobile: owner.Owner_Mobile,
          })),
      };
    });

    return projectData;
  } catch (error) {
    console.error("Error in projectFetcher function:", error.message);
    throw new Error("Database query failed");
  }
};

const unitFetcherHelper = async (
  project,
  catagory,
  type,
  orgName,
  config,
  block
) => {
  try {
    // Validate required inputs
    if (!project || !catagory || !type || !orgName || !config || !block) {
      throw new Error("All parameters are required to fetch unit numbers.");
    }

    const query = `
      SELECT * 
      FROM flat 
      WHERE Project_Name_flats = ? 
        AND Property_type = ? 
        AND Type_Flat = ? 
        AND Org_Name = ? 
        AND Configuration = ? 
        AND Block = ? 
        AND Status != ?`;

    const [rows] = await mySqlPool.query(query, [
      project,
      catagory,
      type,
      orgName,
      config,
      block,
      "sold",
    ]);

    return rows;
  } catch (e) {
    console.error("Error fetching the unit number of the property:", e.message);
    throw new Error(`Database Error: ${e.message}`);
  }
};

const planFetcherHelper = async (project, PType, Flat_Name) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT * FROM payment_plan WHERE Project_Name_Plan = ? AND Property_Type = ? AND Flat_Name=?`,
      [project, PType, Flat_Name]
    );
    return rows;
  } catch (e) {
    console.log(
      "There is Some Error In Fetching Plan During Lead Conversion For Customer" +
        e
    );
    throw e;
  }
};

const configFetcherHelper = async (project, category, type, orgName) => {
  try {
    const query = `
    SELECT * 
    FROM flat 
    WHERE Project_Name_flats = ? 
      AND Property_type = ? 
      AND Type_Flat = ? 
      AND Org_Name = ? 
      AND Status != ?
  `;

    const [rows] = await mySqlPool.query(query, [
      project,
      category,
      type,
      orgName,
      "sold",
    ]);
    return rows;
  } catch (e) {
    console.log(
      "There is Some Error In Fetching Configuration During Lead Conversion For Customer" +
        e
    );
    throw e;
  }
};

const blockFetcherHelper = async (project, catagory, type, orgName, config) => {
  try {
    const query = `SELECT * FROM flat WHERE Project_Name_flats = ? AND Property_type = ? AND Type_Flat = ? AND Org_Name = ? AND Configuration=? AND Status!=?`;

    // Ensure you are using the correct method to run queries
    const [rows] = await mySqlPool.query(query, [
      project,
      catagory,
      type,
      orgName,
      config,
      "sold",
    ]);
    return rows;
  } catch (e) {
    console.log(
      "There is Some Error In Fetching Block During Lead Conversion For Customer" +
        e
    );
    throw e;
  }
};

const listPriceHelper = async (
  project,
  category,
  type,
  orgName,
  config,
  block,
  unitNo
) => {
  try {
    const query = `
    SELECT * FROM flat 
    WHERE Project_Name_flats = ? 
    AND Property_type = ? 
    AND Type_Flat = ? 
    AND Org_Name = ? 
    AND Configuration = ? 
    AND Block = ? 
    AND Unit_No = ?
  `;

    const [rows] = await mySqlPool.query(query, [
      project,
      category,
      type,
      orgName,
      config,
      block,
      unitNo,
    ]);
    return rows;
  } catch (e) {
    console.log(
      "There is Some Error In Fetching Lsit price During Lead Conversion For Customer" +
        e
    );
    throw e;
  }
};

module.exports = {
  fetchFlats,
  propertyTypeList,
  projectCategory,
  projectFetcher,
  unitFetcherHelper,
  planFetcherHelper,
  configFetcherHelper,
  blockFetcherHelper,
  listPriceHelper,
  projectFetcherForSpecificProject,
};
