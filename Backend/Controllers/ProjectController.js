const MainProjectEditHelper = async (req, connection) => {
  const {
    name,
    projectTypes,
    Address,
    discription,
    status,
    country,
    city,
    zip,
    state,
    Owner_Name,
    OldPName,
    dateCreated,
    Id,
  } = req.body;

  try {
    // Check if the project with the given name and owner already exists
    const [existingProject] = await connection.query(
      `SELECT * FROM project WHERE Name = ? AND Owner = ?`,
      [name, Owner_Name]
    );

    if (existingProject.length > 0 && OldPName !== name) {
      throw new Error("The Project name already exists for this organization.");
    }

    // Update project details
    const [result] = await connection.query(
      `UPDATE project
           SET Name = ?, Project_Type = ?, Address = ?, Discription = ?, Status = ?, 
               Country = ?, City = ?, Zip = ?, State = ?, Owner = ?, Created_Date = ?
           WHERE Project_Code = ? AND Owner = ?`,
      [
        name,
        projectTypes.toString(),
        Address,
        discription,
        status,
        country,
        city,
        zip,
        state,
        Owner_Name,
        dateCreated,
        Id,
        Owner_Name,
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error("Project not found or no changes made.");
    }
  } catch (error) {
    throw new Error(error.message || "Error updating project details.");
  }
};

const updateProjectOwnerHelper = async (req, connection) => {
  const { multiuser, Owner_Name, Id } = req.body;
  console.log(req.body);

  try {
    // Delete existing owners
    await connection.query(
      `DELETE FROM projectowner WHERE Project_Name_Owner = ? AND Organization_Name_Owner = ?`,
      [Id, Owner_Name]
    );

    if (multiuser && Array.isArray(multiuser)) {
      const insertValues = multiuser.map((owner) => [
        owner.name,
        owner.email,
        owner.mobile,
        Id,
        Owner_Name,
      ]);

      await connection.query(
        `INSERT INTO projectowner (Name, Email, Mobile, Project_Name_Owner, Organization_Name_Owner) VALUES ?`,
        [insertValues]
      );
    }
  } catch (error) {
    throw new Error(error.message || "Error updating project owners.");
  }
};

const insertProjectCategoryHelper = async (req, connection) => {
  const {
    Id: projectName,
    projectTypes: categories,
    Owner_Name: ownerName,
  } = req.body;

  if (!Array.isArray(categories)) {
    throw new Error("Invalid data: projectTypes should be an array.");
  }

  try {
    // Delete existing categories
    await connection.query(
      `DELETE FROM project_catagory WHERE Project_Name_Catagory = ? AND Organization_Name_catagory = ?`,
      [projectName, ownerName]
    );

    // Insert new categories
    const insertValues = categories.map((category) => [
      category,
      projectName,
      ownerName,
    ]);

    await connection.query(
      `INSERT INTO project_catagory (Catagory, Project_Name_Catagory, Organization_Name_catagory) VALUES ?`,
      [insertValues]
    );
  } catch (error) {
    throw new Error(error.message || "Error updating project categories.");
  }
};

const projectOwnerPostHelper = async (req, connection) => {
  const { multiuser, Owner_Name } = req.body;
  const primaryKey = req.primaryKey;

  try {
    // Validate input data
    if (!multiuser || !Array.isArray(multiuser)) {
      throw new Error("Invalid data: multiuser must be a non-empty array.");
    }

    // Prepare the bulk insert values
    const values = multiuser.map((owner) => [
      owner.name,
      owner.email,
      owner.mobile,
      primaryKey,
      Owner_Name,
    ]);

    // Insert data into projectowner
    const [result] = await connection.query(
      `INSERT INTO projectowner (Name, Email, Mobile, Project_Name_Owner, Organization_Name_Owner) VALUES ?`,
      [values]
    );

    if (result.affectedRows === 0) {
      throw new Error("No project owner records were inserted.");
    }
  } catch (error) {
    throw new Error(error.message || "Error during project owner insertion.");
  }
};

const projectInsertionMainHelper = async (req, connection) => {
  const {
    name,
    projectTypes,
    Address,
    discription,
    status,
    country,
    city,
    zip,
    state,
    Owner_Name,
  } = req.body;

  const Pcode = `${name}_${Math.floor(10000 + Math.random() * 90000)}`;
  const today = new Date();
  const dateString = today.toISOString().split("T")[0]; // Format: YYYY-MM-DD

  try {
    // Check if the project already exists
    const [existingProject] = await connection.query(
      `SELECT * FROM project WHERE Name = ? AND Owner = ?`,
      [name, Owner_Name]
    );

    if (existingProject.length > 0) {
      throw new Error("Project name already exists for this owner.");
    }

    // Insert the new project
    const [result] = await connection.query(
      `INSERT INTO project (Name, Project_Type, Assign_To, Address, Discription, Status, Country, City, Zip, State, Owner, Created_Date, Project_Code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        projectTypes.toString(),
        "No one",
        Address,
        discription,
        status,
        country,
        city,
        zip,
        state,
        Owner_Name,
        dateString,
        Pcode,
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to insert project.");
    }

    // Return the primary key of the inserted project
    return { pKey: result.insertId };
  } catch (error) {
    throw new Error(error.message || "Error during project insertion.");
  }
};
const insertProjectCategory = async (req, connection) => {
  const { projectTypes, Owner_Name } = req.body;
  const primaryKey = req.primaryKey;

  try {
    // Validate projectTypes
    if (!Array.isArray(projectTypes) || projectTypes.length === 0) {
      throw new Error("Invalid data: projectTypes must be a non-empty array.");
    }

    // Prepare the bulk insert values
    const values = projectTypes.map((category) => [
      primaryKey,
      category,
      Owner_Name,
    ]);

    // Insert data into project_catagory
    const [result] = await connection.query(
      `INSERT INTO project_catagory (Project_Name_Catagory, Catagory, Organization_Name_catagory) VALUES ?`,
      [values]
    );

    if (result.affectedRows === 0) {
      throw new Error("No project categories were inserted.");
    }
  } catch (error) {
    throw new Error(
      error.message || "Error during project category insertion."
    );
  }
};

const insertToPaymentMain = async (req, connection) => {
  const { Project_Name, Property_Name, Plan_Size, Flat_Name, orgName } =
    req.body;

  const PlanName = `Plan-${Plan_Size}`;

  try {
    const [result] = await connection.query(
      `INSERT INTO payment_plan (Name, Project_Name_Plan, Property_Type, Flat_Name, Org_Name) VALUES (?, ?, ?, ?, ?)`,
      [PlanName, Project_Name, Property_Name, Flat_Name, orgName]
    );

    if (!result.insertId) {
      throw new Error("Failed to insert data into payment_plan table.");
    }

    console.log("Payment Plan inserted with ID:", result.insertId);
    return result.insertId; // Return the inserted payment plan ID
  } catch (error) {
    console.error("Error inserting into payment_plan:", error.message);
    throw new Error("Failed to insert Payment Plan data.");
  }
};

// Helper Function to Insert Basic and Additional Plans
const AddPlan = async (req, connection, paymentPlanId) => {
  const { Project_Name, Property_Name, Plan_Size, Flat_Name, orgName, plans } =
    req.body;

  const PlanName = `Plan-${Plan_Size}`;

  if (!Array.isArray(plans) || plans.length === 0) {
    throw new Error("Invalid 'plans' data. It should be a non-empty array.");
  }

  try {
    for (const plan of plans) {
      const { description, type, percentage, amount } = plan;

      if (type === "Basic") {
        await connection.query(
          `INSERT INTO basic_additional_plans 
            (Discription, Type, Percentage_Amount, Project_Name_A_P, Property_Type_Plans, Plan_Name, Flat_Name, Org_Name) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            description,
            type,
            percentage,
            Project_Name,
            Property_Name,
            PlanName,
            Flat_Name,
            orgName,
          ]
        );
      } else if (type === "Additional") {
        await connection.query(
          `INSERT INTO basic_additional_plans 
            (Discription, Type, Amount, Project_Name_A_P, Property_Type_Plans, Plan_Name, Flat_Name, Org_Name) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            description,
            type,
            amount,
            Project_Name,
            Property_Name,
            PlanName,
            Flat_Name,
            orgName,
          ]
        );
      } else {
        console.warn("Invalid plan type detected:", type);
        throw new Error("Invalid plan type provided.");
      }
    }

    console.log("All plans inserted successfully.");
  } catch (error) {
    console.error("Error inserting plans into basic_additional_plans:", error);
    throw new Error("Failed to insert Basic/Additional Plans.");
  }
};

module.exports = {
  MainProjectEditHelper,
  updateProjectOwnerHelper,
  insertProjectCategoryHelper,

  projectInsertionMainHelper,

  projectOwnerPostHelper,

  insertProjectCategory,

  insertToPaymentMain,
  AddPlan,
};
