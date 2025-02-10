const mySqlPool = require("../../config/db"); // Assuming you have a MySQL pool setup in a config file

const TotalRevenueFetcher = async (orgName) => {
  try {
    const [totalSalesResult] = await mySqlPool.query(
      `
            SELECT COUNT(*) AS totalSales
            FROM purchaseorder
            WHERE Purchase_org_Name = ?
          `,
      [orgName]
    );
    return totalSalesResult;
  } catch (e) {
    console.log(
      "There is Some Error In Fetching The Organization Total Revenue " + e
    );
    throw e;
  }
};

const totalRevenueFetcher = async (orgName) => {
  try {
    const [totalRevenueResult] = await mySqlPool.query(
      `
            SELECT SUM(Purchase_Price + COALESCE(Additional_Cost, 0)) AS totalRevenue
            FROM purchaseorder
            WHERE Purchase_org_Name = ?
          `,
      [orgName]
    );
    return totalRevenueResult;
  } catch (e) {
    console.log(
      "There is Some Error In Fteching the Total Revenue For An Organization " +
        e
    );
    throw e;
  }
};

const revenueByProject = async (projectCode, type, year) => {
  try {
    let query = "";
    if (type === "monthly") {
      query = `
        SELECT 
          MONTH(Purchase_date) AS month, 
          YEAR(Purchase_date) AS year, 
          SUM(Purchase_Price) AS revenue,
          SUM(Purchase_Price - List_Price) AS profit
        FROM purchaseorder 
        WHERE Project_Name = ? AND YEAR(Purchase_date)=?
        GROUP BY year, month
        ORDER BY year, month;
      `;
    } else if (type === "yearly") {
      query = `
        SELECT 
          YEAR(Purchase_date) AS year, 
          SUM(Purchase_Price) AS revenue,
          SUM(Purchase_Price - List_Price) AS profit
        FROM purchaseorder 
        WHERE Project_Name = ? 
        GROUP BY year
        ORDER BY year;
      `;
    } else if (type === "quarterly") {
      query = `
        SELECT 
          QUARTER(Purchase_date) AS quarter, 
          YEAR(Purchase_date) AS year, 
          SUM(Purchase_Price) AS revenue,
          SUM(Purchase_Price - List_Price) AS profit
        FROM purchaseorder 
        WHERE Project_Name = ? AND YEAR(Purchase_date)=?
        GROUP BY year, quarter
        ORDER BY year, quarter;
      `;
    }

    const [rows] = await mySqlPool.query(query, [projectCode, year]);
    return rows;
  } catch (e) {
    console.log(
      "There is Some Error In Fetching Project Revenue for Organization Dashboard " +
        e
    );
    throw e;
  }
};

const projectNameAndCode = async (MainName) => {
  try {
    const [rows] = await mySqlPool.query(
      `SELECT Project_Code, Name FROM project WHERE Owner=?`,
      [MainName]
    );
    return rows;
  } catch (e) {
    console.log(
      "There is Some Error in Fetching Project for Org DashBoard " + e
    );
    throw e;
  }
};

