import express from "express";
import session from "express-session";
import CourseRoutes from "./routes/courseRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import cors from "cors";
import helmet from "helmet";

export function createApp({ sessionSecret, sessionStore } = {}) {
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET is missing.");
  }

  const app = express();
  app.use(helmet());
  // Parse JSON normally, while preserving the original body for Razorpay.
  app.use(
    express.json({
      verify: (req, res, buffer) => {
        if (req.originalUrl.startsWith("/api/payments/webhook")) {
          req.rawBody = Buffer.from(buffer);
        }
      },
    }),
  );
  // Allow our React frontend to call the API with session cookies.
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    }),
  );
  app.use(
    session({
      name: "eduverse.sid",
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      ...(sessionStore ? { store: sessionStore } : {}),
      cookie: {
        httpOnly: true,
        secure: globalThis.process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  app.use("/api/payments", paymentRoutes);
  app.use("/api/enrollments", enrollmentRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/courses", CourseRoutes);
  app.use("/api/admin", adminRoutes);

  return app;
}
