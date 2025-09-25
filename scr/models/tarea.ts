import { model, Schema, Document } from "mongoose";

export interface ITarea extends Document {
    nombre: string;
    descripcion?: string;
    menu_id: Schema.Types.ObjectId;
    responsable?: Schema.Types.ObjectId;
    estado: 'asignada' |'pendiente' | 'en_proceso' | 'terminado';
    hora_inicio?: Date;
    hora_fin?: Date;
}
const TareaSchema = new Schema<ITarea>({
    nombre: { type: String, required: true },
    descripcion: { type: String },
    menu_id: { type: Schema.Types.ObjectId, ref: 'Menu', required: true },
    responsable: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    estado: { type: String, enum: ['asignada' , 'pendiente', 'en_proceso', 'terminado'], default: 'pendiente' },
    hora_inicio: { type: Date },
    hora_fin: { type: Date }
}, {
    timestamps: true
});

const Tarea = model<ITarea>('Tarea', TareaSchema);
export default Tarea;