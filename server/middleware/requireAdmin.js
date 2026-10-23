import User from "../models/User.js";

// Resolve the role from the current database record; never rely on client data.
export default async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.session.userId).select("_id role");

    if (!user) {
      return res.status(401).json({
        message: "User account not found.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Administrator access required.",
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}
