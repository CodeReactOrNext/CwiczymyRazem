import { Button } from "assets/components/ui/button";
import {
  Pagination as ShadcnPagination,
  PaginationContent,
  PaginationItem,
} from "assets/components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const canGoBack = currentPage > 1;
  const canGoForward =
    currentPage < totalPages && currentPage < lastAccessiblePage;

  return (
    <ShadcnPagination className='pb-4'>
      <PaginationContent className="gap-4">
        <PaginationItem>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label='Go to previous page'
            disabled={!canGoBack}
            onClick={() => onPageChange(currentPage - 1)}>
            <ChevronLeft />
          </Button>
        </PaginationItem>

        <PaginationItem>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label='Go to next page'
            disabled={!canGoForward}
            onClick={() => onPageChange(currentPage + 1)}>
            <ChevronRight />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </ShadcnPagination>
  );
};