const revenueByEachUser = async (timeframe, MainName, year) => {
  try {
    const currentMonth = new Date().getMonth() + 1; // Months are 0-indexed
    const currentYear = new Date().getFullYear();

    let dateCondition = ""; // This will store the SQL condition for filtering
    let query2 = ""; // Variable for detailed query

    // Determine the date condition and query based on the timeframe
    switch (timeframe) {
      case "monthly":
        dateCondition = ` YEAR(Purchase_date) = ${year}`;
        query2 = `
        SELECT 
          p.Lead_Owner_Name,
          p.Purchase_Price, 
          p.Project_Name, 
          p.Project_Catagory, 
          p.Type, 
          f.Unit_No, 
          f.Block, 
          f.Configuration, 
          f.List_Price,
          p.Purchase_date
        FROM purchaseorder AS p 
        JOIN flat AS f ON f.Flat_id = p.Main_Property_Id 
        WHERE 
          YEAR(p.Purchase_date) = ${currentYear} 
          AND Purchase_org_Name = ?
      `;
        break;
      case "quarterly":
        const quarterStartMonth = Math.floor((currentMonth - 1) / 3) * 3 + 1; // Calculate the start month of the quarter
        const quarterEndMonth = quarterStartMonth + 2; // End month of the quarter
        dateCondition = ` YEAR(Purchase_date) = ${year}`;
        query2 = `
        SELECT 
          p.Lead_Owner_Name, 
          p.Purchase_Price, 
          p.Project_Name, 
          p.Project_Catagory, 
          p.Type, 
          f.Unit_No, 
          f.Block, 
          f.Configuration, 
          f.List_Price,
          p.Purchase_date
        FROM purchaseorder AS p 
        JOIN flat AS f ON f.Flat_id = p.Main_Property_Id 
        WHERE 
           YEAR(p.Purchase_date) = ${currentYear} 
          AND Purchase_org_Name = ?
      `;
        break;
      case "yearly":
        dateCondition = `YEAR(Purchase_date) = ${year}`;
        query2 = `
        SELECT 
          p.Lead_Owner_Name, 
          p.Purchase_Price, 
          p.Project_Name, 
          p.Project_Catagory, 
          p.Type, 
          f.Unit_No, 
          f.Block, 
          f.Configuration, 
          f.List_Price,
          p.Purchase_date
        FROM purchaseorder AS p 
        JOIN flat AS f ON f.Flat_id = p.Main_Property_Id 
        WHERE YEAR(p.Purchase_date) = ${currentYear} 
          AND Purchase_org_Name = ?
      `;
        break;
      default:
        return res.status(400).json({ message: "Invalid timeframe" });
    }

    const query = `
    SELECT 
       p.Lead_Owner_Name,
       u.User_Id,
       u.Name AS User_Name, 
       CAST(SUM(p.Purchase_Price) AS DECIMAL(10, 2)) AS total_revenue 
   FROM 
       purchaseorder AS p 
   JOIN 
       users AS u 
   ON 
       u.User_Id = p.Lead_Owner_Name
   WHERE 
       ${dateCondition} 
       AND p.Purchase_org_Name = ? 
       AND YEAR(p.Purchase_date) = ? 
   GROUP BY 
       p.Lead_Owner_Name, u.User_Id, u.Name
   ORDER BY 
       total_revenue DESC;

 `;
    const [results] = await mySqlPool.query(query, [MainName, year]);
    const [result2] = await mySqlPool.query(query2, [MainName]);
    return [results, result2];
  } catch (e) {
    console.log(
      "There is Some Error in Fetching Revenue By Each User for Org Dashboard" +
        e
    );
    throw e;
  }
};

const projectStats = async (orgName) => {
  try {
    const query = `
  SELECT 
     p.Name AS Project_Name_flats, 
     COUNT(*) AS total_properties, 
     SUM(CASE WHEN f.Status = 'sold' THEN 1 ELSE 0 END) AS sold_properties
 FROM 
     flat AS f 
 JOIN  
     project AS p ON p.Project_Code = f.Project_Name_flats
 WHERE 
     f.Org_Name = ?
 GROUP BY 
     p.Name;
 
   `;
    const [results] = await mySqlPool.query(query, [orgName]);
    return results;
  } catch (e) {
    console.log("There is Some Error in Fetching Project Stats " + e);
    throw e;
  }
};

const salesForCastingCenter = async (OrgName) => {
  try {
    const [results] = await mySqlPool.query(
      `
      SELECT 
        SUM(Purchase_Price + Additional_Cost) as totalSales, 
        SUM(CASE WHEN Project_Catagory = 'Website' THEN (List_Price + Additional_Cost) ELSE 0 END) as byWebsite,
        SUM(CASE WHEN Project_Catagory = 'Agent' THEN (List_Price + Additional_Cost) ELSE 0 END) as byAgent,
        SUM(CASE WHEN Project_Catagory = 'Market Team' THEN (List_Price + Additional_Cost) ELSE 0 END) as byMarketTeam,
        SUM(CASE WHEN Project_Catagory = 'App' THEN (List_Price + Additional_Cost) ELSE 0 END) as byApp
      FROM purchaseorder
      WHERE Purchase_org_Name = ?
      `,
      [OrgName]
    );
    return results;
  } catch (e) {
    console.log("There is Some Error In Fetching Sales Forcasting center " + e);
    throw e;
  }
};

