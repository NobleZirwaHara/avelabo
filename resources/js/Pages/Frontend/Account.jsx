import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';

export default function Account({
    user = null,
    orders = [],
    addresses = [],
    billingAddress = null,
    shippingAddress = null,
    countries = [],
    flash = {},
}) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    // Form for account details (profile update)
    const profileForm = useForm({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        phone: user?.phone || '',
    });

    // Form for password update
    const passwordForm = useForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    // Form for order tracking
    const trackingForm = useForm({
        order_id: '',
        billing_email: '',
    });

    // Form for address management
    const addressForm = useForm({
        label: 'Home',
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        phone: '',
        address_line_1: '',
        address_line_2: '',
        city_name: '',
        region_name: '',
        country_id: '',
        postal_code: '',
        is_default: false,
        is_billing: false,
    });

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        profileForm.put(route('account.profile.update'), {
            preserveScroll: true,
        });
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        passwordForm.put(route('account.password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset();
            },
        });
    };

    const handleTrackingSubmit = (e) => {
        e.preventDefault();
        trackingForm.post(route('account.track-order'), {
            preserveScroll: true,
        });
    };

    const handleAddressSubmit = (e) => {
        e.preventDefault();
        if (editingAddress) {
            addressForm.put(route('account.addresses.update', editingAddress.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setShowAddressModal(false);
                    setEditingAddress(null);
                    addressForm.reset();
                },
            });
        } else {
            addressForm.post(route('account.addresses.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    setShowAddressModal(false);
                    addressForm.reset();
                },
            });
        }
    };

    const handleDeleteAddress = (addressId) => {
        if (confirm('Are you sure you want to delete this address?')) {
            router.delete(route('account.addresses.destroy', addressId), {
                preserveScroll: true,
            });
        }
    };

    const handleSetDefaultAddress = (addressId) => {
        router.post(route('account.addresses.default', addressId), {}, {
            preserveScroll: true,
        });
    };

    const openAddressModal = (address = null) => {
        if (address) {
            setEditingAddress(address);
            addressForm.setData({
                label: address.label || 'Home',
                first_name: address.first_name || '',
                last_name: address.last_name || '',
                phone: address.phone || '',
                address_line_1: address.address_line_1 || '',
                address_line_2: address.address_line_2 || '',
                city_name: address.city_name || '',
                region_name: address.region_name || '',
                country_id: address.country_id || '',
                postal_code: address.postal_code || '',
                is_default: address.is_default || false,
                is_billing: address.is_billing || false,
            });
        } else {
            setEditingAddress(null);
            addressForm.reset();
            addressForm.setData('first_name', user?.first_name || '');
            addressForm.setData('last_name', user?.last_name || '');
        }
        setShowAddressModal(true);
    };

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fi-rs-settings-sliders' },
        { id: 'orders', label: 'Orders', icon: 'fi-rs-shopping-bag' },
        { id: 'track-orders', label: 'Track Your Order', icon: 'fi-rs-shopping-cart' },
        { id: 'address', label: 'My Address', icon: 'fi-rs-marker' },
        { id: 'account-detail', label: 'Account Details', icon: 'fi-rs-user' },
    ];

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'processing':
                return 'bg-yellow-100 text-yellow-700';
            case 'completed':
            case 'delivered':
                return 'bg-green-100 text-green-700';
            case 'cancelled':
                return 'bg-red-100 text-red-700';
            case 'shipped':
                return 'bg-blue-100 text-blue-700';
            case 'pending':
                return 'bg-gray-100 text-gray-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const formatAddress = (address) => {
        if (!address) return null;
        const parts = [
            address.address_line_1,
            address.address_line_2,
            address.city_name,
            address.region_name,
            address.postal_code,
            address.country_name,
        ].filter(Boolean);
        return parts;
    };

    return (
        <FrontendLayout>
            <Head title="My Account" />

            {/* Breadcrumb */}
            <section className="bg-grey-9 py-4">
                <div className="max-w-container mx-auto px-4">
                    <nav className="flex items-center gap-2 text-sm">
                        <Link href="/" className="text-muted hover:text-brand transition-colors flex items-center gap-1">
                            <i className="fi-rs-home text-xs"></i> Home
                        </Link>
                        <span className="text-muted">/</span>
                        <span className="text-brand">My Account</span>
                    </nav>
                </div>
            </section>

            {/* Flash Messages */}
            {flash?.success && (
                <div className="max-w-container mx-auto px-4 pt-4">
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                        {flash.success}
                    </div>
                </div>
            )}

            {/* Account Content */}
            <section className="py-12 lg:py-20">
                <div className="max-w-container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Sidebar Menu */}
                            <aside className="w-full lg:w-64 flex-shrink-0">
                                <div className="bg-white border border-border rounded-xl overflow-hidden">
                                    <nav>
                                        <ul className="divide-y divide-border">
                                            {tabs.map((tab) => (
                                                <li key={tab.id}>
                                                    <button
                                                        onClick={() => setActiveTab(tab.id)}
                                                        className={`w-full flex items-center gap-3 px-5 py-4 text-left text-heading hover:text-brand hover:bg-grey-9 transition-colors font-semibold ${
                                                            activeTab === tab.id
                                                                ? 'text-brand bg-brand-light border-l-[3px] border-brand'
                                                                : ''
                                                        }`}
                                                    >
                                                        <i className={`${tab.icon} text-lg`}></i> {tab.label}
                                                    </button>
                                                </li>
                                            ))}
                                            <li>
                                                <Link
                                                    href={route('logout')}
                                                    method="post"
                                                    as="button"
                                                    className="w-full flex items-center gap-3 px-5 py-4 text-left text-heading hover:text-brand hover:bg-grey-9 transition-colors font-semibold"
                                                >
                                                    <i className="fi-rs-sign-out text-lg"></i> Logout
                                                </Link>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </aside>

                            {/* Tab Content */}
                            <div className="flex-1">
                                {/* Dashboard Tab */}
                                {activeTab === 'dashboard' && (
                                    <div className="bg-white border border-border rounded-xl overflow-hidden">
                                        <div className="border-b border-border px-6 py-4">
                                            <h3 className="font-quicksand font-bold text-xl text-heading">
                                                Hello {user?.first_name || user?.name || 'there'}!
                                            </h3>
                                        </div>
                                        <div className="p-6">
                                            <p className="text-body leading-7 mb-6">
                                                From your account dashboard you can easily check &amp; view your{' '}
                                                <button
                                                    onClick={() => setActiveTab('orders')}
                                                    className="text-brand hover:underline"
                                                >
                                                    recent orders
                                                </button>
                                                ,<br />
                                                manage your{' '}
                                                <button
                                                    onClick={() => setActiveTab('address')}
                                                    className="text-brand hover:underline"
                                                >
                                                    shipping and billing addresses
                                                </button>{' '}
                                                and{' '}
                                                <button
                                                    onClick={() => setActiveTab('account-detail')}
                                                    className="text-brand hover:underline"
                                                >
                                                    edit your password and account details.
                                                </button>
                                            </p>

                                            {/* Quick Stats */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-grey-9 rounded-lg p-4 text-center">
                                                    <div className="text-2xl font-bold text-brand">{orders.length}</div>
                                                    <div className="text-sm text-body">Total Orders</div>
                                                </div>
                                                <div className="bg-grey-9 rounded-lg p-4 text-center">
                                                    <div className="text-2xl font-bold text-brand">{addresses.length}</div>
                                                    <div className="text-sm text-body">Saved Addresses</div>
                                                </div>
                                                <div className="bg-grey-9 rounded-lg p-4 text-center">
                                                    <div className="text-2xl font-bold text-green-600">
                                                        {orders.filter(o => o.status?.toLowerCase() === 'delivered').length}
                                                    </div>
                                                    <div className="text-sm text-body">Delivered</div>
                                                </div>
                                                <div className="bg-grey-9 rounded-lg p-4 text-center">
                                                    <div className="text-2xl font-bold text-yellow-600">
                                                        {orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status?.toLowerCase())).length}
                                                    </div>
                                                    <div className="text-sm text-body">In Progress</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Orders Tab */}
                                {activeTab === 'orders' && (
                                    <div className="bg-white border border-border rounded-xl overflow-hidden">
                                        <div className="border-b border-border px-6 py-4">
                                            <h3 className="font-quicksand font-bold text-xl text-heading">Your Orders</h3>
                                        </div>
                                        <div className="p-6">
                                            {orders.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="border-b border-border">
                                                                <th className="text-left py-3 px-4 font-quicksand font-bold text-heading">Order</th>
                                                                <th className="text-left py-3 px-4 font-quicksand font-bold text-heading">Date</th>
                                                                <th className="text-left py-3 px-4 font-quicksand font-bold text-heading">Status</th>
                                                                <th className="text-left py-3 px-4 font-quicksand font-bold text-heading">Total</th>
                                                                <th className="text-left py-3 px-4 font-quicksand font-bold text-heading">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {orders.map((order, index) => (
                                                                <tr key={index} className={index < orders.length - 1 ? 'border-b border-border' : ''}>
                                                                    <td className="py-4 px-4 text-heading font-semibold">{order.id}</td>
                                                                    <td className="py-4 px-4">{order.date}</td>
                                                                    <td className="py-4 px-4">
                                                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(order.status)}`}>
                                                                            {order.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-4 px-4">{order.total} for {order.items} item{order.items !== 1 ? 's' : ''}</td>
                                                                    <td className="py-4 px-4">
                                                                        <Link
                                                                            href={route('customer.orders.show', order.id.replace('ORD-', ''))}
                                                                            className="inline-block px-4 py-2 bg-brand text-white text-xs font-semibold rounded-md hover:bg-brand-dark transition-colors"
                                                                        >
                                                                            View
                                                                        </Link>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <i className="fi-rs-shopping-bag text-5xl text-gray-300 mb-4 block"></i>
                                                    <p className="text-body mb-4">You haven't placed any orders yet.</p>
                                                    <Link
                                                        href={route('shop')}
                                                        className="inline-block px-6 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
                                                    >
                                                        Start Shopping
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Track Orders Tab */}
                                {activeTab === 'track-orders' && (
                                    <div className="bg-white border border-border rounded-xl overflow-hidden">
                                        <div className="border-b border-border px-6 py-4">
                                            <h3 className="font-quicksand font-bold text-xl text-heading">Orders Tracking</h3>
                                        </div>
                                        <div className="p-6">
                                            <p className="text-body mb-6">
                                                To track your order please enter your Order ID in the box below and press "Track" button. This was given to you on your receipt and in the confirmation email you should have received.
                                            </p>
                                            <form onSubmit={handleTrackingSubmit} className="max-w-lg space-y-5">
                                                <div>
                                                    <label htmlFor="order_id" className="block text-heading font-semibold mb-2">Order ID</label>
                                                    <input
                                                        type="text"
                                                        id="order_id"
                                                        name="order_id"
                                                        value={trackingForm.data.order_id}
                                                        onChange={(e) => trackingForm.setData('order_id', e.target.value)}
                                                        placeholder="e.g., ORD-ABC123"
                                                        className="w-full border border-border rounded-md px-4 py-3 focus:border-brand focus:outline-none"
                                                    />
                                                    {trackingForm.errors.order_id && (
                                                        <p className="text-red-500 text-sm mt-1">{trackingForm.errors.order_id}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label htmlFor="billing_email" className="block text-heading font-semibold mb-2">Billing Email</label>
                                                    <input
                                                        type="email"
                                                        id="billing_email"
                                                        name="billing_email"
                                                        value={trackingForm.data.billing_email}
                                                        onChange={(e) => trackingForm.setData('billing_email', e.target.value)}
                                                        placeholder="Email you used during checkout"
                                                        className="w-full border border-border rounded-md px-4 py-3 focus:border-brand focus:outline-none"
                                                    />
                                                    {trackingForm.errors.billing_email && (
                                                        <p className="text-red-500 text-sm mt-1">{trackingForm.errors.billing_email}</p>
                                                    )}
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={trackingForm.processing}
                                                    className="bg-brand hover:bg-brand-dark text-white font-bold px-8 py-3 rounded-md transition-colors disabled:opacity-50"
                                                >
                                                    {trackingForm.processing ? 'Tracking...' : 'Track'}
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                )}

                                {/* Address Tab */}
                                {activeTab === 'address' && (
                                    <div className="space-y-6">
                                        {/* Add New Address Button */}
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => openAddressModal()}
                                                className="bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-2 rounded-md transition-colors flex items-center gap-2"
                                            >
                                                <i className="fi-rs-plus"></i> Add New Address
                                            </button>
                                        </div>

                                        {addresses.length > 0 ? (
                                            <div className="grid md:grid-cols-2 gap-6">
                                                {addresses.map((address) => (
                                                    <div key={address.id} className="bg-white border border-border rounded-xl overflow-hidden">
                                                        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-quicksand font-bold text-lg text-heading">
                                                                    {address.label}
                                                                </h3>
                                                                {address.is_default && (
                                                                    <span className="bg-brand/10 text-brand text-xs px-2 py-1 rounded">Default</span>
                                                                )}
                                                                {address.is_billing && (
                                                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Billing</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="p-6">
                                                            <p className="text-heading font-semibold mb-2">{address.full_name}</p>
                                                            <address className="not-italic text-body leading-7 mb-4">
                                                                {formatAddress(address)?.map((line, i) => (
                                                                    <span key={i}>{line}<br /></span>
                                                                ))}
                                                            </address>
                                                            {address.phone && (
                                                                <p className="text-body mb-4">Phone: {address.phone}</p>
                                                            )}
                                                            <div className="flex gap-2 flex-wrap">
                                                                <button
                                                                    onClick={() => openAddressModal(address)}
                                                                    className="px-4 py-2 bg-brand text-white text-xs font-semibold rounded-md hover:bg-brand-dark transition-colors"
                                                                >
                                                                    Edit
                                                                </button>
                                                                {!address.is_default && (
                                                                    <button
                                                                        onClick={() => handleSetDefaultAddress(address.id)}
                                                                        className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md hover:bg-gray-200 transition-colors"
                                                                    >
                                                                        Set as Default
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDeleteAddress(address.id)}
                                                                    className="px-4 py-2 bg-red-100 text-red-700 text-xs font-semibold rounded-md hover:bg-red-200 transition-colors"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-white border border-border rounded-xl p-8 text-center">
                                                <i className="fi-rs-marker text-5xl text-gray-300 mb-4 block"></i>
                                                <p className="text-body mb-4">You haven't saved any addresses yet.</p>
                                                <button
                                                    onClick={() => openAddressModal()}
                                                    className="inline-block px-6 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
                                                >
                                                    Add Your First Address
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Account Details Tab */}
                                {activeTab === 'account-detail' && (
                                    <div className="space-y-6">
                                        {/* Profile Update Form */}
                                        <div className="bg-white border border-border rounded-xl overflow-hidden">
                                            <div className="border-b border-border px-6 py-4">
                                                <h3 className="font-quicksand font-bold text-xl text-heading">Profile Details</h3>
                                            </div>
                                            <div className="p-6">
                                                <form onSubmit={handleProfileSubmit} className="space-y-5">
                                                    <div className="grid md:grid-cols-2 gap-5">
                                                        <div>
                                                            <label htmlFor="first_name" className="block text-heading font-semibold mb-2">
                                                                First Name <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                id="first_name"
                                                                name="first_name"
                                                                value={profileForm.data.first_name}
                                                                onChange={(e) => profileForm.setData('first_name', e.target.value)}
                                                                required
                                                                className="w-full border border-border rounded-md px-4 py-3 focus:border-brand focus:outline-none"
                                                            />
                                                            {profileForm.errors.first_name && (
                                                                <p className="text-red-500 text-sm mt-1">{profileForm.errors.first_name}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label htmlFor="last_name" className="block text-heading font-semibold mb-2">
                                                                Last Name <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                id="last_name"
                                                                name="last_name"
                                                                value={profileForm.data.last_name}
                                                                onChange={(e) => profileForm.setData('last_name', e.target.value)}
                                                                required
                                                                className="w-full border border-border rounded-md px-4 py-3 focus:border-brand focus:outline-none"
                                                            />
                                                            {profileForm.errors.last_name && (
                                                                <p className="text-red-500 text-sm mt-1">{profileForm.errors.last_name}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="email" className="block text-heading font-semibold mb-2">
                                                            Email Address
                                                        </label>
                                                        <input
                                                            type="email"
                                                            id="email"
                                                            name="email"
                                                            value={user?.email || ''}
                                                            disabled
                                                            className="w-full border border-border rounded-md px-4 py-3 bg-gray-50 text-gray-500"
                                                        />
                                                        <p className="text-sm text-body mt-1">Email cannot be changed</p>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="phone" className="block text-heading font-semibold mb-2">
                                                            Phone Number
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            id="phone"
                                                            name="phone"
                                                            value={profileForm.data.phone}
                                                            onChange={(e) => profileForm.setData('phone', e.target.value)}
                                                            placeholder="+265 999 123 456"
                                                            className="w-full border border-border rounded-md px-4 py-3 focus:border-brand focus:outline-none"
                                                        />
                                                        {profileForm.errors.phone && (
                                                            <p className="text-red-500 text-sm mt-1">{profileForm.errors.phone}</p>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        disabled={profileForm.processing}
                                                        className="bg-brand hover:bg-brand-dark text-white font-bold px-8 py-3 rounded-md transition-colors disabled:opacity-50"
                                                    >
                                                        {profileForm.processing ? 'Saving...' : 'Save Profile'}
                                                    </button>
                                                </form>
                                            </div>
                                        </div>

                                        {/* Password Update Form */}
                                        <div className="bg-white border border-border rounded-xl overflow-hidden">
                                            <div className="border-b border-border px-6 py-4">
                                                <h3 className="font-quicksand font-bold text-xl text-heading">Change Password</h3>
                                            </div>
                                            <div className="p-6">
                                                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                                    <div>
                                                        <label htmlFor="current_password" className="block text-heading font-semibold mb-2">
                                                            Current Password <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="password"
                                                            id="current_password"
                                                            name="current_password"
                                                            value={passwordForm.data.current_password}
                                                            onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                                            required
                                                            className="w-full border border-border rounded-md px-4 py-3 focus:border-brand focus:outline-none"
                                                        />
                                                        {passwordForm.errors.current_password && (
                                                            <p className="text-red-500 text-sm mt-1">{passwordForm.errors.current_password}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label htmlFor="new_password" className="block text-heading font-semibold mb-2">
                                                            New Password <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="password"
                                                            id="new_password"
                                                            name="new_password"
                                                            value={passwordForm.data.new_password}
                                                            onChange={(e) => passwordForm.setData('new_password', e.target.value)}
                                                            required
                                                            className="w-full border border-border rounded-md px-4 py-3 focus:border-brand focus:outline-none"
                                                        />
                                                        {passwordForm.errors.new_password && (
                                                            <p className="text-red-500 text-sm mt-1">{passwordForm.errors.new_password}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label htmlFor="new_password_confirmation" className="block text-heading font-semibold mb-2">
                                                            Confirm New Password <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="password"
                                                            id="new_password_confirmation"
                                                            name="new_password_confirmation"
                                                            value={passwordForm.data.new_password_confirmation}
                                                            onChange={(e) => passwordForm.setData('new_password_confirmation', e.target.value)}
                                                            required
                                                            className="w-full border border-border rounded-md px-4 py-3 focus:border-brand focus:outline-none"
                                                        />
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        disabled={passwordForm.processing}
                                                        className="bg-brand hover:bg-brand-dark text-white font-bold px-8 py-3 rounded-md transition-colors disabled:opacity-50"
                                                    >
                                                        {passwordForm.processing ? 'Updating...' : 'Update Password'}
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Address Modal */}
            {showAddressModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                            <h3 className="font-quicksand font-bold text-xl text-heading">
                                {editingAddress ? 'Edit Address' : 'Add New Address'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAddressModal(false);
                                    setEditingAddress(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <i className="fi-rs-cross text-lg"></i>
                            </button>
                        </div>
                        <form onSubmit={handleAddressSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-heading font-semibold mb-2">Label</label>
                                <select
                                    value={addressForm.data.label}
                                    onChange={(e) => addressForm.setData('label', e.target.value)}
                                    className="w-full border border-border rounded-md px-4 py-3 focus:border-brand focus:outline-none"
                                >
                                    <option value="Home">Home</option>
                                    <option value="Work">Work</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-heading font-semibold mb-2">First Name *</label>
                                    <input
                                        type="text"
                                        value={addressForm.data.first_name}
                                        onChange={(e) => addressForm.setData('first_name', e.target.value)}
                                        required
                                        className="w-full border border-border rounded-md px-4 py-3 focus:border-brand focus:outline-none"
                                    />
                                    {addressForm.errors.first_name && (
                                        <p className="text-red-500 text-sm mt-1">{addressForm.errors.first_name}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-heading font-semibold mb-2">Last Name *</label>
                                    <input
                                        type="text"
                                        value={addressForm.data.last_name}
                                        onChange={(e) => addressForm.setData('last_name', e.target.value)}
                                        required
                                        className="w-full border border-border rounded-md px-4 py-3 focus:border-brand focus:outline-none"
                                    />
                                    {addressForm.errors.last_name && (
                                        <p className="text-red-500 text-sm mt-1">{addressForm.errors.last_name}</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-heading font-semibold mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={addressForm.data.phone}
                                    onChange={(e) => addressForm.setData('phone', e.target.value)}
                                    className="w-full border border-border rounded-md px-4 py-3 focus:border-brand focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-heading font-semibold mb-2">Address Line 1 *</label>
                                <input
                                    type="text"
                                    value={addressForm.data.address_line_1}
                                    onChange={(e) => addressForm.setData('address_line_1', e.target.value)}
                                    required
                                    className="w-full border border-border rounded-md px-4 py-3 focus:border-brand focus:outline-none"
                                />
                                {addressForm.errors.address_line_1 && (
                                    <p className="text-red-500 text-sm mt-1">{addressForm.errors.address_line_1}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-heading font-semibold mb-2">Address Line 2</label>
                                <input
                                    type="text"
                                    value={addressForm.data.address_line_2}
                                    onChange={(e) => addressForm.setData('address_line_2', e.target.value)}
                                    className="w-full border border-border rounded-md px-4 py-3 focus:border-brand focus:outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-heading font-semibold mb-2">City *</label>
                                    <input
                                        type="text"
                                        value={addressForm.data.city_name}
                                        onChange={(e) => addressForm.setData('city_name', e.target.value)}
                                        required
                                        className="w-full border border-border rounded-md px-4 py-3 focus:border-brand focus:outline-none"
                                    />
                                    {addressForm.errors.city_name && (
                                        <p className="text-red-500 text-sm mt-1">{addressForm.errors.city_name}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-heading font-semibold mb-2">Region/State</label>
                                    <input
                                        type="text"
                                        value={addressForm.data.region_name}
                                        onChange={(e) => addressForm.setData('region_name', e.target.value)}
                                        className="w-full border border-border rounded-md px-4 py-3 focus:border-brand focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-heading font-semibold mb-2">Country *</label>
                                    <select
                                        value={addressForm.data.country_id}
                                        onChange={(e) => addressForm.setData('country_id', e.target.value)}
                                        required
                                        className="w-full border border-border rounded-md px-4 py-3 focus:border-brand focus:outline-none"
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map((country) => (
                                            <option key={country.id} value={country.id}>
                                                {country.name}
                                            </option>
                                        ))}
                                    </select>
                                    {addressForm.errors.country_id && (
                                        <p className="text-red-500 text-sm mt-1">{addressForm.errors.country_id}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-heading font-semibold mb-2">Postal Code</label>
                                    <input
                                        type="text"
                                        value={addressForm.data.postal_code}
                                        onChange={(e) => addressForm.setData('postal_code', e.target.value)}
                                        className="w-full border border-border rounded-md px-4 py-3 focus:border-brand focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={addressForm.data.is_default}
                                        onChange={(e) => addressForm.setData('is_default', e.target.checked)}
                                        className="w-4 h-4 text-brand border-border rounded focus:ring-brand"
                                    />
                                    <span className="text-sm text-heading">Set as default shipping address</span>
                                </label>
                            </div>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={addressForm.data.is_billing}
                                        onChange={(e) => addressForm.setData('is_billing', e.target.checked)}
                                        className="w-4 h-4 text-brand border-border rounded focus:ring-brand"
                                    />
                                    <span className="text-sm text-heading">Use as billing address</span>
                                </label>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddressModal(false);
                                        setEditingAddress(null);
                                    }}
                                    className="flex-1 border border-border text-heading font-semibold py-3 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addressForm.processing}
                                    className="flex-1 bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-md transition-colors disabled:opacity-50"
                                >
                                    {addressForm.processing ? 'Saving...' : (editingAddress ? 'Update Address' : 'Save Address')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </FrontendLayout>
    );
}
