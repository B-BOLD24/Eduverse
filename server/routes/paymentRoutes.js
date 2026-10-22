import { Router } from "express";
import { randomUUID } from "node:crypto";

import Course from "../models/Course.js";
import Payment from "../models/Payment.js";
import Enrollment from "../models/Enrollment.js";
import requireAuth from "../middleware/requireAuth.js";
import razorpay from "../config/razorpay.js";
import { createHmac, timingSafeEqual } from "node:crypto";
const router = Router();

// Create a Razorpay order for a paid course.
router.post("/create-order", requireAuth, async (req, res) => {
  try {
    // Read the course's public ID from the request.
    const courseId =
      typeof req.body?.courseId === "string" ? req.body.courseId.trim() : "";

    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required.",
      });
    }

    // Fetch the course and its price from our database.
    const course = await Course.findOne({ id: courseId }).select(
      "_id id title price",
    );

    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    // Free courses should use the normal enrollment endpoint.
    if (!Number.isFinite(course.price) || course.price <= 0) {
      return res.status(400).json({
        message: "This course does not require payment.",
      });
    }

    // Don't create a payment order for an existing enrollment.
    const existingEnrollment = await Enrollment.findOne({
      user: req.session.userId,
      course: course._id,
    }).select("_id");

    if (existingEnrollment) {
      return res.status(409).json({
        message: "You are already enrolled in this course.",
      });
    }

    // Razorpay expects the amount in paise.
    const amountInPaise = Math.round(course.price * 100);

    // Ask Razorpay to create the payment order.
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `edu_${randomUUID()}`,
      notes: {
        userId: req.session.userId,
        courseId: course.id,
      },
    });

    // Save our own record linking the user, course and Razorpay order.
    await Payment.create({
      user: req.session.userId,
      course: course._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      status: "created",
    });

    // Send the checkout details to React.
    return res.status(201).json({
      message: "Payment order created.",
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      course: {
        id: course.id,
        title: course.title,
      },
    });
  } catch (error) {
    console.error("Failed to create payment order:", error.message);

    return res.status(500).json({
      message: "Failed to create payment order.",
    });
  }
});

/* Verify payment and grant course enrollment. */
router.post("/verify", requireAuth, async (req, res) => {
  try {
    // 1. Read the identifiers returned by Razorpay Checkout.
    const orderId = req.body?.razorpay_order_id;
    const paymentId = req.body?.razorpay_payment_id;
    const signature = req.body?.razorpay_signature;

    if (
      typeof orderId !== "string" ||
      typeof paymentId !== "string" ||
      typeof signature !== "string" ||
      !/^[a-f0-9]{64}$/i.test(signature)
    ) {
      return res.status(400).json({
        message: "Invalid payment verification details.",
      });
    }

    // 2. Find our own order record.
    // This ensures the order belongs to the logged-in user.
    const paymentRecord = await Payment.findOne({
      razorpayOrderId: orderId,
      user: req.session.userId,
    });

    if (!paymentRecord) {
      return res.status(404).json({
        message: "Payment order not found.",
      });
    }

    // A refunded order must not grant access again.
    if (paymentRecord.status === "refunded") {
      return res.status(409).json({
        message: "This payment has been refunded.",
      });
    }

    // Don't allow a different payment ID to replace an already
    // verified payment for this order.
    if (
      paymentRecord.status === "paid" &&
      paymentRecord.razorpayPaymentId !== paymentId
    ) {
      return res.status(409).json({
        message: "This order has already been paid.",
      });
    }

    // 3. Recreate Razorpay's expected signature using the order ID
    // stored in our database—not an untrusted order ID alone.
    const expectedSignature = createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET,
    )
      .update(`${paymentRecord.razorpayOrderId}|${paymentId}`)
      .digest();

    const receivedSignature = Buffer.from(signature, "hex");

    // Compare signatures safely.
    if (
      receivedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(receivedSignature, expectedSignature)
    ) {
      return res.status(400).json({
        message: "Payment signature verification failed.",
      });
    }

    // 4. Ask Razorpay for the actual payment details.
    const gatewayPayment = await razorpay.payments.fetch(paymentId);

    // Ensure the payment belongs to our order and matches its amount.
    if (
      gatewayPayment.order_id !== paymentRecord.razorpayOrderId ||
      gatewayPayment.amount !== paymentRecord.amount ||
      gatewayPayment.currency !== paymentRecord.currency
    ) {
      return res.status(400).json({
        message: "Payment details do not match our order.",
      });
    }

    // Signature validity alone is not enough: the payment must
    // actually be captured before we grant course access.
    if (
      gatewayPayment.status !== "captured" ||
      gatewayPayment.captured !== true
    ) {
      return res.status(409).json({
        message: "Payment is not captured yet. No enrollment was granted.",
        paymentStatus: gatewayPayment.status,
      });
    }

    // 5. Persist the confirmed payment.
    paymentRecord.razorpayPaymentId = paymentId;
    paymentRecord.status = "paid";
    await paymentRecord.save();

    // 6. Create the enrollment if it doesn't already exist.
    const existingEnrollment = await Enrollment.findOne({
      user: req.session.userId,
      course: paymentRecord.course,
    }).select("_id");

    if (!existingEnrollment) {
      try {
        await Enrollment.create({
          user: req.session.userId,
          course: paymentRecord.course,
        });
      } catch (error) {
        // Another simultaneous request might have created it.
        // The compound unique index prevents duplicate enrollments.
        if (error.code !== 11000) {
          throw error;
        }
      }
    }

    return res.json({
      message: "Payment verified and course access granted.",
      orderId: paymentRecord.razorpayOrderId,
      paymentId,
      status: "paid",
      enrolled: true,
    });
  } catch (error) {
    console.error("Payment verification failed:", error.message);

    return res.status(500).json({
      message: "Failed to verify payment.",
    });
  }
});

