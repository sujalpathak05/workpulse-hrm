import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getTodayStatus, getMyAttendance } from '../../redux/slices/attendanceSlice';
import { getMyLeaves } from '../../redux/slices/leaveSlice';
import Layout from '../../components/layout/Layout';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-4 sm:p-6 text-white mb-5">
        <h2 className="text-xl sm:text-2xl font-bold">Good {getGreeting()}, {user?.name?.split(' ')[0]}!</h2>
        <p className="text-blue-200 mt-1 text-xs sm:text-sm">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} • {user?.department || 'Employee'}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${hasCheckedIn && !hasCheckedOut ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-xs sm:text-sm font-medium">
              {hasCheckedIn && !hasCheckedOut ? 'Currently Working' : hasCheckedOut ? 'Day Completed' : 'Not Checked In'}
            </span>
          </div>
          {today?.checkIn?.time && (
            <span className="text-xs text-blue-200">
              In: {format(new Date(today.checkIn.time), 'hh:mm a')}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <StatCard title="Present" value={summary?.present || 0} icon={CheckCircle} color="green" subtitle={`+${summary?.late || 0} late`} />
        <StatCard title="Absent" value={summary?.absent || 0} icon={XCircle} color="red" />
        <StatCard title="Work Hours" value={`${summary?.totalWorkHours || 0}h`} icon={Clock} color="blue" />
        <StatCard title="Leaves Left" value={leaveBalance ? leaveBalance.casual + leaveBalance.sick : '-'} icon={Calendar} color="purple" subtitle="Casual + Sick" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Today's Status */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Today's Status</h3>
          {today ? (
            <div className="space-y-2.5">
              {[
                { label: 'Status', value: <Badge status={today.status} /> },
                today.checkIn?.time && { label: 'Check In', value: format(new Date(today.checkIn.time), 'hh:mm a') },
                today.checkOut?.time && { label: 'Check Out', value: format(new Date(today.checkOut.time), 'hh:mm a') },
                today.workHours > 0 && { label: 'Work Hours', value: `${today.workHours}h`, highlight: true },
              ].filter(Boolean).map((item, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${item.highlight ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className={`text-sm font-medium ${item.highlight ? 'text-blue-600 font-bold' : 'text-gray-800'}`}>{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <Clock size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No attendance today</p>
              <a href="/employee/attendance" className="text-blue-600 text-sm hover:underline mt-1 block">Mark Attendance →</a>
            </div>
          )}
        </div>

        {/* Leave Balance */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
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
                    <span className="text-sm font-semibold text-gray-800">{leaveBalance[key]}/{max}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`bg-${color}-500 h-2 rounded-full`} style={{ width: `${(leaveBalance[key] / max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leaves */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Leaves</h3>
            <a href="/employee/leaves" className="text-blue-600 text-sm hover:underline">View All</a>
          </div>
          {recentLeaves.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No leave requests found.</p>
          ) : (
            <div className="space-y-2.5">
              {recentLeaves.map((leave) => (
                <div key={leave._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 capitalize">{leave.leaveType} Leave</p>
                    <p className="text-xs text-gray-500 truncate">
                      {format(new Date(leave.fromDate), 'MMM d')} - {format(new Date(leave.toDate), 'MMM d')} • {leave.totalDays}d
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
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
};

export default EmployeeDashboard;
