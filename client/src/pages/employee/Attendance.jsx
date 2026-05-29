import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkIn, checkOut, getTodayStatus, getMyAttendance } from '../../redux/slices/attendanceSlice';
import Layout from '../../components/layout/Layout';
import Badge from '../../components/common/Badge';
import { getCurrentLocation } from '../../utils/geoLocation';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { MapPin, LogIn, LogOut, Loader, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const AttendancePage = () => {
  const dispatch = useDispatch();
  const { today, isCurrentlyIn, totalSessions, totalWorkHours, records, summary, loading, error } = useSelector((s) => s.attendance);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear] = useState(new Date().getFullYear());
  const [expandedRecord, setExpandedRecord] = useState(null);

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
      if (checkIn.fulfilled.match(result)) {
        toast.success(result.payload.message);
        dispatch(getTodayStatus());
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLocationLoading(true);
    try {
      const location = await getCurrentLocation().catch(() => ({ latitude: null, longitude: null }));
      const result = await dispatch(checkOut(location));
      if (checkOut.fulfilled.match(result)) {
        toast.success(result.payload.message);
        dispatch(getTodayStatus());
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLocationLoading(false);
    }
  };

  const isLoading = loading || locationLoading;

  return (
    <Layout title="Attendance">
      {/* Today's Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 sm:p-6 text-white mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold">Today's Attendance</h2>
            <p className="text-blue-200 text-xs sm:text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <MapPin size={12} className="text-blue-300" />
              <span className="text-xs text-blue-200">Office radius: 50 meters</span>
            </div>
            {totalSessions > 0 && (
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full">
                  {totalSessions} session{totalSessions > 1 ? 's' : ''} today
                </span>
                {totalWorkHours > 0 && (
                  <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full">
                    {totalWorkHours}h total
                  </span>
                )}
                {today?.status && (
                  <Badge status={today.status} />
                )}
              </div>
            )}
          </div>

          {/* Check-in / Check-out Buttons */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 flex-wrap">
              {!isCurrentlyIn ? (
                <button
                  onClick={handleCheckIn}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition disabled:opacity-60 text-sm"
                >
                  {isLoading ? <Loader size={15} className="animate-spin" /> : <LogIn size={15} />}
                  Check In
                </button>
              ) : (
                <button
                  onClick={handleCheckOut}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-red-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-red-600 transition disabled:opacity-60 text-sm"
                >
                  {isLoading ? <Loader size={15} className="animate-spin" /> : <LogOut size={15} />}
                  Check Out
                </button>
              )}
            </div>
            <p className="text-xs text-blue-200">
              {isCurrentlyIn ? 'Currently working — tap Check Out when done' : totalSessions > 0 ? 'Checked out — tap Check In to start new session' : 'Tap Check In to mark attendance'}
            </p>
          </div>
        </div>

        {/* Today's Sessions */}
        {today?.sessions?.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-blue-200 font-medium">Today's Sessions:</p>
            {today.sessions.map((session, idx) => (
              <div key={idx} className="bg-white/10 rounded-xl px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white bg-blue-500 w-5 h-5 rounded-full flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-white flex-wrap">
                    <span className="flex items-center gap-1">
                      <LogIn size={11} className="text-green-300" />
                      {format(new Date(session.checkIn.time), 'hh:mm a')}
                    </span>
                    {session.checkOut?.time ? (
                      <span className="flex items-center gap-1">
                        <LogOut size={11} className="text-red-300" />
                        {format(new Date(session.checkOut.time), 'hh:mm a')}
                      </span>
                    ) : (
                      <span className="text-green-300 animate-pulse font-medium">● Active</span>
                    )}
                  </div>
                </div>
                {session.duration > 0 && (
                  <span className="text-xs text-blue-200">{session.duration}h</span>
                )}
              </div>
            ))}
          </div>
        )}
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

      {/* History */}
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

        {records.length === 0 ? (
          <p className="text-center py-10 text-gray-400 text-sm">No records this month</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {records.map((record) => (
              <div key={record._id}>
                {/* Record Row */}
                <div
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => setExpandedRecord(expandedRecord === record._id ? null : record._id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-center w-10 flex-shrink-0">
                      <p className="text-sm font-bold text-gray-800">{format(new Date(record.date), 'd')}</p>
                      <p className="text-xs text-gray-400">{format(new Date(record.date), 'MMM')}</p>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge status={record.status} />
                        {record.sessions?.length > 0 && (
                          <span className="text-xs text-gray-400">{record.sessions.length} session{record.sessions.length > 1 ? 's' : ''}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                        {record.sessions?.[0]?.checkIn?.time && (
                          <span>First in: {format(new Date(record.sessions[0].checkIn.time), 'hh:mm a')}</span>
                        )}
                        {record.totalWorkHours > 0 && (
                          <span className="font-medium text-blue-600 flex items-center gap-0.5">
                            <Clock size={10} />{record.totalWorkHours}h
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {record.sessions?.length > 1 && (
                      expandedRecord === record._id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Sessions */}
                {expandedRecord === record._id && record.sessions?.length > 0 && (
                  <div className="bg-gray-50 px-4 pb-4">
                    <div className="space-y-2">
                      {record.sessions.map((session, idx) => (
                        <div key={idx} className="bg-white rounded-xl px-3 py-2.5 border border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 w-6 h-6 rounded-full flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div className="flex gap-3 text-xs text-gray-600 flex-wrap">
                              <span className="flex items-center gap-1 text-green-600">
                                <LogIn size={11} />
                                {format(new Date(session.checkIn.time), 'hh:mm a')}
                              </span>
                              {session.checkOut?.time ? (
                                <span className="flex items-center gap-1 text-red-500">
                                  <LogOut size={11} />
                                  {format(new Date(session.checkOut.time), 'hh:mm a')}
                                </span>
                              ) : (
                                <span className="text-green-500 font-medium">Active</span>
                              )}
                            </div>
                          </div>
                          {session.duration > 0 && (
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                              {session.duration}h
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AttendancePage;