const revenueByCategory = async (orgName) => {
  try {
    const [rows] = await mySqlPool.query(
      `
      SELECT 
          p.Project_Catagory,
          c.Catagory, 
          CAST(SUM(p.Purchase_Price) AS DECIMAL(10, 2)) AS total_sales
      FROM 
          purchaseorder AS p 
      JOIN 
          catagory AS c 
      ON 
          c.Id = p.Project_Catagory 
      WHERE 
          p.Purchase_org_Name = ?
      GROUP BY 
          p.Project_Catagory, c.Catagory
      `,
      [orgName]
    );

    return rows;
  } catch (e) {
    console.log("There is Some Error in Fetching Revenue By Categories " + e);
    throw e;
  }
};
const recentPropertyInquries = async (organization) => {
  try {
    const inquiriesQuery = `
    SELECT 
      f.Flat_id AS FlatId,
      f.Project_Name_flats, f.Unit_No, f.Block, f.Configuration, f.Property_type, f.Type_Flat,
      COUNT(l.Lead_id) AS inquiriesCount
    FROM leads AS l
    JOIN flat AS f ON l.Flat_id = f.Flat_id
    WHERE f.Org_Name = ? AND f.Status!=?
    GROUP BY f.Flat_id;
  `;

    const [inquiriesResults] = await mySqlPool.query(inquiriesQuery, [
      organization,
      "sold",
    ]);

    // SQL query to get the number of offers for each property that has been sold
    const offersQuery = `
    SELECT 
      f.Flat_id AS FlatId,
      COUNT(f.Flat_id) AS offersCount
    FROM flat AS f
    WHERE f.Org_Name = ?
    GROUP BY f.Flat_id;  
  `;

    const [offersResults] = await mySqlPool.query(offersQuery, [organization]);

    return [inquiriesResults, offersResults];
  } catch (e) {
    console.log(
      "There is Some Error In Property Inqueries Fetch For Organization Dashboard " +
        e
    );
    throw e;
  }
};

const soldProperties = async (org_Name) => {
  try {
    // Fetch the sold properties for the organization
    const [properties] = await mySqlPool.query(
      `
      SELECT 
          p.Purchase_id,
          c.Catagory AS Category,
          p.Customer_id,
          p.Purchase_Price AS Price,
          p.Purchase_date AS Date,
          p.Main_Property_Id AS Main_Property_Id,
          f.List_Price,
          f.Flat_id,
          f.Unit_No,
          f.Block,
          f.Configuration,
          po.Name AS Main_Project_Name
      FROM 
          purchaseorder AS p
      JOIN 
          flat AS f ON f.Flat_id = p.Main_Property_Id
      JOIN  
          project AS po ON p.Project_Name = po.Project_Code
      JOIN 
          catagory AS c ON c.Id = p.Project_Catagory
      WHERE 
          p.Purchase_org_Name = ?;
      `,
      [org_Name]
    );

    // Process each property to calculate additional details
    const propertyWithStatus = await Promise.all(
      properties.map(async (property) => {
        // Fetch payments for the current property
        const [payments] = await mySqlPool.query(
          `
          SELECT 
              Paid_Amount,
              Type,
              Amount
          FROM 
              perchaseorderpayment
          WHERE 
              Purchase_Id = ?;
          `,
          [property.Purchase_id]
        );

        // Calculate the total paid amount
        const totalPaid = payments.reduce((acc, payment) => {
          const paidAmount = parseFloat(payment.Paid_Amount) || 0;
          return acc + paidAmount;
        }, 0);

        // Calculate additional costs
        const additionalCost = payments.reduce((acc, payment) => {
          if (payment.Type === "Additional") {
            const additionalAmount = parseFloat(payment.Amount) || 0;
            return acc + additionalAmount;
          }
          return acc;
        }, 0);

        // Determine the payment status
        // const allEmpty = payments.every(
        //   (payment) => (parseFloat(payment.Paid_Amount) || 0) === 0
        // );

        let status = "pending";

        // Check if the total paid amount covers the total cost (price + additional cost)
        if (
          Number(property?.Price) + Number(additionalCost) <=
          Number(totalPaid)
        ) {
          status = "paid";
        } else if (Number(totalPaid) > 0) {
          // If some amount is paid but less than the total cost
          status = "partially paid";
        }

        // Return the processed property details
        return {
          name: property.Property_Name || null,
          date: property.Date,
          price: parseFloat(property.Price) || 0,
          status: status,
          Main_Property_Id: property.Main_Property_Id,
          Purchase_id: property.Purchase_id,
          Customer_id: property.Customer_id,
          Block: property.Block,
          Unit_No: property.Unit_No,
          Configuration: property.Configuration,
          List_Price: parseFloat(property.List_Price) || 0,
          Category: property.Category,
          Main_Project_Name: property.Main_Project_Name,
          additionalCost: additionalCost,
          paidAmount: totalPaid,
        };
      })
    );

    return propertyWithStatus;
  } catch (e) {
    console.error("Error Fetching Sold Properties: ", e);
    throw e;
  }
};

