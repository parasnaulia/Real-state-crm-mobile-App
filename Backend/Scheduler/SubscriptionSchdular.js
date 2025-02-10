const schedule = require("node-schedule");
const nodemailer = require("nodemailer");
const mySqlPool = require("../config/db");

// Email configuration
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "your-email@gmail.com",
//     pass: "your-email-password",
//   },
// });

// Scheduler logic
const subscriptionScheduler = () => {
  //   console.log("nice");
  schedule.scheduleJob("0 0 * * *", async () => {
    console.log("Nice1");
    // Runs every midnight
    const today = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(today.getMonth() + 1);

    try {
      // Query to find subscriptions expiring within the next 30 days
      const [results] = await mySqlPool.query(
        `
        SELECT 
          org.id AS orgId,
          org.Organization_Name AS orgName,
          org.Admin_Email AS adminEmail,
          org.Admin_Name AS adminName,
          pkg.Id AS packageId,
          pkg.Name AS packageName,
          org_pkg.End_Date AS expiryDate
        FROM 
          organization AS org
        INNER JOIN 
          organization_package AS org_pkg 
          ON org.id = org_pkg.Organization_Name_package
        INNER JOIN 
          package AS pkg 
          ON org_pkg.Package = pkg.Id
        WHERE 
          org_pkg.Active = ? AND 
          DATE(org_pkg.End_Date) BETWEEN DATE(?) AND DATE(?)
        `,
        [
          "Yes",
          today.toISOString().slice(0, 10),
          oneMonthLater.toISOString().slice(0, 10),
        ]
      );

      console.log(results);
      console.log("This is Result");

      // Process each expiring subscription
      for (const subscription of results) {
        const daysRemaining = Math.ceil(
          (new Date(subscription.expiryDate) - today) / (1000 * 60 * 60 * 24)
        );

        if (daysRemaining > 0) {
          await sendRenewalEmail(
            subscription.adminEmail,
            subscription.packageName,
            subscription.expiryDate,
            subscription.orgName,
            daysRemaining
          );
        }
      }

      console.log("Scheduler completed successfully!");
    } catch (error) {
      console.error("Error in scheduler:", error);
    }
  });
};

// Email sending function
async function sendRenewalEmail(
  email,
  planName,
  expiryDate,
  orgName,
  daysRemaining
) {
  const formattedExpiryDate = new Date(expiryDate).toLocaleDateString();

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 465,
    secure: true, // Use SSL/TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.USER_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Renewal Reminder: Only ${daysRemaining} Days Remaining for "${planName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0046d5;">Renewal Reminder</h2>
        <p>Dear <strong>${orgName} Admin</strong>,</p>
        <p>Your subscription plan <strong>"${planName}"</strong> is set to expire on <strong>${formattedExpiryDate}</strong>.</p>
        <p style="font-size: 1.1rem; color: #d9534f;">
          Only <strong>${daysRemaining} days</strong> are remaining to renew your subscription.
        </p>
        <p>Please ensure you renew your plan at the earliest to continue uninterrupted service.</p>
      
        <br/>
        <p>Thanks,<br/> Reality Realm Team </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to: ${email} | ${daysRemaining} days remaining`);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
  }
}

// Export scheduler
module.exports = subscriptionScheduler;
