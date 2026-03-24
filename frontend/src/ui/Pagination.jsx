import { useEffect } from "react";

const Pagination = ({
  items = [],
  countOfPage = 12,
  paginatedData,
  currPage,
  setCurrPage,
}) => {
  const pageStart = (currPage - 1) * countOfPage;
  const totalPage = Math.ceil(items.length / countOfPage);

  function setPage(idx) {
    if (idx <= 0 || idx > totalPage) {
      return;
    }
    setCurrPage(idx);
    window.scrollTo(0, 0);
    paginatedData(items, pageStart, countOfPage);
  }

  useEffect(() => {
    paginatedData(items, pageStart, countOfPage);
  }, [items, pageStart, countOfPage]);

  if (totalPage <= 1) return null;

  return (
    <nav className="cl-shop__pagination">
      <button
        type="button"
        className="cl-shop__page-btn cl-shop__page-btn--arrow"
        onClick={() => setPage(currPage - 1)}
        disabled={currPage === 1}
        aria-label="Previous page"
      >
        <i className="fa-solid fa-chevron-left" />
      </button>

      {Array.from({ length: totalPage }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          className={`cl-shop__page-btn${currPage === n ? ' cl-shop__page-btn--active' : ''}`}
          onClick={() => setPage(n)}
        >
          {String(n).padStart(2, '0')}
        </button>
      ))}

      <button
        type="button"
        className="cl-shop__page-btn cl-shop__page-btn--arrow"
        onClick={() => setPage(currPage + 1)}
        disabled={currPage === totalPage}
        aria-label="Next page"
      >
        <i className="fa-solid fa-chevron-right" />
      </button>
    </nav>
  );
};

export default Pagination;