const fetchConfigAndCategories = async (organization) => {
  try {
    const configQuery = `
      SELECT Configuration AS propertyConfiguration, COUNT(*) AS soldCount
      FROM flat
      WHERE Status = 'sold' AND Org_Name = ?
      GROUP BY Configuration;
    `;

    // Query for categories
    const categoryQuery = `
    SELECT 
        f.Property_type AS projectCategory,
        c.Catagory AS Category_Name, 
        COUNT(*) AS soldCount
    FROM 
        flat AS f 
    JOIN 
catagory  AS c 
    ON 
        c.Id = f.Property_type
    WHERE 
        f.Status = 'sold' 
        AND f.Org_Name = ?
    GROUP BY 
        f.Property_type, c.Catagory;
  `;

    const [configResults] = await mySqlPool.query(configQuery, [organization]);
    const [categoryResults] = await mySqlPool.query(categoryQuery, [
      organization,
    ]);
    return [configResults, categoryResults];
  } catch (e) {
    console.log(
      "There is Some Error in Fetching in Fetching Categories and Configuration for Dashboard " +
        e
    );
    throw e;
  }
};

const leadsByStage = async (organization, year) => {
  try {
    let leadsQuery = `
      SELECT Lead_Status AS stage, COUNT(*) AS leadsCount
      FROM leads
      WHERE Lead_Status IN (
        'New Lead-not Contacted', 
        'New Lead-Contacted', 
        'Proposal Sent', 
        'Interested', 
        'Negotiation', 
        'Qualified', 
        'Closed Won-not Converted',
        'Closed Won-Converted'
      )
      AND Organization_Name_Leads = ?
    `;

    // Add year filter if year is not "All"
    if (year !== "All") {
      leadsQuery += ` AND YEAR(Date_Created) = ?`;
    }

    // Finalize the query with grouping
    leadsQuery += ` GROUP BY Lead_Status`;

    // Execute the leads query
    const [leadsResults] = await mySqlPool.query(
      leadsQuery,
      year === "All" ? [organization] : [organization, year]
    );

    // Prepare the response data
    const leadsByStage = leadsResults.map((result) => ({
      stage: result.stage, // Lead Status (Stage)
      leadsCount: result.leadsCount, // Number of leads for this stage
    }));
    return leadsByStage;
  } catch (e) {
    console.log(
      "There is Some Error In Fetching Leads By Stage for a Dashboard " + e
    );
    throw e;
  }
};

