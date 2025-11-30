import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';

export default function Edit({ category, parentCategories }) {
    const [imagePreview, setImagePreview] = useState(
        category.image ? `/storage/${category.image}` : null
    );

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        name: category.name || '',
        parent_id: category.parent_id || '',
        description: category.description || '',
        image: null,
        icon: category.icon || '',
        sort_order: category.sort_order || 0,
        is_active: category.is_active ?? true,
        is_featured: category.is_featured ?? false,
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('image', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setData('image', null);
        setImagePreview(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.categories.update', category.id), {
            forceFormData: true,
        });
    };

    return (
        <AdminLayout>
            <Head title={`Edit: ${category.name}`} />

            <div className="max-w-3xl mx-auto">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-heading dark:text-white">Edit Category</h2>
                        <p className="text-body">{category.name}</p>
                    </div>
                    <Link
                        href={route('admin.categories.index')}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-heading rounded-lg font-medium text-sm transition-colors inline-flex items-center gap-2"
                    >
                        <span className="material-icons text-lg">arrow_back</span>
                        Back
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-6">
                        <h3 className="text-lg font-semibold text-heading dark:text-white mb-4">Category Details</h3>
                        <div className="space-y-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                    Category Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={`w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand ${errors.name ? 'ring-2 ring-red-500' : ''}`}
                                    placeholder="Enter category name"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                            </div>

                            {/* Parent Category */}
                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                    Parent Category
                                </label>
                                <select
                                    value={data.parent_id}
                                    onChange={(e) => setData('parent_id', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                >
                                    <option value="">None (Root Category)</option>
                                    {parentCategories?.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows="3"
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                    placeholder="Brief description of the category"
                                />
                            </div>

                            {/* Icon */}
                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                    Icon Class
                                </label>
                                <input
                                    type="text"
                                    value={data.icon}
                                    onChange={(e) => setData('icon', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                    placeholder="e.g., fi-rs-shopping-cart"
                                />
                            </div>

                            {/* Sort Order */}
                            <div>
                                <label className="block text-sm font-medium text-heading dark:text-white mb-2">
                                    Sort Order
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.sort_order}
                                    onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-body border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Image */}
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-6">
                        <h3 className="text-lg font-semibold text-heading dark:text-white mb-4">Category Image</h3>
                        {!imagePreview ? (
                            <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-lg p-6">
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    id="image"
                                />
                                <label
                                    htmlFor="image"
                                    className="flex flex-col items-center justify-center cursor-pointer"
                                >
                                    <span className="material-icons text-5xl text-gray-400 mb-3">cloud_upload</span>
                                    <p className="text-sm text-body mb-1">Click to upload</p>
                                    <p className="text-xs text-body">PNG, JPG, WEBP up to 2MB</p>
                                </label>
                            </div>
                        ) : (
                            <div className="relative inline-block">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-40 h-40 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600"
                                >
                                    <span className="material-icons text-sm">close</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-card p-6">
                        <h3 className="text-lg font-semibold text-heading dark:text-white mb-4">Status</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="w-4 h-4 text-brand bg-gray-100 border-gray-300 rounded focus:ring-brand"
                                />
                                <label htmlFor="is_active" className="text-sm text-heading dark:text-white">
                                    Active (visible on the website)
                                </label>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_featured"
                                    checked={data.is_featured}
                                    onChange={(e) => setData('is_featured', e.target.checked)}
                                    className="w-4 h-4 text-brand bg-gray-100 border-gray-300 rounded focus:ring-brand"
                                />
                                <label htmlFor="is_featured" className="text-sm text-heading dark:text-white">
                                    Featured (show on homepage)
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-4">
                        <Link
                            href={route('admin.categories.index')}
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
                            Update Category
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
