import {
  Pagination as ShadcnPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "assets/components/ui/pagination";
import { useMemo } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  const handlePageClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    page: number
  ) => {
    e.preventDefault();
    onPageChange(page);
  };

  const handlePrevious = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <ShadcnPagination className='pb-4'>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={handlePrevious}
            className={`cursor-pointer border border-white/5 bg-zinc-800/50 hover:bg-zinc-700/50 [&>span]:hidden sm:[&>span]:inline ${
              currentPage === 1 ? "pointer-events-none opacity-50" : ""
            }`}
          />
        </PaginationItem>

        {[...Array(totalPages)].map((_, index) => {
          const pageNumber = index + 1;
          const isCurrent = currentPage === pageNumber;
          const isFirst = pageNumber === 1;
          const isLast = pageNumber === totalPages;
          const isNeighbor =
            pageNumber === currentPage - 1 || pageNumber === currentPage + 1;
          const isEllipsis =
            pageNumber === currentPage - 2 || pageNumber === currentPage + 2;

          if (isFirst || isLast || isCurrent || isNeighbor) {
            return (
              <PaginationItem
                key={pageNumber}
                className={isNeighbor ? "hidden sm:block" : ""}>
                <PaginationLink
                  onClick={(e) => handlePageClick(e, pageNumber)}
                  isActive={isCurrent}
                  className={`cursor-pointer border border-white/5 bg-zinc-800/50 hover:border-cyan-500/30 hover:bg-zinc-700/50 hover:text-cyan-300 ${
                    isCurrent
                      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                      : ""
                  }`}>
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            );
          } else if (isEllipsis) {
            return (
              <PaginationItem key={pageNumber} className='hidden sm:block'>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
          return null;
        })}

        <PaginationItem>
          <PaginationNext
            onClick={handleNext}
            className={`cursor-pointer border border-white/5 bg-zinc-800/50 hover:bg-zinc-700/50 [&>span]:hidden sm:[&>span]:inline ${
              currentPage === totalPages ? "pointer-events-none opacity-50" : ""
            }`}
          />
        </PaginationItem>
      </PaginationContent>
    </ShadcnPagination>
  );
};
