import { Router } from "express";
import argon2 from "argon2";
import requireAuth from "../middleware/requireAuth.js";
import User from "../models/User.js";
import { rateLimit } from "express-rate-limit";

const router = Router();
// Allow at most 10 login requests per IP every 15 minutes.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again later.",
  },
});

// Allow at most 5 registration requests per IP every hour.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many registration attempts. Please try again later.",
  },
});
// ─── Session helper functions ─────────────────────────

// Create a fresh session and wait for completion.
function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

// Save the current session to the session store.
function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

// Destroy the current server-side session.
function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

// ─── 1. REGISTER ───────────────────────────────────────

router.post("/register",registerLimiter, async (req, res) => {
  try {
    // Read and normalize the submitted values.
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";

    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    // Validate required fields.
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    // Basic email format validation.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    // Enforce password length limits.
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({
        message: "Password must be between 8 and 128 characters.",
      });
    }

    // Check whether this email is already registered.
    const existingUser = await User.findOne({ email }).select("_id");

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    // Hash the password before storing it.
    const passwordHash = await argon2.hash(password);

    // Create the account. The schema defaults role to "student".
    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    // Return public information, never the password hash.
    return res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // The database unique index protects against duplicate emails,
    // including simultaneous registration requests.
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration failed:", error.message);

    return res.status(500).json({
      message: "Registration failed.",
    });
  }
});

// ─── 2. LOGIN ──────────────────────────────────────────

router.post("/login",loginLimiter, async (req, res) => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    // Both fields are required.
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    // Find the account.
    const user = await User.findOne({ email });

    // Use the same error message for an unknown email and
    // an incorrect password.
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Create a fresh session after successful authentication.
    await regenerateSession(req);

    // Associate the session with this user.
    req.session.userId = user._id.toString();

    // Finish saving the session before responding.
    await saveSession(req);

    // express-session manages the session cookie.
    return res.json({
      message: "Logged in successfully.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login failed:", error.message);

    return res.status(500).json({
      message: "Login failed.",
    });
  }
});

// ─── 3. CURRENT USER ───────────────────────────────────

// Used by the frontend to restore login information
// after a page refresh.
router.get("/me", requireAuth, async (req, res) => {
  try {
    // Retrieve only the user's public information.
    const user = await User.findById(req.session.userId).select(
      "_id name email role",
    );

    // The account may have been deleted.
    if (!user) {
      return res.status(401).json({
        message: "User account not found.",
      });
    }

    return res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Failed to fetch current user:", error.message);

    return res.status(500).json({
      message: "Failed to fetch current user.",
    });
  }
});

// ─── 4. LOGOUT ─────────────────────────────────────────

router.post("/logout", async (req, res) => {
  try {
    // Invalidate the server-side session first.
    await destroySession(req);

    // Remove the cookie from the current browser.
    res.clearCookie("eduverse.sid", {
      path: "/",
    });

    return res.json({
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout failed:", error.message);

    return res.status(500).json({
      message: "Logout failed.",
    });
  }
});

export default router;
