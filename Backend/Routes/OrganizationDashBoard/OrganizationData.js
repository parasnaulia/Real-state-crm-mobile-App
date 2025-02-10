const express = require("express");

const mySqlPool = require("../../config/db.js");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  TotalRevenueFetcher,
  totalRevenueFetcher,
  revenueByProject,
  projectNameAndCode,
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
} = require("../../Controllers/DashBoardControllers/OrganizationDashBoardController.js");
const {
  conversionRateForUsers,
  leadRepoertTableForUsers,
} = require("../../Controllers/LeadsReportsController/LeadsReportFetcher.js");
const { authenticateToken } = require("../../Middlewares/RoutesAuth.js");
const {
  sourceOfEnquiry,
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

router.get(
  "/active-leads1/:organization/:year",
  authenticateToken,
  async (req, res) => {
    const { organization, year } = req.params;

    if (!organization) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required.",
      });
    }

    try {
      // Execute the query
      const results = await activeLeads(organization, year);

      if (!results || results.length === 0) {
        return res.status(200).send({
          success: true,
          data: [],
          message: "No active leads found.",
        });
      }

      // Format the response for a tabular chart display
      const tableData = results.map((lead) => ({
        userName: lead.userName, // Lead owner's name (User)
        activeLeadsCount: lead.activeLeadsCount, // Total active leads count for this user
        userName: lead.User_Main_Name,
        userId: lead.userName,
      }));

      // Send the response in a table-friendly format
      return res.json({
        success: true,
        data: tableData, // Table-like format for the frontend
        message: "Active leads data fetched successfully.",
      });
    } catch (error) {
      console.error("Error fetching active leads:", error);
      return res.status(500).json({
        success: false,
        message:
          "Server error in fetching the Active Leads for Organization Dashboard",
      });
    }
  }
);