/*
  Razorpay calls this endpoint directly when a payment is captured.
  It does not use requireAuth because Razorpay is the caller.
  We authenticate the webhook using its signature instead.
*/
router.post("/webhook", async (req, res) => {
  try {
    const signature = req.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("Razorpay webhook secret is missing.");
      return res.status(500).json({
        message: "Webhook configuration error.",
      });
    }

    // The original request bytes are required for signature verification.
    if (
      !Buffer.isBuffer(req.rawBody) ||
      typeof signature !== "string" ||
      !/^[a-f0-9]{64}$/i.test(signature)
    ) {
      return res.status(400).json({
        message: "Invalid webhook request.",
      });
    }

    // Calculate the signature expected from Razorpay.
    const expectedSignature = createHmac("sha256", secret)
      .update(req.rawBody)
      .digest();

    const receivedSignature = Buffer.from(signature, "hex");

    // Reject requests whose signatures don't match.
    if (
      receivedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(receivedSignature, expectedSignature)
    ) {
      return res.status(400).json({
        message: "Invalid webhook signature.",
      });
    }

    // We only process captured-payment events in this handler.
    if (req.body?.event !== "payment.captured") {
      return res.status(200).json({ received: true });
    }

    const providerPayment = req.body.payload?.payment?.entity;

    if (!providerPayment?.id || !providerPayment?.order_id) {
      return res.status(400).json({
        message: "Missing payment details.",
      });
    }

    // Locate our saved order using Razorpay's order ID.
    const paymentRecord = await Payment.findOne({
      razorpayOrderId: providerPayment.order_id,
    });

    if (!paymentRecord) {
      // Return an error so the event can be retried if our order
      // record has not become available yet.
      return res.status(500).json({
        message: "Matching payment order not found.",
      });
    }

    // Verify the captured payment matches our saved order.
    if (
      providerPayment.status !== "captured" ||
      providerPayment.captured !== true ||
      providerPayment.amount !== paymentRecord.amount ||
      providerPayment.currency !== paymentRecord.currency
    ) {
      console.error("Captured payment does not match our order.");

      return res.status(400).json({
        message: "Payment details do not match the saved order.",
      });
    }

    // Never overwrite a previously recorded payment with a different one.
    if (
      paymentRecord.status === "paid" &&
      paymentRecord.razorpayPaymentId !== providerPayment.id
    ) {
      console.error("Unexpected second payment for an already-paid order.");
      return res.status(200).json({ received: true });
    }

    // A refunded order must not grant access again.
    if (paymentRecord.status === "refunded") {
      return res.status(200).json({ received: true });
    }

    // Mark the payment as paid. Repeated webhook deliveries are safe
    // because we store the same payment details again.
    paymentRecord.razorpayPaymentId = providerPayment.id;
    paymentRecord.status = "paid";
    await paymentRecord.save();

    // Ensure the user has an enrollment for this course.
    const existingEnrollment = await Enrollment.findOne({
      user: paymentRecord.user,
      course: paymentRecord.course,
    }).select("_id");

    if (!existingEnrollment) {
      try {
        await Enrollment.create({
          user: paymentRecord.user,
          course: paymentRecord.course,
        });
      } catch (error) {
        // Two requests may try to create the same enrollment.
        // The unique user/course index prevents duplicates.
        if (error.code !== 11000) {
          throw error;
        }
      }
    }

    return res.status(200).json({
      received: true,
      message: "Payment processed.",
    });
  } catch (error) {
    console.error("Razorpay webhook failed:", error.message);

    return res.status(500).json({
      message: "Webhook processing failed.",
    });
  }
});

export default router;
