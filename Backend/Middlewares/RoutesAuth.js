const jwt = require("jsonwebtoken");
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract token from 'Bearer <token>'

  // console.log(token);
  // console.log("This is token");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }

    req.user = user; // Attach decoded user data to request
    // console.log(user);
    next();
  });
};
module.exports = {
  authenticateToken,
};
