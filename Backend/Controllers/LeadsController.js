const dayjs = require("dayjs");

const { sendNotification } = require("../WebSockets/websocket");
const assignLeadsUpdate = async (req, connection) => {
  const { Task_id, user_id } = req.body;
  console.log(Task_id);
  console.log(user_id);

  try {
    // Update activity_logs table
    const [result] = await connection.query(
      `UPDATE activity_logs
         SET Assigned_To = ?
         WHERE Task_ID = ?`,
      [user_id, Task_id]
    );

    // Ensure the row was updated
    if (result.affectedRows === 0) {
      throw new Error(`No task found with ID: ${Task_id}`);
    }

    console.log(`Activity log updated for Task ID: ${Task_id}`);
  } catch (err) {
    console.error("Error in assignLeadsUpdate:", err.message);
    throw new Error("Failed to update activity logs.");
  }
};
const updateActivityLogs = async (req, connection) => {
  const { user_id } = req.body; // Extract relevant data
  const { id: Task_id } = req.params; // Extract Task_id from the route

  try {
    // Verify if the task exists
    const [taskExists] = await connection.query(
      `SELECT * FROM user_task_activitylogs WHERE Task_id = ?`,
      [Task_id]
    );

    if (taskExists.length === 0) {
      throw new Error(`No task found with ID: ${Task_id}`);
    }

    // Update activity_logs table
    const [activityLogResult] = await connection.query(
      `UPDATE activity_logs 
         SET Assigned_To = ? 
         WHERE Task_ID = ?`,
      [user_id, Task_id]
    );

    if (activityLogResult.affectedRows === 0) {
      throw new Error("Failed to update activity logs.");
    }

    // Update user_task_activitylogs table
    const [taskLogResult] = await connection.query(
      `UPDATE user_task_activitylogs 
         SET User_Name = ? 
         WHERE Task_id = ?`,
      [user_id, Task_id]
    );

    if (taskLogResult.affectedRows === 0) {
      throw new Error("Failed to update user task activity logs.");
    }

    console.log("This iis tas and user");
    console.log(Task_id);
    console.log(user_id);

    sendNotification(user_id, {
      Task_id,
      user_id,
      message: `You have been assigned a new task with ID: ${Task_id}`,
    });

    console.log(`Task activity logs updated for Task ID: ${Task_id}`);
  } catch (err) {
    console.error("Error in updateActivityLogs:", err.message);
    throw new Error("Failed to update user task activity logs.");
  }
};
const ActivityLogMiddleWareInsertion = async (req, connection) => {
  console.log(req.body);
  const {
    taskTitle,
    taskType,
    description,
    dueDate,
    priority,
    assignedTo,
    status,
    leadId,
    reminders,
    notes,
    next_follow_date,
    MainName,
  } = req.body;

  console.log(req.body);

  console.log("This is activity logsgsgsg");

  // Format current date and time to 'YYYY-MM-DD HH:MM:SS'
  const dateCreated = new Date().toISOString().slice(0, 19).replace("T", " ");

  try {
    // Insert data into `activity_logs`
    const [result] = await connection.query(
      `INSERT INTO activity_logs 
        (Task_Title, Task_Type, Description, Due_Date, Priority, Assigned_To, Status, Lead_Id, Reminders, Notes, Next_follow_up_date, Organization_Name_Activity, Assign_To_Email, Created_Date) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskTitle,
        taskType,
        description,
        dueDate,
        priority,
        assignedTo,
        status,
        leadId,
        reminders,
        notes,
        next_follow_date,
        MainName,
        assignedTo,
        dateCreated,
      ]
    );

    console.log(
      `Activity log inserted successfully with ID: ${result.insertId}`
    );
    return { insertedId: result.insertId };
  } catch (error) {
    console.error("Error inserting activity log:", error.message);
    throw new Error("Failed to insert activity log into the database.");
  }
};

const insertInUserTask = async (req, connection) => {
  const { assignedTo, leadId, taskTitle, AssignedUser, MainName, dueDate } =
    req.body;

  try {
    // Insert data into `user_task_activitylogs`
    const [result] = await connection.query(
      `INSERT INTO user_task_activitylogs 
        (User_Name, Task_id, Lead_Id_Link, Task_Name, User_MainName, OrganizationName_Task, Due_Date) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        assignedTo,
        req.insertedLogId, // ID inserted from activity_logs
        leadId,
        taskTitle,
        AssignedUser,
        MainName,
        dueDate,
      ]
    );

    console.log(
      `User task activity log inserted successfully for Task ID: ${req.insertedLogId}`
    );
  } catch (error) {
    console.error("Error inserting user task activity log:", error.message);
    throw new Error(
      "Failed to insert user task activity log into the database."
    );
  }
};

