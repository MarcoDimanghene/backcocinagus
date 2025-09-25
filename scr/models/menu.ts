import { model, Schema, Document } from "mongoose";

export interface Imenu extends Document {
    nombre: string;
    descripcion: string;
    disponible: boolean;
    tarea: Schema.Types.ObjectId[] ;
}

const MenuSchema = new Schema<Imenu>({
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    disponible: { type: Boolean, default: true },
    tarea: [{
    type: Schema.Types.ObjectId,
    ref: 'Tarea' 
    }]
});

const Menu = model<Imenu>('Menu', MenuSchema);
export default Menu;


