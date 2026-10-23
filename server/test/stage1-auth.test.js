import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { createHmac } from "node:crypto";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Payment from "../models/Payment.js";
import razorpay from "../config/razorpay.js";
import { migrateAdminData } from "../migrations/adminData.js";
import { provisionAdmin } from "../scripts/provisionAdmin.js";

const testRunId = randomUUID().replaceAll("-", "");
const testDatabaseName = `eduverse_admin_test_${globalThis.process.pid}_${testRunId}`;
const testEmails = [];
let mongoServer;
let appServer;
let baseUrl;
let createApp;
let adminCookie;
let studentCookie;
let studentEmail;

before(async () => {
  globalThis.process.env.RAZORPAY_KEY_ID ??= "stage1-test-key";
  globalThis.process.env.RAZORPAY_KEY_SECRET ??= "stage1-test-secret";
  mongoServer = await MongoMemoryServer.create({
    binary: { version: "8.2.6" },
    instance: { dbName: testDatabaseName },
  });

  const testMongoUri = mongoServer.getUri(testDatabaseName);
  const parsedTestMongoUri = new URL(testMongoUri);
  const configuredDatabaseName = decodeURIComponent(
    parsedTestMongoUri.pathname.slice(1),
  );

  if (
    !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(parsedTestMongoUri.hostname) ||
    !configuredDatabaseName.startsWith("eduverse_admin_test_")
  ) {
    throw new Error("Admin tests must use their isolated loopback test database.");
  }

  await mongoose.connect(testMongoUri);
  ({ createApp } = await import("../app.js"));

  const app = createApp({ sessionSecret: "stage1-test-session-secret" });
  appServer = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    appServer.once("listening", resolve);
    appServer.once("error", reject);
  });

  baseUrl = `http://127.0.0.1:${appServer.address().port}`;
});

after(async () => {
  try {
    if (appServer) {
      await new Promise((resolve, reject) => {
        appServer.close((error) => (error ? reject(error) : resolve()));
      });
    }

    if (testEmails.length > 0 && mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: { $in: testEmails } });
    }

    await mongoose.disconnect();
  } finally {
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
});

async function request(path, options = {}, cookie) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();
  return { response, data };
}

async function login(email, password) {
  const { response, data } = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  assert.equal(response.status, 200);
  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie, "login should set the session cookie");
  return { data, cookie: setCookie.split(";")[0] };
}

test("admin boundary, registration role, provisioning, and login authorization", async () => {
  const unauthenticated = await request("/api/admin/access-check");
  assert.equal(unauthenticated.response.status, 401);

  const email = `stage1-${testRunId}@example.test`;
  const studentPassword = "student-test-password";
  const signup = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Stage One Student",
      email,
      password: studentPassword,
      role: "admin",
    }),
  });
  testEmails.push(email);

  assert.equal(signup.response.status, 201);
  assert.equal(signup.data.user.role, "student");
  const registeredUser = await User.findOne({ email });
  assert.equal(registeredUser.role, "student");

  const studentLogin = await login(email, studentPassword);
  studentCookie = studentLogin.cookie;
  studentEmail = email;
  assert.equal(studentLogin.data.user.role, "student");
  const studentAccess = await request(
    "/api/admin/access-check",
    {},
    studentLogin.cookie,
  );
  assert.equal(studentAccess.response.status, 403);

  const adminPassword = "new-admin-test-password";
  const provisioned = await provisionAdmin({
    email,
    name: "Stage One Admin",
    password: adminPassword,
  });
  assert.equal(provisioned.created, false);

  const adminLogin = await login(email, adminPassword);
  adminCookie = adminLogin.cookie;
  assert.equal(adminLogin.data.user.role, "admin");
  const refreshedDatabaseRole = await request(
    "/api/admin/access-check",
    {},
    studentLogin.cookie,
  );
  assert.equal(refreshedDatabaseRole.response.status, 200);

  const adminAccess = await request(
    "/api/admin/access-check",
    {},
    adminLogin.cookie,
  );
  assert.equal(adminAccess.response.status, 200);
  assert.deepEqual(adminAccess.data, { authorized: true });

  const storedAdmin = await User.findOne({ email });
  assert.equal(storedAdmin.role, "admin");
  assert.notEqual(storedAdmin.passwordHash, adminPassword);
});

