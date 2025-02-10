const mySqlPool = require("../../config/db");
const { getMonthName } = require("../../Services/MonthName");

const leadsFetcher = async (organization, timePeriod, year) => {
  try {
    switch (timePeriod.toLowerCase()) {
      case "monthly":
        // Filter for the current month
        dateCondition = `DATE_FORMAT(Date_Created, "%Y-%m") = DATE_FORMAT(NOW(), "%Y-%m")`;
        break;
      case "quarterly":
        // Filter for the current quarter
        dateCondition = `YEAR(Date_Created) = YEAR(NOW()) AND QUARTER(Date_Created) = QUARTER(NOW())`;
        break;
      case "yearly":
        // Filter for the current year
        dateCondition = `YEAR(Date_Created) = YEAR(NOW())`;
        break;
      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid time period." });
    }

    // Query to get the total number of leads for the organization based on the selected time period
    const totalLeadsQuery = `
            SELECT COUNT(*) AS totalLeads
            FROM leads
            WHERE Organization_Name_Leads = ? AND YEAR(Date_Created)=?
            
          `;

    const [totalLeadsResult] = await mySqlPool.query(totalLeadsQuery, [
      organization,
      year,
    ]);
    const totalLeads = totalLeadsResult[0]?.totalLeads || 0;

    // Query to get the number of converted leads (status = 'Close Won') based on the selected time period
    const convertedLeadsQuery = `
            SELECT COUNT(*) AS convertedLeads
            FROM leads
            WHERE Organization_Name_Leads = ?
            AND Lead_Status = 'Closed Won-Converted' AND YEAR(Date_Created)=?
            
          `;

    const [convertedLeadsResult] = await mySqlPool.query(convertedLeadsQuery, [
      organization,
      year,
    ]);
    const convertedLeads = convertedLeadsResult[0]?.convertedLeads || 0;

    // Calculate the conversion rate
    const conversionRate =
      totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return [totalLeads, convertedLeads, conversionRate];
  } catch (e) {
    console.log(
      "There is Some Error in Fetching Conversion For Reports Section " + e
    );
    throw e;
  }
};

const conversionRateForUsers = async (organizationId, timeframe, year) => {
  try {
    let timeframeCondition;
    let timeframeMappingFunction;

    if (timeframe?.toLowerCase() === "monthly") {
      timeframeCondition = "MONTH(Date_Created) AS timeframe";
      timeframeMappingFunction = (value) =>
        new Date(2000, value - 1).toLocaleString("default", { month: "long" }); // Converts 1 -> January
    } else if (timeframe?.toLowerCase() === "quarterly") {
      timeframeCondition = "QUARTER(Date_Created) AS timeframe";
      timeframeMappingFunction = (value) => {
        const quarters = [
          "January-March",
          "April-June",
          "July-September",
          "October-December",
        ];
        return quarters[value - 1]; // Maps 1 -> "January-March", etc.
      };
    } else if (timeframe?.toLowerCase() === "yearly") {
      timeframeCondition = "YEAR(Date_Created) AS timeframe";
      timeframeMappingFunction = (value) => value.toString(); // Just return the year as a string
    } else {
      return res.status(400).send({
        message:
          "Invalid timeframe parameter. Use 'monthly', 'quarterly', or 'yearly'.",
        success: false,
        data: [],
      });
    }

    // Query to calculate conversion rate
    const query = `
        SELECT 
          l.Lead_owner AS lead_owner_name,
          u.Name AS main_lead_owner_name,
          MONTH(l.Date_Created) AS timeframe,
          COUNT(CASE WHEN l.Lead_Status = 'Closed Won-Converted' THEN 1 END) AS close_won_leads,
          COUNT(*) AS total_leads,
          (
            COUNT(CASE WHEN l.Lead_Status = 'Closed Won-Converted' THEN 1 END) * 100.0 / 
            COUNT(*)
          ) AS conversion_rate
        FROM 
          leads AS l
          JOIN users AS u ON l.Lead_owner = u.User_Id
        WHERE 
          l.Organization_Name_Leads = ?
          AND YEAR(l.Date_Created) = ?
        GROUP BY 
          l.Lead_owner, MONTH(l.Date_Created), u.Name
        ORDER BY 
          lead_owner_name ASC, timeframe ASC;
      `;

    // Execute the query
    const [rows] = await mySqlPool.query(query, [organizationId, year]);

    // Transforming data into the desired structure with readable timeframes
    const groupedData = rows.reduce((result, row) => {
      const {
        lead_owner_name,
        main_lead_owner_name,
        timeframe,
        close_won_leads,
        total_leads,
        conversion_rate,
      } = row;

      // Map the timeframe to a readable label
      const readableTimeframe = timeframeMappingFunction(timeframe);

      if (!result[lead_owner_name]) {
        result[lead_owner_name] = {
          main_lead_owner_name, // Store the main_lead_owner_name here
          data: [],
        };
      }

      result[lead_owner_name].data.push({
        timeframe: readableTimeframe,
        close_won_leads,
        total_leads,
        conversion_rate: conversion_rate
          ? parseFloat(conversion_rate).toFixed(2)
          : 0, // Handle null/NaN
      });

      return result;
    }, {});

    // Preparing the final response format
    const responseData = Object.keys(groupedData).map((leadOwnerName) => ({
      lead_owner_name: leadOwnerName,
      main_lead_owner_name: groupedData[leadOwnerName].main_lead_owner_name,
      data: groupedData[leadOwnerName].data,
    }));
    return responseData;
  } catch (e) {
    console.log(
      "There is Some Error In Fetching Conversion Rate For A User For report Sections " +
        e
    );
    throw e;
  }
};

