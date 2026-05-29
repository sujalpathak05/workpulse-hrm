import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllLeaves, leaveAction } from '../../redux/slices/leaveSlice';
import Layout from '../../components/layout/Layout';
import Badge from '../../components/common/Badge';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, X } from 'lucide-react';

const LeaveManagementPage = () => {
  const dispatch = useDispatch();
  const { allLeaves, loading } = useSelector((s) => s.leave);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionModal, setActionModal] = useState(null);
  const [remark, setRemark] = useState('');

  useEffect(() => {
    dispatch(getAllLeaves({ status: statusFilter }));
  }, [dispatch, statusFilter]);

  const handleAction = async (action) => {
    const result = await dispatch(leaveAction({ id: actionModal._id, action, remark }));
    if (leaveAction.fulfilled.match(result)) {
      toast.success(`Leave ${action} successfully!`);
      setActionModal(null);
      setRemark('');
      dispatch(getAllLeaves({ status: statusFilter }));
    } else {
      toast.error('Action failed');
    }
  };

  const counts = {
    pending: allLeaves.length,
  };

  return (
    <Layout title="Leave Management">
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['pending', 'approved', 'rejected', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {status}
            {status === 'pending' && allLeaves.length > 0 && statusFilter === 'pending' && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {allLeaves.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Leave Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : allLeaves.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <Clock size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No {statusFilter} leaves found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allLeaves.map((leave) => (
            <div key={leave._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-semibold overflow-hidden flex-shrink-0">
                    {leave.user?.profileImage ? (
                      <img src={leave.user.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : leave.user?.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{leave.user?.name}</span>
                      <span className="text-xs text-gray-400">{leave.user?.employeeId}</span>
                      <Badge status={leave.status} />
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      <span className="capitalize font-medium">{leave.leaveType}</span> Leave •{' '}
                      {format(new Date(leave.fromDate), 'MMM d')} - {format(new Date(leave.toDate), 'MMM d, yyyy')} •{' '}
                      {leave.totalDays} day(s)
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{leave.reason}</p>
                    {leave.approvalRemark && (
                      <p className="text-xs text-gray-400 mt-1">Remark: {leave.approvalRemark}</p>
                    )}
                    {leave.approvedBy && (
                      <p className="text-xs text-gray-400">
                        {leave.status === 'approved' ? 'Approved' : 'Rejected'} by {leave.approvedBy?.name}
                        {leave.approvedAt && ` on ${format(new Date(leave.approvedAt), 'MMM d, yyyy')}`}
                      </p>
                    )}
                  </div>
                </div>

                {leave.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActionModal({ ...leave, action: 'approve' })}
                      className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
                    >
                      <CheckCircle size={15} /> Approve
                    </button>
                    <button
                      onClick={() => setActionModal({ ...leave, action: 'reject' })}
                      className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
                    >
                      <XCircle size={15} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">
                {actionModal.action === 'approve' ? 'Approve' : 'Reject'} Leave
              </h3>
              <button onClick={() => setActionModal(null)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className={`p-3 rounded-xl mb-4 text-sm ${
              actionModal.action === 'approve' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {actionModal.action === 'approve' ? 'Approving' : 'Rejecting'} {actionModal.leaveType} leave for{' '}
              <strong>{actionModal.user?.name}</strong> ({actionModal.totalDays} days)
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remark (Optional)</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Add a remark for the employee..."
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActionModal(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(actionModal.action === 'approve' ? 'approved' : 'rejected')}
                className={`flex-1 text-white py-2.5 rounded-xl text-sm font-medium transition ${
                  actionModal.action === 'approve'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                Confirm {actionModal.action === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LeaveManagementPage;