const customerInsertionHelper = async (req, connection) => {
  const { data, formData } = req.body;

  console.log(data);
  console.log(formData);

  const {
    Email_Address,
    First_Name,
    Last_Name,
    Contact_Number,
    Age,
    Gender,
    Address,
    Country,
    State,
    City,
    Zip_code,
    Lead_owner,
    Referrer,
    Source_of_Inquiry,
    Lead_ID,
    Property_Type,
    Project_Name,
    Type,
    Configuration,
    Unit_No,
    Block,
    Owner_Email,
    Occupation,
  } = data;

  const {
    projectCategory,
    type,
    configuration,
    unitNo,
    ProjectName,
    orgName,
    block,
  } = formData;

  const Created_Date = new Date();

  try {
    const [flatData] = await connection.query(
      `SELECT * FROM flat WHERE Org_Name=? AND Type_Flat=? AND Property_type=? AND Project_Name_flats=? AND Unit_No=? AND Block=? AND Configuration=?`,
      [
        orgName,
        type,
        projectCategory,
        ProjectName,
        unitNo,
        block,
        configuration,
      ]
    );

    if (flatData.length === 0) {
      throw new Error("The specified property is not available.");
    }

    req.flatData = flatData[0]?.Flat_id;

    const [existingCustomer] = await connection.query(
      `SELECT * FROM customer WHERE Email_Address = ? AND Organization_Name = ?`,
      [Email_Address, orgName]
    );

    if (existingCustomer.length > 0) {
      const [updateResult] = await connection.query(
        `UPDATE customer SET Property_Type=?, Project_Name=?, Type=?, Configuration=?, Unit_No=?, Created_Date=?, Block=?, Lead_owner=?, Lead_ID=?, Referrer=?, Source_of_Inquiry=?, Occupation=?, Flat_id=? WHERE Email_Address=? AND Organization_Name=?`,
        [
          projectCategory,
          ProjectName,
          type,
          configuration,
          unitNo,
          Created_Date,
          block,
          Lead_owner,
          Lead_ID,
          Referrer,
          Source_of_Inquiry,
          Occupation,
          flatData[0]?.Flat_id,
          Email_Address,
          orgName,
        ]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error("Failed to update customer details.");
      }

      return {
        customerId: existingCustomer[0].Customer_Id,
        flatId: flatData[0]?.Flat_id,
      };
    } else {
      // console.log(object)
      const [insertResult] = await connection.query(
        `INSERT INTO customer (First_Name, Last_Name, Contact_Number, Email_Address, Age, Gender, Address, Country, State, City, Zip_code, Lead_owner, Referrer, Source_of_Inquiry, Lead_ID, Property_Type, Organization_Name, Owner_Email, Project_Name, Type, Configuration, Unit_No, Block, Created_Date, Occupation, Flat_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          First_Name,
          Last_Name,
          Contact_Number,
          Email_Address,
          Age,
          Gender,
          Address,
          Country,
          State,
          City,
          Zip_code,
          Lead_owner,
          Referrer,
          Source_of_Inquiry,
          Lead_ID,
          projectCategory,
          orgName,
          Owner_Email,
          ProjectName,
          type,
          configuration,
          unitNo,
          block,
          Created_Date,
          Occupation,
          flatData[0]?.Flat_id,
        ]
      );

      if (insertResult.affectedRows === 0) {
        throw new Error("Failed to insert new customer.");
      }

      return {
        customerId: insertResult.insertId,
        flatId: flatData[0]?.Flat_id,
      };
    }
  } catch (error) {
    console.error("Error in customer insertion:", error.message);
    throw new Error("Failed to process customer data.");
  }
};

// Helper to insert purchase order data
const purchaseOrderInsertionHelper = async (req, connection) => {
  const {
    projectCategory,
    type,
    configuration,
    unitNo,
    ProjectName,
    orgName,
    purchasePrice,
    List_Price,
    plans,
    block,
    Owner_Email,
    Owner_Name,
  } = req.body.formData;

  const generateDateOfIssue = () => dayjs().format("YYYY-MM-DD");

  try {
    const [insertResult] = await connection.query(
      `INSERT INTO purchaseorder (Customer_id, List_Price, Purchase_Price, Project_Name, Project_Catagory, Type, Configuration, Unit_No, Plan, Block, Purchase_org_Name, Purchase_date, Lead_Owner_Email, Lead_Owner_Name, Date_Created, Main_Property_Id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.uniqueCustomer,
        List_Price,
        purchasePrice,
        ProjectName,
        projectCategory,
        type,
        configuration,
        unitNo,
        plans,
        block,
        orgName,
        generateDateOfIssue(),
        Owner_Email,
        Owner_Name,
        req.body.data.Date_Created,
        req.flatData,
      ]
    );

    if (insertResult.affectedRows === 0) {
      throw new Error("Failed to insert purchase order.");
    }

    return { propertyId: insertResult.insertId };
  } catch (error) {
    console.error("Error in purchase order insertion:", error.message);
    throw new Error("Failed to process purchase order data.");
  }
};

const paymentPlanInsertion = async (req, connection) => {
  // Destructure required properties from the formData
  const {
    projectCategory,
    type,
    configuration,
    unitNo,
    ProjectName,
    orgName,
    purchasePrice,
    List_Price,
    plans,
    block,
    customer_Id,
    Owner_Email,
    Owner_Name,
  } = req.body.formData;

  // Helper function to generate today's date in the format YYYY-MM-DD
  const generateDateOfIssue = () => dayjs().format("YYYY-MM-DD");

  try {
    // Step 1: Retrieve payment plan details from the database
    const [rows] = await connection.query(
      `SELECT Discription, Amount, Percentage_Amount, Type 
         FROM basic_additional_plans 
         WHERE Plan_Name = ? 
         AND Flat_Name = ? 
         AND Property_Type_Plans = ? 
         AND Project_Name_A_P = ? 
         AND Org_Name = ?`,
      [plans, type, projectCategory, ProjectName, orgName]
    );

    if (rows.length === 0) {
      throw new Error("No plans found. Failed to insert payment plan details.");
    }

    // Step 2: Iterate through each plan and insert corresponding payment details
    for (const row of rows) {
      const amountToInsert = row.Type === "Additional" ? row.Amount : null;
      const percentageAmountToInsert =
        row.Type === "Basic" ? row.Percentage_Amount : null;

      const [result] = await connection.query(
        `INSERT INTO perchaseorderpayment
              (Purchase_Id, Issue_Date, Discription, Type, Amount, Percentage_Amount, PoP_OrgName,Project_id_code,Catagory_Plan,Type_Plan,Plans) 
              VALUES (?, ?, ?, ?, ?, ?, ?,?,?,?,?)`,
        [
          req.generateUniqueNumber,
          generateDateOfIssue(),
          row.Discription,
          row.Type,
          amountToInsert,
          percentageAmountToInsert,
          orgName,
          ProjectName,
          projectCategory,
          type,
          plans,
        ]
      );

      if (result.affectedRows === 0) {
        throw new Error(
          "Failed to insert payment plan details into purchase order payment."
        );
      }
    }
  } catch (error) {
    console.error(
      "Error occurred while inserting payment plan details: ",
      error.message
    );
    throw new Error(
      "Failed to process payment plan details during the transaction."
    );
  }
};

const deleteLeadsAndSoldStatus = async (req, connection) => {
  // Destructure required fields from the formData
  const generateDateOfIssue = () => dayjs().format("YYYY-MM-DD");
  const {
    type,
    projectCategory,
    ProjectName,
    block,
    configuration,
    unitNo,
    Lead_ID,
  } = req.body.formData;

  try {
    // Step 1: Update the flat status to "sold"
    const [updateResult] = await connection.query(
      `UPDATE flat
             SET Status = ?
             WHERE Project_Name_flats = ? 
             AND Property_type = ? 
             AND Type_Flat = ? 
             AND Block = ? 
             AND Configuration = ? 
             AND Unit_No = ?`,
      ["sold", ProjectName, projectCategory, type, block, configuration, unitNo]
    );

    if (updateResult.affectedRows === 0) {
      throw new Error(
        "Failed to update flat status. No matching property found."
      );
    }

    // console.log(Lead_ID);
    console.log("This is Lead Id");

    // Step 2: Delete the associated lead
    const [deleteLeadResult] = await connection.query(
      `UPDATE leads SET Lead_Status = ?, Converted_Date = ?,Created_Date=? WHERE Lead_ID = ?`,
      [
        "Closed Won-Converted",
        generateDateOfIssue(),
        generateDateOfIssue(),
        Lead_ID,
      ]
    );

    if (deleteLeadResult.affectedRows === 0) {
      throw new Error(
        "Failed to delete lead. No matching lead found for the provided Lead_ID."
      );
    }
  } catch (error) {
    console.error(
      "Error occurred while updating flat status and deleting lead: ",
      error.message
    );
    throw new Error(
      "Failed to update property status or delete associated lead."
    );
  }
};

const leadsInsertionData = async (leadData, connection) => {
  try {
    // Destructure data from leadData
    const {
      firstName,
      lastName,
      emailAddress,
      contactNumber,
      age,
      gender,
      Address,
      country,
      state,
      city,
      zipcode,
      leadStatus,
      referrerName,
      sourceOfEnquiry,
      budget,
      projectCategory,
      notes,
      tentativePurchaseDate,
      finance,
      unitNo,
      configuration,
      type,
      ProjectName,
      block,
      occupation,
      MainOrgName,
      MainOrgEmail,
      User_id,
      tentativePrice,
    } = leadData;

    // Generate unique number and current date
    const uniqueNumber = `${Date.now()}${Math.floor(
      Math.random() * 1_000_000_000
    )}`;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format

    // Check for existing lead or user
    const [existingLeadRows] = await connection.query(
      `SELECT * FROM leads WHERE Email_Address = ? AND Organization_Name_Leads = ? AND Lead_Status!=?`,
      [emailAddress, MainOrgName, "Closed Won-Converted"]
    );

    const [existingUserRows] = await connection.query(
      `SELECT * FROM users WHERE Email = ? AND Organization_Name_User = ?`,
      [emailAddress, MainOrgName]
    );

    if (existingLeadRows?.length > 0 || existingUserRows?.length > 0) {
      throw new Error("User Already Present");
    }

    // Retrieve Flat ID if applicable
    let flatIdData = null;
    if (unitNo && configuration && block && projectCategory && ProjectName) {
      const [flatRows] = await connection.query(
        `SELECT Flat_id FROM flat 
         WHERE Unit_No = ? AND Configuration = ? AND Block = ? 
         AND Project_Name_flats = ? AND Property_type = ? AND Type_Flat = ? AND Org_Name = ?`,
        [
          unitNo,
          configuration,
          block,
          ProjectName,
          projectCategory,
          type,
          MainOrgName,
        ]
      );
      flatIdData = flatRows.length > 0 ? flatRows[0]?.Flat_id : null;
    }

    // Insert new lead
    const [result] = await connection.query(
      `INSERT INTO leads (
         First_Name, Last_Name, Contact_Number, Email_Address, Age, Gender, Address, Country, State, 
         City, Zip_code, Lead_owner, Lead_Status, Referrer, Source_of_Inquiry, Date_Created, 
         Property_Type, Budget, Organization_Name_Leads, Organiztion_Email, Notes, 
         Tentative_Purchase_Date, Finance, Unit_No, Configuration, Type, Project_Name, Block, 
         Occupation, Created_Date, Flat_Id,Tentative_Purchase_Price
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
      [
        firstName,
        lastName,
        contactNumber,
        emailAddress,
        age,
        gender,
        Address,
        country,
        state,
        city,
        zipcode,
        User_id,
        leadStatus,
        referrerName,
        sourceOfEnquiry,
        today,
        projectCategory || null,
        budget,
        MainOrgName,
        MainOrgEmail,
        notes,
        tentativePurchaseDate,
        finance,
        unitNo,
        configuration,
        type || null,
        ProjectName || null,
        block,
        occupation,
        today,
        flatIdData,
        tentativePrice,
      ]
    );

    return { insertId: result.insertId, uniqueNumber };
  } catch (error) {
    console.error("Error inserting lead data:", error.message);
    throw error;
  }
};

const updateLeadsProeperty = async (leadId, propertyData, connection) => {
  const { projectCategory, unitNo, configuration, type, ProjectName, block } =
    propertyData;

  try {
    // Insert into lead_user
    await connection.query(
      `INSERT INTO lead_user (Lead_ID_User, User_Name, User_Id_User_Lead, Organization_Name_User_Lead) 
       VALUES (?, ?, ?, ?)`,
      [leadId, propertyData.userName, propertyData.userId, propertyData.orgName]
    );

    // Update flat record if required
    if (
      projectCategory &&
      ProjectName &&
      unitNo &&
      configuration &&
      block &&
      type
    ) {
      await connection.query(
        `UPDATE flat SET Lead_Arrived = ? WHERE Project_Name_flats = ? 
         AND Property_type = ? AND Type_Flat = ? AND Unit_No = ? AND Block = ? AND Configuration = ?`,
        [
          "Yes",
          ProjectName,
          projectCategory,
          type,
          unitNo,
          block,
          configuration,
        ]
      );
    }
  } catch (error) {
    console.error("Error updating property data:", error.message);
    throw error;
  }
};

module.exports = {
  assignLeadsUpdate,
  updateActivityLogs,
  ActivityLogMiddleWareInsertion,
  insertInUserTask,

  customerInsertionHelper,
  purchaseOrderInsertionHelper,
  paymentPlanInsertion,
  deleteLeadsAndSoldStatus,

  leadsInsertionData,

  updateLeadsProeperty,
};
