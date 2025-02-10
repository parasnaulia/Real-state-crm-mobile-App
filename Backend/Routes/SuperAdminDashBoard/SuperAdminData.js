const express = require("express");

const mySqlPool = require("../../config/db.js");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

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

router.get("/monthly-revenue", async (req, res) => {
  try {
    // SQL query to calculate the total monthly revenue
    const query = `
        SELECT 
          DATE_FORMAT(STR_TO_DATE(Date_Created, '%d/%m/%Y'), '%M') AS month,  -- Convert "dd/mm/yyyy" to a date and get month name
          SUM(Expected_revenue) AS totalRevenue
        FROM leads
        WHERE Expected_revenue IS NOT NULL 
          AND Date_Created IS NOT NULL
          AND Date_Created != ''
        GROUP BY month
        ORDER BY STR_TO_DATE(CONCAT('01 ', month, ' 2020'), '%d %M %Y') ASC;  -- Ensures proper sorting of months
      `;

    // Wrap the MySQL query in a Promise
    const [results] = await mySqlPool.query(query);



    // Format the result to match the frontend requirements
    const monthlyRevenue = results.map((entry) => ({
      month: entry.month,
      totalRevenue: entry.totalRevenue,
    }));



    res.json({ success: true, data: monthlyRevenue });
  } catch (error) {
    console.error("Error fetching monthly revenue:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/sales-forecastingAdmin", async (req, res) => {
  const { organization } = req.params;

  try {
    // SQL query to count records for each category
    const query = `
        SELECT
          SUM(CASE WHEN Lead_Status IN ('New Lead', 'Contacted', 'Interested', 'Proposal Sent', 'Negotiating', 'Qualified') THEN 1 ELSE 0 END) AS allActive,
          SUM(CASE WHEN Lead_Status IN ('Interested', 'Proposal Sent', 'Negotiating') THEN 1 ELSE 0 END) AS hot,
          SUM(CASE WHEN Lead_Status = 'New Lead' THEN 1 ELSE 0 END) AS new,
          SUM(CASE WHEN Lead_Status = 'Contacted' THEN 1 ELSE 0 END) AS contacted,
          SUM(CASE WHEN Lead_Status IN ('Interested', 'Proposal Sent') THEN 1 ELSE 0 END) AS followUp
        FROM leads
      `;

    // Execute the query
    const [results] = await mySqlPool.query(query);
 

    // Send the response
    res.json({
      success: true,
      data: {
        allActive: results[0].allActive,
        hot: results[0].hot,
        new: results[0].new,
        contacted: results[0].contacted,
        followUp: results[0].followUp,
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

module.exports = router;
