import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState, useEffect } from 'react';

export default function PagesEdit({ page }) {
    const { data, setData, put, processing, errors } = useForm({
        page_slug: page.page_slug || '',
        title: page.title || '',
        meta_title: page.meta_title || '',
        meta_description: page.meta_description || '',
        content: page.content || { sections: [] },
        is_active: page.is_active ?? true,
    });

    const [jsonMode, setJsonMode] = useState(false);
    const [jsonContent, setJsonContent] = useState(JSON.stringify(data.content, null, 2));

    useEffect(() => {
        setJsonContent(JSON.stringify(data.content, null, 2));
    }, [data.content]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (jsonMode) {
            try {
                const parsed = JSON.parse(jsonContent);
                put(route('admin.pages.update', page.id), {
                    data: { ...data, content: parsed }
                });
            } catch (err) {
                alert('Invalid JSON format');
                return;
            }
        } else {
            put(route('admin.pages.update', page.id));
        }
    };

    const addSection = () => {
        const newSections = [...(data.content.sections || []), { title: '', content: '', items: [] }];
        setData('content', { ...data.content, sections: newSections });
    };

    const removeSection = (index) => {
        const newSections = (data.content.sections || []).filter((_, i) => i !== index);
        setData('content', { ...data.content, sections: newSections });
    };

    const updateSection = (index, field, value) => {
        const newSections = [...(data.content.sections || [])];
        newSections[index] = { ...newSections[index], [field]: value };
        setData('content', { ...data.content, sections: newSections });
    };

    const addItem = (sectionIndex) => {
        const newSections = [...(data.content.sections || [])];
        newSections[sectionIndex].items = [...(newSections[sectionIndex].items || []), ''];
        setData('content', { ...data.content, sections: newSections });
    };

    const removeItem = (sectionIndex, itemIndex) => {
        const newSections = [...(data.content.sections || [])];
        newSections[sectionIndex].items = newSections[sectionIndex].items.filter((_, i) => i !== itemIndex);
        setData('content', { ...data.content, sections: newSections });
    };

    const updateItem = (sectionIndex, itemIndex, value) => {
        const newSections = [...(data.content.sections || [])];
        newSections[sectionIndex].items[itemIndex] = value;
        setData('content', { ...data.content, sections: newSections });
    };

    // Handle other content fields (like hero, features for vendor-guide)
    const updateContentField = (field, value) => {
        setData('content', { ...data.content, [field]: value });
    };

    return (
        <AdminLayout>
            <Head title={`Edit: ${page.title}`} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Page</h2>
                    <p className="text-gray-500 text-sm">Editing: {page.title}</p>
                </div>
                <Link
                    href={route('admin.pages.index')}
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                    <span className="material-icons">arrow_back</span>
                    Back to Pages
                </Link>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Page Information</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Page Slug *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.page_slug}
                                        onChange={(e) => setData('page_slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                        placeholder="e.g., vendor-guide, privacy-policy"
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-brand"
                                    />
                                    {errors.page_slug && <p className="text-red-500 text-sm mt-1">{errors.page_slug}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Page Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="Enter page title"
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-brand"
                                    />
                                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Meta Title
                                    </label>
                                    <input
                                        type="text"
                                        value={data.meta_title}
                                        onChange={(e) => setData('meta_title', e.target.value)}
                                        placeholder="SEO title (optional)"
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-brand"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Meta Description
                                    </label>
                                    <textarea
                                        value={data.meta_description}
                                        onChange={(e) => setData('meta_description', e.target.value)}
                                        placeholder="SEO description (optional)"
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-brand resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Page Content</h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!jsonMode) {
                                            setJsonContent(JSON.stringify(data.content, null, 2));
                                        } else {
                                            try {
                                                setData('content', JSON.parse(jsonContent));
                                            } catch (err) {
                                                alert('Invalid JSON format');
                                                return;
                                            }
                                        }
                                        setJsonMode(!jsonMode);
                                    }}
                                    className="text-sm text-brand hover:underline"
                                >
                                    {jsonMode ? 'Visual Editor' : 'JSON Editor'}
                                </button>
                            </div>

                            {jsonMode ? (
                                <div>
                                    <textarea
                                        value={jsonContent}
                                        onChange={(e) => setJsonContent(e.target.value)}
                                        rows="20"
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:border-brand"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Hero Section (for vendor-guide) */}
                                    {data.content.hero !== undefined && (
                                        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Hero Section</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Hero Title
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.content.hero?.title || ''}
                                                        onChange={(e) => updateContentField('hero', { ...data.content.hero, title: e.target.value })}
                                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-brand"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Hero Subtitle
                                                    </label>
                                                    <textarea
                                                        value={data.content.hero?.subtitle || ''}
                                                        onChange={(e) => updateContentField('hero', { ...data.content.hero, subtitle: e.target.value })}
                                                        rows="2"
                                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-brand resize-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Last Updated (for privacy-policy) */}
                                    {data.content.last_updated !== undefined && (
                                        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Last Updated</h4>
                                            <input
                                                type="text"
                                                value={data.content.last_updated || ''}
                                                onChange={(e) => updateContentField('last_updated', e.target.value)}
                                                placeholder="e.g., November 30, 2025"
                                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-brand"
                                            />
                                        </div>
                                    )}

                                    {/* Sections */}
                                    {(data.content.sections || []).map((section, sectionIndex) => (
                                        <div key={sectionIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-medium text-gray-900 dark:text-white">Section {sectionIndex + 1}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSection(sectionIndex)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <span className="material-icons text-lg">delete</span>
                                                </button>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Section Title
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={section.title}
                                                        onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-brand"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Content
                                                    </label>
                                                    <textarea
                                                        value={section.content}
                                                        onChange={(e) => updateSection(sectionIndex, 'content', e.target.value)}
                                                        rows="3"
                                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-brand resize-none"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        List Items (optional)
                                                    </label>
                                                    {(section.items || []).map((item, itemIndex) => (
                                                        <div key={itemIndex} className="flex gap-2 mb-2">
                                                            <input
                                                                type="text"
                                                                value={item}
                                                                onChange={(e) => updateItem(sectionIndex, itemIndex, e.target.value)}
                                                                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-brand"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItem(sectionIndex, itemIndex)}
                                                                className="text-red-500 hover:text-red-700 px-2"
                                                            >
                                                                <span className="material-icons text-lg">close</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => addItem(sectionIndex)}
                                                        className="text-sm text-brand hover:underline"
                                                    >
                                                        + Add Item
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addSection}
                                        className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:border-brand hover:text-brand transition-colors"
                                    >
                                        + Add Section
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Publish */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Publish</h3>

                            <div className="space-y-4">
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">Active</span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Page Info</h3>
                            <dl className="space-y-3 text-sm">
                                <div>
                                    <dt className="text-gray-500">Created</dt>
                                    <dd className="text-gray-900 dark:text-white">{new Date(page.created_at).toLocaleString()}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Last Updated</dt>
                                    <dd className="text-gray-900 dark:text-white">{new Date(page.updated_at).toLocaleString()}</dd>
                                </div>
                            </dl>
                        </div>

                        {/* Help */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Tips</h3>
                            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                                <li>• Use JSON editor for advanced content structures</li>
                                <li>• Sections support titles, content, and list items</li>
                                <li>• Changes are saved immediately when you click Save</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
