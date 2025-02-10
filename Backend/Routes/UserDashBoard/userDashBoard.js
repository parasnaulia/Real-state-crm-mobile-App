const express = require("express");

const mySqlPool = require("../../config/db.js");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  taskDataFetcher,
  calendarTask,
} = require("../../Controllers/DashBoardControllers/OrganizationDashBoardController.js");
const { authenticateToken } = require("../../Middlewares/RoutesAuth.js");
const { superAdminTask } = require("../../Controllers/TaskFetcher/TaskCall.js");
const {
  salesTargetByUser,
  leadsByStageForUser,
  leadConversionUser,
  propertEnquiresUser,
  leadsWithProperty,
  soldPropertiesUser,
  myUnitSold,
  totalSaleDoneByUser,
  soldPropertiesUserProperty,
} = require("../../Controllers/DashBoardControllers/UserDashboard.js");

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(__dirname, "../../Public/Image");
    // Check if directory exists, if not, create it
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true }); // Ensure all parent folders are created
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({
  storage: storage,
});
const getDateRange = (period) => {
  const now = new Date();
  let startDate, endDate;

  if (period === "monthly") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (period === "quarterly") {
    const quarter = Math.floor((now.getMonth() + 3) / 3);
    startDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
    endDate = new Date(now.getFullYear(), quarter * 3, 0);
  } else if (period === "annual") {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31);
  }

  // Convert dates to YYYY-MM-DD format for SQL compatibility
  const formatDate = (date) => date.toISOString().split("T")[0];

  return { startDate: formatDate(startDate), endDate: formatDate(endDate) };
};

// Function to fetch sales data for a given period and lead owner
const fetchSalesData = async (startDate, endDate, leadOwner) => {
  // Sales Target: Sum of Expected Revenue for all leads by the lead owner, cast to DECIMAL
  const [salesTargetResult] = await mySqlPool.query(
    `
      SELECT COALESCE(SUM(CAST(Expected_revenue AS DECIMAL(10, 2))), 0) AS sales_target
      FROM leads
      WHERE Owner_Email = ?
      AND STR_TO_DATE(Date_Created, '%d/%m/%Y') BETWEEN ? AND ?
    `,
    [leadOwner, startDate, endDate]
  );

  const [actualSalesResult] = await mySqlPool.query(
    `
      SELECT COALESCE(SUM(CAST(Expected_revenue AS DECIMAL(10, 2))), 0) AS actual_sales
      FROM leads
      WHERE Owner_Email = ?
      AND Lead_Status = 'Closed Won'
      AND STR_TO_DATE(Date_Created, '%d/%m/%Y') BETWEEN ? AND ?
    `,
    [leadOwner, startDate, endDate]
  );

  // Return sales target and actual sales data
  return {
    salesTarget: salesTargetResult[0].sales_target || 0,
    actualSales: actualSalesResult[0].actual_sales || 0,
  };
};

