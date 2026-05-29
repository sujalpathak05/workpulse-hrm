import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Layout from '../../components/layout/Layout';
import { toast } from 'react-toastify';
import { MapPin, Clock, Save, Building } from 'lucide-react';

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setSettings(data.settings);
      } catch (err) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Settings">
        <div className="text-center py-20 text-gray-400">Loading settings...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Company Settings">
      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {/* Company Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-blue-50 rounded-xl"><Building size={18} className="text-blue-600" /></div>
            <h3 className="font-semibold text-gray-800">Company Information</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              value={settings?.companyName || ''}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Office Location */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-green-50 rounded-xl"><MapPin size={18} className="text-green-600" /></div>
            <div>
              <h3 className="font-semibold text-gray-800">Office Location (Geo-Fencing)</h3>
              <p className="text-xs text-gray-500 mt-0.5">Set office coordinates for attendance verification</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={settings?.officeLocation?.latitude || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  officeLocation: { ...settings.officeLocation, latitude: parseFloat(e.target.value) }
                })}
                placeholder="28.6139"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={settings?.officeLocation?.longitude || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  officeLocation: { ...settings.officeLocation, longitude: parseFloat(e.target.value) }
                })}
                placeholder="77.2090"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Radius (meters)</label>
              <input
                type="number"
                value={settings?.officeLocation?.radius || 100}
                onChange={(e) => setSettings({
                  ...settings,
                  officeLocation: { ...settings.officeLocation, radius: parseInt(e.target.value) }
                })}
                placeholder="100"
                min="50"
                max="5000"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-3 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
            Tip: Use Google Maps to find your office latitude/longitude. Right-click on office location → "What's here?"
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-purple-50 rounded-xl"><Clock size={18} className="text-purple-600" /></div>
            <h3 className="font-semibold text-gray-800">Working Hours</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift Start</label>
              <input
                type="time"
                value={settings?.workingHours?.shiftStart || '09:00'}
                onChange={(e) => setSettings({
                  ...settings,
                  workingHours: { ...settings.workingHours, shiftStart: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift End</label>
              <input
                type="time"
                value={settings?.workingHours?.shiftEnd || '18:00'}
                onChange={(e) => setSettings({
                  ...settings,
                  workingHours: { ...settings.workingHours, shiftEnd: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Late Mark After (mins)</label>
              <input
                type="number"
                value={settings?.workingHours?.lateMarkAfter || 15}
                onChange={(e) => setSettings({
                  ...settings,
                  workingHours: { ...settings.workingHours, lateMarkAfter: parseInt(e.target.value) }
                })}
                min="0"
                max="60"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Leave Policy */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-5">Annual Leave Policy</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Sick Leave Days', key: 'sickLeavePerYear' },
              { label: 'Casual Leave Days', key: 'casualLeavePerYear' },
              { label: 'Paid Leave Days', key: 'paidLeavePerYear' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="number"
                  value={settings?.leavePolicy?.[key] || 12}
                  onChange={(e) => setSettings({
                    ...settings,
                    leavePolicy: { ...settings.leavePolicy, [key]: parseInt(e.target.value) }
                  })}
                  min="0"
                  max="365"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </Layout>
  );
};

export default SettingsPage;
