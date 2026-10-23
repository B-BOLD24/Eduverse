import { apiFetch } from "./api.js";

// The admin enrollment endpoint returns bounded pages. Fetch those pages in
// small batches for accurate client-side summaries and enrollment searching.
export async function fetchAllAdminEnrollments() {
  const firstPage = await apiFetch("/api/admin/enrollments?page=1&limit=100");
  const pages = [firstPage.items ?? []];
  const batchSize = 5;

  for (let start = 2; start <= firstPage.totalPages; start += batchSize) {
    const pageNumbers = Array.from(
      { length: Math.min(batchSize, firstPage.totalPages - start + 1) },
      (_, index) => start + index,
    );
    const results = await Promise.all(
      pageNumbers.map((page) =>
        apiFetch(`/api/admin/enrollments?page=${page}&limit=100`),
      ),
    );
    pages.push(...results.map((result) => result.items ?? []));
  }

  return pages.flat();
}
