import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Vui lòng cung cấp tên đăng nhập.'],
    unique: true,
    trim: true,
    minlength: [3, 'Tên đăng nhập phải dài ít nhất 3 ký tự.']
  },
  email: {
    type: String,
    required: [true, 'Vui lòng cung cấp email.'],
    unique: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Vui lòng cung cấp email hợp lệ.'
    ]
  },
  password: {
    type: String,
    required: [true, 'Vui lòng cung cấp mật khẩu.'],
    minlength: [6, 'Mật khẩu phải dài ít nhất 6 ký tự.'],
    select: false
  },
  avatar: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

import wrapModel from './modelWrapper.js';
export default wrapModel('User', mongoose.model('User', UserSchema));
