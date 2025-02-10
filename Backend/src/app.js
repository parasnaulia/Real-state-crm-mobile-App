const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mySqlPool = require("../config/db");
const bodyParser = require("body-parser");
const http = require("http"); // Import HTTP module
const { initWebSocket } = require("../WebSockets/websocket");
require("dotenv").config();

const app = express(); // Express app instance
const server = http.createServer(app); // HTTP server wrapping Express

// Middleware and Parsers
app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use(express.static("Public"));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// app.use((req, res, next) => {
//   req.url = req.url.trim();
//   next();
// });

// app.use((req, res, next) => {
//   console.log("Incoming Request Details:");
//   console.log("Method:", req.method);
//   console.log("URL:", req.url);
//   console.log("Headers:", req.headers);
//   console.log("Body:", req.body);
//   next();
// });

// Routes
app.use("/api", require("../Routes/employeeRoutes"));
app.use("/api/packages", require("../Routes/PackageRoute/Package"));
app.use("/api/groups", require("../Routes/Groups/group"));
app.use("/api/userDashBoard", require("../Routes/UserDashBoard/userDashBoard"));
app.use(
  "/api/OrganizationDashBoard",
  require("../Routes/OrganizationDashBoard/OrganizationData")
);
app.use(
  "/api/SuperAdminDashBoard",
  require("../Routes/SuperAdminDashBoard/SuperAdminData")
);
app.use("/api/properties", require("../Routes/Properties/Properties"));
app.use("/api/leadRoutes", require("../Routes/Leads/Leads"));
app.use("/api/userRoutes", require("../Routes/Users/Users"));
app.use("/api/settingsRoutes", require("../Routes/Settings/Settings"));
app.use(
  "/api/accessProperty",
  require("../Routes/AcessCheckRoutes/AccessCheckPropertyDetails")
);
app.use("/api/Reports", require("../Routes/Reports/Reports"));
// WebSocket Initialization
initWebSocket(server); // Pass the HTTP server to WebSocket initialization

// Root Endpoint
app.get("/", (req, res) => {
  console.log("API is Hit");
  res.send({ data: "Hello From Crm" });
});

// Start MySQL Connection and Server
mySqlPool
  .query("SELECT 1")
  .then(() => {
    console.log("DB connected");

    // Initialize the scheduler
    try {
      const subscriptionScheduler = require("../Scheduler/SubscriptionSchdular");
      subscriptionScheduler();
      console.log("Scheduler started successfully");
    } catch (schedulerError) {
      console.error("Failed to start scheduler:", schedulerError);
    }

    // Start the HTTP server
    server.listen(8000 || process.env.PORT, () => {
      console.log(`Server is listening on port ${8000 || process.env.PORT}`);
    });
  })
  .catch((dbError) => {
    console.error("Database connection failed:", dbError);
  });
