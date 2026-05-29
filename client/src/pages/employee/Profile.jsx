import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getMe, changePassword } from '../../redux/slices/authSlice';
import api from '../../utils/api';
import Layout from '../../components/layout/Layout';
import { toast } from 'react-toastify';
import { User, Phone, MapPin, AlertCircle, Camera, Lock } from 'lucide-react';
import { format } from 'date-fns';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: user?.phone || '',
    address: user?.address || { street: '', city: '', state: '', pincode: '' },
    emergencyContact: user?.emergencyContact || { name: '', phone: '', relation: '' },
  });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/employees/profile/me', profileForm);
      dispatch(getMe());
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    const result = await dispatch(changePassword({
      currentPassword: pwdForm.currentPassword,
      newPassword: pwdForm.newPassword,
    }));
    if (changePassword.fulfilled.match(result)) {
      toast.success('Password changed successfully!');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      toast.error(result.payload);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    try {
      await api.post('/employees/profile/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      dispatch(getMe());
      toast.success('Profile image updated!');
    } catch (err) {
      toast.error('Image upload failed');
    }
  };

  return (
    <Layout title="My Profile">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="w-24 h-24 rounded-2xl bg-blue-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 p-2 bg-blue-600 rounded-xl text-white cursor-pointer hover:bg-blue-700 transition">
              <Camera size={14} />
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          <h2 className="text-xl font-bold text-gray-800">{user?.name}</h2>
          <p className="text-gray-500 text-sm">{user?.designation || 'Employee'}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {user?.employeeId}
          </span>

          <div className="mt-5 space-y-2 text-left">
            {[
              { label: 'Email', value: user?.email },
              { label: 'Department', value: user?.department },
              { label: 'Shift', value: user?.shiftStart && `${user.shiftStart} - ${user.shiftEnd}` },
              { label: 'Joined', value: user?.joiningDate && format(new Date(user.joiningDate), 'MMM d, yyyy') },
            ].map(({ label, value }) => value && (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Forms */}
        <div className="lg:col-span-2">
          <div className="flex gap-3 mb-5">
            {['profile', 'security'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition capitalize ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tab === 'profile' ? 'Edit Profile' : 'Change Password'}
              </button>
            ))}
          </div>

          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileSave} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Phone size={14} /> Phone Number
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <MapPin size={14} /> Address
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['street', 'city', 'state', 'pincode'].map((field) => (
                    <input
                      key={field}
                      type="text"
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      value={profileForm.address[field] || ''}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        address: { ...profileForm.address, [field]: e.target.value }
                      })}
                      className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <AlertCircle size={14} /> Emergency Contact
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['name', 'phone', 'relation'].map((field) => (
                    <input
                      key={field}
                      type="text"
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      value={profileForm.emergencyContact[field] || ''}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        emergencyContact: { ...profileForm.emergencyContact, [field]: e.target.value }
                      })}
                      className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordChange} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-xl text-yellow-700 text-sm">
                <Lock size={16} />
                Use a strong password with letters, numbers, and symbols
              </div>
              {[
                { label: 'Current Password', key: 'currentPassword' },
                { label: 'New Password', key: 'newPassword' },
                { label: 'Confirm New Password', key: 'confirmPassword' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="password"
                    value={pwdForm[key]}
                    onChange={(e) => setPwdForm({ ...pwdForm, [key]: e.target.value })}
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={6}
                  />
                </div>
              ))}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition"
              >
                Change Password
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