const leadsConversionForOrganization = async (
  organization,
  timePeriod,
  param
) => {
  // Initialize year and date condition variables
  let year = null;
  let dateCondition;

  try {
    switch (timePeriod.toLowerCase()) {
      case "monthly":
        // Param should include month and year as MM-YYYY
        if (!param) {
          throw new Error(
            "For 'monthly', you must provide a month and year in 'MM-YYYY' format."
          );
        }
        const [month, monthYear] = param.split("-");
        if (!month || !monthYear) {
          throw new Error(
            "Invalid 'monthly' parameter format. Expected 'MM-YYYY'."
          );
        }
        year = parseInt(monthYear);
        dateCondition = `MONTH(Date_Created) = ${parseInt(
          month
        )} AND YEAR(Date_Created) = ${year}`;
        break;

      case "quarterly":
        // Param should include quarter and year as Q-YYYY
        if (!param) {
          throw new Error(
            "For 'quarterly', you must provide a quarter and year in 'Q-YYYY' format."
          );
        }
        const [quarter, quarterYear] = param.split("-");
        if (!quarter || !quarterYear || isNaN(quarter) || isNaN(quarterYear)) {
          throw new Error(
            "Invalid 'quarterly' parameter format. Expected 'Q-YYYY'."
          );
        }
        year = parseInt(quarterYear);
        const quarterStartMonth = (parseInt(quarter) - 1) * 3 + 1;
        const quarterEndMonth = quarterStartMonth + 2;
        dateCondition = `MONTH(Date_Created) BETWEEN ${quarterStartMonth} AND ${quarterEndMonth} AND YEAR(Date_Created) = ${year}`;
        break;

      case "yearly":
        // Year is passed only in 'param' for yearly
        if (!param || isNaN(param)) {
          throw new Error(
            "For 'yearly', you must provide a year in 'YYYY' format as the parameter."
          );
        }
        year = parseInt(param);
        dateCondition = `YEAR(Date_Created) = ${year}`;
        break;

      default:
        throw new Error(
          "Invalid time period. Use 'monthly', 'quarterly', or 'yearly'."
        );
    }
    const totalLeadsQuery = `
    SELECT COUNT(*) AS totalLeads
    FROM leads
    WHERE Organization_Name_Leads = ?
      AND ${dateCondition}
  `;

    const [totalLeadsResult] = await mySqlPool.query(totalLeadsQuery, [
      organization,
    ]);
    const totalLeads = totalLeadsResult[0]?.totalLeads || 0;

    // Query to get the number of converted leads (status = 'Closed Won-Converted')
    const convertedLeadsQuery = `
    SELECT COUNT(*) AS convertedLeads
    FROM leads
    WHERE Organization_Name_Leads = ?
      AND Lead_Status = 'Closed Won-Converted'
      AND ${dateCondition}
  `;

    const [convertedLeadsResult] = await mySqlPool.query(convertedLeadsQuery, [
      organization,
    ]);
    const convertedLeads = convertedLeadsResult[0]?.convertedLeads || 0;

    // Calculate the conversion rate
    const conversionRate =
      totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return [totalLeads, convertedLeads, conversionRate];
  } catch (error) {
    console.log(
      "There is Some Error During Fetching  Lead Conversion for a Organization  " +
        e
    );

    throw e;
  }
};

const activeLeads = async (organization, year) => {
  try {
    let query = `
      SELECT 
        l.Lead_owner AS userName,
        u.Name AS User_Main_Name, 
        COUNT(*) AS activeLeadsCount
    FROM 
        leads AS l 
    JOIN 
        users AS u 
    ON 
        u.User_Id = l.Lead_owner
    WHERE 
        l.Lead_Status IN ('New Lead-not Contacted', 'New Lead-Contacted', 'Proposal Sent', 'Interested', 'Negotiation', 'Qualified') 
        AND l.Organization_Name_Leads = ? 
        AND YEAR(l.Date_Created) = ?
    GROUP BY 
        l.Lead_owner, u.Name;
  `;

    if (year === "All") {
      query = `
     SELECT 
        l.Lead_owner AS userName,
        u.Name AS User_Main_Name, 
        COUNT(*) AS activeLeadsCount
    FROM 
        leads AS l 
    JOIN 
        users AS u 
    ON 
        u.User_Id = l.Lead_owner
    WHERE 
        l.Lead_Status IN ('New Lead-not Contacted', 'New Lead-Contacted', 'Proposal Sent', 'Interested', 'Negotiation', 'Qualified') 
        AND l.Organization_Name_Leads = ? 
     
    GROUP BY 
        l.Lead_owner, u.Name;
  `;
    }
    const [results] = await mySqlPool.query(query, [organization, year]);
    return results;
  } catch (e) {
    console.log(
      "There is some Error in Fetching User In fetching active Leads for Org " +
        e
    );
    throw e;
  }
};

