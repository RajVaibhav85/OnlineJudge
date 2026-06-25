const mongoose = require('mongoose');
const Solution = require('./Solutions');

const testHubSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  }],
  solutions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Solution'
  }],
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Terminated'],
    default: 'Active'
  },
  durationSeconds: {
    type: Number,
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  },
  finalVerdict: {
    type: String,
    enum: ['Passed', 'Failed', 'Incomplete', null],
    default: null
  }
}, { timestamps: true });

/**
 * Custom Model Instance Method
 * Handles cleanup logic when a session is closed out or broken
 */
testHubSchema.methods.terminateSession = async function() {
  this.status = 'Terminated';
  this.endedAt = new Date();
  this.finalVerdict = 'Incomplete';
  this.solutions = []; // Sever database linkage trace array

  // Cascade delete all solutions matching this session instance
  await Solution.deleteMany({ testHub: this._id });
  
  return await this.save();
};

const TestHub = mongoose.model('TestHub', testHubSchema);
module.exports = TestHub;