router.get("/sales-forecasting/:organization", async (req, res) => {
  const { organization } = req.params;

  if (!organization) {
    return res.status(400).json({
      success: false,
      message: "Organization name is required.",
    });
  }

  try {
    // SQL query to count records for each category based on updated lead statuses
    const query = `
        SELECT
          SUM(CASE WHEN Lead_Status IN ('New Lead-not Contacted', 'New Lead-Contacted', 'Interested', 'Proposal Sent', 'Negotiation', 'Qualified') THEN 1 ELSE 0 END) AS allActive,
          SUM(CASE WHEN Lead_Status IN ('Interested', 'Proposal Sent', 'Negotiation') THEN 1 ELSE 0 END) AS hot,
          SUM(CASE WHEN Lead_Status = 'New Lead-not Contacted' THEN 1 ELSE 0 END) AS newNotContacted,
          SUM(CASE WHEN Lead_Status = 'New Lead-Contacted' THEN 1 ELSE 0 END) AS newContacted,
          SUM(CASE WHEN Lead_Status IN ('Interested', 'Proposal Sent') THEN 1 ELSE 0 END) AS followUp,
          SUM(CASE WHEN Lead_Status = 'Closed Won-Converted' THEN 1 ELSE 0 END) AS closedWon,
          SUM(CASE WHEN Lead_Status = 'Closed Won-not Converted' THEN 1 ELSE 0 END) AS closedLost
        FROM leads
        WHERE Organization_Name = ?;
      `;

    // Execute the query
    const [results] = await mySqlPool.query(query, [organization]);

    // Send the response
    res.json({
      success: true,
      data: {
        allActive: results[0].allActive,
        hot: results[0].hot,
        newNotContacted: results[0].newNotContacted,
        newContacted: results[0].newContacted,
        followUp: results[0].followUp,
        closedWon: results[0].closedWon,
        closedLost: results[0].closedLost,
      },
    });
  } catch (error) {
    console.error("Error fetching sales forecasting data:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// API to get monthly revenue, profit and current month data
// router.get("/revenuegernerated/:org_Name/:timeframe/:year", async (req, res) => {
//   const { org_Name, timeframe,year } = req.params;

//   try {
//     let query = "";
//     const params = [org_Name];

//     if (timeframe === "Yearly") {
//       query = `
//         SELECT YEAR(Purchase_date) AS year, SUM(Purchase_Price + Additional_Cost) AS revenue
//         FROM purchaseorder
//         WHERE Purchase_org_Name = ? AND Mon
//         GROUP BY year
//         ORDER BY year DESC
//         LIMIT 5;
//       `;
//     } else if (timeframe === "Quarterly") {
//       query = `
//         SELECT
//           CASE
//             WHEN QUARTER(Purchase_date) = 1 THEN CONCAT(YEAR(Purchase_date), ' Jan-Mar')
//             WHEN QUARTER(Purchase_date) = 2 THEN CONCAT(YEAR(Purchase_date), ' Apr-Jun')
//             WHEN QUARTER(Purchase_date) = 3 THEN CONCAT(YEAR(Purchase_date), ' Jul-Sep')
//             WHEN QUARTER(Purchase_date) = 4 THEN CONCAT(YEAR(Purchase_date), ' Oct-Dec')
//           END AS quarter,
//           SUM(Purchase_Price + Additional_Cost) AS revenue
//         FROM purchaseorder
//         WHERE Purchase_org_Name = ?
//         GROUP BY quarter
//         ORDER BY YEAR(Purchase_date) DESC, QUARTER(Purchase_date);
//       `;
//     } else if (timeframe === "Monthly") {
//       query = `
//         SELECT
//           DATE_FORMAT(Purchase_date, '%M %Y') AS month,
//           SUM(Purchase_Price + Additional_Cost) AS revenue
//         FROM purchaseorder
//         WHERE Purchase_org_Name = ?
//         GROUP BY month
//         ORDER BY YEAR(Purchase_date) DESC, MONTH(Purchase_date);
//       `;
//     } else {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid timeframe" });
//     }

//     const [data] = await mySqlPool.query(query, params);
//     res.json({ success: true, data });
//   } catch (err) {
//     console.error("Error fetching data:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// {Moonthly}
router.post("/getSalesData", async (req, res) => {
  const { timeframe, orgName } = req.body;

  console.log("Received timeframe:", timeframe?.toLowerCase());
  console.log("Received organization name:", orgName);

  // Validate request input
  if (!timeframe || !orgName) {
    return res
      .status(400)
      .json({ error: "Missing timeframe or organization name" });
  }

  let query = "";

  // Prepare SQL query based on timeframe
  if (timeframe.toLowerCase() === "monthly") {
    query = `
      SELECT 
          MONTHNAME(Purchase_date) AS month, 
          List_Price, Purchase_Price, Project_Name, Project_Catagory,Main_Property_Id,Purchase_date,Purchase_id
      FROM purchaseorder
      WHERE Purchase_org_Name = ? 
      ORDER BY MONTH(Purchase_date);
    `;
  } else if (timeframe.toLowerCase() === "quarterly") {
    query = `
      SELECT 
          QUARTER(Purchase_date) AS quarter, 
          CONCAT(YEAR(Purchase_date), '-Q', QUARTER(Purchase_date)) AS quarter_label,
          List_Price, Purchase_Price, Project_Name, Project_Catagory,Main_Property_Id,Purchase_date,Purchase_id
      FROM purchaseorder
      WHERE Purchase_org_Name = ?
      ORDER BY QUARTER(Purchase_date);
    `;
  } else if (timeframe.toLowerCase() === "yearly") {
    query = `
      SELECT 
          YEAR(Purchase_date) AS year,
          List_Price, Purchase_Price, Project_Name, Project_Catagory,Main_Property_Id,Purchase_date,Purchase_id
      FROM purchaseorder
      WHERE Purchase_org_Name = ?
      ORDER BY YEAR(Purchase_date);
    `;
  } else {
    return res.status(400).json({ error: "Invalid timeframe provided" });
  }

  console.log("Prepared Query:", query);

  try {
    // Execute the MySQL query using async/await
    const [results] = await mySqlPool.execute(query, [orgName]);

    // Check if results are empty
    if (!results || results.length === 0) {
      console.log("No data found for the given criteria");
      return res
        .status(404)
        .json({ message: "No data found for the given criteria" });
    }

    // console.log("Query Results:", results);
    return res.status(200).json(results); // Send the results back to the client
  } catch (error) {
    console.error("Error executing query:", error.message);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

router.get("/projectAdmin", async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE_FORMAT(Purchase_date, '%Y-%m') AS Month,
        Lead_Owner_Name AS Agent,
        Type AS Property_Type,
        SUM(Purchase_Price + IFNULL(Additional_Cost, 0)) AS Total_Revenue
      FROM 
        purchaseorder
      GROUP BY 
        Month, Agent, Property_Type
      ORDER BY 
        Month ASC, Agent ASC
    `;

    const [rows] = await mySqlPool.query(query);

    return res.status(200).json({
      message: "Data fetched successfully",
      success: true,
      data: rows,
    });
  } catch (e) {
    console.log("There is a problem fetching the project data");
    return res.status(500).send({
      message: "Server problem in project get API",
      success: false,
      data: [],
    });
  }
});

router.get("/projectAdmin/:timeframe", authenticateToken, async (req, res) => {
  const { timeframe } = req.params;
  const { organizationId, year } = req.query;

  // console.log("Year from frontend:", year);
  // console.log("Timeframe:", timeframe?.toLowerCase());

  try {
    // Group data by user and timeframe
    const groupedData = await leadRepoertTableForUsers(
      organizationId,
      year,
      timeframe
    );

    console.log(groupedData);
    console.log("This is The Group Data of ledsasdasdasd  ");

    return res.status(200).json({
      message: `${
        timeframe.charAt(0).toUpperCase() + timeframe.slice(1)
      } data fetched successfully`,
      success: true,
      data: groupedData,
    });
  } catch (e) {
    console.error("Error fetching project data:", e);
    return res.status(500).send({
      message: "Server problem in project data API",
      success: false,
      data: [],
    });
  }
});

// {Yearly}
router.get("/projectAdmin/yearly", async (req, res) => {
  try {
    const query = `
      SELECT 
        YEAR(Purchase_date) AS Year,
        Lead_Owner_Name AS Agent,
        Type AS Property_Type,
        SUM(Purchase_Price + IFNULL(Additional_Cost, 0)) AS Total_Revenue
      FROM 
        purchaseorder
      GROUP BY 
        Year, Agent, Property_Type
      ORDER BY 
        Year ASC, Agent ASC
    `;

    const [rows] = await mySqlPool.query(query);

    return res.status(200).json({
      message: "Yearly data fetched successfully",
      success: true,
      data: rows,
    });
  } catch (e) {
    console.log("There is a problem fetching the yearly project data");
    return res.status(500).send({
      message: "Server problem in project yearly API",
      success: false,
      data: [],
    });
  }
});
router.get("/conversionRate-1", authenticateToken, async (req, res) => {
  try {
    const { organizationId, timeframe, year } = req.query;

    // Ensure required parameters are provided
    if (!organizationId || !timeframe || !year) {
      return res.status(400).send({
        message:
          "Missing required query parameters: organizationId, timeframe, or year.",
        success: false,
        data: [],
      });
    }

    // Dynamic timeframe grouping logic

    // Preparing the final response format
    const responseData = await conversionRateForUsers(
      organizationId,
      timeframe,
      year
    );

    // return responseData;

    return res.status(200).json({
      message: "Conversion rate data fetched successfully.",
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error calculating conversion rate:", error);
    return res.status(500).send({
      message: "Server error while calculating conversion rate.",
      success: false,
      data: [],
    });
  }
});

// {Quaterly}

router.get("/projectAdmin/quarterly", async (req, res) => {
  try {
    const query = `
      SELECT 
        CONCAT(YEAR(Purchase_date), '-Q', QUARTER(Purchase_date)) AS Quarter,
        Lead_Owner_Name AS Agent,
        Type AS Property_Type,
        SUM(Purchase_Price + IFNULL(Additional_Cost, 0)) AS Total_Revenue
      FROM 
        purchaseorder
      GROUP BY 
        Quarter, Agent, Property_Type
      ORDER BY 
        Quarter ASC, Agent ASC
    `;

    const [rows] = await mySqlPool.query(query);

    return res.status(200).json({
      message: "Quarterly data fetched successfully",
      success: true,
      data: rows,
    });
  } catch (e) {
    console.log("There is a problem fetching the quarterly project data");
    return res.status(500).send({
      message: "Server problem in project quarterly API",
      success: false,
      data: [],
    });
  }
});

// API to get project stats
router.get("/project-stats", async (req, res) => {
  const queryString = `
    SELECT 
      p.Name AS project_name, 
      p.Status AS project_status,
      COUNT(f.Flat_id) AS total_properties,
      SUM(CASE WHEN f.Status = 'Sold' THEN 1 ELSE 0 END) AS sold_properties
    FROM project p
    LEFT JOIN flat f ON p.Name = f.Project_Name_flats
    GROUP BY p.Name, p.Status
  `;

  try {
    // Await the result of the MySQL query
    const results = await mySqlPool.query(queryString);

    // Return the results in JSON format

    return res.json(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    // Send a 500 status code with an error message
    res.status(500).json({ error: "Database query failed" });
  }
});
router.get(
  "/leads-by-stage/:organization/:year",
  authenticateToken,
  async (req, res) => {
    const { organization, year } = req.params;

    if (!organization) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required.",
      });
    }

    try {
      // Define the base query for leads

      // Prepare the response data
      const leadsByStageData = await leadsByStage(organization, year);

      // Send the response
      return res.json({
        success: true,
        data: leadsByStageData,
        message: "Leads by stage fetched successfully.",
      });
    } catch (error) {
      console.error("Error fetching leads by stage:", error);
      res.status(500).json({
        success: false,
        message: "Server error in Fteching Leads By Stage For A Organization",
      });
    }
  }
);

router.get(
  "/lead-conversion-rate/:organization/:timePeriod/:param?",
  authenticateToken,
  async (req, res) => {
    const { organization, timePeriod, param } = req.params;

    // console.log(req.params);
    // console.log("This is req parmas");

    // Validate organization name
    if (!organization) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required.",
      });
    }

    // Initialize year and date cond

    try {
      const [totalLeads, convertedLeads, conversionRate] =
        await leadsConversionForOrganization(organization, timePeriod, param);

      // Send the result to the frontend
      return res.json({
        success: true,
        data: {
          totalLeads,
          convertedLeads,
          conversionRate: convertedLeads === 0 ? 0 : conversionRate.toFixed(2), // Round to 2 decimal places
        },
      });
    } catch (error) {
      console.error("Error fetching lead conversion rate:", error.message);
      return res.status(500).json({
        success: false,
        message: "Server error, please try again later.",
      });
    }
  }
);

router.get(
  "/active-property/:organization",
  authenticateToken,
  async (req, res) => {
    const { organization } = req.params;

    if (!organization) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required.",
      });
    }

    try {
      // SQL query to get the number of inquiries for each property

      const [inquiriesResults, offersResults] = await recentPropertyInquries(
        organization
      );

      // SQL query to get the number of offers for each property that has been sold

      // Combine inquiries and offers into a single result set
      const combinedData = inquiriesResults.map((inquiry) => {
        const matchingOffer = offersResults.find(
          (offer) => offer.FlatId === inquiry.FlatId
        );
        return {
          propertyIdentifier: inquiry.FlatId,
          propertyIdentifierData: inquiry.Block + inquiry.Unit_No,
          inquiriesCount: inquiry.inquiriesCount,
          offersCount: matchingOffer ? matchingOffer.offersCount : 0,
        };
      });

      // Send the response to the frontend
      return res.json({
        success: true,
        data: combinedData,
      });
    } catch (error) {
      console.error(
        "Server error in fetching Property Recent Enquires For a Organization",
        error
      );
      res.status(500).json({
        success: false,
        message:
          "Server error in fetching Property Recent Enquires For a Organization",
      });
    }
  }
);

router.get(
  "/active-property/summary/:organization",
  authenticateToken,
  async (req, res) => {
    const { organization } = req.params;

    if (!organization) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required.",
      });
    }

    try {
      const [configResults, categoryResults] = await fetchConfigAndCategories(
        organization
      );

      return res.json({
        success: true,
        message: "Categories and Config Fetched SucessFully",
        data: {
          configurations: configResults,
          categories: categoryResults,
        },
      });
    } catch (error) {
      console.error("Error fetching active property summary:", error);
      return res.status(500).json({
        success: false,
        message:
          "Server error in Fetching Categories and Configuration for Dashboard Charts",
      });
    }
  }
);

router.get(
  "/sold-properties/:org_Name",
  authenticateToken,
  async (req, res) => {
    const { org_Name } = req.params;

    try {
      // Fetch properties linked with the organization
      const propertyWithStatus = await soldProperties(org_Name);

      // Return response with calculated property payment status
      return res.json({ success: true, data: propertyWithStatus });
    } catch (err) {
      console.error("Error fetching sold properties for Organization:", err);
      res.status(500).json({
        error: err,
        success: false,
        message:
          "Internal Server Error while Fetching Sold Properties for Organization Dashboard",
      });
    }
  }
);

router.get("/sold-properties-user/:org_Name/:user_id", async (req, res) => {
  const { org_Name, id } = req.params;

  try {
    // Fetch properties linked with the organization
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
          p.Purchase_org_Name = ? AND p.Lead_Owner_Name=?
      `,
      [org_Name, id]
    );

    // For each property, calculate the payment status
    const propertyWithStatus = await Promise.all(
      properties.map(async (property) => {
        const [payments] = await mySqlPool.query(
          `
          SELECT 
              Paid_Amount 
          FROM 
              perchaseorderpayment
          WHERE 
              Purchase_Id = ?
          `,
          [property.Purchase_id]
        );

        // Determine payment status based on payments
        let status = "pending"; // Default to pending

        if (payments.length > 0) {
          const totalPaid = payments.reduce(
            (acc, payment) => acc + (payment.Paid_Amount || 0),
            0
          );

          const allEmpty = payments.every(
            (payment) =>
              payment.Paid_Amount == null || payment.Paid_Amount === 0
          );
          const someFilled = payments.some(
            (payment) => payment.Paid_Amount != null && payment.Paid_Amount > 0
          );
          const allFilled = payments.every(
            (payment) => payment.Paid_Amount != null && payment.Paid_Amount > 0
          );

          if (allEmpty) {
            status = "pending";
          } else if (someFilled && !allFilled) {
            status = "partially paid";
          } else if (totalPaid >= property.Price) {
            status = "paid";
          }
        }

        return {
          name: property.Property_Name,
          date: property.Date,
          price: property.Price,
          status: status,
          Main_Property_Id: property.Main_Property_Id,
          Purchase_id: property.Purchase_id,
          Customer_id: property.Customer_id,
          Block: property.Block,
          Unit_No: property.Unit_No,
          Configuration: property.Configuration,
          List_Price: property.List_Price,
          Main_Project_Name: property?.Main_Project_Name,
          CategoryName: property?.Category,
        };
      })
    );

    console.log(propertyWithStatus);
    console.log("this is insane");

    // Return response with calculated property payment status
    return res.json({ success: true, data: propertyWithStatus });
  } catch (err) {
    console.error("Error fetching sold properties:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});
// router.get(
//   "/total-soldPropertiesByUser/:orgName/:timeframe",
//   async (req, res) => {
//     const { orgName, timeframe } = req.params;

//     // console.log("This is Inmsane");

//     try {
//       // Validate timeframe
//       const validTimeframes = ["monthly", "quarterly", "yearly"];
//       if (!validTimeframes.includes(timeframe)) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Invalid timeframe. Use 'monthly', 'quarterly', or 'yearly'.",
//         });
//       }

//       // Base query with joins to fetch relevant data
//       let query = `
//         SELECT
//           u.Name AS userName,
//           MONTHNAME(po.Purchase_date) AS monthName,
//           QUARTER(po.Purchase_date) AS quarter,
//           CONCAT(
//             CASE
//               WHEN QUARTER(po.Purchase_date) = 1 THEN 'January-March'
//               WHEN QUARTER(po.Purchase_date) = 2 THEN 'April-June'
//               WHEN QUARTER(po.Purchase_date) = 3 THEN 'July-September'
//               WHEN QUARTER(po.Purchase_date) = 4 THEN 'October-December'
//             END
//           ) AS quarterRange,
//           YEAR(po.Purchase_date) AS year,
//           po.Project_Name AS projectName,
//           po.Project_Catagory AS propertyCategory,
//           po.List_Price AS listPrice,
//           po.Purchase_Price AS purchasePrice,
//           po.Main_Property_Id,
//           po.Purchase_date,

//           po.Purchase_id

//         FROM
//           users u
//         JOIN
//           purchaseorder po ON u.User_Id = po.Lead_Owner_Name
//         WHERE
//           u.Organization_Name_User = ?
//           AND YEAR(po.Purchase_date) >= 2020
//         ORDER BY
//           u.Name, po.Purchase_date;
//       `;

//       const results = await mySqlPool.query(query, [orgName]);

//       // Parse results into desired format
//       let data = {};
//       results[0].forEach((row) => {
//         const {
//           userName,
//           monthName,
//           quarterRange,
//           year,
//           projectName,
//           propertyCategory,
//           listPrice,
//           purchasePrice,
//           Main_Property_Id,
//           Purchase_id,
//           Purchase_date,
//         } = row;

//         if (!data[userName]) {
//           data[userName] = {};
//         }

//         if (timeframe === "monthly") {
//           if (!data[userName][monthName]) {
//             data[userName][monthName] = [];
//           }
//           data[userName][monthName].push({
//             year,
//             projectName,
//             propertyCategory,
//             listPrice,
//             purchasePrice,
//             Main_Property_Id,
//             Purchase_id,
//             Purchase_date,
//           });
//         } else if (timeframe === "quarterly") {
//           if (!data[userName][quarterRange]) {
//             data[userName][quarterRange] = [];
//           }
//           data[userName][quarterRange].push({
//             year,
//             projectName,
//             propertyCategory,
//             listPrice,
//             purchasePrice,
//             Main_Property_Id,
//             Purchase_id,
//             Purchase_date,
//           });
//         } else if (timeframe === "yearly") {
//           const yearKey = `${year}`;
//           if (!data[userName][yearKey]) {
//             data[userName][yearKey] = [];
//           }
//           data[userName][yearKey].push({
//             projectName,
//             propertyCategory,
//             listPrice,
//             purchasePrice,
//             Main_Property_Id,
//             Purchase_id,
//             Purchase_date,
//           });
//         }
//       });

//       // Format response
//       const formattedData = Object.keys(data).map((userName) => ({
//         userName,
//         timeframeData: data[userName],
//       }));

//       res.status(200).json({
//         success: true,
//         data: formattedData,
//       });
//     } catch (err) {
//       console.error("Error fetching sold properties:", err);
//       res.status(500).json({
//         success: false,
//         message: "Internal Server Error",
//       });
//     }
//   }
// );

router.get("/follow-up-summary/:org_Name", async (req, res) => {
  const { org_Name } = req.params;
  try {
    // Query for total leads count (All)
    const [allLeads] = await mySqlPool.query(
      `SELECT COUNT(*) AS totalLeads FROM leads WHERE Organization_Name_Leads = ?`,
      [org_Name]
    );

    // Query for overdue tasks
    const [overdueTasks] = await mySqlPool.query(
      `
      SELECT COUNT(DISTINCT Lead_Id) AS overdue FROM activity_logs
      WHERE Due_Date < CURDATE() AND Status = 'Pending' 
    `,
      [org_Name]
    );

    // Query for upcoming tasks
    const [upcomingTasks] = await mySqlPool.query(
      `
      SELECT COUNT(DISTINCT Lead_Id) AS upcoming FROM activity_logs
      WHERE Due_Date > CURDATE() AND Status = 'Pending' 
    `,
      [org_Name]
    );

    // Query for tasks due today
    const [dueTodayTasks] = await mySqlPool.query(
      `
      SELECT COUNT(DISTINCT Lead_Id) AS dueToday FROM activity_logs
      WHERE DATE(Due_Date) = CURDATE() AND Status = 'Pending' 
    `,
      [org_Name]
    );

    // Query for callback due tasks
    const [callbackDueTasks] = await mySqlPool.query(
      `
      SELECT COUNT(DISTINCT Lead_Id) AS callbackDue FROM activity_logs
      WHERE Task_Type = 'Callback' AND Status = 'Pending' 
    `,
      [org_Name]
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

router.get("/total-revenue/:orgName", authenticateToken, async (req, res) => {
  const { orgName } = req.params; // Get organization name from parameters
  try {
    // Query to calculate total revenue, treating NULL Additional_Cost as 0
    const totalRevenueResult = await totalRevenueFetcher(orgName);

    // If there are no results or total revenue is null
    if (!totalRevenueResult[0] || totalRevenueResult[0].totalRevenue === null) {
      return res.json({ success: true, totalRevenue: 0 });
    }

    // Send total revenue in the response
    return res.json({
      success: true,
      totalRevenue: totalRevenueResult[0].totalRevenue,
    });
  } catch (err) {
    console.error("Error fetching total revenue for the Organziation:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching total revenue for the Organziation",
    });
  }
});

router.get("/total-sales/:orgName", authenticateToken, async (req, res) => {
  const { orgName } = req.params;
  try {
    // Query to calculate total sales (number of properties sold)
    const totalSalesResult = await TotalRevenueFetcher(orgName);

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
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});
router.get("/taskofUsers/:orgName", authenticateToken, async (req, res) => {
  const { orgName } = req.params;

  try {
    // Query the database using the provided organization name

    const [rows] = await taskofUsers(orgName);

    // Check if any results were returned
    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .json({ message: `No tasks found for organization '${orgName}'` });
    }

    // Send the results back as a response
    res.status(200).json({ data: rows, success: true });
  } catch (error) {
    // Log error details for debugging
    console.error("Error fetching tasks:", error);

    // Send generic error message to avoid leaking sensitive details
    res.status(500).json({
      message: "An error occurred while fetching tasks",
      success: false,
    });
  }
});

router.get("/project-stats1/:orgName", authenticateToken, async (req, res) => {
  const { orgName } = req.params;

  // Check if orgName is provided
  if (!orgName) {
    return res.status(400).json({
      success: false,
      message: "Organization name is required",
    });
  }

  // console.log(object)

  try {
    // Execute the query with the organization name as a parameter
    const results = await projectStats(orgName);

    console.log(results);
    console.log("nice");

    // Send a success response with results

    return res.json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error("Error fetching project stats:", err);

    // Send error response in case of failure
    return res.status(500).json({
      success: false,
      message: "Failed to fetch project statistics",
      error: err.message, // Optionally include the error message
    });
  }
});
router.get("/revenueByUser/:timeframe/:MainName/:year", async (req, res) => {
  const { timeframe, MainName, year } = req.params;

  // Parse the year and default to the current year if not provided
  const selectedYear = parseInt(year) || new Date().getFullYear();

  let dateCondition = ""; // This will store the SQL condition for filtering
  let query2 = ""; // Variable for detailed query

  // Determine the date condition and query based on the timeframe
  switch (timeframe) {
    case "monthly":
      if (!req.query.month) {
        return res.status(400).json({
          message: "Please provide a month for the monthly timeframe",
        });
      }
      const month = parseInt(req.query.month);
      dateCondition = `MONTH(Purchase_date) = ${month} AND YEAR(Purchase_date) = ${selectedYear}`;
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
        WHERE MONTH(p.Purchase_date) = ${month} 
          AND YEAR(p.Purchase_date) = ${selectedYear} 
          AND Purchase_org_Name = ?
      `;
      break;
    case "quarterly":
      if (!req.query.quarter) {
        return res.status(400).json({
          message: "Please provide a quarter (1-4) for the quarterly timeframe",
        });
      }
      const quarter = parseInt(req.query.quarter);
      const quarterStartMonth = (quarter - 1) * 3 + 1; // Calculate the start month of the quarter
      const quarterEndMonth = quarterStartMonth + 2; // Calculate the end month of the quarter

      dateCondition = `
        (MONTH(Purchase_date) BETWEEN ${quarterStartMonth} AND ${quarterEndMonth}) 
        AND YEAR(Purchase_date) = ${selectedYear}
      `;
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
        WHERE (MONTH(p.Purchase_date) BETWEEN ${quarterStartMonth} AND ${quarterEndMonth}) 
          AND YEAR(p.Purchase_date) = ${selectedYear} 
          AND Purchase_org_Name = ?
      `;
      break;
    case "yearly":
      dateCondition = `YEAR(Purchase_date) = ${selectedYear}`;
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
        WHERE YEAR(p.Purchase_date) = ${selectedYear} 
          AND Purchase_org_Name = ?
      `;
      break;
    default:
      return res.status(400).json({ message: "Invalid timeframe" });
  }

  const query = `
    SELECT 
      Lead_Owner_Name, 
      CAST(SUM(Purchase_Price) AS DECIMAL(10, 2)) AS total_revenue 
    FROM purchaseorder 
    WHERE ${dateCondition} AND Purchase_org_Name = ? 
    GROUP BY Lead_Owner_Name 
    ORDER BY total_revenue DESC;
  `;

  try {
    // Execute queries
    const [results] = await mySqlPool.query(query, [MainName]);
    const [result2] = await mySqlPool.query(query2, [MainName]);

    // Format the detailed query results
    const mainDataFormattedResult = result2.map((row) => ({
      Lead_Owner_Name: row.Lead_Owner_Name,
      Purchase_Price: row.Purchase_Price,
      Project_Name: row.Project_Name,
      Project_Catagory: row.Project_Catagory,
      Type: row.Type,
      Unit_No: row.Unit_No,
      Block: row.Block,
      Configuration: row.Configuration,
      List_Price: row.List_Price,
      Purchase_date: row.Purchase_date,
    }));

    // Format the revenue summary results
    const formattedResults = results.map((row) => ({
      Lead_Owner_Name: row.Lead_Owner_Name || "Unknown", // Handle undefined names gracefully
      total_revenue: Number(row.total_revenue) || 0, // Ensure revenue is a number
    }));

    return res.status(200).send({
      formattedResults: formattedResults,
      details: mainDataFormattedResult,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching revenue data:", error.message);
    return res.status(500).json({
      message: "Server error, please try again later",
      success: false,
    });
  }
});

// {Sales Forcasting Upadated}

router.get(
  "/sales/forecasting/:OrgName",
  authenticateToken,
  async (req, res) => {
    const { OrgName } = req.params;

    // Check if OrgName is provided
    if (!OrgName) {
      return res.status(400).json({ error: "Organization name is required" });
    }

    try {
      // SQL Query with orgName parameter to fetch sales data
      const results = await salesForCastingCenter(OrgName);

      // console.log("This is The Salesd datatatatatatatatatattatatat");
      // console.log(results);

      // Check if results were found
      if (results.length === 0) {
        return res.status(404).json({
          error: "No sales data found for this organization",
          success: false,
        });
      }

      // Return the response with sales data
      return res.json({
        totalSales: results[0].totalSales || 0,
        byWebsite: results[0].byWebsite || 0,
        byAgent: results[0].byAgent || 0,
        byMarketTeam: results[0].byMarketTeam || 0,
        byApp: results[0].byApp || 0,
        success: true,
      });
    } catch (error) {
      console.error("Error fetching sales center data :", error);
      return res
        .status(500)
        .json({ error: "Database query failed", success: false });
    }
  }
);

// Admin Config

router.get("/org-revenue-profit/:year", authenticateToken, async (req, res) => {
  const { year } = req.params;
  try {
    const queryString = `
      SELECT 
        Purchase_org_Name AS organization,
        MONTH(Purchase_date) AS month,
        SUM(Purchase_Price) AS revenue,
        ( SUM(Purchase_Price + Additional_Cost)-SUM(List_Price) ) AS profit
      FROM 
        purchaseorder
      WHERE 
        Purchase_org_Name IS NOT NULL AND YEAR(Purchase_date)=?
      GROUP BY 
        Purchase_org_Name, MONTH(Purchase_date)
      ORDER BY 
        Purchase_org_Name, MONTH(Purchase_date);
    `;

    const [results] = await mySqlPool.query(queryString, [year]);

    // Restructure the data for frontend usage
    const response = {};
    results.forEach((row) => {
      if (!response[row.organization]) {
        response[row.organization] = {
          revenue: new Array(12).fill(0),
          profit: new Array(12).fill(0),
        };
      }
      response[row.organization].revenue[row.month - 1] = row.revenue || 0;
      response[row.organization].profit[row.month - 1] = row.profit || 0;
    });

    res.json(response);
  } catch (err) {
    console.error("Server Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

//Main Organization Data

router.get("/TasksById/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // SQL query to get project details based on Project_id
    const [rows] = await mySqlPool.query(
      `SELECT * FROM activity_logs WHERE Task_ID = ?`,
      [id]
    );

    if (rows.length > 0) {
      // If project data is found, send it with a success message
      return res.status(200).json({
        message: "Project data retrieved successfully",
        success: true,
        data: rows[0],
      });
    } else {
      // If no data found for the provided Project_id
      return res.status(404).json({
        message: "Project not found",
        success: false,
        data: {},
      });
    }
  } catch (error) {
    console.error("Error fetching project data:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
      data: {},
    });
  }
});

router.get("/projectData/:MainName", authenticateToken, async (req, res) => {
  const { MainName } = req.params;
  try {
    const rows = await projectNameAndCode(MainName);

    return res.status(200).send({
      message:
        "The Project Data is Fetched Sucessfully for Organization Dashboard",
      success: true,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error fetching projects for Organization DashBoard",
      success: false,
    });
  }
});

// Updated API route
router.get(
  "/revenueForOrg/:projectCode/:type/:year",
  authenticateToken,
  async (req, res) => {
    const { projectCode, type, year } = req.params;
    // console.log("Aceesss");

    try {
      const rows = await revenueByProject(projectCode, type, year);

      // console.log("This is data of Chart overview ");
      // console.log(rows);

      // Ensure numerical summation
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
      console.error("Error fetching revenue and profit data:", error);
      return res.status(500).json({
        error: "Error fetching revenue and profit data for Org",
        success: false,
      });
    }
  }
);

router.get("/catagoryByGroup/:id", authenticateToken, async (req, res) => {
  const orgName = req.params.id;

  try {
    const rows = await revenueByCategory(orgName);

    return res.status(200).send({
      message: "Total Sales By Each Category Fetched Successfully",
      success: true,
      data: rows,
    });
  } catch (e) {
    console.error("Error fetching data:", e);
    return res.status(500).send({
      message: "Failed to Fetch Total Sales By Each Category",
      success: false,
    });
  }
});

router.get("/organizationByName", async (req, res) => {
  try {
    // SQL query to fetch designation names for the given IDs
    const [rows] = await mySqlPool.query(
      `SELECT id, Organization_Name FROM organization`
    );

    if (rows.length === 0) {
      return res.status(404).send({
        message: "Designations not found",
        success: false,
        data: {},
      });
    }

    // Map the rows into a key-value object: { id1: "designationName1", id2: "designationName2", ... }
    const designationNameMap = rows.reduce((acc, row) => {
      acc[row?.id] = row?.Organization_Name; // Assuming `Name` is the column name for designation name
      return acc;
    }, {});

    return res.status(200).send({
      message: "Designation data retrieved successfully",
      success: true,
      data: designationNameMap, // Return as a key-value pair object
    });
  } catch (error) {
    console.error("Error fetching designation names:", error);
    return res.status(500).send({
      message: "Server error",
      success: false,
      data: {},
    });
  }
});
router.get("/followUpSummaryUser/:id", authenticateToken, async (req, res) => {
  const userId = req.params.id;

  try {
    const [rows] = await mySqlPool.query(
      `
      SELECT
        COUNT(*) AS all_tasks,
        SUM(CASE WHEN STR_TO_DATE(activity_logs.Due_Date, '%Y-%m-%d') < CURDATE() THEN 1 ELSE 0 END) AS overdue,
        SUM(CASE WHEN STR_TO_DATE(activity_logs.Due_Date, '%Y-%m-%d') = CURDATE() THEN 1 ELSE 0 END) AS due_today,
        SUM(CASE WHEN STR_TO_DATE(activity_logs.Due_Date, '%Y-%m-%d') > CURDATE() THEN 1 ELSE 0 END) AS upcoming
      FROM activity_logs
      INNER JOIN user_task_activitylogs
      ON activity_logs.Task_ID = user_task_activitylogs.Task_Id
      WHERE user_task_activitylogs.User_Name = ? AND activity_logs.Status!=?;
    `,
      [userId, "completed"]
    );

    const data = {
      all: rows[0].all_tasks,
      overdue: rows[0].overdue,
      dueToday: rows[0].due_today,
      upcoming: rows[0].upcoming,
    };

    return res.status(200).send({ success: true, data });
  } catch (e) {
    console.error("Error fetching follow-up summary:", e);
    res.status(500).json({
      success: false,
      message:
        "Internal Server Error in fetching The Follow Up Summary For Org",
    });
  }
});

router.get(
  "/source-of-inquiry/:userId",
  authenticateToken,
  async (req, res) => {
    const userId = req.params.userId;

    try {
      const results = await sourceOfEnquiry(userId);
      return res.status(200).json({ success: true, data: results });
    } catch (error) {
      console.error("Error fetching leads by source of inquiry:", error);
      res.status(500).json({
        success: false,
        message:
          "Internal server error in Fetching Source of Inquiry chart data",
      });
    }
  }
);

router.get("/totalUserCount/:orgName", async (req, res) => {
  const { orgName } = req.params;

  try {
    // Query to count users for the given organization name
    const [rows] = await mySqlPool.query(
      `SELECT COUNT(*) as userCount FROM users WHERE Organization_Name_User = ?`,
      [orgName]
    );

    // Extracting user count
    const userCount = rows[0]?.userCount || 0;

    if (userCount === 0) {
      return res.status(204).send({
        message: "No users found for the specified organization",
        success: true,
        data: { userCount },
      });
    }

    return res.status(200).send({
      message: "User count fetched successfully",
      success: true,
      data: { userCount },
    });
  } catch (error) {
    console.error("Error fetching user count:", error);
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      data: {},
    });
  }
});

router.get("/revenueByProject/:orgName/:timely", async (req, res) => {
  const { orgName, timely } = req.params;

  try {
    // Determine the time grouping based on the "timely" parameter
    let timeGrouping;
    if (timely === "monthly") {
      timeGrouping = "DATE_FORMAT(pu.Purchase_date, '%Y-%m')"; // Group by year and month
    } else if (timely === "yearly") {
      timeGrouping = "DATE_FORMAT(pu.Purchase_date, '%Y')"; // Group by year
    } else if (timely === "quarterly") {
      timeGrouping =
        "CONCAT(YEAR(pu.Purchase_date), '-Q', QUARTER(pu.Purchase_date))"; // Group by year and quarter
    } else {
      return res.status(400).send({
        message:
          "Invalid 'timely' parameter. Use 'monthly', 'yearly', or 'quarterly'.",
        success: false,
      });
    }

    // Define the SQL query to calculate revenue grouped by project and time period
    const query = `
      SELECT 
        p.Name AS Project_Name, 
        ${timeGrouping} AS Time_Period, 
        SUM(pu.Purchase_Price) AS Total_Revenue
      FROM 
        purchaseorder AS pu 
      JOIN 
        project AS p 
        ON pu.Project_Name = p.Project_Code 
      WHERE 
        pu.Purchase_date IS NOT NULL
        AND pu.Purchase_date != ''
        AND pu.Purchase_date > '1900-01-01' -- Exclude invalid dates
        AND pu.purchase_org_name = ?
      GROUP BY 
        p.Name, Time_Period
      ORDER BY 
        p.Name, Time_Period;
    `;

    // Execute the query with the provided organization name
    const [rows] = await mySqlPool.query(query, [orgName]);

    // Utility function to format numbers in Indian numbering system
    const formatIndianCurrency = (amount) => {
      return amount
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        .replace(/(\d+),(\d{2},\d{3})$/, "$1,$2");
    };

    // Format the revenue before sending the response
    const formattedRows = rows.map((row) => ({
      ...row,
      Total_Revenue: formatIndianCurrency(row.Total_Revenue),
    }));

    // Send the fetched data in the response
    return res.status(200).send({
      message: "Revenue by project fetched successfully",
      success: true,
      data: formattedRows,
    });
  } catch (error) {
    console.error("Error fetching revenue by project:", error);
    return res.status(500).send({
      message: "Internal server error",
      success: false,
      data: {},
    });
  }
});

module.exports = router;