async function registerAndLogin(name) {
  const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${testRunId}@example.test`;
  const password = "secondary-test-password";
  const signup = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  assert.equal(signup.response.status, 201);
  testEmails.push(email);
  return login(email, password);
}

async function createAdminCourse(title, price = 0, cookie = adminCookie) {
  const result = await request("/api/admin/courses", {
    method: "POST",
    body: JSON.stringify({
      title,
      instructor: "Admin Test",
      category: "Testing",
      level: "Beginner",
      duration: "2 hours",
      price,
      curriculum: ["lesson-one"],
    }),
  }, cookie);
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  return result.data.course;
}

test("legacy course and enrollment migration is idempotent and evidence-based", async () => {
  const owner = await User.findOne({ email: studentEmail });
  const legacyPaidCourseId = new mongoose.Types.ObjectId();
  const legacyUnknownCourseId = new mongoose.Types.ObjectId();
  const legacyArchivedAfterMigrationId = new mongoose.Types.ObjectId();
  const now = new Date();
  await Course.collection.insertMany([
    { _id: legacyPaidCourseId, id: `legacy-paid-${testRunId}`, title: "Legacy paid", instructor: "Test", category: "Legacy", level: "Beginner", duration: "1 hour", price: 10, createdAt: now, updatedAt: now },
    { _id: legacyUnknownCourseId, id: `legacy-unknown-${testRunId}`, title: "Legacy unknown", instructor: "Test", category: "Legacy", level: "Beginner", duration: "1 hour", price: 10, createdAt: now, updatedAt: now },
    { _id: legacyArchivedAfterMigrationId, id: `legacy-archived-${testRunId}`, title: "Legacy status", instructor: "Test", category: "Legacy", level: "Beginner", duration: "1 hour", price: 10, createdAt: now, updatedAt: now },
  ]);
  await Enrollment.collection.insertMany([
    { user: owner._id, course: legacyPaidCourseId, createdAt: now, updatedAt: now },
    { user: owner._id, course: legacyUnknownCourseId, createdAt: now, updatedAt: now },
  ]);
  await Payment.create({
    user: owner._id,
    course: legacyPaidCourseId,
    razorpayOrderId: `legacy-paid-order-${testRunId}`,
    amount: 1000,
    status: "paid",
  });

  const first = await migrateAdminData();
  assert.equal(first.coursesPublished, 3);
  assert.equal(first.enrollmentsResolved, 2);
  assert.equal(first.enrollmentsProvenPaid, 1);
  assert.equal((await Course.findById(legacyPaidCourseId)).status, "published");
  assert.equal((await Enrollment.findOne({ course: legacyPaidCourseId })).accessType, "paid");
  assert.equal((await Enrollment.findOne({ course: legacyUnknownCourseId })).accessType, "unknown");

  await Course.updateOne({ _id: legacyArchivedAfterMigrationId }, { $set: { status: "archived" } });
  const second = await migrateAdminData();
  assert.equal(second.coursesPublished, 0);
  assert.equal(second.enrollmentsResolved, 0);
  assert.equal((await Course.findById(legacyArchivedAfterMigrationId)).status, "archived");
});

test("admin course lifecycle, student summaries, read-only enrollments, and archived access", async () => {
  const student = await registerAndLogin("Learning Student");
  const course = await createAdminCourse(`Lifecycle ${testRunId}`);

  assert.equal(course.status, "draft");
  const publicDraft = await request(`/api/courses/${encodeURIComponent(course.id)}`);
  assert.equal(publicDraft.response.status, 404);
  const draftEnroll = await request(`/api/enrollments/${encodeURIComponent(course.id)}`, { method: "POST" }, student.cookie);
  assert.equal(draftEnroll.response.status, 404);

  const listing = await request("/api/courses");
  assert.equal(listing.data.courses.some(({ id }) => id === course.id), false);
  const published = await request(`/api/admin/courses/${encodeURIComponent(course.id)}/publish`, { method: "POST" }, adminCookie);
  assert.equal(published.response.status, 200);
  assert.equal(published.data.course.status, "published");
  const featured = await request(`/api/admin/courses/${encodeURIComponent(course.id)}`, {
    method: "PATCH",
    body: JSON.stringify({ featured: true, description: "Updated by admin" }),
  }, adminCookie);
  assert.equal(featured.response.status, 200);
  assert.equal(featured.data.course.featured, true);
  assert.equal((await request(`/api/courses/${encodeURIComponent(course.id)}`)).response.status, 200);

  const enrollment = await request(`/api/enrollments/${encodeURIComponent(course.id)}`, { method: "POST" }, student.cookie);
  assert.equal(enrollment.response.status, 201);
  const savedEnrollment = await Enrollment.findOne({ course: (await Course.findOne({ id: course.id }))._id });
  assert.equal(savedEnrollment.accessType, "free");

  const archived = await request(`/api/admin/courses/${encodeURIComponent(course.id)}/archive`, { method: "POST" }, adminCookie);
  assert.equal(archived.response.status, 200);
  assert.equal(archived.data.course.status, "archived");
  assert.equal((await request(`/api/courses/${encodeURIComponent(course.id)}`)).response.status, 404);
  const archivedEnroll = await request(`/api/enrollments/${encodeURIComponent(course.id)}`, { method: "POST" }, student.cookie);
  assert.equal(archivedEnroll.response.status, 404);
  const archivedOrder = await request("/api/payments/create-order", {
    method: "POST",
    body: JSON.stringify({ courseId: course.id }),
  }, student.cookie);
  assert.equal(archivedOrder.response.status, 404);

  const content = await request(`/api/enrollments/${encodeURIComponent(course.id)}/content`, {}, student.cookie);
  assert.equal(content.response.status, 200);
  assert.equal(content.data.course.status, "archived");
  assert.equal(content.data.enrollment.enrolled, true);
  const deniedContent = await request(`/api/enrollments/${encodeURIComponent(course.id)}/content`, {}, adminCookie);
  assert.equal(deniedContent.response.status, 403);

  const adminStudents = await request("/api/admin/students", {}, adminCookie);
  assert.equal(adminStudents.response.status, 200);
  assert.ok(adminStudents.data.items.some(({ email, accessSummary }) => email === student.data.user.email && accessSummary === "free"));
  const studentDetails = await request(`/api/admin/students/${student.data.user.id}`, {}, adminCookie);
  assert.equal(studentDetails.response.status, 200);
  assert.equal(studentDetails.data.enrollments[0].accessType, "free");
  assert.equal("progress" in studentDetails.data.enrollments[0], false);

  const adminEnrollments = await request("/api/admin/enrollments", {}, adminCookie);
  assert.equal(adminEnrollments.response.status, 200);
  const listedEnrollment = adminEnrollments.data.items.find(({ course: listedCourse }) => listedCourse.id === course.id);
  assert.equal(listedEnrollment.accessType, "free");
  assert.equal("progress" in listedEnrollment, false);
  assert.ok((await request("/api/admin/categories", {}, adminCookie)).data.categories.includes("Testing"));
  const dashboard = await request("/api/admin/dashboard", {}, adminCookie);
  assert.equal(dashboard.response.status, 200);
  assert.ok(dashboard.data.totals.students >= 1);

  const undeleteable = await request(`/api/admin/courses/${encodeURIComponent(course.id)}`, { method: "DELETE" }, adminCookie);
  assert.equal(undeleteable.response.status, 409);
});

test("verified pre-archive payment continues to grant paid access", async () => {
  const student = await registerAndLogin("Payment Student");
  const course = await createAdminCourse(`Paid Compatibility ${testRunId}`, 450);
  const published = await request(`/api/admin/courses/${encodeURIComponent(course.id)}/publish`, { method: "POST" }, adminCookie);
  assert.equal(published.response.status, 200);

  const originalCreate = razorpay.orders.create;
  const originalFetch = razorpay.payments.fetch;
  const orderId = `order_stage2_${testRunId}`;
  const paymentId = `pay_stage2_${testRunId}`;
  try {
    razorpay.orders.create = async ({ amount, currency }) => ({ id: orderId, amount, currency });
    const order = await request("/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ courseId: course.id }),
    }, student.cookie);
    assert.equal(order.response.status, 201);

    const archived = await request(`/api/admin/courses/${encodeURIComponent(course.id)}/archive`, { method: "POST" }, adminCookie);
    assert.equal(archived.response.status, 200);
    razorpay.payments.fetch = async () => ({
      order_id: orderId,
      amount: order.data.amount,
      currency: "INR",
      status: "captured",
      captured: true,
    });
    const signature = createHmac("sha256", globalThis.process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`).digest("hex");
    const verification = await request("/api/payments/verify", {
      method: "POST",
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      }),
    }, student.cookie);
    assert.equal(verification.response.status, 200, JSON.stringify(verification.data));
    const archivedCourse = await Course.findOne({ id: course.id });
    const paidEnrollment = await Enrollment.findOne({ user: student.data.user.id, course: archivedCourse._id });
    assert.equal(paidEnrollment.accessType, "paid");
    const content = await request(`/api/enrollments/${encodeURIComponent(course.id)}/content`, {}, student.cookie);
    assert.equal(content.response.status, 200);
  } finally {
    razorpay.orders.create = originalCreate;
    razorpay.payments.fetch = originalFetch;
  }
});
