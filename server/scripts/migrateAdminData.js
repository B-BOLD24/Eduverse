import "dotenv/config";
import readline from "node:readline/promises";
import mongoose from "mongoose";
import { migrateAdminData } from "../migrations/adminData.js";

const targetUri = process.env.ADMIN_MIGRATION_MONGODB_URI;
if (!targetUri) {
  throw new Error("Set ADMIN_MIGRATION_MONGODB_URI to the explicitly selected migration database.");
}
if (process.env.MONGODB_URI && targetUri === process.env.MONGODB_URI) {
  throw new Error("Refusing to migrate the configured application database URI.");
}

const parsed = new URL(targetUri);
const databaseName = decodeURIComponent(parsed.pathname.slice(1));
if (!databaseName) throw new Error("Migration URI must name a database explicitly.");

const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
try {
  const confirmation = await prompt.question(`Type the exact database name (${databaseName}) to confirm migration: `);
  if (confirmation !== databaseName) throw new Error("Database name confirmation did not match; no migration was run.");
} finally {
  prompt.close();
}

await mongoose.connect(targetUri);
try {
  const result = await migrateAdminData();
  console.log("Admin data migration completed:", result);
} finally {
  await mongoose.disconnect();
}
