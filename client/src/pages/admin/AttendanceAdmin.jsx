import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Layout from '../../components/layout/Layout';
import Badge from '../../components/common/Badge';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Download, MapPin, Search } from 'lucide-react';

const AttendanceAdminPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/attendance/admin', { params: { date: selectedDate } });
      setRecords(data.records);
    } catch (err) {
      toast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAttendance(); }, [selectedDate]);

  const statusCount = (status) => records.filter((r) => r.status === status).length;

  return (
    <Layout title="Attendance Management">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-3 mb-5">
        {[
          { label: 'Present', status: 'present', color: 'green' },
          { label: 'Late', status: 'late', color: 'yellow' },
          { label: 'Half Day', status: 'half_day', color: 'orange' },
          { label: 'On Leave', status: 'on_leave', color: 'blue' },
        ].map(({ label, status, color }) => (
          <div key={status} className={`bg-${color}-50 border border-${color}-200 rounded-xl px-4 py-2 text-sm`}>
            <span className={`font-bold text-${color}-700`}>{statusCount(status)}</span>
            <span className={`text-${color}-600 ml-1`}>{label}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-5">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="flex items-center text-sm text-gray-500">
          {records.length} record(s) found
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Employee</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Check In</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Check Out</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Work Hours</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Location</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t">
                    <td colSpan="6" className="px-4 py-4">
                      <div className="h-6 bg-gray-100 animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    No attendance records for {format(new Date(selectedDate), 'MMMM d, yyyy')}
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold overflow-hidden">
                          {r.user?.profileImage ? (
                            <img src={r.user.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : r.user?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{r.user?.name}</p>
                          <p className="text-xs text-gray-400">{r.user?.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.checkIn?.time ? (
                        <div>
                          <p>{format(new Date(r.checkIn.time), 'hh:mm a')}</p>
                          {r.isLate && (
                            <p className="text-xs text-red-500">{r.lateMinutes} mins late</p>
                          )}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.checkOut?.time ? format(new Date(r.checkOut.time), 'hh:mm a') : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.workHours ? `${r.workHours}h` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {r.checkIn?.location?.latitude ? (
                        <a
                          href={`https://www.google.com/maps?q=${r.checkIn.location.latitude},${r.checkIn.location.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-blue-600 text-xs hover:underline"
                        >
                          <MapPin size={12} />
                          {r.distanceFromOffice}m from office
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={r.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default AttendanceAdminPage;
