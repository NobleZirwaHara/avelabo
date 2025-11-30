import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';

export default function ContactMessagesIndex({ messages, filters = {}, statusCounts = {} }) {
    const [status, setStatus] = useState(filters.status || '');
    const [selectedMessages, setSelectedMessages] = useState([]);

    const handleFilter = (newStatus) => {
        setStatus(newStatus);
        router.get(route('admin.contact-messages.index'), { status: newStatus }, { preserveState: true });
    };

    const statusColors = {
        new: 'bg-blue-100 text-blue-700',
        read: 'bg-gray-100 text-gray-700',
        replied: 'bg-green-100 text-green-700',
        archived: 'bg-yellow-100 text-yellow-700',
    };

    const statusTabs = [
        { value: '', label: 'All', count: statusCounts.all || 0 },
        { value: 'new', label: 'New', count: statusCounts.new || 0 },
        { value: 'read', label: 'Read', count: statusCounts.read || 0 },
        { value: 'replied', label: 'Replied', count: statusCounts.replied || 0 },
        { value: 'archived', label: 'Archived', count: statusCounts.archived || 0 },
    ];

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedMessages(messages.data.map(m => m.id));
        } else {
            setSelectedMessages([]);
        }
    };

    const handleSelect = (id) => {
        setSelectedMessages(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkAction = (action) => {
        if (selectedMessages.length === 0) {
            alert('Please select at least one message');
            return;
        }

        router.post(route('admin.contact-messages.bulk-action'), {
            action,
            ids: selectedMessages,
        }, {
            preserveState: true,
            onSuccess: () => setSelectedMessages([]),
        });
    };

    const handleDelete = (message) => {
        if (confirm('Are you sure you want to delete this message?')) {
            router.delete(route('admin.contact-messages.destroy', message.id));
        }
    };

    return (
        <AdminLayout>
            <Head title="Contact Messages" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Messages</h2>
                    <p className="text-gray-500 text-sm">View and manage contact form submissions</p>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-2 mb-6">
                <div className="flex flex-wrap gap-2">
                    {statusTabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => handleFilter(tab.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                status === tab.value
                                    ? 'bg-brand text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                    status === tab.value ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedMessages.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 flex items-center justify-between">
                    <span className="text-blue-800 dark:text-blue-200">
                        {selectedMessages.length} message(s) selected
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleBulkAction('mark_read')}
                            className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
                        >
                            Mark as Read
                        </button>
                        <button
                            onClick={() => handleBulkAction('archive')}
                            className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
                        >
                            Archive
                        </button>
                        <button
                            onClick={() => handleBulkAction('delete')}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            )}

            {/* Messages Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {messages?.data?.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedMessages.length === messages.data.length}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            From
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Subject
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Received
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {messages.data.map((message) => (
                                        <tr
                                            key={message.id}
                                            className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                                                message.status === 'new' ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                            }`}
                                        >
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMessages.includes(message.id)}
                                                    onChange={() => handleSelect(message.id)}
                                                    className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <p className={`text-gray-900 dark:text-white ${message.status === 'new' ? 'font-semibold' : ''}`}>
                                                        {message.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{message.email}</p>
                                                    {message.phone && (
                                                        <p className="text-xs text-gray-400">{message.phone}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className={`text-gray-900 dark:text-white ${message.status === 'new' ? 'font-semibold' : ''}`}>
                                                    {message.subject}
                                                </p>
                                                <p className="text-sm text-gray-500 truncate max-w-xs">
                                                    {message.message.substring(0, 80)}...
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[message.status] || 'bg-gray-100 text-gray-700'}`}>
                                                    {message.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(message.created_at).toLocaleDateString()}
                                                <br />
                                                <span className="text-xs">{new Date(message.created_at).toLocaleTimeString()}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={route('admin.contact-messages.show', message.id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-brand hover:bg-brand/10 rounded-lg transition-colors"
                                                    >
                                                        <span className="material-icons text-lg">visibility</span>
                                                        View
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(message)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <span className="material-icons text-lg">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {messages.last_page > 1 && (
                            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-500">
                                        Showing {messages.from} to {messages.to} of {messages.total} messages
                                    </p>
                                    <div className="flex gap-2">
                                        {messages.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`px-3 py-1 rounded text-sm ${
                                                    link.active
                                                        ? 'bg-brand text-white'
                                                        : link.url
                                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-12 text-center">
                        <span className="material-icons text-5xl text-gray-300 mb-4">mail</span>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No messages</h3>
                        <p className="text-gray-500">
                            {status ? `No ${status} messages at the moment.` : 'No contact messages yet.'}
                        </p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
