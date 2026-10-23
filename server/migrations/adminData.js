import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Payment from "../models/Payment.js";

// Idempotently backfill legacy documents. Existing explicit values are kept;
// only successful Payment records can upgrade an unresolved enrollment to paid.
export async function migrateAdminData({
  CourseModel = Course,
  EnrollmentModel = Enrollment,
  PaymentModel = Payment,
} = {}) {
  const courses = await CourseModel.updateMany(
    { status: { $exists: false } },
    { $set: { status: "published" } },
  );

  const enrollments = await EnrollmentModel.updateMany(
    { $or: [{ accessType: { $exists: false } }, { accessType: null }] },
    { $set: { accessType: "unknown" } },
  );

  const provenPayments = await PaymentModel.find({ status: "paid" })
    .select("user course")
    .lean();
  const pairs = new Set();
  for (const payment of provenPayments) {
    if (payment.user && payment.course) {
      pairs.add(`${payment.user.toString()}:${payment.course.toString()}`);
    }
  }

  let classifiedPaid = 0;
  for (const pair of pairs) {
    const [user, course] = pair.split(":");
    const result = await EnrollmentModel.updateMany(
      { user, course, accessType: "unknown" },
      { $set: { accessType: "paid" } },
    );
    classifiedPaid += result.modifiedCount ?? result.nModified ?? 0;
  }

  return {
    coursesPublished: courses.modifiedCount ?? courses.nModified ?? 0,
    enrollmentsResolved: enrollments.modifiedCount ?? enrollments.nModified ?? 0,
    enrollmentsProvenPaid: classifiedPaid,
  };
}
