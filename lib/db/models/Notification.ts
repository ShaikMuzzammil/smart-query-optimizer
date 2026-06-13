import mongoose, { Schema, models, model } from 'mongoose';

export interface INotification {
  _id: string;
  userId: string;
  type: 'upload' | 'search' | 'ai' | 'system' | 'achievement';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['upload', 'search', 'ai', 'system', 'achievement'], default: 'system' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

const NotificationModel = (models.Notification || model<INotification>('Notification', NotificationSchema)) as mongoose.Model<INotification>;
export default NotificationModel;
