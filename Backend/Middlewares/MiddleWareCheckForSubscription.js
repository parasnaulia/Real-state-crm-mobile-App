const mySqlPool = require("../config/db");

const middleWareCheckForPackageSubscription = async (req, res, next) => {
  // console.log("api is hit bhaiiiiirtyrty");
  try {
    // console.log("Middleware: Validating user and subscription status...");

    // Fetch user details based on the provided email
    const [userQuery] = await mySqlPool.query(
      `SELECT * FROM employee_info WHERE Email = ? LIMIT 1`,
      [req.body.email]
    );

    if (!userQuery || userQuery.length === 0) {
      return res.status(404).send({
        success: false,
        message: "User with the provided email not found.",
      });
    }

    const user = userQuery[0];

    // If user is not an Organization role, pass control to the next middleware
    if (user.Role !== "Organization") {
      console.log("Middleware: User is not an Organization. Proceeding...");
      return next();
    }

    // Fetch organization details associated with the user
    const [organizationQuery] = await mySqlPool.query(
      `SELECT o.Organization_Name, o.Company_Email, o.id 
       FROM organization AS o 
       JOIN users AS u ON o.id = u.Organization_Name_User 
       WHERE u.Email = ?`,
      [user.Email]
    );

    if (!organizationQuery || organizationQuery.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Organization details not found for the user.",
      });
    }

    const organization = organizationQuery[0];

    // Fetch active package details for the organization
    const [packageQuery] = await mySqlPool.query(
      `SELECT * 
       FROM organization_package 
       WHERE Organization_Name_package = ? AND Active = ?`,
      [organization.id, "Yes"]
    );

    if (!packageQuery || packageQuery.length === 0) {
      return res.status(403).send({
        success: false,
        message: "No active subscription found for the organization.",
        isExpired: true,
      });

      // console.log("NO active Package is Here");
    }

    const packageDetails = packageQuery[0];
    const expiryDate = new Date(packageDetails.End_Date);
    const currentDate = new Date();

    if (expiryDate <= currentDate) {
      console.log("Middleware: Subscription has expired.");
      req.subscriptionExpired = true; // Pass subscription status to the next handler
    } else {
      req.subscriptionExpired = false; // Active subscription
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error(
      "Middleware: Error occurred while validating subscription.",
      error
    );
    return res.status(500).send({
      success: false,
      message:
        "An internal server error occurred while validating subscription data.",
    });
  }
};

module.exports = { middleWareCheckForPackageSubscription };
