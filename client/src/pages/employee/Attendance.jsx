import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkIn, checkOut, getTodayStatus, getMyAttendance } from '../../redux/slices/attendanceSlice';
import Layout from '../../components/layout/Layout';
import Badge from '../../components/common/Badge';
import { getCurrentLocation } from '../../utils/geoLocation';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { MapPin, Clock, CheckCircle, LogIn, LogOut, Loader } from 'lucide-react';

const AttendancePage = () => {
  const dispatch = useDispatch();
  const { today, hasCheckedIn, hasCheckedOut, records, summary, loading, error } = useSelector((s) => s.attendance);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    dispatch(getTodayStatus());
    dispatch(getMyAttendance({ month: selectedMonth, year: selectedYear }));
  }, [dispatch, selectedMonth, selectedYear]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleCheckIn = async () => {
    setLocationLoading(true);
    try {
      const location = await getCurrentLocation();
      const result = await dispatch(checkIn(location));
      if (checkIn.fulfilled.match(result)) toast.success(result.payload.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLocationLoading(true);
    try {
      const location = await getCurrentLocation();
      const result = await dispatch(checkOut(location));
      if (checkOut.fulfilled.match(result)) toast.success(result.payload.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLocationLoading(false);
    }
  };

  const isLoading = loading || locationLoading;

  return (
    <Layout title="Attendance">
      {/* Check-in/out Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 sm:p-6 text-white mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold mb-1">Today's Attendance</h2>
            <p className="text-blue-200 text-xs sm:text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <MapPin size={13} className="text-blue-300" />
              <span className="text-xs text-blue-200">Geo-location verification required</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {today && <div className="self-start sm:self-end"><Badge status={today.status} /></div>}

            <div className="flex gap-2 flex-wrap">
              {!hasCheckedIn ? (
                <button
                  onClick={handleCheckIn}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition disabled:opacity-60 text-sm"
                >
                  {isLoading ? <Loader size={15} className="animate-spin" /> : <LogIn size={15} />}
                  Check In
                </button>
              ) : !hasCheckedOut ? (
                <button
                  onClick={handleCheckOut}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-red-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-red-600 transition disabled:opacity-60 text-sm"
                >
                  {isLoading ? <Loader size={15} className="animate-spin" /> : <LogOut size={15} />}
                  Check Out
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-xl text-sm">
                  <CheckCircle size={15} />
                  <span className="font-semibold">Day Complete</span>
                </div>
              )}
            </div>

            {today?.checkIn?.time && (
              <div className="flex gap-3 text-xs text-blue-200 flex-wrap">
                <span>In: {format(new Date(today.checkIn.time), 'hh:mm a')}</span>
                {today?.checkOut?.time && <span>Out: {format(new Date(today.checkOut.time), 'hh:mm a')}</span>}
                {today?.workHours > 0 && <span className="text-white font-semibold">{today.workHours}h worked</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      {summary && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mb-5">
          {[
            { label: 'Present', value: summary.present, color: 'green' },
            { label: 'Late', value: summary.late, color: 'yellow' },
            { label: 'Absent', value: summary.absent, color: 'red' },
            { label: 'Half Day', value: summary.halfDay, color: 'orange' },
            { label: 'On Leave', value: summary.onLeave, color: 'blue' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-2.5 sm:p-4 text-center shadow-sm border border-gray-100">
              <p className={`text-xl sm:text-2xl font-bold text-${color}-600`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Attendance History</h3>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="text-xs sm:text-sm border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Check In</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Check Out</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Hours</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-400 text-sm">No records this month</td></tr>
              ) : records.map((r) => (
                <tr key={r._id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-800">{format(new Date(r.date), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3 text-gray-600">{r.checkIn?.time ? format(new Date(r.checkIn.time), 'hh:mm a') : '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.checkOut?.time ? format(new Date(r.checkOut.time), 'hh:mm a') : '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.workHours ? `${r.workHours}h` : '-'}</td>
                  <td className="px-4 py-3"><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="sm:hidden divide-y divide-gray-50">
          {records.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">No records this month</p>
          ) : records.map((r) => (
            <div key={r._id} className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{format(new Date(r.date), 'MMM d, yyyy')}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {r.checkIn?.time ? format(new Date(r.checkIn.time), 'hh:mm a') : '--:--'}
                  {' → '}
                  {r.checkOut?.time ? format(new Date(r.checkOut.time), 'hh:mm a') : '--:--'}
                  {r.workHours ? ` • ${r.workHours}h` : ''}
                </p>
              </div>
              <Badge status={r.status} />
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default AttendancePage;
