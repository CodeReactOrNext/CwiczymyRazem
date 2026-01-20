import {
  Pagination as ShadcnPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "assets/components/ui/pagination";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  lastAccessiblePage: number;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  lastAccessiblePage,
}: PaginationProps) => {
  const handlePageClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    page: number
  ) => {
    e.preventDefault();
    if (page <= lastAccessiblePage) {
      onPageChange(page);
    }
  };

  const handlePrevious = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (currentPage < totalPages && currentPage < lastAccessiblePage) {
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
          const isAccessible = pageNumber <= lastAccessiblePage;

          if (isFirst || isLast || isCurrent || isNeighbor) {
            return (
              <PaginationItem
                key={pageNumber}
                className={isNeighbor ? "hidden sm:block" : ""}>
                <PaginationLink
                  onClick={(e) => isAccessible && handlePageClick(e, pageNumber)}
                  isActive={isCurrent}
                  className={`cursor-pointer border border-white/5 bg-zinc-800/50 ${
                    isCurrent
                      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                      : isAccessible 
                        ? "hover:border-cyan-500/30 hover:bg-zinc-700/50 hover:text-cyan-300"
                        : "opacity-30 cursor-not-allowed hover:bg-zinc-800/50"
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
              (currentPage === totalPages || currentPage >= lastAccessiblePage) ? "pointer-events-none opacity-50" : ""
            }`}
          />
        </PaginationItem>
      </PaginationContent>
    </ShadcnPagination>
  );
};
