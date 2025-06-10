const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['photo', 'document', 'email', 'phone'],
    required: true
  },
  documents: [{
    type: {
      type: String,
      enum: ['id', 'passport', 'drivers_license', 'selfie'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    required: true
  },
  codeExpiresAt: {
    type: Date,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastAttemptAt: Date,
  adminNotes: [{
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps
verificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Generate verification code
verificationSchema.statics.generateCode = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to verify code
verificationSchema.methods.verifyCode = async function(code) {
  if (this.attempts >= 3) {
    throw new Error('Too many attempts. Please request a new code.');
  }

  if (new Date() > this.codeExpiresAt) {
    throw new Error('Verification code has expired');
  }

  this.attempts += 1;
  this.lastAttemptAt = new Date();

  if (code === this.verificationCode) {
    if (this.type === 'email') {
      this.emailVerified = true;
    } else if (this.type === 'phone') {
      this.phoneVerified = true;
    }
    this.status = 'approved';
    await this.save();
    return true;
  }

  await this.save();
  return false;
};

// Instance method to add admin note
verificationSchema.methods.addAdminNote = async function(adminId, note) {
  this.adminNotes.push({
    admin: adminId,
    note,
    timestamp: new Date()
  });
  return this.save();
};

// Instance method to update document status
verificationSchema.methods.updateDocumentStatus = async function(documentType, status, adminId) {
  const document = this.documents.find(doc => doc.type === documentType);
  if (!document) {
    throw new Error('Document not found');
  }

  document.status = status;
  document.verifiedAt = new Date();
  document.verifiedBy = adminId;

  // Update overall verification status
  const allApproved = this.documents.every(doc => doc.status === 'approved');
  if (allApproved) {
    this.status = 'approved';
  }

  await this.save();
  return this;
};

const Verification = mongoose.model('Verification', verificationSchema);

module.exports = Verification; 