const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    default: '// Start coding...'
  },
  language: {
    type: String,
    default: 'javascript',
    enum: ['javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'go', 'rust', 'typescript', 'html']
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
codeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Code', codeSchema);
