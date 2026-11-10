import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Package,
  FolderTree,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Category, Product } from '../../types/domain';
import { formatVND } from '../../utils/formatters';

type CatalogTab = 'PRODUCTS' | 'CATEGORIES';

export const CatalogManagementPage: React.FC = () => {
  const {
    products,
    categories,
    orders,
    createProduct,
    updateProduct,
    toggleProductVisibility,
    deleteProduct,
    createCategory,
    updateCategory,
    toggleCategoryVisibility,
    deleteCategory,
  } = useApp();

  const [activeTab, setActiveTab] = useState<CatalogTab>('PRODUCTS');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prdCode, setPrdCode] = useState('');
  const [prdName, setPrdName] = useState('');
  const [prdCategoryId, setPrdCategoryId] = useState('');
  const [prdPrice, setPrdPrice] = useState('');
  const [prdOriginalPrice, setPrdOriginalPrice] = useState('');
  const [prdInitialStock, setPrdInitialStock] = useState('10');
  const [prdMinThreshold, setPrdMinThreshold] = useState('5');
  const [prdDescription, setPrdDescription] = useState('');

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');

  const activeCategories = useMemo(
    () => categories.filter((c) => !c.isDeleted),
    [categories]
  );

  const activeProducts = useMemo(
    () => products.filter((p) => !p.isDeleted),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return activeProducts.filter((p) => {
      if (categoryFilter !== 'ALL' && p.categoryId !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeProducts, categoryFilter, searchQuery]);

  const filteredCategories = useMemo(() => {
    return activeCategories.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    });
  }, [activeCategories, searchQuery]);

  const getCategoryName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name || 'Chưa phân loại';

  const openCreateProduct = () => {
    setEditingProduct(null);
    const nextNum = String(products.length + 1).padStart(2, '0');
    setPrdCode(`SKU-${nextNum}`);
    setPrdName('');
    setPrdCategoryId(activeCategories[0]?.id || '');
    setPrdPrice('1500000');
    setPrdOriginalPrice('1800000');
    setPrdInitialStock('15');
    setPrdMinThreshold('5');
    setPrdDescription('');
    setShowProductModal(true);
  };

  const openEditProduct = (prd: Product) => {
    setEditingProduct(prd);
    setPrdCode(prd.code);
    setPrdName(prd.name);
    setPrdCategoryId(prd.categoryId);
    setPrdPrice(String(prd.price));
    setPrdOriginalPrice(prd.originalPrice ? String(prd.originalPrice) : '');
    setPrdDescription(prd.description);
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(prdPrice);
    const origNum = prdOriginalPrice ? Number(prdOriginalPrice) : undefined;

    const res = editingProduct
      ? updateProduct(editingProduct.id, {
          name: prdName,
          categoryId: prdCategoryId,
          price: priceNum,
          originalPrice: origNum,
          description: prdDescription,
        })
      : createProduct({
          code: prdCode,
          name: prdName,
          categoryId: prdCategoryId,
          price: priceNum,
          originalPrice: origNum,
          description: prdDescription,
          initialStock: Number(prdInitialStock),
          minStockThreshold: Number(prdMinThreshold),
        });

    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setShowProductModal(false);
    }
  };

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDescription('');
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDescription(cat.description);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const res = editingCategory
      ? updateCategory(editingCategory.id, {
          name: catName,
          description: catDescription,
        })
      : createCategory({
          name: catName,
          description: catDescription,
        });

    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setShowCategoryModal(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
            Sản phẩm & Danh mục
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Quản lý danh mục hàng hóa, thông tin giá bán và trạng thái hiển thị trên cửa hàng
          </p>
        </div>

        <button
          type="button"
          onClick={
            activeTab === 'PRODUCTS' ? openCreateProduct : openCreateCategory
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>
            {activeTab === 'PRODUCTS' ? 'Thêm sản phẩm' : 'Thêm danh mục'}
          </span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
            feedback.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mode Switch & Filters */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#f4f4f5] p-1 rounded-full">
          <button
            type="button"
            onClick={() => setActiveTab('PRODUCTS')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'PRODUCTS'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Sản phẩm ({activeProducts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CATEGORIES')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'CATEGORIES'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Danh mục ({activeCategories.length})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end">
          {activeTab === 'PRODUCTS' && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 rounded-full bg-[#f4f4f5] text-xs font-medium text-zinc-700 focus:outline-none"
            >
              <option value="ALL">Tất cả danh mục</option>
              {activeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'PRODUCTS'
                  ? 'Tìm theo tên hoặc mã SKU...'
                  : 'Tìm kiếm danh mục...'
              }
              className="w-full h-9 pl-9 pr-3.5 rounded-full bg-[#f4f4f5] text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white border border-transparent focus:border-zinc-300"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: PRODUCTS TABLE */}
      {activeTab === 'PRODUCTS' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider bg-[#f8f9fa]/60">
                  <th className="py-3 px-4">Sản phẩm</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4">Giá bán</th>
                  <th className="py-3 px-4">Tồn kho</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {filteredProducts.map((product) => {
                  const inOrders = orders.some((o) =>
                    o.items.some((i) => i.productId === product.id)
                  );

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-zinc-50/70 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded-xl object-cover bg-zinc-100 border border-zinc-200/60 shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-zinc-900">
                              {product.name}
                            </div>
                            <div className="text-[11px] font-mono text-zinc-400">
                              {product.code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-600">
                        {getCategoryName(product.categoryId)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900">
                          {formatVND(product.price)}
                        </div>
                        {product.originalPrice && (
                          <div className="text-[11px] text-zinc-400 line-through">
                            {formatVND(product.originalPrice)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            product.stock === 0
                              ? 'text-rose-600'
                              : product.stock <= product.minStockThreshold
                              ? 'text-amber-600'
                              : 'text-zinc-800'
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            product.isVisible
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {product.isVisible ? 'Đang bán' : 'Tạm ẩn'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const res = toggleProductVisibility(product.id);
                              setFeedback({ ok: res.ok, text: res.message });
                            }}
                            title={product.isVisible ? 'Tạm ẩn sản phẩm' : 'Mở bán lại'}
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                          >
                            {product.isVisible ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditProduct(product)}
                            title="Chỉnh sửa sản phẩm"
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const res = deleteProduct(product.id);
                              setFeedback({ ok: res.ok, text: res.message });
                            }}
                            title={
                              inOrders
                                ? 'Sản phẩm đã có đơn hàng — chỉ hỗ trợ tạm ẩn'
                                : 'Xóa sản phẩm'
                            }
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORIES GRID */}
      {activeTab === 'CATEGORIES' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => {
            const productCount = activeProducts.filter(
              (p) => p.categoryId === cat.id
            ).length;

            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-zinc-200/80 p-4 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] flex items-center justify-center text-xs font-bold text-zinc-700">
                      {cat.iconName}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        {productCount} sản phẩm
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      cat.isVisible
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {cat.isVisible ? 'Hiển thị' : 'Tạm ẩn'}
                  </span>
                </div>

                <p className="text-xs text-zinc-500 line-clamp-2">
                  {cat.description}
                </p>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const res = toggleCategoryVisibility(cat.id);
                      setFeedback({ ok: res.ok, text: res.message });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-[11px] font-medium text-zinc-700"
                  >
                    {cat.isVisible ? 'Tạm ẩn' : 'Hiển thị'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditCategory(cat)}
                    className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const res = deleteCategory(cat.id);
                      setFeedback({ ok: res.ok, text: res.message });
                    }}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white rounded-3xl border border-zinc-200/80 max-w-lg w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                {editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
              </h3>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Mã SKU *
                </label>
                <input
                  type="text"
                  disabled={Boolean(editingProduct)}
                  value={prdCode}
                  onChange={(e) => setPrdCode(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs disabled:opacity-60"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  value={prdName}
                  onChange={(e) => setPrdName(e.target.value)}
                  placeholder="Nhập tên sản phẩm..."
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Danh mục *
                </label>
                <select
                  value={prdCategoryId}
                  onChange={(e) => setPrdCategoryId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
                >
                  {activeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Giá bán (VNĐ) *
                </label>
                <input
                  type="number"
                  value={prdPrice}
                  onChange={(e) => setPrdPrice(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Giá niêm yết cũ
                </label>
                <input
                  type="number"
                  value={prdOriginalPrice}
                  onChange={(e) => setPrdOriginalPrice(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
                />
              </div>
            </div>

            {!editingProduct ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Tồn kho khởi tạo
                  </label>
                  <input
                    type="number"
                    value={prdInitialStock}
                    onChange={(e) => setPrdInitialStock(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Ngưỡng cảnh báo sắp hết
                  </label>
                  <input
                    type="number"
                    value={prdMinThreshold}
                    onChange={(e) => setPrdMinThreshold(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-500 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/60">
                Số lượng tồn kho hiện tại ({editingProduct.stock}) được quản lý tập trung tại phân hệ <strong>Kho hàng</strong> để đảm bảo đối soát lịch sử nhập/xuất.
              </p>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Mô tả ngắn
              </label>
              <textarea
                rows={3}
                value={prdDescription}
                onChange={(e) => setPrdDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 rounded-full border border-zinc-200 text-xs font-medium text-zinc-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold"
              >
                Lưu sản phẩm
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create / Edit Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCategory}
            className="bg-white rounded-3xl border border-zinc-200/80 max-w-md w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                {editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Tên danh mục *
              </label>
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="VD: Danh mục 09"
                className="w-full h-10 px-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Mô tả danh mục
              </label>
              <textarea
                rows={3}
                value={catDescription}
                onChange={(e) => setCatDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#f8f9fa] border border-zinc-200 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 rounded-full border border-zinc-200 text-xs font-medium text-zinc-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold"
              >
                Lưu danh mục
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
