import "dotenv/config";
import argon2 from "argon2";
import readline from "node:readline/promises";
import { pathToFileURL } from "node:url";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

export async function provisionAdmin({ email, name, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();

  if (!normalizedName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("A valid name and email are required.");
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    throw new Error("Password must be between 8 and 128 characters.");
  }

  const passwordHash = await argon2.hash(password);
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    existingUser.name = normalizedName;
    existingUser.passwordHash = passwordHash;
    existingUser.role = "admin";
    await existingUser.save();
    return { created: false, email: existingUser.email };
  }

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash,
    role: "admin",
  });

  return { created: true, email: user.email };
}

async function promptHidden(label) {
  const input = globalThis.process.stdin;

  if (!input.isTTY || typeof input.setRawMode !== "function") {
    throw new Error("Admin provisioning must run in an interactive terminal.");
  }

  globalThis.process.stdout.write(label);
  input.setRawMode(true);
  input.setEncoding("utf8");
  input.resume();

  return new Promise((resolve, reject) => {
    let value = "";

    const restore = () => {
      input.off("data", onData);
      input.setRawMode(false);
      globalThis.process.stdout.write("\n");
    };

    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          restore();
          reject(new Error("Admin provisioning cancelled."));
          return;
        }

        if (character === "\r" || character === "\n") {
          restore();
          resolve(value);
          return;
        }

        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
        } else {
          value += character;
        }
      }
    };

    input.on("data", onData);
  });
}

async function runProvisioningPrompt() {
  if (globalThis.process.argv.length !== 2) {
    throw new Error("Do not pass account credentials as command-line arguments.");
  }

  const prompts = readline.createInterface({
    input: globalThis.process.stdin,
    output: globalThis.process.stdout,
  });

  let name;
  let email;
  try {
    name = await prompts.question("Admin name: ");
    email = await prompts.question("Admin email: ");
  } finally {
    prompts.close();
  }

  const password = await promptHidden("Admin password (input hidden): ");
  const confirmation = await promptHidden("Confirm password (input hidden): ");

  if (password !== confirmation) {
    throw new Error("Passwords do not match.");
  }

  await connectDB();
  const result = await provisionAdmin({ email, name, password });
  console.log(
    `Admin account ${result.created ? "created" : "promoted"}: ${result.email}`,
  );
}

if (
  globalThis.process.argv[1] &&
  import.meta.url === pathToFileURL(globalThis.process.argv[1]).href
) {
  runProvisioningPrompt()
    .catch((error) => {
      console.error(`Admin provisioning failed: ${error.message}`);
      globalThis.process.exitCode = 1;
    })
    .finally(async () => {
      await import("mongoose").then(({ default: mongoose }) => mongoose.disconnect());
    });
}
