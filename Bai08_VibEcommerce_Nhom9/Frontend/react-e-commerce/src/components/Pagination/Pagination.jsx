import React from "react";
import ReactPaginate from "react-paginate";
// import "./Pagination.css";
const Pagination = ({ currentPage, totalPages, handlePageClick }) => {
  return (
    <ReactPaginate
      previousLabel={"Previous"}
      nextLabel={"Next"}
      breakLabel={"..."}
      pageCount={totalPages}
      marginPagesDisplayed={2}
      pageRangeDisplayed={3}
      onPageChange={handlePageClick}
      containerClassName="flex justify-center mt-4"
      pageClassName="mx-1"
      pageLinkClassName="px-3 py-2 border rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition"
      previousClassName="mx-1"
      previousLinkClassName="px-3 py-2 border rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition"
      nextClassName="mx-1"
      nextLinkClassName="px-3 py-2 border rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition"
      breakClassName="mx-1"
      breakLinkClassName="px-3 py-2 border rounded-lg text-gray-500"
      activeClassName="bg-green-500 text-white border-green-500 hover:bg-green-600 hover:text-white"
      forcePage={currentPage}
    />
  );
};

export default Pagination;
