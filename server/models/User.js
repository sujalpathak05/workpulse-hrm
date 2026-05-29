const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['super_admin', 'hr_admin', 'employee'],
    default: 'employee',
  },
  phone: {
    type: String,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
  },
  designation: {
    type: String,
    trim: true,
  },
  joiningDate: {
    type: Date,
    default: Date.now,
  },
  salary: {
    type: Number,
    default: 0,
  },
  shiftStart: {
    type: String,
    default: '09:00',
  },
  shiftEnd: {
    type: String,
    default: '18:00',
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String,
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  profileImage: {
    type: String,
    default: '',
  },
  documents: [
    {
      docType: {
        type: String,
        enum: ['aadhaar', 'pan', 'resume', 'offer_letter', 'certificate', 'other'],
      },
      docName: String,
      fileUrl: String,
      publicId: String,
      uploadedAt: { type: Date, default: Date.now },
      verified: { type: Boolean, default: false },
    },
  ],
  leaveBalance: {
    sick: { type: Number, default: 12 },
    casual: { type: Number, default: 12 },
    paid: { type: Number, default: 15 },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: Date,
  lastLoginIP: String,
  deviceInfo: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

// Auto-generate Employee ID
userSchema.pre('save', async function (next) {
  if (!this.employeeId) {
    const count = await mongoose.model('User').countDocuments();
    this.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
  }
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
