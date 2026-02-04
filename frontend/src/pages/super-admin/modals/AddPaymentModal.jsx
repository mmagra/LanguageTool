import React, { useState } from 'react';
import { X, DollarSign, Calendar, CreditCard, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';

const AddPaymentModal = ({ isOpen, onClose, schoolId, payment, onPaymentSaved }) => {
    const isEditing = !!payment;

    const [formData, setFormData] = useState({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'manual',
        status: 'pending',
        billing_period_start: '',
        billing_period_end: '',
        notes: ''
    });

    React.useEffect(() => {
        if (payment) {
            setFormData({
                amount: payment.amount || '',
                payment_date: payment.payment_date ? payment.payment_date.split('T')[0] : new Date().toISOString().split('T')[0],
                payment_method: payment.payment_method || 'manual',
                status: payment.status || 'pending',
                billing_period_start: payment.billing_period_start ? payment.billing_period_start.split('T')[0] : '',
                billing_period_end: payment.billing_period_end ? payment.billing_period_end.split('T')[0] : '',
                notes: payment.notes || ''
            });
        } else {
            setFormData({
                amount: '',
                payment_date: new Date().toISOString().split('T')[0],
                payment_method: 'manual',
                status: 'pending',
                billing_period_start: '',
                billing_period_end: '',
                notes: ''
            });
        }
    }, [payment]);

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.amount || formData.amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        if (!formData.payment_date) {
            toast.error('Please select a payment date');
            return;
        }
        if (formData.billing_period_start && formData.billing_period_end) {
            if (new Date(formData.billing_period_end) < new Date(formData.billing_period_start)) {
                toast.error('Billing end date must be after start date');
                return;
            }
        }

        setLoading(true);
        try {
            let response;
            if (isEditing) {
                response = await api.updatePayment(schoolId, payment.id, formData);
            } else {
                response = await api.createPayment(schoolId, formData);
            }

            if (response.success) {
                toast.success(isEditing ? 'Payment updated successfully' : 'Payment added successfully');
                onPaymentSaved(response.data);
                onClose();
            }
        } catch (error) {
            console.error('Error saving payment:', error);
            toast.error(error.response?.data?.message || 'Failed to save payment');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-inter">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-[#f0f4fe]">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {isEditing ? 'Edit Payment' : 'Add Payment'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            {isEditing ? 'Update payment details' : 'Record a new payment'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-500 transition-colors shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Amount & Date Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                <DollarSign size={16} className="text-green-600" />
                                Amount *
                            </label>
                            <input
                                type="number"
                                name="amount"
                                step="0.01"
                                min="0"
                                value={formData.amount}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                <Calendar size={16} className="text-indigo-600" />
                                Payment Date *
                            </label>
                            <input
                                type="date"
                                name="payment_date"
                                value={formData.payment_date}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Payment Method & Status Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                <CreditCard size={16} className="text-purple-600" />
                                Payment Method
                            </label>
                            <select
                                name="payment_method"
                                value={formData.payment_method}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            >
                                <option value="manual">Manual</option>
                                <option value="credit_card">Credit Card</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cash">Cash</option>
                                <option value="check">Check</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            >
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                    </div>

                    {/* Billing Period Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                <Calendar size={16} className="text-blue-600" />
                                Billing Period Start
                            </label>
                            <input
                                type="date"
                                name="billing_period_start"
                                value={formData.billing_period_start}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                                <Calendar size={16} className="text-blue-600" />
                                Billing Period End
                            </label>
                            <input
                                type="date"
                                name="billing_period_end"
                                value={formData.billing_period_end}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                            <FileText size={16} className="text-gray-600" />
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                            placeholder="Add any additional notes..."
                        />
                    </div>

                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-2.5 bg-primary-600 text-white font-semibold text-sm rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : isEditing ? 'Update Payment' : 'Add Payment'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AddPaymentModal;
