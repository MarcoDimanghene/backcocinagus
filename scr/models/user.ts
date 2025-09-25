import { model, Schema, Document } from "mongoose";

export interface IUser extends Document{
    username: string;
    passwordHash: string;
    active: boolean;
    rol: 'user' | 'admin' | 'cocinero' | 'regente';
}

const UsuarioSchema = new Schema<IUser>({
    username: { type: String, required: true },
    passwordHash: { type: String, required: true },
    active: { type: Boolean, default: true },
    rol: { type: String, enum: ['user', 'admin', 'cocinero', 'regente'], required: true, default: 'user' }
});

const User = model<IUser>('User', UsuarioSchema);
export default User;
