import "./App.css";
import Login from "./pages/Login";
import { Home } from "./pages/Home";
import { Route, Routes } from "react-router-dom";
import { Footer } from "./components/Footer";
import { Courses } from "./pages/Courses";
import CourseLearning from "./pages/CourseLearning.jsx";
import MyLearning from "./pages/MyLearning.jsx";
import { CourseDetails } from "./pages/CourseDetails";
import Register from "./pages/Register";
import AdminRoute from "./components/admin/AdminRoute.jsx";
import AdminLayout from "./components/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminStudents from "./pages/admin/AdminStudents.jsx";
import AdminStudentDetails from "./pages/admin/AdminStudentDetails.jsx";
import AdminCourses from "./pages/admin/AdminCourses.jsx";
import AdminEnrollments from "./pages/admin/AdminEnrollments.jsx";
function App() {
  return (
    <>
      <Routes>
        <Route path="/my-learning" element={<MyLearning />} />
        <Route path="/courses/:courseId/learn" element={<CourseLearning />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />}></Route>
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:courseId" element={<CourseDetails />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="students/:studentId" element={<AdminStudentDetails />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="enrollments" element={<AdminEnrollments />} />
          </Route>
        </Route>
      </Routes>
      <Footer />
    </>
  );
}

export default App;
