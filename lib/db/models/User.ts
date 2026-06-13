import mongoose, { Schema, models, model } from 'mongoose';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  plan: 'free' | 'pro';
  settings: {
    theme: 'dark' | 'light';
    stopwordsEnabled: boolean;
    caseSensitiveSearch: boolean;
    defaultResultCount: number;
    fuzzySearch: boolean;
  };
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    settings: {
      theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
      stopwordsEnabled: { type: Boolean, default: true },
      caseSensitiveSearch: { type: Boolean, default: false },
      defaultResultCount: { type: Number, default: 10 },
      fuzzySearch: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const UserModel = (models.User || model<IUser>('User', UserSchema)) as mongoose.Model<IUser>;
export default UserModel;
