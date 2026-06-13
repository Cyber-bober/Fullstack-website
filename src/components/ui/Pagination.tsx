// src/components/ui/Pagination.tsx

"use client";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
      <button
        className="btn glass-effect"
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
        style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
      >
        ← Назад
      </button>
      
      {pages.map((p) => (
        <button
          key={p}
          className={`btn ${p === currentPage ? "btn-primary" : ""}`}
          onClick={() => handlePageChange(p)}
          style={{ minWidth: "40px" }}
        >
          {p}
        </button>
      ))}

      <button
        className="btn"
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
        style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
      >
        Вперед →
      </button>
    </div>
  );
}