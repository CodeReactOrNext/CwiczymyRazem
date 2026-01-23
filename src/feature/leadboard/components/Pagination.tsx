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
      <PaginationContent className="gap-4">
        <PaginationItem>
          <PaginationPrevious
            onClick={handlePrevious}
            className={`cursor-pointer border border-white/5 bg-zinc-800/50 hover:bg-zinc-700/50 ${
              currentPage === 1 ? "pointer-events-none opacity-50" : ""
            }`}
          />
        </PaginationItem>

        <PaginationItem>
          <PaginationNext
            onClick={handleNext}
            className={`cursor-pointer border border-white/5 bg-zinc-800/50 hover:bg-zinc-700/50 ${
              (currentPage === totalPages || currentPage >= lastAccessiblePage) ? "pointer-events-none opacity-50" : ""
            }`}
          />
        </PaginationItem>
      </PaginationContent>
    </ShadcnPagination>
  );
};
