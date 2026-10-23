# Eduverse — Online Learning Platform

**Upgrade your skills. Build your future.**

Eduverse is a full-stack online learning platform where students can discover courses, enroll in learning content, and manage their learning library. It includes a dedicated admin panel for managing courses, students, and enrollments.

Built with React, Node.js, Express, and MongoDB, the project demonstrates reusable UI components, REST APIs, session-based authentication, role-based authorization, and database-backed course management.

## Features

### Student Experience
- Browse and search courses.
- Filter courses by category, difficulty, price, and rating.
- Sort courses and navigate paginated results.
- View course descriptions, instructors, and curriculum.
- Register, log in, and maintain an authenticated session.
- Enroll in courses and access them through My Learning.
- View enrolled courses and maintain access to legitimately enrolled content.

### Admin Panel
- Dashboard with student, course, and enrollment summaries.
- Search and browse registered students.
- View student details and course enrollments.
- Create, edit, publish, feature, archive, and delete eligible courses.
- Manage course categories through course data.
- Inspect enrollment records and free/paid/unknown enrollment classifications.
- Protected admin routes and backend role-based authorization.

### Authentication and Data Management
- Password hashing using Argon2.
- Session-based authentication.
- Server-side admin authorization using the account's database role.
- Course lifecycle management with draft, published, and archived states.
- Enrollment access classification as free, paid, or unknown.
- Historical data migration designed to preserve existing courses and avoid unsupported assumptions about past enrollments.

### Payment Integration
- Razorpay order creation and payment verification flows.
- Enrollment classification after verified payments.
- Payment-related server logic and webhook handling.

> Payment functionality has not been verified with a live transaction. Configure and test the payment provider in test mode before considering it ready for real payments.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| Styling | Tailwind CSS v4 |
| Routing | React Router |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | Sessions, Argon2 |
| Payments | Razorpay integration |
| Testing | Node.js test runner, Supertest, mongodb-memory-server |
| Version Control | Git, GitHub |

## Architecture

Eduverse uses a separate frontend and backend.

```text
Eduverse/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   ├── courses/
│   │   └── ...
│   ├── context/
│   ├── lib/
│   ├── pages/
│   │   └── admin/
│   ├── App.jsx
│   └── main.jsx
│
├── server/
│   ├── config/
│   ├── middleware/
│   ├── migrations/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── test/
│   ├── app.js
│   └── server.js
│
├── package.json
└── README.md
```

The frontend communicates with the Express backend through API requests. The backend validates requests, enforces authorization, and accesses MongoDB through Mongoose.

## Getting Started

### Prerequisites

- Node.js 22 or a compatible supported version.
- npm.
- A MongoDB database for local development.
- Razorpay test credentials if you intend to test payment flows.

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_REPOSITORY_DIRECTORY>
```

Replace the placeholders with your GitHub repository URL and directory name.

### 2. Install dependencies

Install the frontend dependencies:

```bash
npm install
```

Install the backend dependencies:

```bash
npm --prefix server install
```

### 3. Configure environment variables

Create the backend environment file at `server/.env` if that is the location expected by your current server configuration.

Configure the required values using the variable names read by the existing server code. These typically include:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_long_random_session_secret

RAZORPAY_KEY_ID=your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_test_webhook_secret
```

These are example variable names and placeholders; verify them against the current configuration files before use. The Razorpay values are only required when enabling the corresponding payment flows.

**Security precautions**
- Never commit `.env` files or actual credentials.
- Keep database credentials and payment secrets on the backend.
- Use an isolated development database rather than a production database for testing.
- Do not configure admin privileges through public registration.

### 4. Start the application

Start the Vite frontend from the repository root:

```bash
npm run dev
```

Start the Express backend in a separate terminal:

```bash
cd server
node server.js
```

Check the configured port and startup output if your local setup differs.

The development frontend normally runs at `http://localhost:5173`, and the backend runs at `http://localhost:5000`.

## Application Routes

### Student Routes

| Route | Purpose |
|---|---|
| `/` | Home page |
| `/courses` | Course catalog |
| `/courses/:courseId` | Course details |
| `/my-learning` | Enrolled courses |
| `/login` | Login and registration |

### Admin Routes

| Route | Purpose |
|---|---|
| `/admin` | Admin dashboard |
| `/admin/students` | Student management |
| `/admin/students/:studentId` | Student details and enrollments |
| `/admin/courses` | Course management |
| `/admin/enrollments` | Read-only enrollment management |

Admin pages and API endpoints require appropriate authorization. Frontend route guards improve navigation but do not replace backend security checks.

## Development and Testing

### Run backend tests

From the repository root:

```bash
npm --prefix server test
```

The backend test suite uses an isolated temporary MongoDB instance through `mongodb-memory-server` and should not require your application database.

### Build the frontend

```bash
npm run build
```

### Run lint checks

```bash
npm run lint
```

The root lint command has previously reported existing findings outside the new admin frontend files. Focused ESLint checks for the new and modified admin frontend files passed during the latest verification. Recheck the current branch for updated results.

### Before using the application database

The course lifecycle and historical enrollment migration is an operator-managed operation. Review the target database URI, back up the database, and follow the migration script's explicit database confirmation requirements before running it. Do not run the migration blindly against production.

## Design Principles

- **Reusable components:** Share course cards and other repeated UI across pages.
- **Separation of concerns:** Keep rendering, data processing, authentication, and API access organized.
- **Server-side authorization:** Determine admin permissions from trusted database state.
- **Data integrity:** Preserve enrollment history and archive courses when deletion would break existing records.
- **Responsive design:** Support desktop and mobile layouts.
- **Explicit uncertainty:** Use unknown enrollment classifications when historical records do not provide reliable evidence.

## Project Status

The main student-facing flows and admin implementation have passed the reported build and focused verification checks. The backend test suite passed four tests during the latest reported run.

Remaining verification includes selected browser interactions, payment testing beyond the isolated mocked tests, and reviewing the full-project lint findings. The operator-managed migration must also be reviewed before applying it to the actual application database.

## Future Improvements

Potential next steps include:
- Expanded automated browser and integration tests.
- Improved dashboard analytics.
- Persistent theme preferences across routes.
- Additional course discovery and learning features.
- Production deployment, monitoring, and security hardening.

---

**Eduverse** — Keep learning. Keep growing.
