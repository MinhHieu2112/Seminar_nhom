import "./Product.css";
import headphones_pink from "@/assets/images/airpods_max_pink.jpg";
import { FaStar } from "react-icons/fa";
import { useGlobalContext } from "@/components/GlobalContext/GlobalContext";
import { toast } from "react-toastify";

const Product = ({ product }) => {
  let {store} = useGlobalContext();
  let stars = [];
  for (let i = 0; i < product?.rating; i++) {
    stars.push(<FaStar key={i} />);
  }
  const isInCart = product?.addedToCart;
  return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 relative hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col">
        {/* Product Image */}
        <div className="h-48 bg-gray-50 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
          <img
              src={product?.image || headphones_pink}
              alt="Product"
              className="w-full h-full object-contain p-2"
          />
        </div>
        <div className="flex flex-col flex-1">

        {/* Name */}
        <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1">{product?.name}</h3>

        {/* Rating */}
        <div className="flex items-center text-yellow-500 text-sm space-x-1 mb-1">
          <div>{stars}</div>
          <span className="text-gray-500 ml-1 text-xs">({parseInt(Math.random() * 400)})</span>
        </div>

        {/* Price */}
        <div className="flex items-center space-x-2 mb-4">
    <span className="text-lg font-bold text-green-600">
      ${product?.price?.toLocaleString()}
    </span>
          <span className="text-xs text-gray-400 line-through">
      ${(product?.price + 1285)?.toLocaleString()}
    </span>
        </div>

        {/* Button */}
        <button
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition text-sm shadow-sm hover:shadow-md"
            onClick={() => {
              if (!isInCart) {
                if (store.state.cartQuantity > 10) {
                  toast.warning("You can only add 10 items to cart");
                  return;
                }
                store.addToCart(product?.id);
              } else {
                store.removeFromCart(product?.id);
              }
            }}
        >
          <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
          >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386a.75.75 0 01.732.585L5.79 9.75m1.466 6.75h10.469a.75.75 0 00.732-.585l1.597-7.424a.75.75 0 00-.732-.915H6.318m0 0L5.25 4.5m1.068 5.25h13.159"
            />
          </svg>
          {isInCart ? 'Remove from cart' : 'Add to cart'}
        </button>
        </div>
      </div>


  );
};
export default Product;
