import { model, Schema, Document } from "mongoose";

export interface ITarea extends Document {
    nombre: string;
    descripcion?: string;
    // Opcional: Permite tareas que no están asociadas a un menú (tareas independientes)
    menu_id?: Schema.Types.ObjectId; 
    // Opcional: Permite tareas que aún no han sido asignadas
    responsable?: Schema.Types.ObjectId; 
    estado: 'PENDIENTE' | 'ASIGNADA' | 'EN_PROCESO' | 'TERMINADO' | 'CANCELADA' | 'VENCIDA';
    prioridad?: 'BAJA' | 'MEDIA' | 'ALTA';
    // Requerida: Necesaria para la programación y filtrado
    fecha_ejecucion: Date;
    createdAt?: Date; // Fecha de creación automática
    updatedAt?: Date; // Fecha de última actualización automática
    // Opcionales: Usadas para seguimiento del tiempo
    hora_inicio?: Date;
    hora_fin?: Date;
}

const TareaSchema = new Schema<ITarea>({
    nombre: { 
        type: String, 
        required: true 
    },
    descripcion: { 
        type: String 
    },
    menu_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'Menu', 
        required: false 
    },
    responsable: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: false 
    },
    estado: { 
        type: String, 
        enum: ['PENDIENTE', 'ASIGNADA', 'EN_PROCESO', 'TERMINADO', 'CANCELADA', 'VENCIDA'], 
        default: 'PENDIENTE' 
    },
    prioridad: { 
        type: String, 
        enum: ['BAJA', 'MEDIA', 'ALTA'], 
        default: 'MEDIA' 
    },
    fecha_ejecucion: { 
        type: Date, 
        default: Date.now 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    },

    hora_inicio: { 
        type: Date 
    },
    hora_fin: { 
        type: Date 
    }
}, {
    // Agrega campos createdAt y updatedAt automáticamente
    timestamps: true 
});

const Tarea = model<ITarea>('Tarea', TareaSchema);
export default Tarea;