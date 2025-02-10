const mySqlPool = require("../../config/db");
const salesTargetByUser = async (orgName, email) => {
  try {
    const [totalSalesResult] = await mySqlPool.query(
      `
          SELECT COUNT(*) AS totalSales
          FROM purchaseorder
          WHERE Purchase_org_Name = ? AND Lead_Owner_Name=?
        `,
      [orgName, email]
    );
    return totalSalesResult;
  } catch (e) {
    console.log(
      "There is Some Error in fetching total sale target by user " + e
    );
    throw e;
  }
};

const leadsByStageForUser = async (organization, email) => {
  try {
    const leadsQuery = `
        SELECT Lead_Status AS stage, COUNT(*) AS leadsCount
        FROM leads
        WHERE Lead_Status IN ('New Lead-not Contacted', 'New Lead-Contacted', 'Proposal Sent', 'Interested', 'Negotiation', 'Qualified', 'Closed Won-not Converted','Closed Won-Converted')
        AND Organization_Name_Leads = ? AND Lead_owner=?
        GROUP BY Lead_Status;
      `;

    // SQL query to fetch "Close Won - Converted" data from the purchaseorder table
    // const purchaseOrderQuery = `
    //     SELECT 'Closed Won - Converted' AS stage, COUNT(*) AS leadsCount
    //     FROM purchaseorder
    //     WHERE Purchase_org_Name = ? AND Lead_Owner_Name=?;
    //   `;

    // Execute both queries
    const [leadsResults] = await mySqlPool.query(leadsQuery, [
      organization,
      email,
    ]);
    return leadsResults;
  } catch (e) {
    console.log(
      "There is Some Error in Fetching leads By Stage for a user " + e
    );
    throw e;
  }
};
const leadConversionUser = async (
  organization,
  timePeriod,
  userId,
  year,
  extraParam
) => {
  let dateCondition;
  switch (timePeriod.toLowerCase()) {
    case "monthly":
      if (!extraParam) {
        return res.status(400).json({
          success: false,
          message: "Month is required for monthly data.",
        });
      }
      dateCondition = `YEAR(Date_Created) = ${year} AND MONTH(Date_Created) = ${extraParam}`;
      break;

    case "quarterly":
      if (!extraParam) {
        return res.status(400).json({
          success: false,
          message: "Quarter is required for quarterly data.",
        });
      }
      dateCondition = `YEAR(Date_Created) = ${year} AND QUARTER(Date_Created) = ${extraParam}`;
      break;

    case "yearly":
      dateCondition = `YEAR(Date_Created) = ${year}`;
      break;

    default:
      return res.status(400).json({
        success: false,
        message: "Invalid time period.",
      });
  }
  try {
    const totalLeadsQuery = `
        SELECT COUNT(*) AS totalLeads
        FROM leads
        WHERE Lead_owner = ? 
          AND Organization_Name_Leads = ? 
          AND ${dateCondition};
      `;

    const [totalLeadsResult] = await mySqlPool.query(totalLeadsQuery, [
      userId,
      organization,
    ]);
    const totalLeads = totalLeadsResult[0]?.totalLeads || 0;

    // Query for converted leads
    const convertedLeadsQuery = `
        SELECT COUNT(*) AS convertedLeads
        FROM leads
        WHERE Lead_owner = ?
          AND Lead_Status = 'Closed Won-Converted' 
          AND Organization_Name_Leads = ?
          AND ${dateCondition};
      `;

    const [convertedLeadsResult] = await mySqlPool.query(convertedLeadsQuery, [
      userId,
      organization,
    ]);

    return [totalLeads, convertedLeadsResult];
  } catch (e) {
    console.log(
      "There is Some Error in Fetching Conversion Rate for Users " + e
    );
    throw e;
  }
};

const sourceOfEnquiry = async (userId) => {
  try {
    const query = `
        SELECT 
          leads.Source_of_Inquiry,
          COUNT(leads.Lead_ID) AS Lead_Count
        FROM 
          lead_user
        JOIN 
          leads
        ON 
          lead_user.Lead_ID_User = leads.Lead_ID
        WHERE 
          lead_user.User_Id_User_Lead = ?
          AND leads.Source_of_Inquiry IS NOT NULL -- Exclude NULL values
        GROUP BY 
          leads.Source_of_Inquiry
      `;

    const [results] = await mySqlPool.query(query, [userId]);
    return results;
  } catch (e) {
    console.log("There os some Error in Fetching source of enquiry " + e);
    throw e;
  }
};

const propertEnquiresUser = async (id, email) => {
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
               f.Configuration,
               c.Catagory,
               p.Name AS Project_Name_Data,
               u.Name AS Owner,
               f.Status AS Property_Status,
               l.Flat_id
             FROM leads AS l
             LEFT JOIN flat AS f ON f.Flat_id = l.Flat_Id
             LEFT JOIN project AS p ON p.Project_Code = l.Project_Name
             LEFT JOIN catagory AS c ON c.Id = l.Property_Type
             JOIN users AS u ON u.User_Id = l.Lead_owner
             WHERE l.Organization_Name_Leads = ? AND l.Lead_owner=?
               AND l.Lead_Status != ? AND l.Lead_Status != ?`,
      [
        id,
        email,
        "Closed Won-not Converted",
        "Closed Won-Converted",
        "Closed Won-not Converted",
      ]
    );
    return rows;
  } catch (e) {
    console.log(
      "There is Some Error in fetching Property enquires for User " + e
    );
    throw e;
  }
};

const leadsWithProperty = async (userId) => {
  const query = `
    SELECT 
      f.Unit_No, 
      f.Block, 
      COUNT(l.Lead_ID) AS lead_count 
    FROM leads AS l 
    JOIN flat AS f ON f.Flat_id = l.Flat_Id 
    WHERE l.Lead_owner = ?  AND l.Lead_Status!=? AND l.Lead_Status!=?
    GROUP BY f.Block, f.Unit_No
    ORDER BY lead_count DESC
  `;

  try {
    const [results] = await mySqlPool.query(query, [
      userId,
      "Closed Won-Converted",
      "Closed Won-not Converted",
    ]);
    return results;
  } catch (e) {
    console.log(
      "There is Some Error in Fetching leads Associated with Property " + e
    );
    throw e;
  }
};
const soldPropertiesUser = async (org_Name, user_id) => {
  try {
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
                p.Purchase_org_Name = ? AND p.Lead_Owner_Name = ?;
            `,
      [org_Name, user_id]
    );
    return properties;
  } catch (e) {
    console.log(
      "There is Some Error in Fetching Sold Properties For A user " + e
    );
    throw e;
  }
};

