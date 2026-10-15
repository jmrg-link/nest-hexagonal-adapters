import { Schema } from 'mongoose';
import { ROLES, type Role } from '../../../../shared/domain/principal';

/** Forma del documento en la colección `users`. */
export interface UserDocument {
  _id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

/** Nombre del modelo registrado en la conexión. */
export const USER_MODEL = 'User';

/**
 * Esquema de `users`. Las fechas las gestiona el dominio (sin `timestamps`) para
 * que todos los adaptadores se comporten igual.
 * Índices: email único y ESR `{ role: 1, createdAt: -1 }` (E = role, S = createdAt).
 */
export const userSchema = new Schema<UserDocument>(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'users', versionKey: false },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, createdAt: -1 });
