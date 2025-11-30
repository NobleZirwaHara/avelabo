import { Head, Link, useForm, router } from '@inertiajs/react';
import SellerLayout from '@/Layouts/SellerLayout';
import { useState } from 'react';

export default function OrderShow({ order, availableStatuses }) {
    const [selectedItems, setSelectedItems] = useState([]);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    const { data, setData, patch, processing, reset } = useForm({
        item_id: null,
        status: '',
        tracking_number: '',
        tracking_carrier: '',
        comment: '',
    });

    const bulkForm = useForm({
        item_ids: [],
        status: '',
        tracking_number: '',
        tracking_carrier: '',
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-MW', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-MW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getItemStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
            processing: 'bg-blue-100 text-blue-700 border-blue-300',
            shipped: 'bg-purple-100 text-purple-700 border-purple-300',
            delivered: 'bg-green-100 text-green-700 border-green-300',
            cancelled: 'bg-red-100 text-red-700 border-red-300',
        };
        return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
    };

    const getAvailableStatusesForItem = (currentStatus) => {
        const transitions = {
            pending: ['processing', 'cancelled'],
            processing: ['shipped', 'cancelled'],
            shipped: ['delivered'],
            delivered: [],
            cancelled: [],
        };
        return transitions[currentStatus] || [];
    };

    const handleItemClick = (item) => {
        const availableTransitions = getAvailableStatusesForItem(item.status);
        if (availableTransitions.length > 0) {
            setCurrentItem(item);
            setData({
                item_id: item.id,
                status: '',
                tracking_number: '',
                tracking_carrier: '',
                comment: '',
            });
            setShowItemModal(true);
        }
    };

    const handleItemStatusUpdate = (e) => {
        e.preventDefault();
        patch(route('seller.orders.update-status', order.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowItemModal(false);
                setCurrentItem(null);
                reset();
            },
        });
    };

    const handleSelectItem = (itemId) => {
        setSelectedItems(prev => {
            if (prev.includes(itemId)) {
                return prev.filter(id => id !== itemId);
            }
            return [...prev, itemId];
        });
    };

    const handleSelectAll = () => {
        const selectableItems = order.items?.filter(item =>
            getAvailableStatusesForItem(item.status).length > 0
        ) || [];

        if (selectedItems.length === selectableItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(selectableItems.map(item => item.id));
        }
    };

    const handleBulkUpdate = (e) => {
        e.preventDefault();
        bulkForm.setData('item_ids', selectedItems);
        router.post(route('seller.orders.bulk-update-status', order.id), {
            item_ids: selectedItems,
            status: bulkForm.data.status,
            tracking_number: bulkForm.data.tracking_number,
            tracking_carrier: bulkForm.data.tracking_carrier,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowBulkModal(false);
                setSelectedItems([]);
                bulkForm.reset();
            },
        });
    };

    const selectableItems = order.items?.filter(item =>
        getAvailableStatusesForItem(item.status).length > 0
    ) || [];

    return (
        <SellerLayout title={`Order ${order.order_number}`}>
            <Head title={`Order ${order.order_number}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('seller.orders.index')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <span className="material-icons text-gray-500">arrow_back</span>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{order.order_number}</h2>
                        <p className="text-gray-500 text-sm">Placed on {formatDate(order.created_at)}</p>
                    </div>
                </div>
                <div className="font-bold text-brand text-xl">
                    Your Earnings: {formatCurrency(order.seller_total)}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Bulk Actions */}
                    {selectableItems.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.length === selectableItems.length && selectableItems.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-brand rounded border-gray-300 focus:ring-brand"
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Select All ({selectableItems.length})
                                    </span>
                                </label>
                                {selectedItems.length > 0 && (
                                    <span className="text-sm text-brand font-medium">
                                        {selectedItems.length} selected
                                    </span>
                                )}
                            </div>
                            {selectedItems.length > 0 && (
                                <button
                                    onClick={() => setShowBulkModal(true)}
                                    className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
                                >
                                    Bulk Update Status
                                </button>
                            )}
                        </div>
                    )}

                    {/* Order Items */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Items in This Order</h3>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {order.items?.map((item) => {
                                const canUpdate = getAvailableStatusesForItem(item.status).length > 0;
                                return (
                                    <div key={item.id} className="p-6">
                                        <div className="flex items-start gap-4">
                                            {/* Checkbox */}
                                            {canUpdate && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.includes(item.id)}
                                                    onChange={() => handleSelectItem(item.id)}
                                                    className="mt-2 w-4 h-4 text-brand rounded border-gray-300 focus:ring-brand"
                                                />
                                            )}

                                            {/* Product Image */}
                                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                                {item.product_image ? (
                                                    <img
                                                        src={`/storage/${item.product_image}`}
                                                        alt={item.product_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="material-icons text-gray-400 text-2xl">image</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between gap-4">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                                            {item.product_name}
                                                        </h4>
                                                        {item.variant_name && (
                                                            <p className="text-sm text-gray-500">{item.variant_name}</p>
                                                        )}
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            Qty: {item.quantity} × {formatCurrency(item.price)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-gray-900 dark:text-white">
                                                            {formatCurrency(item.line_total)}
                                                        </p>
                                                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium border ${getItemStatusColor(item.status)}`}>
                                                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Tracking Info */}
                                                {item.tracking_number && (
                                                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                                                        <span className="material-icons text-sm text-gray-500 mr-1 align-middle">local_shipping</span>
                                                        {item.tracking_carrier && <span className="text-gray-600 dark:text-gray-400">{item.tracking_carrier}: </span>}
                                                        <span className="text-gray-900 dark:text-white font-medium">{item.tracking_number}</span>
                                                    </div>
                                                )}

                                                {/* Update Button */}
                                                {canUpdate && (
                                                    <button
                                                        onClick={() => handleItemClick(item)}
                                                        className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-sm text-brand hover:bg-brand/10 rounded-lg transition-colors"
                                                    >
                                                        <span className="material-icons text-lg">edit</span>
                                                        Update Status
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Total */}
                        <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900 dark:text-white">Your Total Earnings</span>
                                <span className="font-bold text-xl text-brand">{formatCurrency(order.seller_total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Shipping Address */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ship To</h3>
                        {order.shipping_address ? (
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <p className="font-medium text-gray-900 dark:text-white">{order.shipping_address.name}</p>
                                <p>{order.shipping_address.address}</p>
                                {order.shipping_address.phone && (
                                    <p className="flex items-center gap-1 mt-2">
                                        <span className="material-icons text-sm">phone</span>
                                        {order.shipping_address.phone}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No shipping address provided</p>
                        )}
                    </div>

                    {/* Quick Status Guide */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Flow</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-sm font-medium">1</span>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Pending</p>
                                    <p className="text-xs text-gray-500">New order received</p>
                                </div>
                            </div>
                            <div className="ml-4 w-0.5 h-4 bg-gray-200 dark:bg-gray-700"></div>
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium">2</span>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Processing</p>
                                    <p className="text-xs text-gray-500">Preparing for shipment</p>
                                </div>
                            </div>
                            <div className="ml-4 w-0.5 h-4 bg-gray-200 dark:bg-gray-700"></div>
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-medium">3</span>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Shipped</p>
                                    <p className="text-xs text-gray-500">Add tracking number</p>
                                </div>
                            </div>
                            <div className="ml-4 w-0.5 h-4 bg-gray-200 dark:bg-gray-700"></div>
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-medium">4</span>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Delivered</p>
                                    <p className="text-xs text-gray-500">Customer received</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Single Item Update Modal */}
            {showItemModal && currentItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            Update Item Status
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {currentItem.product_name}
                        </p>
                        <form onSubmit={handleItemStatusUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    New Status
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand"
                                    required
                                >
                                    <option value="">Select status...</option>
                                    {getAvailableStatusesForItem(currentItem.status).map(status => (
                                        <option key={status} value={status}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {data.status === 'shipped' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Tracking Number
                                        </label>
                                        <input
                                            type="text"
                                            value={data.tracking_number}
                                            onChange={(e) => setData('tracking_number', e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand"
                                            placeholder="Enter tracking number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Carrier
                                        </label>
                                        <input
                                            type="text"
                                            value={data.tracking_carrier}
                                            onChange={(e) => setData('tracking_carrier', e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand"
                                            placeholder="e.g., DHL, FedEx"
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Comment (optional)
                                </label>
                                <textarea
                                    value={data.comment}
                                    onChange={(e) => setData('comment', e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand resize-none"
                                    rows={2}
                                    placeholder="Add a note..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowItemModal(false);
                                        setCurrentItem(null);
                                        reset();
                                    }}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !data.status}
                                    className="flex-1 px-4 py-2 bg-brand text-white hover:bg-brand-dark rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {processing ? 'Updating...' : 'Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Update Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            Bulk Update {selectedItems.length} Items
                        </h3>
                        <form onSubmit={handleBulkUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    New Status
                                </label>
                                <select
                                    value={bulkForm.data.status}
                                    onChange={(e) => bulkForm.setData('status', e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand"
                                    required
                                >
                                    <option value="">Select status...</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                </select>
                            </div>

                            {bulkForm.data.status === 'shipped' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Tracking Number (same for all)
                                        </label>
                                        <input
                                            type="text"
                                            value={bulkForm.data.tracking_number}
                                            onChange={(e) => bulkForm.setData('tracking_number', e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand"
                                            placeholder="Enter tracking number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Carrier
                                        </label>
                                        <input
                                            type="text"
                                            value={bulkForm.data.tracking_carrier}
                                            onChange={(e) => bulkForm.setData('tracking_carrier', e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand"
                                            placeholder="e.g., DHL, FedEx"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowBulkModal(false);
                                        bulkForm.reset();
                                    }}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={bulkForm.processing || !bulkForm.data.status}
                                    className="flex-1 px-4 py-2 bg-brand text-white hover:bg-brand-dark rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {bulkForm.processing ? 'Updating...' : 'Update All'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SellerLayout>
    );
}
