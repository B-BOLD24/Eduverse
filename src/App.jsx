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
      </Routes>
      <Footer />
    </>
  );
}

export default App;
