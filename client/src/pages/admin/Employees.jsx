import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Layout from '../../components/layout/Layout';
import { toast } from 'react-toastify';
import { Plus, Search, Edit, UserX, UserCheck, X, Eye, EyeOff, Key } from 'lucide-react';
import { format } from 'date-fns';

const departments = ['HR', 'Engineering', 'Sales', 'Marketing', 'Finance', 'Operations', 'Support', 'Other'];

const emptyForm = {
  name: '', email: '', phone: '', department: 'Engineering',
  designation: '', salary: '', shiftStart: '09:00', shiftEnd: '18:00',
  joiningDate: format(new Date(), 'yyyy-MM-dd'),
  password: '', confirmPassword: '',
};

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Password reset modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/employees', { params: { search } });
      setEmployees(data.employees);
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchEmployees, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const openAdd = () => {
    setEditEmployee(null);
    setForm(emptyForm);
    setShowPassword(false);
    setShowConfirm(false);
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setEditEmployee(emp);
    setForm({
      name: emp.name, email: emp.email, phone: emp.phone || '',
      department: emp.department || 'Engineering', designation: emp.designation || '',
      salary: emp.salary || '', shiftStart: emp.shiftStart || '09:00',
      shiftEnd: emp.shiftEnd || '18:00',
      joiningDate: emp.joiningDate ? format(new Date(emp.joiningDate), 'yyyy-MM-dd') : '',
      password: '', confirmPassword: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Password validation for new employee
    if (!editEmployee) {
      if (!form.password) {
        return toast.error('Password is required');
      }
      if (form.password.length < 6) {
        return toast.error('Password must be at least 6 characters');
      }
      if (form.password !== form.confirmPassword) {
        return toast.error('Passwords do not match');
      }
    }

    setSubmitting(true);
    try {
      const payload = { ...form };
      delete payload.confirmPassword;
      if (editEmployee) delete payload.password;

      if (editEmployee) {
        await api.put(`/employees/${editEmployee._id}`, payload);
        toast.success('Employee updated successfully!');
      } else {
        await api.post('/employees', payload);
        toast.success(`Employee created! Login: ${form.email} / ${form.password}`);
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (emp) => {
    try {
      await api.put(`/employees/${emp._id}`, { isActive: !emp.isActive });
      toast.success(`Employee ${emp.isActive ? 'deactivated' : 'activated'}`);
      fetchEmployees();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmNewPassword) return toast.error('Passwords do not match');

    try {
      await api.put(`/employees/${resetTarget._id}/reset-password`, { newPassword });
      toast.success(`Password reset successfully for ${resetTarget.name}`);
      setShowResetModal(false);
      setNewPassword('');
      setConfirmNewPassword('');
      setResetTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed');
    }
  };

  const openResetPassword = (emp) => {
    setResetTarget(emp);
    setNewPassword('');
    setConfirmNewPassword('');
    setShowNewPwd(false);
    setShowResetModal(true);
  };

  return (
    <Layout title="Employee Management">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap"
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Employee</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Department</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium hidden lg:table-cell">Joined</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td colSpan="5" className="px-4 py-4">
                      <div className="h-8 bg-gray-100 animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-400">No employees found</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-semibold overflow-hidden flex-shrink-0">
                          {emp.profileImage ? (
                            <img src={emp.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : emp.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{emp.name}</p>
                          <p className="text-xs text-gray-400">{emp.employeeId} • {emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      <div>
                        <p>{emp.department}</p>
                        <p className="text-xs text-gray-400">{emp.designation}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {emp.joiningDate ? format(new Date(emp.joiningDate), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        emp.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(emp)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Employee"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => openResetPassword(emp)}
                          className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="Reset Password"
                        >
                          <Key size={15} />
                        </button>
                        <button
                          onClick={() => toggleActive(emp)}
                          className={`p-1.5 rounded-lg transition ${
                            emp.isActive
                              ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={emp.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {emp.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800">
                {editEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Rahul Sharma"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="rahul@company.com"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!editEmployee}
                    disabled={!!editEmployee}
                  />
                </div>
              </div>

              {/* Password fields — sirf new employee ke liye */}
              {!editEmployee && (
                <div className="border border-blue-100 bg-blue-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                    <Key size={13} /> Employee Login Password Set Karo
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder="Min 6 characters"
                          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password *</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          value={form.confirmPassword}
                          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                          placeholder="Repeat password"
                          className={`w-full border rounded-xl px-3 py-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            form.confirmPassword && form.password !== form.confirmPassword
                              ? 'border-red-400 bg-red-50'
                              : 'border-gray-300'
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {form.confirmPassword && form.password !== form.confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                  {form.password && form.password === form.confirmPassword && (
                    <p className="text-xs text-green-600">Passwords match</p>
                  )}
                </div>
              )}

              {/* Phone & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {departments.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Designation & Salary */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Designation</label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    placeholder="Software Engineer"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Salary (Rs.)</label>
                  <input
                    type="number"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    placeholder="50000"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Shift & Joining */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Shift Start</label>
                  <input
                    type="time"
                    value={form.shiftStart}
                    onChange={(e) => setForm({ ...form, shiftStart: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Shift End</label>
                  <input
                    type="time"
                    value={form.shiftEnd}
                    onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={form.joiningDate}
                    onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : editEmployee ? 'Update Employee' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && resetTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Reset Password</h3>
              <button onClick={() => setShowResetModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl mb-4">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-semibold flex-shrink-0">
                {resetTarget.name?.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-sm text-gray-800">{resetTarget.name}</p>
                <p className="text-xs text-gray-500">{resetTarget.email}</p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New Password *</label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    confirmNewPassword && newPassword !== confirmNewPassword ? 'border-red-400' : 'border-gray-300'
                  }`}
                  required
                />
                {confirmNewPassword && newPassword !== confirmNewPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-medium transition"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EmployeesPage;
