import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowUpDown, FolderSearch, Heart, Plus, RotateCcw, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaginationBar } from '../../components/common/PaginationBar';
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
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const pageSize = 8;

  // UC-12: Tìm kiếm danh mục sản phẩm (chỉ hiển thị danh mục đang bật & chưa xóa)
  const visibleCategories = useMemo(
    () => categories.filter((c) => c.isVisible && !c.isDeleted),
    [categories]
  );

  const matchedCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return visibleCategories;
    return visibleCategories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [visibleCategories, categorySearch]);

  const minPriceNum = minPrice.trim() !== '' ? Number(minPrice) : null;
  const maxPriceNum = maxPrice.trim() !== '' ? Number(maxPrice) : null;
  const priceRangeError =
    minPriceNum !== null &&
    maxPriceNum !== null &&
    !Number.isNaN(minPriceNum) &&
    !Number.isNaN(maxPriceNum) &&
    minPriceNum > maxPriceNum
      ? 'Giá tối thiểu không được lớn hơn giá tối đa.'
      : null;

  const filteredProducts = useMemo(() => {
    if (priceRangeError) return [];
    const list = products.filter((p) => {
      if (!p.isVisible || p.isDeleted) return false;
      if (selectedCategoryId !== 'ALL' && p.categoryId !== selectedCategoryId) {
        return false;
      }
      if (onlyInStock && p.stock <= 0) return false;
      if (minPriceNum !== null && !Number.isNaN(minPriceNum) && p.price < minPriceNum) {
        return false;
      }
      if (maxPriceNum !== null && !Number.isNaN(maxPriceNum) && p.price > maxPriceNum) {
        return false;
      }
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
  }, [
    products,
    selectedCategoryId,
    onlyInStock,
    minPriceNum,
    maxPriceNum,
    priceRangeError,
    searchQuery,
    sortBy,
  ]);

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
    setCategorySearch('');
    setOnlyInStock(false);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('DEFAULT');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedCategoryId !== 'ALL' ||
    Boolean(searchQuery.trim()) ||
    Boolean(categorySearch.trim()) ||
    onlyInStock ||
    Boolean(minPrice.trim()) ||
    Boolean(maxPrice.trim());

  return (
    <div className="space-y-6">
      {/* Subtle Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Heading + Minimal Filter/Sort Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-zinc-900 tracking-tight leading-tight">
              {currentUser ? `Xin chào, ${currentUser.fullName}` : 'Chào mừng đến với HCShop'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-zinc-500">
                {selectedCategory ? selectedCategory.name : 'Danh sách sản phẩm'}
              </p>
              {hasActiveFilters && (
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

          {/* Minimal Sort, Price Range (UC-17) & In-Stock Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 bg-white border border-zinc-200/80 rounded-full px-3 h-8 text-xs">
              <span className="text-zinc-400">Giá:</span>
              <input
                type="number"
                min={0}
                step={100000}
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Từ (đ)"
                aria-label="Giá từ"
                className="w-20 bg-transparent text-zinc-800 placeholder:text-zinc-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-zinc-300">–</span>
              <input
                type="number"
                min={0}
                step={100000}
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Đến (đ)"
                aria-label="Giá đến"
                className="w-20 bg-transparent text-zinc-800 placeholder:text-zinc-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

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

        {/* UC-12: Tìm kiếm & chọn nhanh Danh mục sản phẩm (GET /api/danh-muc/tim-kiem) */}
        <div className="bg-white rounded-2xl border border-zinc-200/70 p-3 flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="relative w-full sm:w-60 shrink-0">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              maxLength={100}
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Tìm danh mục sản phẩm..."
              aria-label="Tìm kiếm danh mục"
              className="w-full h-8 pl-8 pr-7 rounded-full bg-[#f4f4f5] text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:bg-white border border-transparent focus:border-zinc-300"
            />
            {categorySearch && (
              <button
                type="button"
                onClick={() => setCategorySearch('')}
                aria-label="Xóa từ khóa danh mục"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 flex-1">
            {!categorySearch.trim() && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryId('ALL');
                  setCurrentPage(1);
                }}
                className={`h-7 px-3 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategoryId === 'ALL'
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80'
                }`}
              >
                Tất cả danh mục
              </button>
            )}
            {matchedCategories.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 px-2">
                <FolderSearch className="w-3.5 h-3.5" />
                Không tìm thấy danh mục phù hợp với &ldquo;{categorySearch}&rdquo;
              </span>
            ) : (
              matchedCategories.map((cat) => {
                const count = products.filter(
                  (p) => p.categoryId === cat.id && p.isVisible && !p.isDeleted
                ).length;
                const active = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setCurrentPage(1);
                    }}
                    className={`h-7 px-3 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      active
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80'
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })
            )}
          </div>
        </div>

        {priceRangeError && (
          <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200/80 rounded-2xl px-4 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{priceRangeError}</span>
          </div>
        )}
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

          {/* Pagination Bar (UC-17, ISS-19) */}
          <PaginationBar
            currentPage={currentPage}
            totalItems={filteredProducts.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="sản phẩm"
          />
        </>
      )}
    </div>
  );
};