const taskofUsers = async (orgName) => {
  try {
    const query = `
    SELECT 
      t.Task_ID, 
      t.Task_Title, 
      t.Task_Type, 
      t.Due_Date, 
      t.Assigned_To, 
      t.Status, 
      ta.User_Name AS User_id,
      u.Name
    FROM 
      user_task_activitylogs AS ta 
    JOIN 
      activity_logs AS t 
    ON 
      ta.Task_id = t.Task_ID

      JOIN 
      users AS u 
      ON u.User_Id=ta.User_Name
    WHERE 
      t.Status != ? 
    AND 
      ta.OrganizationName_Task = ?
  `;

    const rows = await mySqlPool.query(query, ["completed", orgName]);
    return rows;
  } catch (e) {
    console.log(
      "There is Some Error in Fetching Task of Users for Organization Dashboard " +
        e
    );
    throw e;
  }
};

const taskDataFetcher = async (username) => {
  try {
    const [userTasks] = await mySqlPool.query(
      `
        SELECT Task_id
        FROM user_task_activitylogs
        WHERE User_Name = ?
        `,
      [username]
    );

    if (!userTasks || userTasks.length === 0) {
      return res.status(404).json({
        message: "No tasks found for this user",
        success: false,
      });
    }

    const taskIds = userTasks.map((task) => task.Task_id);

    const [activityLogs] = await mySqlPool.query(
      `
        SELECT *
        FROM activity_logs
        WHERE Task_ID IN (?)
        `,
      [taskIds]
    );
    return activityLogs;
  } catch (e) {
    console.log(
      "There is Some Error in Fetching Task for Organization Admin for users Dashboard " +
        e
    );
    throw e;
  }
};

const calendarTask = async (email, organizationName) => {
  try {
    const userTaskQuery = `
      SELECT Task_id
      FROM user_task_activitylogs
      WHERE User_Name = ? AND OrganizationName_Task = ?;
    `;

    const [userTasks] = await mySqlPool.query(userTaskQuery, [
      email,
      organizationName,
    ]);

    if (userTasks.length === 0) {
      return res.json([]);
    }

    const taskIds = userTasks.map((task) => task.Task_id);

    // Query to get detailed task information from `activity_logs`
    const activityLogsQuery = `
      SELECT Task_Title AS Task_Name, Due_Date, Lead_Id, Status, Task_ID
      FROM activity_logs
      WHERE Task_ID IN (?);
    `;

    const [taskDetails] = await mySqlPool.query(activityLogsQuery, [taskIds]);

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const tasks = taskDetails.map((task) => {
      const dueDate = new Date(task.Due_Date);
      const dueDateStr = dueDate.toISOString().split("T")[0];

      let status = "pending";
      if (dueDateStr < todayStr) {
        status = "overdue";
      } else if (dueDateStr === todayStr) {
        status = "due_today";
      }

      return {
        taskName: task.Task_Name,
        taskId: task.Task_ID, // Access Task_ID directly
        dueDate: dueDate.toISOString(),
        leadId: task?.Lead_Id,
        status,
        taskStatus: task.Status, // Status from activity_logs
      };
    });
    return tasks;
  } catch (e) {
    console.log("There is Some Error in Fetching task for a calendar " + e);
    throw e;
  }
};

const findAdditionalPrices = async (Purchase_id, purchasePrice) => {
  try {
    const [payments] = await mySqlPool.query(
      `SELECT Paid_Amount, Type, Amount FROM perchaseorderpayment WHERE Purchase_Id = ?;`,
      [Purchase_id]
    );

    const totalPaid = payments.reduce(
      (acc, payment) => acc + (parseFloat(payment.Paid_Amount) || 0),
      0
    );

    const additionalCost = payments.reduce((acc, payment) => {
      if (payment.Type === "Additional") {
        return acc + (parseFloat(payment.Amount) || 0);
      }
      return acc;
    }, 0);

    let status = "pending";
    if (totalPaid >= purchasePrice + additionalCost) {
      status = "paid";
    } else if (totalPaid > 0) {
      status = "partially paid";
    }
    return [totalPaid, additionalCost, status];
  } catch (e) {
    console.log(
      "There is Some Problem in Calculation Additional Cost,paid Amount and Status " +
        e
    );
    throw e;
  }
};

