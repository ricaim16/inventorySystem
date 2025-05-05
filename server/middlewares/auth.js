import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token Payload:", decoded);
    req.user = decoded; // { id, role }
    next();
  } catch (error) {
    console.error("Token Verification Error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const roleMiddleware = (roles) => (req, res, next) => {
  console.log("Request User Role:", req.user?.role);
  console.log("Allowed Roles:", roles);
  if (!req.user || !roles.includes(req.user.role.toUpperCase())) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  next();
};

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({ error: message });
};