router.get("/sales-target/:leadOwner", async (req, res) => {
  const leadOwner = req.params.leadOwner;

  try {
    // Get date ranges for each period (monthly, quarterly, annual)
    const monthlyRange = getDateRange("monthly");
    const quarterlyRange = getDateRange("quarterly");
    const annualRange = getDateRange("annual");

    // Fetch data for each period
    const monthlyData = await fetchSalesData(
      monthlyRange.startDate,
      monthlyRange.endDate,
      leadOwner
    );
    const quarterlyData = await fetchSalesData(
      quarterlyRange.startDate,
      quarterlyRange.endDate,
      leadOwner
    );
    const annualData = await fetchSalesData(
      annualRange.startDate,
      annualRange.endDate,
      leadOwner
    );

    return res.status(200).json({
      leadOwner,
      monthly: {
        startDate: monthlyRange.startDate,
        endDate: monthlyRange.endDate,
        ...monthlyData,
      },
      quarterly: {
        startDate: quarterlyRange.startDate,
        endDate: quarterlyRange.endDate,
        ...quarterlyData,
      },
      annual: {
        startDate: annualRange.startDate,
        endDate: annualRange.endDate,
        ...annualData,
      },
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error retrieving sales data", success: false });
  }
});

const fetchConversionRate = async (leadOwner) => {
  try {
    const [conversionRateResult] = await mySqlPool.query(
      `
        SELECT 
          ( 
            COUNT(CASE WHEN Lead_Status = 'Closed Won' THEN 1 END) / COUNT(*) 
          ) * 100 AS conversion_rate
        FROM 
          leads
        WHERE 
          Owner_Email = ?
        `,
      [leadOwner]
    );

    return conversionRateResult[0].conversion_rate || 0;
  } catch (error) {
    console.error("Error fetching conversion rate:", error);
    throw error;
  }
};

router.get("/conversion-rate/:leadOwner", async (req, res) => {
  const leadOwner = req.params.leadOwner;

  try {
    const conversionRate = await fetchConversionRate(leadOwner);

    return res.status(200).send({
      leadOwner,
      conversionRate: conversionRate,
      success: true,
    });
  } catch (error) {
    console.log("error hai yeeeeeeeeee");
    return res
      .status(500)
      .send({ error: "Error retrieving conversion rate", success: false });
  }
});

const convertToDate = (dateStr) => {
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
};

const getMonthNamesFromLeads = (leadDates) => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const months = leadDates.map((dateStr) => {
    const date = convertToDate(dateStr);
    return monthNames[date.getMonth()]; // Get the month name from the Date object
  });

  // Return unique month names in order
  return [...new Set(months)];
};

router.get("/avg-deal-size/:leadOwnerEmail", async (req, res) => {
  const leadOwnerEmail = req.params.leadOwnerEmail;

  try {
    // Query to fetch expected revenue for Closed Won deals of the lead owner
    const [results] = await mySqlPool.query(
      `
        SELECT Expected_revenue, Date_Created 
        FROM leads 
        WHERE Owner_Email = ? 
        AND Lead_Status = 'Closed Won'
      `,
      [leadOwnerEmail]
    );

    if (!results.length) {
      return res.status(404).json({
        message: "No data found for the given lead owner",
        success: false,
      });
    }

    const totalRevenue = results.reduce((sum, lead) => {
      // Ensure `Expected_revenue` is treated as a string and remove commas
      const expectedRevenue = parseFloat(
        lead.Expected_revenue.toString().replace(/,/g, "")
      );
      return sum + (isNaN(expectedRevenue) ? 0 : expectedRevenue);
    }, 0);

    const monthCategories = getMonthNamesFromLeads(
      results.map((lead) => lead.Date_Created)
    );

    const avgDealSize = totalRevenue / results.length;

    const avgDealSizeData = {
      series: [
        {
          name: "Average Deal Size",
          data: Array(results.length).fill(avgDealSize),
        },
      ],
      options: {
        chart: {
          type: "line",
        },
        stroke: {
          curve: "smooth",
        },
        xaxis: {
          categories: monthCategories,
        },
        colors: ["#FBBF24"],
        title: {
          text: "Average Deal Size",
          align: "left",
        },
      },
    };

    // Send response with data
    return res.status(200).json({
      leadOwnerEmail,
      avgDealSizeData,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error retrieving data", success: false });
  }
});
const fetchPipelineStageData = async (leadOwner, stage) => {
  const [result] = await mySqlPool.query(
    `
      SELECT 
        COUNT(*) AS number_of_deals, 
        COALESCE(SUM(CAST(REPLACE(Expected_revenue, ',', '') AS UNSIGNED)), 0) AS total_revenue
      FROM leads
      WHERE Owner_Email = ?
      AND Lead_Status = ?
    `,
    [leadOwner, stage]
  );

  return {
    numberOfDeals: result[0].number_of_deals || 0,
    totalRevenue: result[0].total_revenue || 0,
  };
};

router.get("/pipeline-stages/:leadOwner", async (req, res) => {
  const leadOwner = req.params.leadOwner;

  try {
    const stages = [
      "NewLead",
      "Contacted",
      "Interested",
      "Proposal Sent",
      "Negotiating",
      "Qualified",
      "Closed Won",
      "Closed Lost",
    ];

    const pipelineData = await Promise.all(
      stages.map((stage) => fetchPipelineStageData(leadOwner, stage))
    );

    const response = stages.reduce((acc, stage, index) => {
      acc[stage] = pipelineData[index];
      return acc;
    }, {});

    return res.status(200).json({
      leadOwner,
      pipelineData: response,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error retrieving pipeline data", success: false });
  }
});

router.get("/lead-generation/:leadOwner", async (req, res) => {
  const leadOwner = req.params.leadOwner;

  try {
    // Count total leads generated for the lead owner
    const [totalLeadsResult] = await mySqlPool.query(
      `
        SELECT COUNT(*) AS total_leads
        FROM leads
        WHERE Owner_Email = ?
        `,
      [leadOwner]
    );

    // Count qualified leads (Lead_Status = 'Qualified')
    const [qualifiedLeadsResult] = await mySqlPool.query(
      `
        SELECT COUNT(*) AS qualified_leads
        FROM leads
        WHERE Owner_Email = ?
        AND Lead_Status = 'Qualified'
        `,
      [leadOwner]
    );

    // Count converted leads (Lead_Status = 'Closed Won')
    const [convertedLeadsResult] = await mySqlPool.query(
      `
        SELECT COUNT(*) AS converted_leads
        FROM leads
        WHERE Owner_Email = ?
        AND Lead_Status = 'Closed Won'
        `,
      [leadOwner]
    );

    const response = {
      leadOwner,
      totalLeads: totalLeadsResult[0].total_leads || 0,
      qualifiedLeads: qualifiedLeadsResult[0].qualified_leads || 0,
      convertedLeads: convertedLeadsResult[0].converted_leads || 0,
      success: true,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error retrieving lead generation data:", error);
    return res.status(500).json({
      error: "Error retrieving lead generation data",
      success: false,
    });
  }
});
router.get("/lead-funnel/:leadOwner", async (req, res) => {
  const leadOwner = req.params.leadOwner;

  try {
    const leadStages = [
      "New Lead",
      "Contacted",
      "Interested",
      "Proposal Sent",
      "Negotiating",
      "Qualified",
      "Closed Won",
      "Closed Lost",
    ];

    // Run all queries in parallel to improve performance
    const funnelPromises = leadStages.map((stage) =>
      mySqlPool.query(
        `SELECT COUNT(*) AS lead_count
         FROM leads 
         WHERE Lead_owner = ? AND Lead_Status = ?`,
        [leadOwner, stage]
      )
    );

    // Await all promises
    const results = await Promise.all(funnelPromises);

    // Map results back to the funnelData object
    let funnelData = {};
    leadStages.forEach((stage, idx) => {
      funnelData[stage] = results[idx][0].lead_count || 0;
    });

    return res.status(200).json({
      leadOwner,
      funnelData,
      success: true,
    });
  } catch (error) {
    console.error("Error retrieving lead funnel data:", error);
    return res.status(500).json({
      error: "Error retrieving lead funnel data",
      success: false,
    });
  }
});

router.get("/active-deals/:leadOwner", async (req, res) => {
  const leadOwner = req.params.leadOwner;

  try {
    // Define active stages
    const activeStages = [
      "New Lead",
      "Contacted",
      "Interested",
      "Proposal Sent",
      "Negotiating",
      "Qualified",
    ];

    const [result] = await mySqlPool.query(
      `
        SELECT COUNT(*) AS activeDeals
        FROM leads
        WHERE Owner_Email = ?
        AND Lead_Status IN (?)
        `,
      [leadOwner, activeStages]
    );

    // Return the count of active deals
    return res.status(200).json({
      leadOwner,
      activeDeals: result[0].activeDeals || 0,
      success: true,
    });
  } catch (error) {
    console.error("Error retrieving active deals data:", error);
    return res.status(500).json({
      error: "Error retrieving active deals data",
      success: false,
    });
  }
});

router.get("/closed-deals/:leadOwner", async (req, res) => {
  const leadOwner = req.params.leadOwner;

  try {
    const closedStages = ["Closed Won", "Closed Lost"];

    const [result] = await mySqlPool.query(
      `
        SELECT 
          SUM(CASE WHEN Lead_Status = 'Closed Won' THEN 1 ELSE 0 END) AS closedWon,
          SUM(CASE WHEN Lead_Status = 'Closed Lost' THEN 1 ELSE 0 END) AS closedLost
        FROM leads
        WHERE Owner_Email = ?
        AND Lead_Status IN (?)
        `,
      [leadOwner, closedStages]
    );

    return res.status(200).json({
      leadOwner,
      closedDeals: {
        closedWon: result[0].closedWon || 0,
        closedLost: result[0].closedLost || 0,
        totalClosed:
          Number(result[0].closedWon || 0) + +(result[0].closedLost || 0),
      },
      success: true,
    });
  } catch (error) {
    console.error("Error retrieving closed deals data:", error);
    return res.status(500).json({
      error: "Error retrieving closed deals data",
      success: false,
    });
  }
});

const dealStageMapping = {
  prospecting: ["New Lead", "Contacted", "Interested"],
  needsAnalysis: ["Proposal Sent", "Negotiating"],
  negotiation: ["Qualified"],
  closing: ["Closed Won", "Closed Lost"],
};
router.get("/deal-stages/:leadOwner", async (req, res) => {
  const leadOwner = req.params.leadOwner;

  try {
    const dealStagesCount = {
      prospecting: 0,
      needsAnalysis: 0,
      negotiation: 0,
      closing: 0,
    };

    const [dealStageResults] = await mySqlPool.query(
      `
        SELECT Lead_Status, COUNT(*) as deal_count
        FROM leads
        WHERE Owner_Email = ?
        GROUP BY Lead_Status
        `,
      [leadOwner]
    );

    dealStageResults.forEach((deal) => {
      const { Lead_Status, deal_count } = deal;

      for (const stage in dealStageMapping) {
        if (dealStageMapping[stage].includes(Lead_Status)) {
          dealStagesCount[stage] += deal_count;
        }
      }
    });

    return res.status(200).json({
      leadOwner,
      dealStages: dealStagesCount,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error retrieving deal stages data", success: false });
  }
});

router.get("/call-summary/:email", async (req, res) => {
  const userEmail = req.params.email;

  try {
    const [userLeads] = await mySqlPool.query(
      `
        SELECT Lead_ID 
        FROM lead_user
        WHERE User_Email = ?
        `,
      [userEmail]
    );

    if (userLeads.length === 0) {
      return res.status(200).json({
        leadOwnerEmail: userEmail,
        callSummary: {
          incoming: 0,
          outgoing: 0,
          missed: 0,
        },
        success: true,
      });
    }

    const leadIds = userLeads.map((lead) => lead.Lead_ID);
    // console.log(leadIds);

    const [callSummaryResults] = await mySqlPool.query(
      `
        SELECT Call_Type, COUNT(*) as call_count
        FROM call_task
        WHERE Lead_ID IN (?)
        GROUP BY Call_Type
        `,
      [leadIds]
    );

    const callSummary = {
      incoming: 0,
      outgoing: 0,
      missed: 0,
    };

    callSummaryResults.forEach((call) => {
      if (call.Call_Type === "incoming") {
        callSummary.incoming = call.call_count;
      } else if (call.Call_Type === "outgoing") {
        callSummary.outgoing = call.call_count;
      } else if (call.Call_Type === "missed") {
        callSummary.missed = call.call_count;
      }
    });

    // Return the summary of calls
    return res.status(200).json({
      leadOwnerEmail: userEmail,
      callSummary,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error retrieving call summary", success: false });
  }
});

router.get("/meetings/:email", async (req, res) => {
  const userEmail = req.params.email;

  try {
    // Step 1: Fetch meetings directly from call_task where UserEmail matches
    const [meetings] = await mySqlPool.query(
      `
        SELECT Call_ID, Lead_ID, Call_Date, Notes, Outcome, schedule_appointment, Notes
        FROM call_task
        WHERE User_Email = ? 
        AND Outcome = 'scheduled appointment'
        ORDER BY Call_Date DESC
        `,
      [userEmail]
    );

    // Step 2: Handle no meeting case
    if (!meetings || meetings.length === 0) {
      return res
        .status(404)
        .json({ message: "No meetings or appointments found", success: false });
    }

    // Step 3: Return meeting data
    return res.status(200).json({
      userEmail,
      meetings: meetings.map((meeting) => ({
        Call_ID: meeting.Call_ID,
        Lead_ID: meeting.Lead_ID,
        Call_Date: meeting.Call_Date,
        Notes: meeting.Notes,
        Outcome: meeting.Outcome,
        appointmentDate: meeting.schedule_appointment,
        notes: meeting.Notes,
      })),
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error retrieving meetings data", success: false });
  }
});
router.get("/user-activity1/:username", async (req, res) => {
  const username = req.params.username;

  try {
    // Step 1: Fetch Task_IDs associated with the username from user_task_activitylogs
    const [userTasks] = await mySqlPool.query(
      `SELECT Task_id FROM user_task_activitylogs WHERE User_Name = ?`,
      [username]
    );

    // Step 2: Check if any tasks were found for the user
    if (!userTasks || userTasks.length === 0) {
      return res.status(404).json({
        message: "No tasks found for this user",
        success: false,
      });
    }

    // Extract Task_IDs into an array
    const taskIds = userTasks.map((task) => task.Task_id);

    // Step 3: Use the Task_IDs to fetch corresponding entries from activity_logs
    const [activityLogs] = await mySqlPool.query(
      `SELECT Task_Title, Due_Date, Reminders, Time_Estimated, Actual_Time FROM activity_logs WHERE Task_ID IN (?)`,
      [taskIds]
    );

    // Step 4: Check if any activity logs were found
    if (!activityLogs || activityLogs.length === 0) {
      return res.status(404).json({
        message: "No activity logs found for the provided tasks",
        success: false,
      });
    }

    // Step 5: Transform the activity logs into calendar event format
    const events = activityLogs.map((log) => {
      const start = new Date(log.Due_Date);

      // Assuming you want the duration to be a fixed length for demonstration; adjust as needed
      const end = new Date(start);
      end.setHours(start.getHours() + 1); // Set end time to 1 hour after start time

      return {
        title: log.Task_Title,
        start,
        end,
      };
    });

    return res.status(200).json({
      username,
      events,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return res.status(500).json({
      message: "Error retrieving activity logs",
      success: false,
    });
  }
});

router.get(
  "/user-activity-task/:username",
  authenticateToken,
  async (req, res) => {
    const username = req.params.username;

    try {
      const activityLogs = await taskDataFetcher(username);

      // Step 4: Check if any activity logs were found
      if (!activityLogs || activityLogs.length === 0) {
        return res.status(404).json({
          message: "No activity logs found for the provided tasks",
          success: false,
        });
      }

      // Step 5: Return the activity logs in the response
      return res.status(200).json({
        username,
        activityLogs,
        success: true,
      });
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      return res.status(500).json({
        message:
          "Error retrieving activity logs or Task for Organization Admin",
        success: false,
      });
    }
  }
);

// New Datassssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss------------------------>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

router.get("/sales-targetsUser", authenticateToken, async (req, res) => {
  const { Lead_Owner_Email, Organization_Name, period, year } = req.query;

  let groupByClause;
  if (period === "Monthly") {
    groupByClause = "MONTH(Purchase_date)";
  } else if (period === "Quarterly") {
    groupByClause = "QUARTER(Purchase_date)";
  } else if (period === "Yearly") {
    groupByClause = "YEAR(Purchase_date)";
  } else {
    return res.status(400).json({ error: "Invalid period" });
  }

  let yearOne = "";
  if (period === "Monthly" || period === "Quarterly") {
    yearOne = `YEAR(Purchase_date) = ?`;
  }

  const query = `
    SELECT ${groupByClause} AS period, 
           SUM(Purchase_Price) AS total_sales
    FROM purchaseorder 
    WHERE Lead_Owner_Name = ? 
    AND Purchase_org_Name = ? 
    ${yearOne ? `AND ${yearOne}` : ""}
    GROUP BY ${groupByClause}
    ORDER BY Purchase_date;
  `;

  try {
    const params = [Lead_Owner_Email, Organization_Name];
    if (yearOne) params.push(year);

    // Execute the query with async/await
    const [results] = await mySqlPool.query(query, params);

    return res.json(results);
  } catch (err) {
    // Handle any errors
    res.status(500).json({ error: err.message });
  }
});

// Project

router.get("/projectUser/:orgName/:userEmail", async (req, res) => {
  const { orgName, userEmail } = req.params;
  // console.log("Get Api Of project is hitted ");

  try {
    const [rows, fields] = await mySqlPool.query(
      `SELECT * FROM project_user Where Organization_Name_Reported=? AND User_Id=? `,
      [orgName, userEmail]
    );

    if (!rows) {
      return res.status(400).send({
        message: "Not Found",
        success: false,
        data: [],
      });
    }
    // console.log(rows);
    // console.log("data is Found and it is send to Frontend");

    return res.status(200).send({
      message: "Data is send",
      data: rows,
      success: true,
    });
  } catch (e) {
    console.log("There is Problem in Gettind data of PRojects");
    return res.status(500).send({
      message: "Server Problem in project get Api",
      success: false,
      data: [],
    });
  }
});

//Total revenuee

router.get(
  "/total-revenue/:orgName/:email",
  authenticateToken,
  async (req, res) => {
    const { orgName, email } = req.params; // Get organization name from parameters
    try {
      // Query to calculate total revenue, treating NULL Additional_Cost as 0
      const [totalRevenueResult] = await mySqlPool.query(
        `
      SELECT SUM(Purchase_Price + COALESCE(Additional_Cost, 0)) AS totalRevenue
      FROM purchaseorder
      WHERE Purchase_org_Name = ? AND Lead_Owner_Name=?
    `,
        [orgName, email]
      );

      // If there are no results or total revenue is null
      if (
        !totalRevenueResult[0] ||
        totalRevenueResult[0].totalRevenue === null
      ) {
        return res.json({ success: true, totalRevenue: 0 });
      }

      // Send total revenue in the response
      return res.json({
        success: true,
        totalRevenue: totalRevenueResult[0].totalRevenue,
      });
    } catch (err) {
      console.error("Error fetching total revenue:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
);

router.get(
  "/total-sales-user/:orgName/:email",
  authenticateToken,
  async (req, res) => {
    const { orgName, email } = req.params;
    try {
      // Query to calculate total sales (number of properties sold)
      const totalSalesResult = await salesTargetByUser(orgName, email);

      if (
        totalSalesResult.length === 0 ||
        totalSalesResult[0].totalSales === null
      ) {
        return res.json({ success: true, totalSales: 0 });
      }

      res.json({
        success: true,
        totalSales: totalSalesResult[0].totalSales,
      });
    } catch (err) {
      console.error("Error fetching total sales:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
);

// Total Sale

router.get("/yearly-stats-user/:org_Name/:email", async (req, res) => {
  const { org_Name, email } = req.params; // Extract organization name from request parameters

  try {
    // Query to get monthly revenue for the current year, filtering by organization name
    const [monthlyRevenue] = await mySqlPool.query(
      `
      SELECT 
          DATE_FORMAT(Purchase_date, '%Y-%m') AS Month,
          SUM(Purchase_Price) AS Total_Revenue
      FROM 
          purchaseorder
      WHERE 
          YEAR(Purchase_date) = YEAR(CURDATE()) 
          AND Purchase_org_Name = ? AND Lead_Owner_Name=?
      GROUP BY 
          Month
      ORDER BY 
          Month
    `,
      [org_Name, email]
    );

    // Query to get monthly profit for the current year, filtering by organization name
    const [monthlyProfit] = await mySqlPool.query(
      `
      SELECT 
          DATE_FORMAT(Purchase_date, '%Y-%m') AS Month,
          SUM( Purchase_Price- List_Price  - IFNULL(Additional_Cost, 0)) AS Total_Profit
      FROM 
          purchaseorder
      WHERE 
          YEAR(Purchase_date) = YEAR(CURDATE()) 
          AND Purchase_org_Name = ? AND Lead_Owner_Name=?
      GROUP BY 
          Month
      ORDER BY 
          Month
    `,
      [org_Name, email]
    );

    // Query to get the current month revenue, filtering by organization name
    const [[currentMonthRevenue]] = await mySqlPool.query(
      `
      SELECT 
          SUM(Purchase_Price) AS Current_Month_Revenue
      FROM 
          purchaseorder
      WHERE  
          YEAR(Purchase_date) = YEAR(CURDATE()) 
          AND MONTH(Purchase_date) = MONTH(CURDATE())
          AND Purchase_org_Name = ? AND Lead_Owner_Name=?
    `,
      [org_Name, email]
    );

    // Query to get the current month profit, filtering by organization name
    const [[currentMonthProfit]] = await mySqlPool.query(
      `
      SELECT 
          SUM( Purchase_Price- List_Price  - IFNULL(Additional_Cost, 0)) AS Current_Month_Profit
      FROM 
          purchaseorder
      WHERE 
          YEAR(Purchase_date) = YEAR(CURDATE()) 
          AND MONTH(Purchase_date) = MONTH(CURDATE())
          AND Purchase_org_Name = ? AND Lead_Owner_Name=?
    `,
      [org_Name, email]
    );

    // Create response data
    const response = {
      monthlyRevenue: monthlyRevenue.map((row) => ({
        month: row.Month,
        revenue: row.Total_Revenue,
      })),
      monthlyProfit: monthlyProfit.map((row) => ({
        month: row.Month,
        profit: row.Total_Profit,
      })),
      currentMonthStats: {
        currentMonthRevenue: currentMonthRevenue.Current_Month_Revenue || 0,
        currentMonthProfit: currentMonthProfit.Current_Month_Profit || 0,
      },
    };

    // Return the combined data
    res.json({ success: true, data: response });
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get(
  "/leads-by-stage-user/:organization/:email",
  authenticateToken,
  async (req, res) => {
    const { organization, email } = req.params;

    if (!organization) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required.",
      });
    }

    try {
      const leadsResults = await leadsByStageForUser(organization, email);
      // const [purchaseOrderResults] = await mySqlPool.query(purchaseOrderQuery, [
      //   organization,
      //   email,
      // ]);

      // Combine the results
      const combinedResults = [
        ...leadsResults,
        // This will add the "Close Won - Converted" data
      ];

      // Format the response for frontend display
      const leadsByStage = combinedResults.map((result) => ({
        stage: result.stage, // Lead Status (Stage)
        leadsCount: result.leadsCount, // Number of leads for this stage
      }));

      // Send the response in a table-friendly format
      return res.json({
        success: true,
        data: leadsByStage, // Table-like format for the frontend
        message: "Leads by stage fetched successfully.",
      });
    } catch (error) {
      console.error("Error fetching leads by stage:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

router.get(
  "/lead-conversion-rate/:organization/:timePeriod/:userId/:year/:extraParam?",
  authenticateToken,
  async (req, res) => {
    const { organization, timePeriod, userId, year, extraParam } = req.params;
    // console.log("nice");
    // Validate required parameters
    if (!organization || !timePeriod || !userId || !year) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters.",
      });
    }

    try {
      const [totalLeads, convertedLeadsResult] = await leadConversionUser(
        organization,
        timePeriod,
        userId,
        year,
        extraParam
      );

      const convertedLeads = convertedLeadsResult[0]?.convertedLeads || 0;

      // Calculate the conversion rate
      const conversionRate =
        totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      res.json({
        success: true,
        data: {
          totalLeads,
          convertedLeads,
          conversionRate: conversionRate.toFixed(2), // Rounded to 2 decimal places
        },
      });
    } catch (error) {
      console.error("Error fetching lead conversion rate:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// router.get("/sold-properties-user/:org_Name/:email", async (req, res) => {
//   const { org_Name, email } = req.params;

//   try {
//     // Fetch properties linked with the organization
//     const [properties] = await mySqlPool.query(
//       `
//       SELECT
//           p.Purchase_id,
//           p.Project_Name AS Property_Name,
//           p.Purchase_Price AS Price,
//           p.Purchase_date AS Date,
//           p.Main_Property_Id AS Main_Property_Id,
//           p.Project_Name,
//           p.Project_Catagory,
//           p.Type,
//           p.Plan,
//           p.Date_Created
//       FROM
//           purchaseorder p
//       WHERE
//           p.Purchase_org_Name = ? AND Lead_Owner_Name=?
//       `,
//       [org_Name, email]
//     );

//     // Map over the properties to format each property item correctly
//     const soldProperties = properties.map((property) => ({
//       name: property.Property_Name,
//       date: property.Date,
//       price: property.Price,
//       Main_Property_Id: property.Main_Property_Id,
//       Project_Name: property.Project_Name,
//       Project_Catagory: property.Project_Catagory,
//       Type: property.Type,
//       Plan: property.Plan,
//       dateOfPurchase: property.Date_Created,
//       Purchase_Id: property.Purchase_id,
//     }));

//     return res.status(200).json({
//       success: true,
//       properties: soldProperties,
//     });
//   } catch (err) {
//     console.error("Error fetching sold properties:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

router.get(
  "/sold-properties-status-user/:id/:projectName/:pType/:Type/:Plan",
  async (req, res) => {
    const { id, projectName, pType, Type, Plan } = req.params;

    try {
      // First query to get plan details
      const [planDetails] = await mySqlPool.query(
        `
        SELECT * 
        FROM basic_additional_plans 
        WHERE Project_Name_A_P = ? 
          AND Property_Type_Plans = ? 
          AND Flat_Name = ? 
          AND Plan_Name = ?
        `,
        [projectName, pType, Type, Plan]
      );

      // Second query to get purchase order payment details
      const [purchaseOrderPayments] = await mySqlPool.query(
        `
        SELECT * 
        FROM perchaseorderpayment 
        WHERE Purchase_Id = ?
        `,
        [id]
      );

      // Send successful response with both dataset counts and optional data
      return res.status(200).json({
        message: "The status of the property was successfully fetched.",
        success: true,
        data1Count: planDetails.length,
        data2Count: purchaseOrderPayments.length,
        data1: planDetails, // Optional: include actual data if needed
        data2: purchaseOrderPayments, // Optional: include actual data if needed
      });
    } catch (error) {
      // Handle errors and send a response with a 500 status code
      console.error("Error fetching property status:", error);
      return res.status(500).json({
        message: "An error occurred while fetching the property status.",
        success: false,
        error: error.message,
      });
    }
  }
);

router.get(
  "/active-property/summaryUser/:organization/:email",
  async (req, res) => {
    const { organization, email } = req.params;

    if (!organization) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required.",
      });
    }

    try {
      // Query for configurations
      const configQuery = `
      SELECT Configuration AS propertyConfiguration, COUNT(*) AS soldCount
      FROM purchaseorder
      WHERE Lead_Owner_Name=? AND Purchase_org_Name = ?
      GROUP BY Configuration;
    `;

      // Query for categories
      const categoryQuery = `
      SELECT Project_Catagory AS projectCategory, COUNT(*) AS soldCount
      FROM purchaseorder
      WHERE Lead_Owner_Name=? AND Purchase_org_Name = ?
      GROUP BY Project_Catagory;
    `;

      const [configResults] = await mySqlPool.query(configQuery, [
        email,
        organization,
      ]);
      const [categoryResults] = await mySqlPool.query(categoryQuery, [
        email,
        organization,
      ]);

      return res.json({
        success: true,
        data: {
          configurations: configResults,
          categories: categoryResults,
        },
      });
    } catch (error) {
      console.error("Error fetching active property summary:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

router.get("/leadsUser/:id/:email", authenticateToken, async (req, res) => {
  // console.log("This is The Leads Get");
  const { id, email } = req.params;

  try {
    const rows = await propertEnquiresUser(id, email);

    if (rows.length > 0) {
      return res.status(200).send({
        message: "The Data is Fetched Sucessfully",
        data: rows,
        success: true,
      });
    } else {
      return res.status(500).send({
        message: "The Data is Fetched Sucessfully",
        data: [],
        success: false,
      });
    }
  } catch (e) {
    console.log("This is The data of Leads Insertion " + e);

    return res.status(500).send({
      message: "data is not Fetched of Leads",
      data: [],
      success: false,
    });
  }
});

router.get("/active-properties/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID (Lead owner) is required.",
    });
  }

  try {
    // Step 1: Get all Lead_Id values for this user
    const leadsQuery = `
      SELECT Lead_Id, Flat_id
      FROM leads
      WHERE Lead_owner = ?;
    `;

    const [leadsResults] = await mySqlPool.query(leadsQuery, [userId]);

    // If no leads found, return an empty array
    if (leadsResults.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "No properties found for this user.",
      });
    }

    // Step 2: Extract Flat_ids from leads results
    const flatIds = leadsResults.map((lead) => lead.Flat_id);

    // Step 3: Fetch property details from flat table based on Flat_ids
    const flatsQuery = `
      SELECT 
        CONCAT(Unit_No, '-', Block, '-', Configuration) AS propertyIdentifier,
        Project_Name_flats,
        Unit_No,
        Block,
        Configuration,
        Property_type,
        Type_Flat
      FROM flat
      WHERE Flat_id IN (?);
    `;

    const [flatsResults] = await mySqlPool.query(flatsQuery, [flatIds]);

    // Step 4: Format and send the results
    const properties = flatsResults.map((flat) => ({
      propertyIdentifier: flat.propertyIdentifier,
      projectName: flat.Project_Name_flats,
      unitNo: flat.Unit_No,
      block: flat.Block,
      configuration: flat.Configuration,
      propertyType: flat.Property_type,
      typeFlat: flat.Type_Flat,
    }));

    res.json({
      success: true,
      data: properties,
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});
router.get(
  "/sold-properties-user/:org_Name/:user_id",
  authenticateToken,
  async (req, res) => {
    const { org_Name, user_id } = req.params;

    try {
      // Fetch properties linked with the organization and user
      const properties = await soldPropertiesUser(org_Name, user_id);
      if (!properties.length) {
        return res.json({ success: true, data: [] });
      }

      const propertyWithStatus = await soldPropertiesUserProperty(
        org_Name,
        user_id
      );

      // Return response with calculated property payment status
      return res.json({ success: true, data: propertyWithStatus });
    } catch (err) {
      console.error("Error fetching sold properties:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
);

router.get("/follow-up-summary-user/:org_Name/:email", async (req, res) => {
  const { org_Name, email } = req.params;
  try {
    // Query for total leads count (All)
    const [allLeads] = await mySqlPool.query(
      `SELECT COUNT(*) AS totalLeads FROM leads WHERE Organization_Name_Leads = ? AND Lead_owner=?`,
      [org_Name, email]
    );

    // Query for overdue tasks
    const [overdueTasks] = await mySqlPool.query(
      `
      SELECT COUNT(DISTINCT Lead_Id) AS overdue FROM activity_logs
      WHERE Due_Date < CURDATE() AND Status = 'Pending' AND Assigned_To=?
    `,
      [org_Name, email]
    );

    // Query for upcoming tasks
    const [upcomingTasks] = await mySqlPool.query(
      `
      SELECT COUNT(DISTINCT Lead_Id) AS upcoming FROM activity_logs
      WHERE Due_Date > CURDATE() AND Status = 'Pending' AND Assigned_To=?
    `,
      [org_Name, email]
    );

    // Query for tasks due today
    const [dueTodayTasks] = await mySqlPool.query(
      `
      SELECT COUNT(DISTINCT Lead_Id) AS dueToday FROM activity_logs
      WHERE DATE(Due_Date) = CURDATE() AND Status = 'Pending' AND Assigned_To=?
    `,
      [org_Name, email]
    );

    // Query for callback due tasks
    const [callbackDueTasks] = await mySqlPool.query(
      `
      SELECT COUNT(DISTINCT Lead_Id) AS callbackDue FROM activity_logs
      WHERE Task_Type = 'Callback' AND Status = 'Pending' AND Assigned_To=? 
    `,
      [org_Name, email]
    );

    // Combine results
    const summaryData = {
      all: allLeads[0].totalLeads,
      overdue: overdueTasks[0].overdue,
      upcoming: upcomingTasks[0].upcoming,
      dueToday: dueTodayTasks[0].dueToday,
      callbackDue: callbackDueTasks[0].callbackDue,
    };

    res.json({ success: true, data: summaryData });
  } catch (err) {
    console.error("Error fetching follow-up summary:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Total Sale Per Month

router.get("/salesPerMonth", async (req, res) => {
  const { email, orgName } = req.query;

  const sqlQuery = `
    SELECT 
    DATE_FORMAT(Purchase_date, '%Y-%b') as month,  -- Use %b for abbreviated month names
    SUM(Additional_Cost + Purchase_Price) as total_sales
FROM purchaseorder 
WHERE Lead_Owner_Name= ? 
AND Purchase_org_Name = ?
GROUP BY month
ORDER BY month ASC;
;
  `;

  try {
    const [rows] = await mySqlPool.query(sqlQuery, [email, orgName]);

    return res.status(200).send({
      data: rows, // Send rows as data property
      message: "Data OF User Month Sale is Fetched",
      success: true,
    });
  } catch (err) {
    console.error("There is An Error In Sales Per Month", err);
    return res.status(500).send({
      message: "Problem in Retrieving User Sale Data",
      success: false,
      data: [],
    });
  }
});

//My Unit

router.get(
  "/revenueForUsers/:projectCode/:type/:id/:year",
  async (req, res) => {
    const { projectCode, type, id, year } = req.params;

    console.log(type);
    console.log("This is type");

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
        WHERE Project_Name = ? AND Lead_Owner_Name=? AND YEAR(Purchase_date)=?
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
        WHERE Project_Name = ? AND Lead_Owner_Name=? 
        GROUP BY year
        ORDER BY year;
        `;
      } else if (type === "quarterly") {
        query = `
        SELECT 
          CASE 
            WHEN MONTH(Purchase_date) IN (1, 2, 3) THEN 'Jan-Mar'
            WHEN MONTH(Purchase_date) IN (4, 5, 6) THEN 'Apr-Jun'
            WHEN MONTH(Purchase_date) IN (7, 8, 9) THEN 'Jul-Sep'
            WHEN MONTH(Purchase_date) IN (10, 11, 12) THEN 'Oct-Dec'
          END AS quarter,
          YEAR(Purchase_date) AS year, 
          SUM(Purchase_Price) AS revenue,
          SUM(Purchase_Price - List_Price) AS profit
        FROM purchaseorder 
        WHERE Project_Name = ? AND Lead_Owner_Name=? AND YEAR(Purchase_date)=?
        GROUP BY year, quarter
        ORDER BY year, quarter;
        `;
      }

      const params =
        type === "yearly" ? [projectCode, id] : [projectCode, id, year];
      const [rows] = await mySqlPool.query(query, params);

      // Calculate total revenue and profit for display
      const totalRevenue = rows.reduce(
        (acc, row) => acc + Number(row.revenue),
        0
      );
      const totalProfit = rows.reduce(
        (acc, row) => acc + Number(row.profit),
        0
      );

      return res.status(200).send({
        message: "Org Admin Revenue and Profit Fetched Successfully",
        success: true,
        data: rows,
        totalRevenue,
        totalProfit,
      });
    } catch (error) {
      return res.status(500).json({
        error: "Error fetching revenue and profit data for Org",
        success: false,
      });
    }
  }
);

// Backend API route to fetch sold properties by project and lead owner
router.get("/MyUnit", authenticateToken, async (req, res) => {
  const { email, orgName } = req.query;

  if (!email || !orgName) {
    return res
      .status(400)
      .json({ error: "Missing email or organization name" });
  }

  try {
    const results = await myUnitSold(email, orgName);

    // Return the data in a clean format
    return res.status(200).send({
      data: results,
      sucess: true,
      message: "This is The My Unit Data",
    });
  } catch (err) {
    console.error("Error fetching data:", err);
    return res.status(500).send({
      message: "Database error occurred",
      success: false,
      message: "There is Problem In Fetching MyUnit",
    });
  }
});

router.get("/TotalPropertyUser", async (req, res) => {
  const { projectName, orgName } = req.query;

  if (!projectName || !orgName) {
    return res
      .status(400)
      .json({ error: "Missing email or organization name" });
  }

  try {
    const query = `
          SELECT Project_Name_flats, COUNT(*) as Total_Sold 
          FROM flat 
          WHERE Project_Name_flats = ? AND Org_Name = ? 
          GROUP BY Project_Name_flats
      `;
    const results = await mySqlPool.query(query, [projectName, orgName]);

    // Return the data in a clean format
    return res.status(200).send({
      data: results,
      sucess: true,
      message: "This is The My Unit Data",
    });
  } catch (err) {
    console.error("Error fetching data:", err);
    return res.status(500).send({
      message: "Database error occurred",
      success: false,
      message: "There is Problem In Fetching MyUnit",
    });
  }
});

// Total Sale
router.get("/totalSalesUser", authenticateToken, async (req, res) => {
  const { email, orgName, period, year } = req.query;

  if (!email || !orgName || !period) {
    return res
      .status(400)
      .json({ error: "Missing email, organization name, or period" });
  }

  try {
    const results = await totalSaleDoneByUser(email, orgName, period, year);

    return res.status(200).json({
      data: results,
      message: "Data of Sale of user is Fetched Successfully",
      success: true,
    });
  } catch (err) {
    console.error("Error fetching total sales:", err);
    return res.status(500).json({
      message: "There is A Problem in Fetching The User Sale Data",
      success: false,
      data: [],
    });
  }
});

//Lead Convergene user

router.get(
  "/lead-conversion-rate-user/:organization/:timePeriod/:email",
  async (req, res) => {
    const { organization, timePeriod, email } = req.params;

    // Validate organization name
    if (!organization) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required.",
      });
    }

    // Define date format and groupings for different periods
    let dateConditionLeads, dateConditionPurchases;
    switch (timePeriod.toLowerCase()) {
      case "monthly":
        // Convert Date_Created from DD/MM/YYYY to YYYY-MM for monthly filtering
        dateConditionLeads = `DATE_FORMAT(STR_TO_DATE(Date_Created, "%d/%m/%Y"), "%Y-%m") = DATE_FORMAT(NOW(), "%Y-%m")`;
        dateConditionPurchases = `DATE_FORMAT(Purchase_date, "%Y-%m") = DATE_FORMAT(NOW(), "%Y-%m")`;
        break;
      case "quarterly":
        // Quarterly filtering based on year and quarter
        dateConditionLeads = `YEAR(STR_TO_DATE(Date_Created, "%d/%m/%Y")) = YEAR(NOW()) AND QUARTER(STR_TO_DATE(Date_Created, "%d/%m/%Y")) = QUARTER(NOW())`;
        dateConditionPurchases = `YEAR(Purchase_date) = YEAR(NOW()) AND QUARTER(Purchase_date) = QUARTER(NOW())`;
        break;
      case "yearly":
        // Yearly filtering based on year
        dateConditionLeads = `YEAR(STR_TO_DATE(Date_Created, "%d/%m/%Y")) = YEAR(NOW())`;
        dateConditionPurchases = `YEAR(Purchase_date) = YEAR(NOW())`;
        break;
      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid time period." });
    }

    try {
      // Query to get the total number of leads for the organization based on the selected time period
      const totalLeadsQuery = `
      SELECT COUNT(*) AS totalLeads
      FROM leads
      WHERE Organization_Name_Leads= ? 
      AND ${dateConditionLeads} AND Lead_owner=?
    `;

      const [totalLeadsResult] = await mySqlPool.query(totalLeadsQuery, [
        organization,
        email,
      ]);
      const totalLeads = totalLeadsResult[0].totalLeads || 0;

      // Query to get the number of leads that resulted in a purchase (conversion) based on the selected time period
      const convertedLeadsQuery = `
      SELECT COUNT(*) AS convertedLeads
      FROM purchaseorder
      WHERE Purchase_org_Name = ?
      AND ${dateConditionPurchases} AND Lead_Owner_Name=?
    `;

      const [convertedLeadsResult] = await mySqlPool.query(
        convertedLeadsQuery,
        [organization, email]
      );
      const convertedLeads = convertedLeadsResult[0].convertedLeads || 0;

      // Calculate the conversion rate
      const conversionRate =
        totalLeads >= 0
          ? (convertedLeads / (convertedLeads + totalLeads)) * 100
          : 0;

      // Send the result to the frontend
      res.json({
        success: true,
        data: {
          totalLeads: convertedLeads + totalLeads,
          convertedLeads,
          conversionRate: convertedLeads === 0 ? 0 : conversionRate.toFixed(2), // Round to 2 decimal places
        },
      });
    } catch (error) {
      console.error("Error fetching lead conversion rate:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// TAsk

router.get("/tasks-user", authenticateToken, async (req, res) => {
  const { email, organizationName } = req.query;

  try {
    const tasks = await calendarTask(email, organizationName);

    return res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", success: false });
  }
});
router.get("/superAdmin-Task", authenticateToken, async (req, res) => {
  try {
    // Query to get tasks for super admin
    const tasks = await superAdminTask();

    return res.status(200).json(tasks);
  } catch (e) {
    console.error("Error fetching Admin task data:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/leadsWithFlat/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params; // Destructure userId from params for cleaner code

  // SQL query to fetch data from leads and flat tables

  try {
    // Execute the query with the userId as a parameter
    const results = await leadsWithProperty(userId);

    // Format the response data
    const responseData = results.map((item) => ({
      flatId: `${item.Block}${item.Unit_No}`, // Concatenate Block and Unit_No for flatId
      leadCount: item.lead_count, // Number of leads associated with the flat
    }));

    // Send the response with formatted data
    return res.status(200).json({ data: responseData });
  } catch (error) {
    // Log and handle errors
    console.error("Error fetching leads:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching leads", error });
  }
});

module.exports = router;