const myUnitSold = async (email, orgName) => {
  try {
    const query = `
       SELECT 
    p.Project_Name, 
    COUNT(*) AS Total_Sold,
    pro.Name
FROM 
    purchaseorder AS p
JOIN 
    project AS pro 
ON 
    p.Project_Name = pro.Project_Code
WHERE 
    p.Lead_Owner_Name = ? 
    AND Purchase_org_Name = ?
GROUP BY 
    p.Project_Name, 
    pro.Name;
    `;
    const [results] = await mySqlPool.query(query, [email, orgName]);

    const mainData = await Promise.all(
      results.map(async (item) => {
        const [rows] = await mySqlPool.query(
          `SELECT COUNT(*) AS total_Properties from flat where Project_Name_flats=?`,
          [item?.Project_Name]
        );
        return {
          projet_Name: item?.Name,
          total_Properties: rows[0]?.total_Properties,
          total_Sold_By_Me: item?.Total_Sold,
        };
      })
    );

    return mainData;
  } catch (e) {
    console.log("There is Some Error in Fetching My unit Sold " + e);
    throw e;
  }
};

const totalSaleDoneByUser = async (email, orgName, period, year) => {
  try {
    let groupByClause;
    switch (period) {
      case "monthly":
        groupByClause = `
          CASE
            WHEN MONTH(Purchase_date) = 1 THEN 'January'
            WHEN MONTH(Purchase_date) = 2 THEN 'February'
            WHEN MONTH(Purchase_date) = 3 THEN 'March'
            WHEN MONTH(Purchase_date) = 4 THEN 'April'
            WHEN MONTH(Purchase_date) = 5 THEN 'May'
            WHEN MONTH(Purchase_date) = 6 THEN 'June'
            WHEN MONTH(Purchase_date) = 7 THEN 'July'
            WHEN MONTH(Purchase_date) = 8 THEN 'August'
            WHEN MONTH(Purchase_date) = 9 THEN 'September'
            WHEN MONTH(Purchase_date) = 10 THEN 'October'
            WHEN MONTH(Purchase_date) = 11 THEN 'November'
            WHEN MONTH(Purchase_date) = 12 THEN 'December'
          END
        `; // Descriptive month names
        break;
      case "quarterly":
        groupByClause = `
          CASE
            WHEN MONTH(Purchase_date) IN (1, 2, 3) THEN 'Jan-Mar'
            WHEN MONTH(Purchase_date) IN (4, 5, 6) THEN 'Apr-Jun'
            WHEN MONTH(Purchase_date) IN (7, 8, 9) THEN 'Jul-Sep'
            WHEN MONTH(Purchase_date) IN (10, 11, 12) THEN 'Oct-Dec'
          END
        `; // Descriptive quarter names
        break;
      case "yearly":
        groupByClause = "YEAR(Purchase_date)"; // Year format for yearly grouping
        break;
      default:
        return res.status(400).json({ error: "Invalid period" });
    }

    let currenYear;
    let query1;
    let parmas = [];
    if (period === "monthly" || period === "quarterly") {
      query1 = `SELECT ${groupByClause} as Period, SUM(Purchase_Price + Additional_Cost) as Total_Sale, COUNT(*) as Total_Units
            FROM purchaseorder 
            WHERE Lead_Owner_Name = ? AND Purchase_org_Name = ?  AND YEAR(Purchase_date)=?
            GROUP BY Period 
            ORDER BY FIELD(Period, 'Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');
        `;
      parmas.push(email, orgName, year);
    } else if (period === "yearly") {
      query1 = `SELECT ${groupByClause} as Period, SUM(Purchase_Price + Additional_Cost) as Total_Sale, COUNT(*) as Total_Units
      FROM purchaseorder 
      WHERE Lead_Owner_Name = ? AND Purchase_org_Name = ?  
      GROUP BY Period 
      ORDER BY FIELD(Period, 'Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');
  `;
      parmas.push(email, orgName);
    }

    const results = await mySqlPool.query(query1, parmas);

    return results;
  } catch (e) {
    console.log("There is Some Error in Fetching Totak sale Done By User " + e);
    throw e;
  }
};

const soldPropertiesUserProperty = async (org_Name, user_id) => {
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
            p.Purchase_org_Name = ? AND p.Lead_Owner_Name=?;
        `,
      [org_Name, user_id]
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

module.exports = {
  salesTargetByUser,
  leadsByStageForUser,
  leadConversionUser,
  sourceOfEnquiry,
  propertEnquiresUser,
  leadsWithProperty,
  soldPropertiesUser,
  myUnitSold,
  totalSaleDoneByUser,
  soldPropertiesUserProperty,
};
