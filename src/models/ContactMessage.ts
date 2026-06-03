import mongoose, { Schema, Document } from 'mongoose';

export interface IContactMessage extends Document {
  name:     string;
  email:    string;
  subject:  string;
  category: string;
  message:  string;
  status:   'new' | 'read' | 'replied';
  ipHash?:  string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name:    { type: String, required: true, trim: true, maxlength: 100 },
    email:   { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    category:{
      type: String,
      enum: ['general','bug','feature','billing','enterprise'],
      default: 'general',
    },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status:  { type: String, enum: ['new','read','replied'], default: 'new' },
    ipHash:  { type: String, maxlength: 32 },
  },
  { timestamps: true }
);

ContactMessageSchema.index({ createdAt: -1 });
ContactMessageSchema.index({ status: 1 });

export const ContactMessage =
  mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);
