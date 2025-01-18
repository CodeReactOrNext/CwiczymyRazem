interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const buttons = [];

  buttons.push(
    <button
      key='first'
      onClick={() => onPageChange(1)}
      disabled={currentPage === 1}
      className='btn join-item btn-sm'>
      «
    </button>,
    <button
      key='prev'
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className='btn join-item btn-sm'>
      ‹
    </button>
  );

  for (let i = startPage; i <= endPage; i++) {
    buttons.push(
      <button
        key={i}
        onClick={() => onPageChange(i)}
        className={`btn join-item btn-sm ${
          currentPage === i ? "btn-active" : ""
        }`}>
        {i}
      </button>
    );
  }

  buttons.push(
    <button
      key='next'
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      className='btn join-item btn-sm'>
      ›
    </button>,
    <button
      key='last'
      onClick={() => onPageChange(totalPages)}
      disabled={currentPage === totalPages}
      className='btn join-item btn-sm'>
      »
    </button>
  );

  return <div className='join'>{buttons}</div>;
};

export default Pagination;
