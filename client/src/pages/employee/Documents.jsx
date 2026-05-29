import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import Layout from '../../components/layout/Layout';
import { toast } from 'react-toastify';
import { Upload, FileText, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const docTypes = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'resume', label: 'Resume / CV' },
  { value: 'offer_letter', label: 'Offer Letter' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'other', label: 'Other' },
];

const DocumentsPage = () => {
  const { user } = useSelector((s) => s.auth);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ docType: 'aadhaar', docName: '', file: null });

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/employees/${user._id}`);
      setDocuments(data.employee.documents || []);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.file) return toast.error('Please select a file');

    const fd = new FormData();
    fd.append('document', form.file);
    fd.append('docType', form.docType);
    fd.append('docName', form.docName || form.file.name);

    setUploading(true);
    try {
      const { data } = await api.post('/employees/documents/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocuments(data.documents);
      setForm({ docType: 'aadhaar', docName: '', file: null });
      toast.success('Document uploaded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout title="My Documents">
      {/* Upload Form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Upload Document</h3>
        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={form.docType}
            onChange={(e) => setForm({ ...form, docType: e.target.value })}
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {docTypes.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Document name (optional)"
            value={form.docName}
            onChange={(e) => setForm({ ...form, docName: e.target.value })}
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="relative">
            <input
              type="file"
              onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 file:text-xs file:font-medium cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-60"
          >
            {uploading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : <Upload size={16} />}
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2">Supported: PDF, JPG, PNG, DOC (Max 10MB)</p>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No documents uploaded yet</p>
          <p className="text-gray-400 text-sm mt-1">Upload your Aadhaar, PAN, and other documents above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <FileText size={22} className="text-blue-600" />
                </div>
                {doc.verified ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <CheckCircle size={12} /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                    <Clock size={12} /> Pending
                  </span>
                )}
              </div>
              <p className="font-medium text-gray-800 text-sm">{doc.docName}</p>
              <p className="text-xs text-gray-400 capitalize mt-1">{doc.docType?.replace('_', ' ')}</p>
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
              </p>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-blue-600 text-xs hover:underline mt-3"
              >
                <ExternalLink size={12} /> View Document
              </a>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default DocumentsPage;