const revenueByUserReport = async (orgName, timeframe, year) => {
  try {
    

    // Base query with joins to fetch relevant data
    const baseQuery = `
        SELECT 
          u.Name AS userName,
          MONTHNAME(po.Purchase_date) AS monthName,
          QUARTER(po.Purchase_date) AS quarter,
          CONCAT(
            CASE 
              WHEN QUARTER(po.Purchase_date) = 1 THEN 'January-March'
              WHEN QUARTER(po.Purchase_date) = 2 THEN 'April-June'
              WHEN QUARTER(po.Purchase_date) = 3 THEN 'July-September'
              WHEN QUARTER(po.Purchase_date) = 4 THEN 'October-December'
            END
          ) AS quarterRange,
          YEAR(po.Purchase_date) AS year,
          po.Project_Name AS projectId,
          po.Project_Catagory AS propertyCategoryId,
          po.List_Price AS listPrice,
          po.Purchase_Price AS purchasePrice,
          po.Main_Property_Id,
          po.Purchase_id,
          po.Purchase_date,
          p.Name AS Project_Name_data,
          c.Catagory AS Category_Name,
          f.Block,
          f.Unit_No
        FROM 
          purchaseorder po 
        JOIN 
          users u ON u.User_Id = po.Lead_Owner_Name
        JOIN
          project p ON po.Project_Name = p.Project_Code
        JOIN
          catagory c ON po.Project_Catagory = c.Id
        JOIN 
          flat f ON po.Main_Property_Id = f.Flat_id
        WHERE 
          u.Organization_Name_User = ?
      `;

    // Add conditions based on timeframe
    let query;
    const queryParams = [orgName];
    if (timeframe === "monthly") {
      query = `${baseQuery} AND YEAR(po.Purchase_date) = ? ORDER BY u.Name, po.Purchase_date;`;
      queryParams.push(year);
    } else if (timeframe === "quarterly") {
      query = `${baseQuery} AND YEAR(po.Purchase_date) = ? ORDER BY u.Name, po.Purchase_date;`;
      queryParams.push(year);
    } else if (timeframe === "yearly") {
      query = `${baseQuery} AND YEAR(po.Purchase_date) >= 2020 ORDER BY u.Name, po.Purchase_date;`;
    }

    const [results] = await mySqlPool.query(query, queryParams);

    // Process results into desired format
    const data = {};
    for (const row of results) {
      const {
        userName,
        monthName,
        quarterRange,
        year,
        projectId,
        propertyCategoryId,
        listPrice,
        purchasePrice,
        Main_Property_Id,
        Purchase_id,
        Purchase_date,
        Project_Name_data,
        Category_Name,
        Block,
        Unit_No,
      } = row;

      if (!data[userName]) {
        data[userName] = {};
      }

      const [totalPaid, additionalCost, status] = await findAdditionalPrices(
        Purchase_id,
        purchasePrice
      );

      const timeframeKey =
        timeframe === "monthly"
          ? monthName
          : timeframe === "quarterly"
          ? quarterRange
          : `${year}`;

      if (!data[userName][timeframeKey]) {
        data[userName][timeframeKey] = [];
      }

      data[userName][timeframeKey].push({
        projectId,
        propertyCategoryId,
        listPrice,
        purchasePrice,
        Main_Property_Id,
        Purchase_id,
        Purchase_date,
        Project_Name_data,
        Category_Name,
        Block,
        Unit_No,
        totalPaid,
        additionalCost,
        status,
      });
    }

    const formattedData = Object.entries(data).map(
      ([userName, timeframeData]) => ({ userName, timeframeData })
    );
    return formattedData;
  } catch (e) {
    console.log(
      "There is Some Error in Finding Sold Property by User FOr Reaports Data " +
        e
    );
    throw e;
  }
};

