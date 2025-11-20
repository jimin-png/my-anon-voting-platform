import mongoose, { Schema, model, models } from 'mongoose';

export type EventStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

const EventSchema = new Schema({
  requestId: { type: String, required: true, index: true },
  txHash: { type: String, required: true, index: true },
  eventName: { type: String },
  payload: { type: Schema.Types.Mixed },
  status: { type: String, enum: ['PENDING','CONFIRMED','FAILED'], default: 'PENDING' },
  confirmations: { type: Number, default: 0 },
  nextRetryAt: { type: Date, default: null },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() },
});

EventSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default models.Event || model('Event', EventSchema);
