import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, Heart, Plus, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatVND } from '../../utils/formatters';

type SortOption = 'DEFAULT' | 'PRICE_ASC' | 'PRICE_DESC' | 'STOCK_DESC';

export const CatalogPage: React.FC = () => {
  const {
    currentUser,
    products,
    categories,
    wishlistProductIds,
    searchQuery,
    setSearchQuery,
    selectedCategoryId,
    setSelectedCategoryId,
    addToCart,
    toggleWishlist,
  } = useApp();

  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortOption>('DEFAULT');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const pageSize = 8;

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      if (!p.isVisible || p.isDeleted) return false;
      if (selectedCategoryId !== 'ALL' && p.categoryId !== selectedCategoryId) {
        return false;
      }
      if (onlyInStock && p.stock <= 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (sortBy === 'PRICE_ASC') {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'PRICE_DESC') {
      return [...list].sort((a, b) => b.price - a.price);
    }
    if (sortBy === 'STOCK_DESC') {
      return [...list].sort((a, b) => b.stock - a.stock);
    }
    return list;
  }, [products, selectedCategoryId, onlyInStock, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleQuickAdd = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    const res = addToCart(productId, 1);
    showToast(res.message);
  };

  const handleToggleWish = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    const res = toggleWishlist(productId);
    showToast(res.message);
  };

  const handleClearFilters = () => {
    setSelectedCategoryId('ALL');
    setSearchQuery('');
    setOnlyInStock(false);
    setSortBy('DEFAULT');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Subtle Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Heading + Minimal Filter/Sort Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-zinc-900 tracking-tight leading-tight">
            Xin chào, {currentUser ? currentUser.fullName : 'User'}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-zinc-500">
              {selectedCategory ? selectedCategory.name : 'Danh sách sản phẩm'}
            </p>
            {(selectedCategoryId !== 'ALL' || searchQuery.trim() || onlyInStock) && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline ml-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>
        </div>

        {/* Minimal Sort & In-Stock Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setOnlyInStock((prev) => !prev);
              setCurrentPage(1);
            }}
            className={`h-8 px-3 rounded-full text-xs font-medium border transition-colors ${
              onlyInStock
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-600 border-zinc-200/80 hover:bg-zinc-100'
            }`}
          >
            Còn hàng
          </button>

          <div className="relative inline-flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 absolute left-3 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setCurrentPage(1);
              }}
              aria-label="Sắp xếp sản phẩm"
              className="h-8 pl-8 pr-7 rounded-full bg-white border border-zinc-200/80 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="DEFAULT">Sắp xếp: Mặc định</option>
              <option value="PRICE_ASC">Giá: Thấp đến Cao</option>
              <option value="PRICE_DESC">Giá: Cao đến Thấp</option>
              <option value="STOCK_DESC">Tồn kho: Nhiều nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty Search / Filter State (UC-19 3a) */}
      {paginatedProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200/70 p-12 text-center space-y-3">
          <p className="text-sm font-semibold text-zinc-900">
            Không tìm thấy sản phẩm phù hợp
          </p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn một danh mục sản phẩm khác.
          </p>
          <div className="pt-1">
            <button
              onClick={handleClearFilters}
              className="h-8 px-4 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs font-medium text-zinc-800 transition-colors"
            >
              Hiển thị toàn bộ sản phẩm
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 4-Column Product Grid Matching Figma Mockup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {paginatedProducts.map((product) => {
              const category = categories.find((c) => c.id === product.categoryId);
              const isLiked = wishlistProductIds.includes(product.id);
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="bg-white rounded-2xl border border-zinc-200/70 overflow-hidden flex flex-col justify-between transition-all hover:border-zinc-300 cursor-pointer group"
                >
                  <div>
                    {/* Placeholder Thumbnail */}
                    <div className="relative aspect-[5/4] bg-[#f1f5f9] overflow-hidden">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                      <button
                        onClick={(e) => handleToggleWish(e, product.id)}
                        className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                          isLiked
                            ? 'bg-rose-50 text-rose-500'
                            : 'bg-white text-zinc-700 hover:bg-zinc-50'
                        }`}
                        aria-label="Yêu thích"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Card Content */}
                    <div className="px-4 pt-3.5 pb-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>{category?.name || 'Danh mục 02'}</span>
                        <span className={isOutOfStock ? 'text-rose-500 font-medium' : ''}>
                          {isOutOfStock ? 'Hết hàng' : `Tồn: ${product.stock}`}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-zinc-900 pt-0.5 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom Price + Add Button */}
                  <div className="px-4 pb-4 pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-zinc-900 block leading-tight">
                        {formatVND(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-[11px] text-zinc-400 line-through block mt-0.5">
                          {formatVND(product.originalPrice)}
                        </span>
                      )}
                    </div>

                    <button
                      disabled={isOutOfStock}
                      onClick={(e) => handleQuickAdd(e, product.id)}
                      className={`inline-flex items-center gap-1 h-8 px-3.5 rounded-full text-xs font-medium transition-colors ${
                        isOutOfStock
                          ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                          : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isOutOfStock ? 'Hết hàng' : 'Thêm'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Bar (UC-17) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white border border-zinc-200/80 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
