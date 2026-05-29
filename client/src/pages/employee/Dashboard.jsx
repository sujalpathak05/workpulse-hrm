import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getTodayStatus, getMyAttendance } from '../../redux/slices/attendanceSlice';
import { getMyLeaves } from '../../redux/slices/leaveSlice';
import Layout from '../../components/layout/Layout';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { today, hasCheckedIn, hasCheckedOut, summary } = useSelector((s) => s.attendance);
  const { myLeaves, leaveBalance } = useSelector((s) => s.leave);

  useEffect(() => {
    dispatch(getTodayStatus());
    dispatch(getMyAttendance({ month: new Date().getMonth() + 1, year: new Date().getFullYear() }));
    dispatch(getMyLeaves({ year: new Date().getFullYear() }));
  }, [dispatch]);

  const recentLeaves = myLeaves?.slice(0, 3) || [];

  return (
    <Layout title="My Dashboard">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white mb-6">
        <h2 className="text-2xl font-bold">Good {getGreeting()}, {user?.name?.split(' ')[0]}! 👋</h2>
        <p className="text-blue-200 mt-1 text-sm">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} • {user?.department || 'Employee'}
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${hasCheckedIn && !hasCheckedOut ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-sm font-medium">
              {hasCheckedIn && !hasCheckedOut ? 'Currently Working' : hasCheckedOut ? 'Day Completed' : 'Not Checked In'}
            </span>
          </div>
          {today?.checkIn?.time && (
            <span className="text-sm text-blue-200">
              Check-in: {format(new Date(today.checkIn.time), 'hh:mm a')}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="This Month Present"
          value={summary?.present || 0}
          icon={CheckCircle}
          color="green"
          subtitle={`+${summary?.late || 0} late`}
        />
        <StatCard
          title="Absent Days"
          value={summary?.absent || 0}
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="Work Hours"
          value={`${summary?.totalWorkHours || 0}h`}
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Leaves Available"
          value={leaveBalance ? leaveBalance.casual + leaveBalance.sick : '-'}
          icon={Calendar}
          color="purple"
          subtitle="Casual + Sick"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Today's Status</h3>
          {today ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-600">Status</span>
                <Badge status={today.status} />
              </div>
              {today.checkIn?.time && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Check In</span>
                  <span className="text-sm font-medium text-gray-800">
                    {format(new Date(today.checkIn.time), 'hh:mm a')}
                  </span>
                </div>
              )}
              {today.checkOut?.time && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Check Out</span>
                  <span className="text-sm font-medium text-gray-800">
                    {format(new Date(today.checkOut.time), 'hh:mm a')}
                  </span>
                </div>
              )}
              {today.workHours > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <span className="text-sm text-gray-600">Work Hours</span>
                  <span className="text-sm font-bold text-blue-600">{today.workHours}h</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Clock size={40} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No attendance marked today</p>
              <a href="/employee/attendance" className="text-blue-600 text-sm hover:underline mt-1 block">
                Mark Attendance →
              </a>
            </div>
          )}
        </div>

        {/* Leave Balance */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Leave Balance</h3>
          {leaveBalance && (
            <div className="space-y-3">
              {[
                { label: 'Casual Leave', key: 'casual', color: 'blue', max: 12 },
                { label: 'Sick Leave', key: 'sick', color: 'green', max: 12 },
                { label: 'Paid Leave', key: 'paid', color: 'purple', max: 15 },
              ].map(({ label, key, color, max }) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className="text-sm font-semibold text-gray-800">{leaveBalance[key]}/{max} days</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`bg-${color}-500 h-2 rounded-full transition-all`}
                      style={{ width: `${(leaveBalance[key] / max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leaves */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Leave Requests</h3>
            <a href="/employee/leaves" className="text-blue-600 text-sm hover:underline">View All</a>
          </div>
          {recentLeaves.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No leave requests found.</p>
          ) : (
            <div className="space-y-3">
              {recentLeaves.map((leave) => (
                <div key={leave._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-800 capitalize">{leave.leaveType} Leave</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(leave.fromDate), 'MMM d')} - {format(new Date(leave.toDate), 'MMM d, yyyy')} • {leave.totalDays} day(s)
                    </p>
                  </div>
                  <Badge status={leave.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

export default EmployeeDashboard;