const leadRepoertTableForUsers = async (organizationId, year, timeframe) => {
  try {
    let query = "";
    // let query2 = "";
    const params = [];

    if (timeframe?.toLowerCase() === "monthly") {
      query = `
          SELECT 
      us.Name AS userName,
      MONTH(
        CASE
          WHEN l.Date_Created REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN STR_TO_DATE(l.Date_Created, '%Y-%m-%d') 
          WHEN l.Date_Created REGEXP '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$' THEN STR_TO_DATE(l.Date_Created, '%m/%d/%Y')
          ELSE NULL
        END
      ) AS month,
      DATE_FORMAT(
        CASE
          WHEN l.Date_Created REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN STR_TO_DATE(l.Date_Created, '%Y-%m-%d')
          WHEN l.Date_Created REGEXP '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$' THEN STR_TO_DATE(l.Date_Created, '%m/%d/%Y')
          ELSE NULL
        END,
        '%Y-%m-%d'
      ) AS parsedDate, -- Debugging for parsed date
      l.Date_Created AS originalDate, -- Original date for debugging
      l.First_Name AS leadName,
      l.Last_Name AS LastName,
      l.Lead_Status AS leadStatus,
      l.Flat_Id AS PropertyId,
      l.Project_Name AS projectName,
      l.Property_Type AS PropertyType,
      l.Date_Created AS createdDate,
      l.Organization_Name_Leads AS organizationName,
      u.User_Id_User_Lead,
      p.Name AS Project_Main_Name,
      c.Catagory AS Main_Category_Name,
      f.Unit_No,
      f.Block
    FROM leads l
    LEFT JOIN lead_user u  ON u.Lead_ID_User = l.Lead_ID
       LEFT JOIN users us ON l.Lead_owner = us.User_Id
    LEFT JOIN project AS p ON l.Project_Name= p.Project_Code
    LEFT JOIN catagory AS c ON l.Property_Type=c.Id
    LEFT JOIN flat AS f ON l.Flat_Id=f.Flat_id
    WHERE l.Organization_Name_Leads = ? 
      AND YEAR(
        CASE
          WHEN l.Date_Created REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN STR_TO_DATE(l.Date_Created, '%Y-%m-%d') 
          WHEN l.Date_Created REGEXP '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$' THEN STR_TO_DATE(l.Date_Created, '%m/%d/%Y')
          ELSE NULL
        END
      ) = ?
    ORDER BY us.Name, month;
    
    
          `;

      params.push(organizationId, year);
    } else if (timeframe?.toLowerCase() === "quarterly") {
      query = `
            SELECT 
              us.Name AS userName,
              QUARTER(
                CASE
                  WHEN l.Date_Created REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN STR_TO_DATE(l.Date_Created, '%Y-%m-%d') 
                  WHEN l.Date_Created REGEXP '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$' THEN STR_TO_DATE(l.Date_Created, '%m/%d/%Y')
                  ELSE NULL
                END
              ) AS quarter,
              CONCAT(
                CASE QUARTER(
                  CASE
                    WHEN l.Date_Created REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN STR_TO_DATE(l.Date_Created, '%Y-%m-%d') 
                    WHEN l.Date_Created REGEXP '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$' THEN STR_TO_DATE(l.Date_Created, '%m/%d/%Y')
                    ELSE NULL
                  END
                )
                  WHEN 1 THEN 'January-March'
                  WHEN 2 THEN 'April-June'
                  WHEN 3 THEN 'July-September'
                  WHEN 4 THEN 'October-December'
                END
              ) AS quarterName,
               l.Date_Created AS originalDate,
              l.First_Name AS leadName,
      l.Last_Name As LastName,
      l.Lead_Status AS leadStatus,
      l.Flat_Id As PropertyId ,
      u.User_Id_User_Lead,
    
    
       
              l.Project_Name AS projectName,
              l.Property_Type As PropertyType,
              l.Date_Created As createdDate,
      l.Organization_Name_Leads AS organizationName, 
      p.Name AS Project_Main_Name,
      c.Catagory AS Main_Category_Name,
      f.Unit_No,
      f.Block
            FROM leads l 
            LEFT JOIN lead_user AS u ON u.Lead_ID_User = l.Lead_ID
              LEFT JOIN users us ON l.Lead_owner = us.User_Id
            LEFT JOIN project AS p ON l.Project_Name= p.Project_Code
    LEFT JOIN catagory AS c ON l.Property_Type=c.Id
    LEFT JOIN flat AS f ON l.Flat_Id=f.Flat_id
    WHERE l.Organization_Name_Leads = ? 
            WHERE l.Organization_Name_Leads = ? AND YEAR(
              CASE
                WHEN l.Date_Created REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN STR_TO_DATE(l.Date_Created, '%Y-%m-%d') 
                WHEN l.Date_Created REGEXP '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$' THEN STR_TO_DATE(l.Date_Created, '%m/%d/%Y')
                  ELSE NULL
              END
            ) = ?
            ORDER BY us.Name, quarter;
          `;

      params.push(organizationId, year);
    } else if (timeframe?.toLowerCase() === "yearly") {
      query = `
            SELECT 
              us.Name AS userName,
              YEAR(
                CASE
                  WHEN l.Date_Created REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN STR_TO_DATE(l.Date_Created, '%Y-%m-%d') 
                  WHEN l.Date_Created REGEXP '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$' THEN STR_TO_DATE(l.Date_Created, '%m/%d/%Y')
                  ELSE NULL
                END
              ) AS year,
               l.Date_Created AS originalDate,
              l.First_Name AS leadName,
      l.Last_Name As LastName,
      l.Lead_Status AS leadStatus,
      l.Flat_Id As PropertyId ,
      u.User_Id_User_Lead  ,
    
    
       
              l.Project_Name AS projectName,
              l.Property_Type As PropertyType,
              l.Date_Created As createdDate,
      l.Organization_Name_Leads AS organizationName,
        p.Name AS Project_Main_Name,
      c.Catagory AS Main_Category_Name,
      f.Unit_No,
      f.Block
            FROM   leads l
           LEFT JOIN lead_user u  ON u.Lead_ID_User = l.Lead_ID
           LEFT JOIN users us ON l.Lead_owner = us.User_Id
            LEFT JOIN project AS p ON l.Project_Name= p.Project_Code
    LEFT JOIN catagory AS c ON l.Property_Type=c.Id
    LEFT JOIN flat AS f ON l.Flat_Id=f.Flat_id
    
    WHERE l.Organization_Name_Leads = ? 
            WHERE l.Organization_Name_Leads = ? 
            ORDER BY us.Name, year;
          `;

      params.push(organizationId, year);
    } else {
      return res.status(400).json({
        message:
          "Invalid timeframe specified. Use 'monthly', 'quarterly', or 'yearly'.",
        success: false,
        data: [],
      });
    }

    let [rows] = await mySqlPool.query(query, params);
    const groupedData = rows.reduce((acc, row) => {
      if (!acc[row.userName]) acc[row.userName] = [];
      const timeframeKey =
        timeframe?.toLowerCase() === "monthly"
          ? row.month
            ? getMonthName(row.month)
            : "Invalid Month" // Handle invalid months
          : timeframe?.toLowerCase() === "quarterly"
          ? row.quarterName
          : row.year;

      acc[row.userName].push({
        timeframe: timeframeKey,
        leadName: row.leadName,
        leadStatus: row.leadStatus,
        projectId: row.projectName,
        organizationName: row.organizationName,
        categoryId: row.PropertyType,
        created_date: row.originalDate,
        property: row.PropertyId,
        lastName: row.LastName,
        User_Id_User_Lead: row.User_Id_User_Lead,
        Main_Project_Name: row?.Project_Main_Name,
        Main_Category_Name: row?.Main_Category_Name,
        unitNo: row?.Unit_No,
        Block: row?.Block,
        Main_User_Name: row?.userName,
      });
      return acc;
    }, {});
    return groupedData;
  } catch (e) {
    console.log(
      "There is Some Error in fetching Leads Reports For A User " + e
    );
    throw e;
  }
};
module.exports = {
  leadsFetcher,
  conversionRateForUsers,
  leadRepoertTableForUsers,
};