const totalSoldPropertiesReports = async (timeframe, orgName, selectedYear) => {
  if (
    ["monthly", "quarterly"].includes(timeframe.toLowerCase()) &&
    !selectedYear
  ) {
    return res.status(400).json({
      success: false,
      error:
        "The 'selectedYear' parameter is required for 'monthly' and 'quarterly' timeframes.",
    });
  }

  let query = "";
  let params = [];

  // Build SQL query based on timeframe
  switch (timeframe.toLowerCase()) {
    case "monthly":
      query = `
        SELECT 
            MONTHNAME(po.Purchase_date) AS month, 
            po.List_Price, po.Purchase_Price, po.Project_Name, po.Project_Catagory, 
            po.Main_Property_Id, po.Purchase_date, po.Purchase_id, 
            p.Name AS Project_Main_Name, c.Catagory AS Main_Category_Name, f.Block, f.Unit_No
        FROM purchaseorder AS po 
        JOIN project AS p ON po.Project_Name = p.Project_Code
        JOIN catagory AS c ON po.Project_Catagory = c.Id
        JOIN flat AS f ON po.Main_Property_Id = f.Flat_id
        WHERE po.Purchase_org_Name = ? AND YEAR(po.Purchase_date) = ?
        ORDER BY MONTH(po.Purchase_date);
      `;
      params = [orgName, selectedYear];
      break;
    case "quarterly":
      query = `
        SELECT 
            QUARTER(po.Purchase_date) AS quarter, 
            CONCAT(YEAR(po.Purchase_date), '-Q', QUARTER(po.Purchase_date)) AS quarter_label,
            po.List_Price, po.Purchase_Price, po.Project_Name, po.Project_Catagory, 
            po.Main_Property_Id, po.Purchase_date, po.Purchase_id, 
            p.Name AS Project_Main_Name, c.Catagory AS Main_Category_Name, f.Block, f.Unit_No
        FROM purchaseorder AS po
        JOIN project AS p ON po.Project_Name = p.Project_Code
        JOIN catagory AS c ON po.Project_Catagory = c.Id
        JOIN flat AS f ON po.Main_Property_Id = f.Flat_id
        WHERE po.Purchase_org_Name = ? AND YEAR(po.Purchase_date) = ?
        ORDER BY QUARTER(po.Purchase_date);
      `;
      params = [orgName, selectedYear];
      break;
    case "yearly":
      query = `
        SELECT 
            YEAR(po.Purchase_date) AS year,
            po.List_Price, po.Purchase_Price, po.Project_Name, po.Project_Catagory, 
            po.Main_Property_Id, po.Purchase_date, po.Purchase_id, 
            p.Name AS Project_Main_Name, c.Catagory AS Main_Category_Name, f.Block, f.Unit_No
        FROM purchaseorder AS po
        JOIN project AS p ON po.Project_Name = p.Project_Code
        JOIN catagory AS c ON po.Project_Catagory = c.Id
        JOIN flat AS f ON po.Main_Property_Id = f.Flat_id
        WHERE po.Purchase_org_Name = ?
        ORDER BY YEAR(po.Purchase_date);
      `;
      params = [orgName];
      break;
  }

  try {
    console.log("Executing Query:", query, "with Params:", params);

    // Execute SQL query
    const [results] = await mySqlPool.execute(query, params);

    // Process results with async operations
    const mainArray = await Promise.all(
      results.map(async (item) => {
        const [totalPaid, additionalCost, status] = await findAdditionalPrices(
          item?.Purchase_id,
          item?.Purchase_Price
        );
        return {
          ...item,
          totalPaid,
          additionalCost,
          status,
        };
      })
    );
    return mainArray;
  } catch (e) {
    console.log(
      "There is Some Error In fetching All Peropties Data That is Sold For Sold Properties in Sales Section " +
        e
    );
    throw e;
  }
};

module.exports = {
  TotalRevenueFetcher,
  totalRevenueFetcher,
  revenueByProject,
  projectNameAndCode,
  revenueByEachUser,
  projectStats,
  salesForCastingCenter,
  revenueByCategory,
  recentPropertyInquries,
  soldProperties,
  fetchConfigAndCategories,
  leadsByStage,
  leadsConversionForOrganization,
  activeLeads,
  taskofUsers,
  taskDataFetcher,
  calendarTask,
  findAdditionalPrices,
  revenueByUserReport,
  totalSoldPropertiesReports,
};
