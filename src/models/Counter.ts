import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
  key: string;
  value: number;
}

const CounterSchema: Schema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 0 },
});

export default mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema);


