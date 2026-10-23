import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { apiFetch } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

// Load Razorpay's checkout library only when needed.
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

export const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();

  // Course information fetched from MongoDB.
  const [course, setCourse] = useState(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState("");

  // Current user's enrollment information.
  const [enrollment, setEnrollment] = useState(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(true);
  const [enrollmentError, setEnrollmentError] = useState("");

  // Button and payment feedback.
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  // 1. Fetch the selected course from our backend.
  useEffect(() => {
    let cancelled = false;

    async function loadCourse() {
      setCourseLoading(true);
      setCourseError("");
      setCourse(null);

      try {
        const data = await apiFetch(
          `/api/courses/${encodeURIComponent(courseId)}`,
        );

        if (!cancelled) {
          setCourse(data.course);
        }
      } catch (error) {
        if (!cancelled) {
          setCourseError(error.message);
        }
      } finally {
        if (!cancelled) {
          setCourseLoading(false);
        }
      }
    }

    loadCourse();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  // 2. Fetch enrollment status when authentication is resolved.
  useEffect(() => {
    let cancelled = false;

    async function loadEnrollment() {
      if (authLoading) return;

      setEnrollmentError("");

      // Logged-out visitors can still view course details.
      if (!user) {
        setEnrollment(null);
        setEnrollmentLoading(false);
        return;
      }

      setEnrollmentLoading(true);

      try {
        const data = await apiFetch(
          `/api/enrollments/${encodeURIComponent(courseId)}`,
        );

        if (!cancelled) {
          setEnrollment(data);
        }
      } catch (error) {
        if (!cancelled) {
          setEnrollment(null);
          setEnrollmentError(error.message);
        }
      } finally {
        if (!cancelled) {
          setEnrollmentLoading(false);
        }
      }
    }

    loadEnrollment();

    return () => {
      cancelled = true;
    };
  }, [courseId, user?.id, authLoading]);

  // 3. Enroll in a free course or start paid checkout.
  async function handleEnroll() {
    if (!course || isProcessing || authLoading) return;

    // Users need an account to save their course progress.
    if (!user) {
      navigate("/login");
      return;
    }

    // Don't attempt enrollment a second time.
    if (enrollment?.enrolled) {
      navigate(`/courses/${encodeURIComponent(course.id)}/learn`);
      return;
    }

    setIsProcessing(true);
    setPaymentMessage("");

    // Keep the button disabled while Checkout is open.
    let checkoutOpened = false;

    try {
      // Free courses use our normal enrollment endpoint.
      if (course.price <= 0) {
        const data = await apiFetch(
          `/api/enrollments/${encodeURIComponent(course.id)}`,
          {
            method: "POST",
          },
        );

        setEnrollment({
          enrolled: true,
          progress: data.enrollment.progress,
          completedLessons: data.enrollment.completedLessons,
        });

        setPaymentMessage(data.message);
        return;
      }

      // Load Razorpay Checkout.
      const loaded = await loadRazorpayScript();

      if (!loaded) {
        throw new Error("Could not load Razorpay Checkout.");
      }

      // Our backend calculates the price and creates the order.
      const order = await apiFetch("/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify({
          courseId: course.id,
        }),
      });

      // Configure the Razorpay checkout window.
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Eduverse",
        description: order.course.title,
        order_id: order.orderId,

        // A successful Checkout callback is not proof of payment.
        // Our backend verifies the payment before granting access.
        handler: async (paymentResponse) => {
          try {
            const result = await apiFetch("/api/payments/verify", {
              method: "POST",
              body: JSON.stringify(paymentResponse),
            });

            setEnrollment({
              enrolled: true,
              progress: 0,
              completedLessons: [],
            });

            setPaymentMessage(result.message);
          } catch (error) {
            setPaymentMessage(
              `${error.message} If money was deducted, check the payment status before retrying.`,
            );
          } finally {
            setIsProcessing(false);
          }
        },

        // The user closed Checkout without completing the flow.
        modal: {
          ondismiss: () => {
            setPaymentMessage("Checkout was closed.");
            setIsProcessing(false);
          },
        },
      });

      // Show errors reported by Razorpay Checkout.
      checkout.on("payment.failed", (event) => {
        setPaymentMessage(
          event.error?.description || "Payment failed. Please try again.",
        );

        setIsProcessing(false);
      });

      checkoutOpened = true;
      checkout.open();
    } catch (error) {
      setPaymentMessage(error.message);
    } finally {
      if (!checkoutOpened) {
        setIsProcessing(false);
      }
    }
  }

  // 4. Course loading and error states.
  if (courseLoading) {
    return <p className="p-8 text-center">Loading course...</p>;
  }

  if (courseError) {
    return (
      <p role="alert" className="p-8 text-center text-red-600 dark:text-red-400">
        Couldn't load course: {courseError}
      </p>
    );
  }

  if (!course) {
    return <p className="p-8 text-center">Course not found.</p>;
  }

  const isEnrolled = Boolean(enrollment?.enrolled);

  const buttonLabel = isProcessing
    ? "Processing..."
    : enrollmentLoading
      ? "Checking enrollment..."
      : isEnrolled
        ? "Continue Learning"
        : course.price > 0
          ? "Buy Course"
          : "Enroll Now";

  return (
    <div className="bg-violet-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
          Courses / {course.category}
        </p>

        <div className="mt-6 grid gap-10 md:grid-cols-2 md:items-center">
          {/* Course information */}
          <div>
            <span className="rounded-full bg-violet-100 dark:bg-violet-900/60 px-3 py-1 text-sm font-semibold text-violet-700 dark:text-violet-300">
              {course.level}
            </span>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl lg:text-5xl">
              {course.title}
            </h1>

            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
              Learn from industry experts and build practical skills with this{" "}
              {course.category.toLowerCase()} course.
            </p>

            <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
              Created by{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {course.instructor}
              </span>
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {course.rating} ★
              </span>

              <span className="text-slate-600 dark:text-slate-300">
                ({course.reviews.toLocaleString()} reviews)
              </span>

              <span className="text-slate-600 dark:text-slate-300">
                {course.students.toLocaleString()} learners
              </span>
            </div>

            {/* Enrollment and payment actions */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={handleEnroll}
                disabled={
                  isProcessing ||
                  authLoading ||
                  enrollmentLoading ||
                  Boolean(enrollmentError)
                }
                className="rounded-xl bg-violet-600 px-6 py-3.5 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {buttonLabel}
              </button>

              <span className="text-sm text-slate-600 dark:text-slate-300">
                {course.duration} of learning
              </span>
            </div>

            {paymentMessage && (
              <p role="status" className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                {paymentMessage}
              </p>
            )}

            {enrollmentError && (
              <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
                Couldn't check enrollment: {enrollmentError}
              </p>
            )}

            {/* Show saved progress for enrolled students. */}
            {isEnrolled && (
              <div className="mt-6 max-w-md">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Your progress
                  </span>

                  <span className="text-slate-600 dark:text-slate-300">{enrollment.progress}%</span>
                </div>

                <div
                  role="progressbar"
                  aria-label="Course progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={enrollment.progress}
                  className="h-2.5 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/60"
                >
                  <div
                    className="h-full rounded-full bg-violet-600 transition-all"
                    style={{
                      width: `${enrollment.progress}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Your progress is saved to your account.
                </p>
              </div>
            )}
          </div>

          {/* Course preview and price */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
            <div className="h-64 w-full bg-slate-100 dark:bg-slate-800 sm:h-80">
              <img
                src={course.image}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-6">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  ₹{course.price}
                </span>

                {course.originalPrice > course.price && (
                  <span className="text-base text-slate-400 dark:text-slate-500 line-through">
                    ₹{course.originalPrice}
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Course access and learning details
              </p>

              <ul className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li>✓ Course level: {course.level}</li>
                <li>✓ Duration: {course.duration}</li>
                <li>✓ Learn at your own pace</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
