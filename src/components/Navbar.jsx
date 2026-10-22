import bookIcon from "../assets/book.svg";
import toggle from "../assets/toggle.svg";
import menu from "../assets/menu.svg";
import { useState } from "react";
import { Link } from "react-router-dom";
export const Navbar = () => {
  const [menuToggle, setMenuToggle] = useState(false);
  const closeMenu = () => setMenuToggle(false);

  return (
    <>
      <div className="flex h-10 w-full bg-white-300  ">
        <div className="ml-2 h-10 w-10 shrink-0 ">
          <img
            src={bookIcon}
            alt="Book"
            className="h-full w-full object-contain "
          />
        </div>
        <div className="p-2">Eduverse</div>

        <div className="p-2 hidden md:block">
          <Link to={"/courses"}>Courses</Link>
        </div>
        <div className="p-2  hidden md:block">
          <Link to={"/courses#categories"}>Categories</Link>
        </div>
        <div className="p-2  hidden md:block">
          {" "}
          <Link to={"/#about"}>About</Link>
        </div>

        <div className="ml-auto flex items-center h-10">
          <div className="p-2  ml-auto  hidden md:block">
            <input type="text" placeholder="Search Courses..." />
          </div>
          <button
            onClick={() => setMenuToggle((prev) => !prev)}
            className="h-10 w-10 md:hidden shrink-0"
          >
            <img
              src={menu}
              alt="menu"
              className="h-full w-full object-contain "
            />
          </button>

          <div className="p-2  h-10 w-10 shrink-0">
            <img
              src={toggle}
              alt="toggle"
              className="h-full w-full object-contain "
            />
          </div>
          <div className="p-2">
            <Link to={"/login"}>Sign in</Link>
          </div>
          <div className="p-2">
            {" "}
            <Link to={"/login"}>Get Started</Link>
          </div>
        </div>
      </div>
      {menuToggle && (
        <div className="w-2xl  md:hidden">
          <div className="p-2">
            <input type="text" placeholder="Search Courses..." />
          </div>
          <div className="p-2 ">
            <Link to={"/courses"} onClick={closeMenu}>
              Courses
            </Link>
          </div>
          <div className="p-2  ">
            <Link to={"/courses#categories"} onClick={closeMenu}>
              Categories
            </Link>
          </div>
          <div className="p-2  ">
            <Link to={"/#about"} onClick={closeMenu}>
              About
            </Link>
          </div>
        </div>
      )}
    </>
  );
};
