const express = require("express");
// const bcrypt = require("bcrypt");
// const moment = require("moment");
// const loginData = require("../Controllers/login");
const mySqlPool = require("../../config/db");
// const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  revenueByEachUser,
  findAdditionalPrices,
  revenueByUserReport,
  totalSoldPropertiesReports,
} = require("../../Controllers/DashBoardControllers/OrganizationDashBoardController");
const {
  leadsFetcher,
} = require("../../Controllers/LeadsReportsController/LeadsReportFetcher");
const { authenticateToken } = require("../../Middlewares/RoutesAuth");

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
  "/total-soldPropertiesByUser/:orgName/:timeframe/:year",
  authenticateToken,
  async (req, res) => {
    const { orgName, timeframe, year } = req.params;
    const validTimeframes = ["monthly", "quarterly", "yearly"];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timeframe. Use 'monthly', 'quarterly', or 'yearly'.",
      });
    }

    try {
      const formattedData = await revenueByUserReport(orgName, timeframe, year);
      return res.status(200).json({
        success: true,
        data: formattedData,
      });
    } catch (err) {
      console.error("Error fetching sold properties:", err);
      return res.status(500).json({
        success: false,
        message:
          "Internal Server Error while fetching property sold for users For Reports Section",
      });
    }
  }
);

router.get(
  "/revenueByUser/:timeframe/:MainName/:year",
  authenticateToken,
  async (req, res) => {
    const { timeframe, MainName, year } = req.params;

    try {
      // Execute queries
      const [results, result2] = await revenueByEachUser(
        timeframe,
        MainName,
        year
      );

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
        Lead_Owner_Id: row.Lead_Owner_Name || "Unknown",
        User_Name: row.User_Name, // Handle undefined names gracefully
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
  }
);

router.get(
  "/revenuegernerated/:org_Name/:timeframe/:year",
  authenticateToken,
  async (req, res) => {
    let { org_Name, timeframe, year } = req.params;

    try {
      let query = "";
      let params = [org_Name];

      if (timeframe === "Yearly") {
        query = `
        SELECT YEAR(Purchase_date) AS year, SUM(Purchase_Price + Additional_Cost) AS revenue
        FROM purchaseorder
        WHERE Purchase_org_Name = ? 
        GROUP BY year
        ORDER BY year DESC
        LIMIT 5;
      `;
      } else if (timeframe === "Quarterly") {
        params = [];
        params = [org_Name, year];
        query = `
        SELECT 
          CASE 
            WHEN QUARTER(Purchase_date) = 1 THEN CONCAT(YEAR(Purchase_date), ' Jan-Mar')
            WHEN QUARTER(Purchase_date) = 2 THEN CONCAT(YEAR(Purchase_date), ' Apr-Jun')
            WHEN QUARTER(Purchase_date) = 3 THEN CONCAT(YEAR(Purchase_date), ' Jul-Sep')
            WHEN QUARTER(Purchase_date) = 4 THEN CONCAT(YEAR(Purchase_date), ' Oct-Dec')
          END AS quarter,
          SUM(Purchase_Price + Additional_Cost) AS revenue
        FROM purchaseorder
        WHERE Purchase_org_Name = ? AND YEAR(Purchase_date)=?
        GROUP BY quarter
        ORDER BY YEAR(Purchase_date) DESC, QUARTER(Purchase_date);
      `;
      } else if (timeframe === "Monthly") {
        params = [];
        params = [org_Name, year];
        query = `
        SELECT 
          DATE_FORMAT(Purchase_date, '%M %Y') AS month,
          SUM(Purchase_Price + Additional_Cost) AS revenue
        FROM purchaseorder
        WHERE Purchase_org_Name = ? AND YEAR(Purchase_date)=?
        GROUP BY month
        ORDER BY YEAR(Purchase_date) DESC, MONTH(Purchase_date);
      `;
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Invalid timeframe" });
      }

      // console.log(params);
      // console.log("PAramsssssssssssssssssssssssssssssss");
      const [data] = await mySqlPool.query(query, params);
      res.json({ success: true, data });
    } catch (err) {
      console.error("Error fetching data:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);
router.get(
  "/getSalesData/:timeframe/:orgName/:selectedYear?",
  authenticateToken,
  async (req, res) => {
    const { timeframe, orgName, selectedYear } = req.params;

    console.log("API Request Parameters:", {
      timeframe,
      orgName,
      selectedYear,
    });

    // Validate required parameters
    if (!timeframe || !orgName) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: 'timeframe' or 'orgName'",
      });
    }

    if (!["monthly", "quarterly", "yearly"].includes(timeframe.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid 'timeframe'. Valid options are: 'monthly', 'quarterly', 'yearly'.",
      });
    }

    try {
      // Process results with async operations
      const mainArray = await totalSoldPropertiesReports(
        timeframe,
        orgName,
        selectedYear
      );

      if (!mainArray.length) {
        return res.status(200).json({
          success: false,
          message: "No data found for the given criteria.",
        });
      }

      // Send processed results
      return res.status(200).json({
        success: true,
        data: mainArray,
      });
    } catch (error) {
      console.error("Error executing query:", error.message);
      return res.status(500).json({
        success: false,
        error:
          "An internal server error occurred. while fetching the Overall Sold Propeties for Reports Sales Section",
      });
    }
  }
);

router.get(
  "/lead-conversion-rateReports/:organization/:timePeriod/:year",
  authenticateToken,
  async (req, res) => {
    const { organization, timePeriod, year } = req.params;
    console.log(year);

    console.log("This is Year");

    // Validate organization name
    if (!organization) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required.",
      });
    }
    try {
      // Define date condition based on the time period
      const [totalLeads, convertedLeads, conversionRate] = await leadsFetcher(
        organization,
        timePeriod,
        year
      );

      // Send the result to the frontend
      // console.log(totalLeads);
      // console.log(convertedLeads);
      // console.log(conversionRate);
      return res.json({
        success: true,
        data: {
          totalLeads,
          convertedLeads,
          conversionRate: convertedLeads === 0 ? 0 : conversionRate.toFixed(2), // Round to 2 decimal places
        },
      });
    } catch (error) {
      console.error("Error fetching lead conversion rate for Reports:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

module.exports = router;
