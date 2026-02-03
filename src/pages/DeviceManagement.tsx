import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
    getAllDevices,
    approveDevice,
    revokeDevice,
    forceLogoutDevice,
    type Device
} from '../services/deviceService';

const DeviceManagement: React.FC = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 50;
    const [deleteDeviceId, setDeleteDeviceId] = useState<string | null>(null);

    const loadDevices = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getAllDevices(page, limit);
            setDevices(response.data);
            setTotal(response.pagination?.total || 0);
            setTotalPages(response.pagination?.totalPages || 1);
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } }
            toast.error(axiosError?.response?.data?.message || 'Failed to load devices');
        } finally {
            setLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        loadDevices();
    }, [loadDevices]);

    const handleApprove = async (deviceId: string) => {
        try {
            await approveDevice(deviceId);
            toast.success('Device approved successfully');
            loadDevices();
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } }
            toast.error(axiosError?.response?.data?.message || 'Failed to approve device');
        }
    };

    const handleRevoke = async (deviceId: string) => {
        try {
            await revokeDevice(deviceId);
            toast.success('Device revoked successfully');
            loadDevices();
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } }
            toast.error(axiosError?.response?.data?.message || 'Failed to revoke device');
        }
    };

    const openDeleteModal = (deviceId: string) => {
        setDeleteDeviceId(deviceId);
    };

    const handleConfirmDelete = async () => {
        if (!deleteDeviceId) return;

        try {
            await forceLogoutDevice(deleteDeviceId);
            toast.success('Device deleted successfully');
            loadDevices();
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } }
            toast.error(axiosError?.response?.data?.message || 'Failed to delete device');
        } finally {
            setDeleteDeviceId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-600 dark:text-gray-400">Loading devices...</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden ">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Device Management</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Manage approved devices for all users
                </p>
            </div>

            {devices?.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No devices found
                </div>
            ) : (
                <>
                    <div className="flex-1 min-h-0 overflow-auto scrollbar-thin border border-gray-200 dark:border-gray-700 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Device ID
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Browser
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        OS
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Last Used
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {devices?.map((device) => (
                                    <tr key={device.id}>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                            <div className="text-gray-900 dark:text-white">
                                                {device.user?.firstname} {device.user?.lastname}
                                            </div>
                                            <div className="text-gray-500 dark:text-gray-400 text-xs">
                                                {device.user?.useremail}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                {device.deviceId.substring(0, 12)}...
                                            </code>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {device.browser || 'Unknown'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {device.os || 'Unknown'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${device.isAllowed
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                    }`}
                                            >
                                                {device.isAllowed ? 'Approved' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {device.lastUsedAt
                                                ? new Date(device.lastUsedAt).toLocaleString()
                                                : 'Never'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                {!device.isAllowed && (
                                                    <button
                                                        onClick={() => handleApprove(device.id)}
                                                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {device.isAllowed && (
                                                    <button
                                                        onClick={() => handleRevoke(device.id)}
                                                        className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                                                    >
                                                        Revoke
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openDeleteModal(device.id)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                                <span className="font-medium">
                                    {Math.min(page * limit, total)}
                                </span>{' '}
                                of <span className="font-medium">{total}</span> devices
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}


            {/* Delete Confirmation Modal */}
            {
                deleteDeviceId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Delete Device?
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                Are you sure you want to permanently delete this device? Users will be logged out immediately.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteDeviceId(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default DeviceManagement;
