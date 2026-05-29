import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Layout from '../../components/layout/Layout';
import Badge from '../../components/common/Badge';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { MapPin } from 'lucide-react';

const AttendanceAdminPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/attendance/admin', { params: { date: selectedDate } });
      setRecords(data.records);
    } catch (err) { toast.error('Failed to fetch attendance'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAttendance(); }, [selectedDate]);

  const statusCount = (status) => records.filter((r) => r.status === status).length;

  return (
    <Layout title="Attendance">
      {/* Summary */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { label: 'Present', status: 'present', color: 'green' },
          { label: 'Late', status: 'late', color: 'yellow' },
          { label: 'Half Day', status: 'half_day', color: 'orange' },
          { label: 'On Leave', status: 'on_leave', color: 'blue' },
        ].map(({ label, status, color }) => (
          <div key={status} className={`bg-${color}-50 border border-${color}-200 rounded-xl px-3 py-1.5 text-sm`}>
            <span className={`font-bold text-${color}-700`}>{statusCount(status)}</span>
            <span className={`text-${color}-600 ml-1 text-xs`}>{label}</span>
          </div>
        ))}
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-3 mb-4">
        <input type="date" value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-500">{records.length} record(s)</span>
      </div>

      {/* Desktop Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Employee</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Check In</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Check Out</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Hours</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Location</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-t">
                    <td colSpan="6" className="px-4 py-4"><div className="h-6 bg-gray-100 animate-pulse rounded" /></td>
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-10 text-gray-400 text-sm">No records for this date</td></tr>
              ) : records.map((r) => (
                <tr key={r._id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold overflow-hidden flex-shrink-0">
                        {r.user?.profileImage ? <img src={r.user.profileImage} alt="" className="w-full h-full object-cover" /> : r.user?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{r.user?.name}</p>
                        <p className="text-xs text-gray-400">{r.user?.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {r.checkIn?.time ? (
                      <div>
                        <p>{format(new Date(r.checkIn.time), 'hh:mm a')}</p>
                        {r.isLate && <p className="text-xs text-red-500">{r.lateMinutes}m late</p>}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{r.checkOut?.time ? format(new Date(r.checkOut.time), 'hh:mm a') : '-'}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{r.workHours ? `${r.workHours}h` : '-'}</td>
                  <td className="px-4 py-3">
                    {r.checkIn?.location?.latitude ? (
                      <a href={`https://www.google.com/maps?q=${r.checkIn.location.latitude},${r.checkIn.location.longitude}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-blue-600 text-xs hover:underline">
                        <MapPin size={11} />{r.distanceFromOffice}m
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3"><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="sm:hidden divide-y divide-gray-50">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="p-4"><div className="h-16 bg-gray-100 animate-pulse rounded" /></div>)
          ) : records.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">No records for this date</p>
          ) : records.map((r) => (
            <div key={r._id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm overflow-hidden flex-shrink-0">
                    {r.user?.profileImage ? <img src={r.user.profileImage} alt="" className="w-full h-full object-cover" /> : r.user?.name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{r.user?.name}</p>
                    <p className="text-xs text-gray-400">{r.user?.employeeId} • {r.user?.department}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                      {r.checkIn?.time && <span>In: {format(new Date(r.checkIn.time), 'hh:mm a')}</span>}
                      {r.checkOut?.time && <span>Out: {format(new Date(r.checkOut.time), 'hh:mm a')}</span>}
                      {r.workHours > 0 && <span className="font-medium text-blue-600">{r.workHours}h</span>}
                    </div>
                    {r.isLate && <p className="text-xs text-red-500 mt-0.5">{r.lateMinutes} mins late</p>}
                  </div>
                </div>
                <Badge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default AttendanceAdminPage;
