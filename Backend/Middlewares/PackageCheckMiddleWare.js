const mySqlPool = require("../config/db");

const checkPackageValidity = async (req, res, next) => {
  const { Owner_Name } = req.body;

  if (!Owner_Name) {
    return res.status(400).send({
      message: "Owner name is required.",
      success: false,
    });
  }
  console.log("This is ORgniazasdasd");

  try {
    const currentDate = new Date(); // Get current date
    const formattedCurrentDate = currentDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD

    // Fetch projects associated with the owner
    const [projects] = await mySqlPool.query(
      `SELECT * FROM project WHERE Owner = ?`,
      [Owner_Name]
    );

    // Fetch active package details for the owner
    const [activePackages] = await mySqlPool.query(
      `
        SELECT p.Name AS Package_Name, 
               p.Project AS Allowed_Projects, 
               op.Start_Date, 
               op.End_Date 
        FROM package AS p 
        JOIN organization_package AS op 
        ON op.Package = p.Id 
        WHERE op.Organization_Name_package = ? AND op.Active = ?
        `,
      [Owner_Name, "Yes"]
    );

    if (activePackages.length === 0) {
      return res.status(200).send({
        message:
          "No active subscription found. Please subscribe to a plan to proceed.",
        success: false,
        isActive: false,
      });
    }

    const totalProjectsCreated = projects.length;
    const allowedProjects = activePackages[0]?.Allowed_Projects;
    const packageEndDate = activePackages[0]?.End_Date;

    // Compare dates and project limits
    if (totalProjectsCreated >= allowedProjects) {
      return res.status(200).send({
        message: `You have reached your project creation limit of ${allowedProjects}. Upgrade your plan to create more projects.`,
        success: false,
      });
    }

    if (formattedCurrentDate > packageEndDate) {
      return res.status(200).send({
        message:
          "Your subscription package has expired. Please renew your plan to continue.",
        success: false,
      });
    }

    // If all checks pass, proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error checking package validity:", error.message);
    res.status(500).send({
      message:
        "An error occurred while checking your package. Please try again later.",
      success: false,
    });
  }
};

// module.exports = checkPackageValidity;

module.exports = { checkPackageValidity };
