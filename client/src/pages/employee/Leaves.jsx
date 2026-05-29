import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { applyLeave, getMyLeaves, cancelLeave } from '../../redux/slices/leaveSlice';
import Layout from '../../components/layout/Layout';
import Badge from '../../components/common/Badge';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Plus, X, Calendar } from 'lucide-react';

const LeavesPage = () => {
  const dispatch = useDispatch();
  const { myLeaves, leaveBalance, loading, error } = useSelector((s) => s.leave);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ leaveType: 'casual', fromDate: '', toDate: '', reason: '' });

  useEffect(() => { dispatch(getMyLeaves({ year: new Date().getFullYear() })); }, [dispatch]);
  useEffect(() => { if (error) toast.error(error); }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(applyLeave(form));
    if (applyLeave.fulfilled.match(result)) {
      toast.success('Leave applied successfully!');
      setShowModal(false);
      setForm({ leaveType: 'casual', fromDate: '', toDate: '', reason: '' });
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Cancel this leave?')) {
      const result = await dispatch(cancelLeave(id));
      if (cancelLeave.fulfilled.match(result)) toast.success('Leave cancelled.');
    }
  };

  return (
    <Layout title="My Leaves">
      {/* Leave Balance Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
        {[
          { label: 'Casual', key: 'casual', color: 'blue' },
          { label: 'Sick', key: 'sick', color: 'green' },
          { label: 'Paid', key: 'paid', color: 'purple' },
        ].map(({ label, key, color }) => (
          <div key={key} className={`bg-${color}-50 border border-${color}-200 rounded-2xl p-3 sm:p-5 text-center`}>
            <p className={`text-2xl sm:text-3xl font-bold text-${color}-600`}>{leaveBalance?.[key] ?? '-'}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Leave History</h3>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition"
        >
          <Plus size={15} /> Apply Leave
        </button>
      </div>

      {/* Leave List */}
      <div className="space-y-3">
        {myLeaves.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
            <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No leave requests</p>
            <button onClick={() => setShowModal(true)} className="text-blue-600 text-sm hover:underline mt-2">Apply now</button>
          </div>
        ) : myLeaves.map((leave) => (
          <div key={leave._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-gray-800 capitalize text-sm">{leave.leaveType} Leave</span>
                  <Badge status={leave.status} />
                </div>
                <p className="text-xs text-gray-500">
                  {format(new Date(leave.fromDate), 'MMM d')} - {format(new Date(leave.toDate), 'MMM d, yyyy')} • {leave.totalDays} day(s)
                </p>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{leave.reason}</p>
                {leave.approvalRemark && (
                  <p className="text-xs text-gray-400 mt-1">Remark: {leave.approvalRemark}</p>
                )}
              </div>
              {leave.status === 'pending' && (
                <button
                  onClick={() => handleCancel(leave._id)}
                  className="text-red-500 hover:text-red-700 flex-shrink-0 p-1.5 hover:bg-red-50 rounded-lg transition"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800">Apply for Leave</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Leave Type</label>
                <select
                  value={form.leaveType}
                  onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="paid">Paid Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                  <option value="emergency">Emergency Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                  <input type="date" value={form.fromDate}
                    onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                  <input type="date" value={form.toDate}
                    onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                    min={form.fromDate || format(new Date(), 'yyyy-MM-dd')}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Enter reason..." rows={3}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-60">
                  {loading ? 'Applying...' : 'Apply Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LeavesPage;
