import { useEffect, useState } from "react";

import { CourseCard } from "../components/CourseCard";
import { CoursesNavbar } from "../components/CoursesNavbar";
import { apiFetch } from "../lib/api.js";

// Six courses per page: two rows of three on desktop.
const PAGE_SIZE = 6;

// Shared styles for filter controls.
const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-violet-900";

const radioClass = "accent-violet-600";

// Reusable filter controls for desktop and mobile.
const FilterControls = ({
  categories,
  levels,
  selectedCategory,
  onCategoryChange,
  selectedLevel,
  onLevelChange,
  maxPrice,
  onMaxPriceChange,
  minRating,
  onMinRatingChange,
  onClear,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Filters
        </h2>

        <button
          type="button"
          onClick={onClear}
          className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
        >
          Clear all
        </button>
      </div>

      {/* Category filter */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          Category
        </legend>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="radio"
              name="category"
              value="All"
              checked={selectedCategory === "All"}
              onChange={(event) => onCategoryChange(event.target.value)}
              className={radioClass}
            />
            All categories
          </label>

          {categories.map((category) => (
            <label
              key={category}
              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
            >
              <input
                type="radio"
                name="category"
                value={category}
                checked={selectedCategory === category}
                onChange={(event) => onCategoryChange(event.target.value)}
                className={radioClass}
              />
              {category}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Difficulty filter */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          Difficulty
        </legend>

        <div className="space-y-3">
          {["All", ...levels].map((level) => (
            <label
              key={level}
              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
            >
              <input
                type="radio"
                name="level"
                value={level}
                checked={selectedLevel === level}
                onChange={(event) => onLevelChange(event.target.value)}
                className={radioClass}
              />
              {level === "All" ? "All levels" : level}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Maximum-price filter */}
      <div>
        <label
          htmlFor="price-filter"
          className="mb-3 block text-sm font-semibold text-slate-900 dark:text-slate-100"
        >
          Maximum price
        </label>

        <select
          id="price-filter"
          value={maxPrice}
          onChange={(event) => onMaxPriceChange(event.target.value)}
          className={selectClass}
        >
          <option value="all">Any price</option>
          <option value="500">Up to ₹500</option>
          <option value="800">Up to ₹800</option>
          <option value="1000">Up to ₹1,000</option>
        </select>
      </div>

      {/* Minimum-rating filter */}
      <div>
        <label
          htmlFor="rating-filter"
          className="mb-3 block text-sm font-semibold text-slate-900 dark:text-slate-100"
        >
          Minimum rating
        </label>

        <select
          id="rating-filter"
          value={minRating}
          onChange={(event) => onMinRatingChange(event.target.value)}
          className={selectClass}
        >
          <option value="0">Any rating</option>
          <option value="4">4.0 and above</option>
          <option value="4.5">4.5 and above</option>
        </select>
      </div>
    </div>
  );
};

export const Courses = () => {
  // Courses on the current page, returned by the API.
  const [courses, setCourses] = useState([]);

  // All fetched courses are used only to build filter options.
  const [allCourses, setAllCourses] = useState([]);

  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");

  // Search and filter selections.
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [maxPrice, setMaxPrice] = useState("all");
  const [minRating, setMinRating] = useState("0");

  // Sorting, pagination and UI state.
  const [sortBy, setSortBy] = useState("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 0,
  });

  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Derive the available filter options from database data.
  const categories = [...new Set(allCourses.map((course) => course.category))];

  const levels = [...new Set(allCourses.map((course) => course.level))];

  // Fetch the course list used to populate category and level options.
  // This runs only when the page mounts.
  useEffect(() => {
    let cancelled = false;

    async function loadFilterOptions() {
      try {
        const data = await apiFetch("/api/courses?limit=50");

        if (!cancelled) {
          setAllCourses(data.courses ?? []);
        }
      } catch (error) {
        // The main results request displays the API error.
        console.error("Failed to load course filter options:", error.message);
      }
    }

    loadFilterOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  // Debounce search so we don't request results for every keystroke.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch filtered, sorted and paginated results from Express.
  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      setCoursesLoading(true);
      setCoursesError("");

      try {
        // Build the query parameters from the current UI selections.
        const params = new URLSearchParams();

        if (debouncedSearchTerm) {
          params.set("search", debouncedSearchTerm);
        }

        if (selectedCategory !== "All") {
          params.set("category", selectedCategory);
        }

        if (selectedLevel !== "All") {
          params.set("level", selectedLevel);
        }

        if (maxPrice !== "all") {
          params.set("maxPrice", maxPrice);
        }

        if (minRating !== "0") {
          params.set("minRating", minRating);
        }

        params.set("sortBy", sortBy);
        params.set("page", String(currentPage));
        params.set("limit", String(PAGE_SIZE));

        const data = await apiFetch(`/api/courses?${params.toString()}`);

        if (!cancelled) {
          setCourses(data.courses ?? []);

          // The backend provides counts for the complete filtered result.
          setPagination(
            data.pagination ?? {
              total: data.courses?.length ?? 0,
              page: currentPage,
              limit: PAGE_SIZE,
              totalPages: Math.ceil((data.courses?.length ?? 0) / PAGE_SIZE),
            },
          );
        }
      } catch (error) {
        if (!cancelled) {
          setCoursesError(error.message);
          setCourses([]);
        }
      } finally {
        if (!cancelled) {
          setCoursesLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      cancelled = true;
    };
  }, [
    debouncedSearchTerm,
    selectedCategory,
    selectedLevel,
    maxPrice,
    minRating,
    sortBy,
    currentPage,
  ]);

  // Reset pagination whenever the user changes a filter.
  const changeSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const changeCategory = (value) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const changeLevel = (value) => {
    setSelectedLevel(value);
    setCurrentPage(1);
  };

  const changeMaxPrice = (value) => {
    setMaxPrice(value);
    setCurrentPage(1);
  };

  const changeMinRating = (value) => {
    setMinRating(value);
    setCurrentPage(1);
  };

  const changeSort = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedCategory("All");
    setSelectedLevel("All");
    setMaxPrice("all");
    setMinRating("0");
    setSortBy("popular");
    setCurrentPage(1);
  };

  // Calculate the visible range using the total count from the backend.
  const showingFrom =
    pagination.total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const showingTo = Math.min(currentPage * PAGE_SIZE, pagination.total);

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-screen bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <CoursesNavbar
          onSearchClick={() => setIsMobilePanelOpen(true)}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode((previous) => !previous)}
        />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Page heading */}
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Find your next skill
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Explore Courses
            </h1>

            <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
              Discover courses, learn from experts, and take your next step
              towards your goals.
            </p>
          </div>

          <div className="flex items-start gap-8">
            {/* Desktop sidebar */}
            <aside className="hidden w-64 shrink-0 md:block">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <FilterControls
                  categories={categories}
                  levels={levels}
                  selectedCategory={selectedCategory}
                  onCategoryChange={changeCategory}
                  selectedLevel={selectedLevel}
                  onLevelChange={changeLevel}
                  maxPrice={maxPrice}
                  onMaxPriceChange={changeMaxPrice}
                  minRating={minRating}
                  onMinRatingChange={changeMinRating}
                  onClear={clearFilters}
                />
              </div>
            </aside>

            {/* Course results */}
            <section className="min-w-0 flex-1">
              {/* Search and sorting toolbar */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:ring-violet-900">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5 shrink-0 text-slate-400"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
                  </svg>

                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => changeSearch(event.target.value)}
                    placeholder="Search courses or instructors..."
                    aria-label="Search courses or instructors"
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
                  />
                </label>

                <label className="flex shrink-0 items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span>Sort:</span>

                  <select
                    value={sortBy}
                    onChange={(event) => changeSort(event.target.value)}
                    className={selectClass}
                    aria-label="Sort courses"
                  >
                    <option value="popular">Most popular</option>
                    <option value="rating">Highest rated</option>
                    <option value="price-low">Price: low to high</option>
                    <option value="price-high">Price: high to low</option>
                    <option value="newest">Newest</option>
                  </select>
                </label>
              </div>

              {/* Result count */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <p
                  aria-live="polite"
                  className="text-sm text-slate-500 dark:text-slate-400"
                >
                  {coursesLoading
                    ? "Loading course results..."
                    : `Showing ${showingFrom}–${showingTo} of ${pagination.total} courses`}
                </p>

                <button
                  type="button"
                  onClick={() => setIsMobilePanelOpen(true)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-violet-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
                >
                  Filters
                </button>
              </div>

              {/* Loading, error, course cards, or empty state */}
              {coursesLoading ? (
                <div className="rounded-2xl border border-slate-200 px-6 py-16 text-center dark:border-slate-800">
                  <p className="text-slate-600 dark:text-slate-300">
                    Loading courses...
                  </p>
                </div>
              ) : coursesError ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 px-6 py-10 text-center dark:border-red-900"
                >
                  <h2 className="text-lg font-semibold text-red-600">
                    Couldn't load courses
                  </h2>

                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {coursesError}
                  </p>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => page)}
                    className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Retry
                  </button>
                </div>
              ) : courses.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    No courses found
                  </h2>

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Try another search or clear some filters.
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-5 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {/* Pagination from the backend */}
              {!coursesLoading &&
                !coursesError &&
                pagination.totalPages > 1 && (
                  <nav
                    aria-label="Course pagination"
                    className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row"
                  >
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Page {currentPage} of {pagination.totalPages}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage((page) => Math.max(1, page - 1))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        Previous
                      </button>

                      {Array.from(
                        { length: pagination.totalPages },
                        (_, index) => index + 1,
                      ).map((pageNumber) => (
                        <button
                          key={pageNumber}
                          type="button"
                          aria-current={
                            currentPage === pageNumber ? "page" : undefined
                          }
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`h-10 min-w-10 rounded-lg px-3 text-sm font-semibold transition ${
                            currentPage === pageNumber
                              ? "bg-violet-600 text-white"
                              : "border border-slate-200 text-slate-700 hover:bg-violet-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      ))}

                      <button
                        type="button"
                        disabled={currentPage === pagination.totalPages}
                        onClick={() =>
                          setCurrentPage((page) =>
                            Math.min(pagination.totalPages, page + 1),
                          )
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        Next
                      </button>
                    </div>
                  </nav>
                )}
            </section>
          </div>
        </main>
      </div>

      {/* Mobile search and filter drawer */}
      {isMobilePanelOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Clicking the backdrop closes the drawer */}
          <button
            type="button"
            aria-label="Close search and filters"
            onClick={() => setIsMobilePanelOpen(false)}
            className="absolute inset-0 h-full w-full bg-slate-950/40"
          />

          <aside className="absolute right-0 top-0 h-full w-[min(92vw,380px)] overflow-y-auto bg-white p-5 shadow-2xl dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Search and filters
              </h2>

              <button
                type="button"
                aria-label="Close drawer"
                onClick={() => setIsMobilePanelOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Mobile search uses the same search state */}
            <label className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 px-3 dark:border-slate-700">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5 shrink-0 text-slate-400"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => changeSearch(event.target.value)}
                placeholder="Search courses..."
                aria-label="Search courses"
                className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none dark:text-slate-100"
              />
            </label>

            <FilterControls
              categories={categories}
              levels={levels}
              selectedCategory={selectedCategory}
              onCategoryChange={changeCategory}
              selectedLevel={selectedLevel}
              onLevelChange={changeLevel}
              maxPrice={maxPrice}
              onMaxPriceChange={changeMaxPrice}
              minRating={minRating}
              onMinRatingChange={changeMinRating}
              onClear={clearFilters}
            />
          </aside>
        </div>
      )}
    </div>
  );
};
