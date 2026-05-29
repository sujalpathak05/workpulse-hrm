import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import Layout from '../../components/layout/Layout';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { Users, UserCheck, UserX, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

const AdminDashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const [stats, setStats] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, a, l] = await Promise.all([
          api.get('/employees/stats'),
          api.get('/attendance/admin'),
          api.get('/leaves?status=pending&limit=5'),
        ]);
        setStats(s.data.stats);
        setTodayAttendance(a.data.records);
        setPendingLeaves(l.data.leaves);
      } catch (err) {}
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const deptData = stats?.departments?.map((d) => ({ name: d._id || 'Others', value: d.count })) || [];
  const attendanceSummary = [
    { name: 'Present', value: todayAttendance.filter((a) => a.status === 'present').length },
    { name: 'Late', value: todayAttendance.filter((a) => a.status === 'late').length },
    { name: 'On Leave', value: todayAttendance.filter((a) => a.status === 'on_leave').length },
    { name: 'Absent', value: (stats?.totalEmployees || 0) - todayAttendance.length },
  ].filter((s) => s.value > 0);

  return (
    <Layout title="Admin Dashboard">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-4 sm:p-6 text-white mb-5">
        <h2 className="text-lg sm:text-xl font-bold">Welcome back, {user?.name} 👋</h2>
        <p className="text-gray-400 text-xs sm:text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        {stats?.pendingLeaves > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-xl px-3 py-2 text-yellow-300 text-xs sm:text-sm w-fit">
            <Calendar size={14} />
            {stats.pendingLeaves} pending leave(s) need attention
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-5 h-24 animate-pulse" />)
        ) : (
          <>
            <StatCard title="Total Employees" value={stats?.totalEmployees || 0} icon={Users} color="blue" />
            <StatCard title="Present Today" value={stats?.todayPresent || 0} icon={UserCheck} color="green" subtitle="Checked in" />
            <StatCard title="Absent Today" value={stats?.todayAbsent || 0} icon={UserX} color="red" />
            <StatCard title="Pending Leaves" value={stats?.pendingLeaves || 0} icon={Calendar} color="yellow" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-5">
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">Today's Attendance</h3>
          {attendanceSummary.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={attendanceSummary} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                  {attendanceSummary.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 text-sm py-12">No data yet</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">Employees by Department</h3>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 text-sm py-12">No data</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Today Check-ins */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Today's Check-ins</h3>
            <a href="/admin/attendance" className="text-blue-600 text-xs hover:underline">View All</a>
          </div>
          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {todayAttendance.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No check-ins today</p>
            ) : todayAttendance.slice(0, 8).map((a) => (
              <div key={a._id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs overflow-hidden flex-shrink-0">
                  {a.user?.profileImage ? <img src={a.user.profileImage} alt="" className="w-full h-full object-cover" /> : a.user?.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{a.user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{a.user?.department}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge status={a.status} />
                  <p className="text-xs text-gray-400 mt-0.5">
                    {a.sessions?.[0]?.checkIn?.time && format(new Date(a.sessions[0].checkIn.time), 'hh:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Pending Leaves</h3>
            <a href="/admin/leaves" className="text-blue-600 text-xs hover:underline">View All</a>
          </div>
          <div className="space-y-2.5">
            {pendingLeaves.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No pending requests</p>
            ) : pendingLeaves.map((leave) => (
              <div key={leave._id} className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="font-medium text-xs sm:text-sm text-gray-800 truncate">{leave.user?.name}</span>
                  <Badge status="pending" />
                </div>
                <p className="text-xs text-gray-500 capitalize">
                  {leave.leaveType} • {leave.totalDays}d • {format(new Date(leave.fromDate), 'MMM d')} - {format(new Date(leave.toDate), 'MMM d')}
                </p>
                <a href="/admin/leaves" className="inline-block mt-2 text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition">Review</a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
