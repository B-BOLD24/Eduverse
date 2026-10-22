import { FeaturedCourses } from "../components/home/FeaturedCourses";
import { Hero } from "../components/home/Hero";
import { Stats } from "../components/home/Stats";
import { Navbar } from "../components/Navbar";

export const Home = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Stats/>
      <FeaturedCourses/>
    </>
  );
};
