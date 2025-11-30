import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';

export default function Edit({ product, categories, brands, sellers, attributes }) {
    const [imagePreview, setImagePreview] = useState([]);
    const [existingImages, setExistingImages] = useState(product.images || []);

    const { data, setData, put, processing, errors } = useForm({
        seller_id: product.seller_id || '',
        name: product.name || '',
        category_id: product.category_id || '',
        brand_id: product.brand_id || '',
        description: product.description || '',
        short_description: product.short_description || '',
        base_price: product.base_price || '',
        compare_at_price: product.compare_at_price || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        stock_quantity: product.stock_quantity || 0,
        low_stock_threshold: product.low_stock_threshold || 5,
        track_inventory: product.track_inventory ?? true,
        allow_backorders: product.allow_backorders ?? false,
        weight: product.weight || '',
        length: product.length || '',
        width: product.width || '',
        height: product.height || '',
        status: product.status || 'draft',
        is_featured: product.is_featured ?? false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.products.update', product.id));
    };

    // Flatten categories for select
    const flattenCategories = (cats, prefix = '') => {
        let result = [];
        cats?.forEach(cat => {
            result.push({ id: cat.id, name: prefix + cat.name });
            if (cat.children?.length > 0) {
                result = result.concat(flattenCategories(cat.children, prefix + '— '));
            }
        });
        return result;
    };

    const flatCategories = flattenCategories(categories);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    return (
        <AdminLayout>
            <Head title={`Edit: ${product.name}`} />

            <div className="max-w-5xl mx-auto">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-heading dark:text-white">Edit Product</h2>
                        <p className="text-body">{product.name}</p>
                    </div>
                    <Link
                        href={route('admin.products.index')}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-heading rounded-lg font-medium text-sm transition-colors inline-flex items-center gap-2"
                    >
                        <span className="material-icons text-lg">arrow_back</span>
                        Back to Products
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-6">
                        <h3 className="text-lg font-semibold text-heading dark:text-white mb-4">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Seller */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                    Seller <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.seller_id}
                                    onChange={(e) => setData('seller_id', e.target.value)}
                                    className={`w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand ${errors.seller_id ? 'ring-2 ring-red-500' : ''}`}
                                >
                                    <option value="">Select Seller</option>
                                    {sellers?.map((seller) => (
                                        <option key={seller.id} value={seller.id}>{seller.shop_name}</option>
                                    ))}
                                </select>
                                {errors.seller_id && <p className="mt-1 text-sm text-red-500">{errors.seller_id}</p>}
                            </div>

                            {/* Name */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                    Product Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={`w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand ${errors.name ? 'ring-2 ring-red-500' : ''}`}
                                    placeholder="Enter product name"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', e.target.value)}
                                    className={`w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand ${errors.category_id ? 'ring-2 ring-red-500' : ''}`}
                                >
                                    <option value="">Select Category</option>
                                    {flatCategories.map((category) => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                    ))}
                                </select>
                                {errors.category_id && <p className="mt-1 text-sm text-red-500">{errors.category_id}</p>}
                            </div>

                            {/* Brand */}
                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                    Brand
                                </label>
                                <select
                                    value={data.brand_id}
                                    onChange={(e) => setData('brand_id', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                >
                                    <option value="">Select Brand</option>
                                    {brands?.map((brand) => (
                                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Short Description */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                    Short Description
                                </label>
                                <textarea
                                    value={data.short_description}
                                    onChange={(e) => setData('short_description', e.target.value)}
                                    rows="2"
                                    maxLength="500"
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                    placeholder="Brief product description"
                                />
                                <p className="text-xs text-body mt-1">{data.short_description?.length || 0}/500</p>
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                    Full Description
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows="5"
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                    placeholder="Detailed product description"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-6">
                        <h3 className="text-lg font-semibold text-heading dark:text-white mb-4">Pricing</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                    Base Price (MWK) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.base_price}
                                    onChange={(e) => setData('base_price', e.target.value)}
                                    className={`w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand ${errors.base_price ? 'ring-2 ring-red-500' : ''}`}
                                />
                                {errors.base_price && <p className="mt-1 text-sm text-red-500">{errors.base_price}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                    Compare at Price (MWK)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.compare_at_price}
                                    onChange={(e) => setData('compare_at_price', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Inventory */}
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-6">
                        <h3 className="text-lg font-semibold text-heading dark:text-white mb-4">Inventory</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">SKU</label>
                                <input
                                    type="text"
                                    value={data.sku}
                                    onChange={(e) => setData('sku', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">Barcode</label>
                                <input
                                    type="text"
                                    value={data.barcode}
                                    onChange={(e) => setData('barcode', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                    Stock Quantity <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.stock_quantity}
                                    onChange={(e) => setData('stock_quantity', parseInt(e.target.value) || 0)}
                                    className={`w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand ${errors.stock_quantity ? 'ring-2 ring-red-500' : ''}`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">Low Stock Threshold</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.low_stock_threshold}
                                    onChange={(e) => setData('low_stock_threshold', parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="track_inventory"
                                    checked={data.track_inventory}
                                    onChange={(e) => setData('track_inventory', e.target.checked)}
                                    className="w-4 h-4 text-brand bg-gray-100 border-gray-300 rounded focus:ring-brand"
                                />
                                <label htmlFor="track_inventory" className="text-sm text-heading dark:text-white">Track inventory</label>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="allow_backorders"
                                    checked={data.allow_backorders}
                                    onChange={(e) => setData('allow_backorders', e.target.checked)}
                                    className="w-4 h-4 text-brand bg-gray-100 border-gray-300 rounded focus:ring-brand"
                                />
                                <label htmlFor="allow_backorders" className="text-sm text-heading dark:text-white">Allow backorders</label>
                            </div>
                        </div>
                    </div>

                    {/* Shipping */}
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-6">
                        <h3 className="text-lg font-semibold text-heading dark:text-white mb-4">Shipping</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">Weight (kg)</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={data.weight}
                                    onChange={(e) => setData('weight', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">Length (cm)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.length}
                                    onChange={(e) => setData('length', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">Width (cm)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.width}
                                    onChange={(e) => setData('width', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">Height (cm)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.height}
                                    onChange={(e) => setData('height', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-6">
                            <h3 className="text-lg font-semibold text-heading dark:text-white mb-4">Current Images</h3>
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                                {existingImages.map((image, index) => (
                                    <div key={image.id} className="relative group">
                                        <img
                                            src={`/storage/${image.path}`}
                                            alt={image.alt_text || product.name}
                                            className="w-full aspect-square object-cover rounded-lg"
                                        />
                                        {image.is_primary && (
                                            <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-brand text-white text-xs rounded">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Status & Visibility */}
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-6">
                        <h3 className="text-lg font-semibold text-heading dark:text-white mb-4">Status & Visibility</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 pt-8">
                                <input
                                    type="checkbox"
                                    id="is_featured"
                                    checked={data.is_featured}
                                    onChange={(e) => setData('is_featured', e.target.checked)}
                                    className="w-4 h-4 text-brand bg-gray-100 border-gray-300 rounded focus:ring-brand"
                                />
                                <label htmlFor="is_featured" className="text-sm text-heading dark:text-white">
                                    Featured product
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-4">
                        <Link
                            href={route('admin.products.index')}
                            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-heading rounded-lg font-medium text-sm transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            {processing && <span className="material-icons animate-spin text-lg">sync</span>}
                            Update Product
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
