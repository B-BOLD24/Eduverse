import "./App.css";
import { Home } from "./pages/Home";
import { Route, Routes } from "react-router-dom";
import { Footer } from "./components/Footer";
import { Courses } from "./pages/Courses";
import { CourseDetails } from "./pages/CourseDetails";
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:courseId" element={<CourseDetails />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
