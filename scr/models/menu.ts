import { model, Schema, Document, Types } from "mongoose";

// Interfaz para definir la estructura de un documento de Menú
export interface IMenu extends Document {
    nombre: string;
    descripcion?: string; // Lo mantengo opcional en la interfaz para flexibilidad, aunque sea requerido en el Schema
    disponible: boolean;
    // IMPORTANTE: Cambio 'tarea' por 'tareas_base' para compatibilidad con el controlador
    tareas_base: Types.ObjectId[]; 
}

// Esquema de la base de datos para el modelo de Menú
const MenuSchema = new Schema<IMenu>({
    nombre: {
        type: String,
        required: true,
        unique: true, // Asegura que no haya dos menús con el mismo nombre
        trim: true,
    },
    descripcion: {
        type: String,
        required: true, // Se mantiene requerido en el esquema de Mongoose
        trim: true,
    },
    disponible: {
        type: Boolean,
        default: true
    },
    // Almacena los IDs de las tareas que sirven como plantillas para este menú
    tareas_base: [{ 
        type: Schema.Types.ObjectId,
        ref: 'Tarea',
        default: [] 
    }]
}, {
    timestamps: true // Agrega createdAt y updatedAt
});

const Menu = model<IMenu>('Menu', MenuSchema);
export default Menu;



