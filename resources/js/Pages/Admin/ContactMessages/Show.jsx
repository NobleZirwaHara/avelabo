import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function ContactMessagesShow({ message }) {
    const { data, setData, put, processing } = useForm({
        admin_notes: message.admin_notes || '',
        status: message.status || 'new',
    });

    const statusColors = {
        new: 'bg-blue-100 text-blue-700',
        read: 'bg-gray-100 text-gray-700',
        replied: 'bg-green-100 text-green-700',
        archived: 'bg-yellow-100 text-yellow-700',
    };

    const handleSaveNotes = (e) => {
        e.preventDefault();
        put(route('admin.contact-messages.update', message.id));
    };

    const handleMarkReplied = () => {
        router.put(route('admin.contact-messages.mark-replied', message.id));
    };

    const handleArchive = () => {
        router.put(route('admin.contact-messages.archive', message.id));
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this message?')) {
            router.delete(route('admin.contact-messages.destroy', message.id));
        }
    };

    return (
        <AdminLayout>
            <Head title={`Message: ${message.subject}`} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">View Message</h2>
                    <p className="text-gray-500 text-sm">From: {message.name}</p>
                </div>
                <Link
                    href={route('admin.contact-messages.index')}
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                    <span className="material-icons">arrow_back</span>
                    Back to Messages
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Message Details */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{message.subject}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[message.status] || 'bg-gray-100 text-gray-700'}`}>
                                {message.status}
                            </span>
                        </div>

                        {/* Sender Info */}
                        <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                            <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center">
                                <span className="material-icons text-brand">person</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">{message.name}</p>
                                <p className="text-sm text-gray-500">{message.email}</p>
                                {message.phone && (
                                    <p className="text-sm text-gray-500">{message.phone}</p>
                                )}
                            </div>
                            <div className="text-right text-sm text-gray-500">
                                <p>{new Date(message.created_at).toLocaleDateString()}</p>
                                <p>{new Date(message.created_at).toLocaleTimeString()}</p>
                            </div>
                        </div>

                        {/* Message Body */}
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {message.message}
                            </p>
                        </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Admin Notes</h3>
                        <form onSubmit={handleSaveNotes}>
                            <textarea
                                value={data.admin_notes}
                                onChange={(e) => setData('admin_notes', e.target.value)}
                                placeholder="Add internal notes about this message..."
                                rows="4"
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-brand resize-none mb-4"
                            />
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Save Notes'}
                            </button>
                        </form>
                    </div>

                    {/* Reply via Email */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Reply</h3>
                        <p className="text-gray-500 mb-4">
                            Reply to this message using your email client:
                        </p>
                        <a
                            href={`mailto:${message.email}?subject=Re: ${message.subject}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors"
                        >
                            <span className="material-icons">email</span>
                            Reply via Email
                        </a>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Actions */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
                        <div className="space-y-3">
                            {message.status !== 'replied' && (
                                <button
                                    onClick={handleMarkReplied}
                                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-icons text-lg">check_circle</span>
                                    Mark as Replied
                                </button>
                            )}

                            {message.status !== 'archived' && (
                                <button
                                    onClick={handleArchive}
                                    className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-icons text-lg">archive</span>
                                    Archive Message
                                </button>
                            )}

                            <button
                                onClick={handleDelete}
                                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-icons text-lg">delete</span>
                                Delete Message
                            </button>
                        </div>
                    </div>

                    {/* Message Info */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Message Info</h3>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-gray-500">Status</dt>
                                <dd className="text-gray-900 dark:text-white capitalize">{message.status}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Received</dt>
                                <dd className="text-gray-900 dark:text-white">{new Date(message.created_at).toLocaleString()}</dd>
                            </div>
                            {message.read_at && (
                                <div>
                                    <dt className="text-gray-500">Read At</dt>
                                    <dd className="text-gray-900 dark:text-white">{new Date(message.read_at).toLocaleString()}</dd>
                                </div>
                            )}
                            {message.replied_at && (
                                <div>
                                    <dt className="text-gray-500">Replied At</dt>
                                    <dd className="text-gray-900 dark:text-white">{new Date(message.replied_at).toLocaleString()}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">Contact Info</h3>
                        <div className="space-y-3">
                            <a
                                href={`mailto:${message.email}`}
                                className="flex items-center gap-3 text-blue-800 dark:text-blue-200 hover:underline"
                            >
                                <span className="material-icons text-lg">email</span>
                                {message.email}
                            </a>
                            {message.phone && (
                                <a
                                    href={`tel:${message.phone}`}
                                    className="flex items-center gap-3 text-blue-800 dark:text-blue-200 hover:underline"
                                >
                                    <span className="material-icons text-lg">phone</span>
                                    {message.phone}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
