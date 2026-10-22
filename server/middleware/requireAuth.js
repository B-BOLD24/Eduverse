// Checks whether the request belongs to a logged-in user.
export default function requireAuth(req, res, next) {
  // The session middleware has already processed the cookie.
  if (!req.session?.userId) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  // Authentication check passed. Continue to the route handler.
  next();
}