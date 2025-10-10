import { Request, Response } from 'express';
import Tarea from '../models/tarea';
import Menu from '../models/menu';
import { Types } from 'mongoose';
import { IUser } from '../models/user';
import { populate } from 'dotenv';

interface IRequest {
    uid?: string;
    usuario?: IUser;
    query: any;
    params: any;
    body: any;
}

//mantenimiento
//purga de tareas antiguas

const purgeOldTasks = async (): Promise<void> => {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    try {
        const result = await Tarea.deleteMany({ 
            createdAt: { $lt: sixtyDaysAgo }
        });
        console.log(`Purgadas ${result.deletedCount} tareas antiguas.`);

    } catch (error) {
        console.error("Error purgando tareas antiguas:", error);
    }
};

//  Marca las tareas como 'VENCIDA' si su fecha de ejecución ya pasó y su estado no es 'TERMINADO' o 'CANCELADA'
const validateAndSetExpired = async (userId: string): Promise<void> => {
    const today = new Date();
    // Establecer la hora a medianoche de hoy (00:00:00) para incluir todo el día anterior
    today.setHours(0, 0, 0, 0); 
    
    try {
        const result = await Tarea.updateMany(
            {
                fecha_ejecucion: { $lt: today }, // Si la fecha de ejecución es anterior a hoy
                estado: { $in: ['PENDIENTE', 'ASIGNADA', 'EN_PROCESO'] } // Y no está terminada/cancelada
            },
            {
                estado: 'VENCIDA',
                responsable: userId // Opcional: Asignar al usuario que generó el cambio (Admin/Regente)
            }
        );

        console.log(`[Vencimiento] Tareas marcadas como VENCIDA: ${result.modifiedCount}`);

    } catch (error) {
        console.error('[Error de Vencimiento] No se pudieron marcar tareas vencidas:', error);
    }
};
// ===============================================
// CONTROLADORES CRUD
// ===============================================

//1. CREAR TAREA (Template o Independiente)
export const createTarea = async (req: Request & IRequest, res: Response) => {
    const { nombre, descripcion, menu_id, fecha_ejecucion, responsable, prioridad } = req.body;
    const userId = req.uid;
    try {
        const nuevaTarea = new Tarea({
            nombre,
            descripcion,
            menu_id, 
            fecha_ejecucion: new Date(fecha_ejecucion),
            responsable,
            prioridad,
            // Establecer el estado inicial
            estado: responsable ? 'ASIGNADA' : 'PENDIENTE'
        });

        const tareaGuardada = await nuevaTarea.save();
        // Si se proporciona menu_id, asociar la tarea al array tareas_base del Menú
        if (menu_id) {
            await Menu.findByIdAndUpdate(
                menu_id,
                { $push: { tareas_base: nuevaTarea._id } }, 
                { new: true }
            );
        }
        res.status(201).json({
            ok: true,
            msg: "Tarea creada exitosamente.",
            tarea: nuevaTarea
        });
    
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al crear la tarea. Hable con el administrador.'
        });
    }
}

// 2. OBTENER TAREAS DEL DÍA (Ejecuta Purgado y Vencimiento)
export const getTasksDay = async (req: IRequest, res: Response) => {
    const dateQuery = req.query.date as unknown as Date;
    const userId = req.uid as string;
    try {
        // Ejecutar mantenimiento antes de obtener las tareas
        await purgeOldTasks();
        await validateAndSetExpired(userId);
        // Construir el filtro de fecha
        const startOfDay = new Date(dateQuery);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(dateQuery);
        endOfDay.setHours(23, 59, 59, 999);

        const tareas = await Tarea.find({
            fecha_ejecucion: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        })
        .populate('responsable', 'username rol')
        .populate('menu_id', 'nombre')
        .sort({ prioridad: -1, nombre: 1 }); 

        res.status(200).json({
            ok: true,
            tareas
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener las tareas. Hable con el administrador.'
        });
    }
}

// 3. OBTENER TAREA POR ID
export const getTareaById = async (req: IRequest, res: Response) => {
    const tareaId = req.params;
    try {
        const tarea = await Tarea.findById(tareaId)
            .populate('responsable', 'username rol')
            .populate('menu_id', 'nombre descripcion');
        if (!tarea) {
            res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada.'
            });
            return;
        }
        res.status(200).json({
            ok: true,
            tarea
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener la tarea. Hable con el administrador.'
        });
    }
}

// 4. TOMAR TAREA (Asignación rápida)
export const takeTarea = async (req: IRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.uid as string;
    try {
        const tarea = await Tarea.findById(id);
        if (!tarea) {
            res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada.'
            });
            return;
        };
        if (tarea.estado !== 'PENDIENTE') {
            res.status(400).json({
                ok: false,
                msg: 'La tarea ya se encuentra asignada o no está en estado PENDIENTE.'
            });
            return;
        };
        const tareaTomada = await Tarea.findByIdAndUpdate(
            id,
            { estado: 'ASIGNADA', responsable: userId },
            { new: true }
        ).populate('responsable', 'username');
        res.status(200).json({
            ok: true,
            msg: 'Tarea tomada exitosamente.',
            tarea: tareaTomada
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al tomar la tarea. Hable con el administrador.'
        });
    }
}

// 5. ACTUALIZAR ESTADO DE TAREA (EN_PROCESO, TERMINADO, CANCELADA)
export const updateTareaState = async (req: IRequest, res: Response) => {
    const { id } = req.params;
    const { estado } = req.body;
    const userId = req.uid as string;
    try {
        const tarea = await Tarea.findById(id);
        if (!tarea) {
            res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada.'
            });
            return;
        }
        const updateTask = await Tarea.findByIdAndUpdate(
            id,
            { estado, responsable: userId },
            { new: true }
        ).populate('responsable', 'username');
        res.status(200).json({
            ok: true,
            msg: 'Estado de la tarea actualizado exitosamente.',
            tarea: updateTask
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar el estado de la tarea. Hable con el administrador.'
        });
    }
}

// 6. OBTENER LISTADO GENERAL DE TAREAS
export const getAllTasks = async (req: IRequest, res: Response) => {
    const { estado, responsable, fecha_inicio, fecha_fin } = req.query;

    const queryFilter: any = {};

    if (estado) {
        queryFilter.estado = estado;
    }
    if (responsable) {
        if (Types.ObjectId.isValid(responsable as string)) {
            queryFilter.responsable = responsable;
        } else {
            return res.status(400).json({
                ok: false,
                msg: 'El ID del responsable no es válido.'
            });
        }
    }
    //FILTROS POR RANGO DE FECHAS
    const dateQuery: any = {};
    if (fecha_inicio) {
        dateQuery.$gte = new Date(fecha_inicio as string);
    }
    if (fecha_fin) {
        let end = new Date(fecha_fin as string);
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
    }
    if (Object.keys(dateQuery).length > 0) {
        // Aplicar el filtro de rango de fechas al campo 'fecha' de la tarea
        queryFilter.fecha_ejecucion = dateQuery;
    }
    try {
        // Encontrar tareas con posibles filtros, poblando referencias y ordenando
        const tareas = await Tarea.find(queryFilter)
            .populate('responsable', 'username rol')
            .populate('menu_id', 'nombre')
            .sort({ fecha_ejecucion: -1, prioridad: -1, nombre: 1 });
        res.json({
            ok: true,
            total: tareas.length,
            tareas
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener las tareas. Hable con el administrador.'
        });
    }
}
// 7. REPROGRAMAR / CLONAR TAREA (Generar copias en otras fechas)
export const cloneTarea = async (req: IRequest, res: Response) => {
    const { id } = req.params;
    const { fecha_ejecucion, responsableId } = req.body;

    const {
        nombre: newNombre,
        descripcion: newDescripcion,
        prioridad: newPrioridad
    } = req.body;

    try {
        const tareaBase = await Tarea.findById(id);
        if (!tareaBase) {
            res.status(404).json({
                ok: false,
                msg: 'Tarea original no encontrada.'
            });
            return;
        }
        if (!fecha_ejecucion || fecha_ejecucion.length === 0) {
            res.status(400).json({
                ok: false,
                msg: 'La fecha de ejecución es requerida.'
            });
            return;
        }
        const nuevasTareas: any[] = []
        for (const fecha of fecha_ejecucion) {
            const nuevaFecha = new Date(fecha);
            
            // Lógica de sobreescritura: Usar el valor nuevo si está definido (no nulo, no undefined, no vacío), 
            // sino usar el valor de la tarea plantilla (tareaBase).
            // ¡FIX! Usamos el operador "!" para indicar a TypeScript que tareaBase no es nulo aquí.
            const finalNombre = newNombre || tareaBase!.nombre;
            const finalDescripcion = newDescripcion || tareaBase!.descripcion;
            // La prioridad debe ser manejada con cuidado si es un número, usamos nullish coalescing
            const finalPrioridad = newPrioridad ?? tareaBase!.prioridad;
            
            // 1. Clonar la tarea base, aplicando los overrides
            const nuevaTarea = new Tarea({
                nombre: finalNombre,
                descripcion: finalDescripcion,
                fecha_ejecucion: nuevaFecha,
                responsable: responsableId || undefined, 
                prioridad: finalPrioridad,
                // Reiniciar estado y horas
                estado: responsableId ? 'ASIGNADA' : 'PENDIENTE', 
                hora_inicio: undefined,
                hora_fin: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            nuevasTareas.push(nuevaTarea);
        }

        const tareasClonadas = await Tarea.insertMany(nuevasTareas);

        // Si se proporcionó menu_id (ya sea nuevo o de la tarea base), asociar las nuevas tareas al menú
        res.status(201).json({
            ok: true,
            msg: `${tareasClonadas.length} tareas clonadas y programadas exitosamente.`,
            tareas: tareasClonadas
        });
        } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al clonar la tarea. Hable con el administrador.'
        });
    }
}

// 8. ACTUALIZAR DETALLES DE TAREA
export const updateTareaDetails = async (req: IRequest, res: Response) => {
    const { id } = req.params;
    const updateFields = req.body;
    if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({
            ok: false,
            msg: 'ID de tarea no válido.'
        });
        return;
    }
    // Lógica para actualizar hora_fin si pasa a TERMINADO
    if (updateFields.estado === 'TERMINADO') {
        updateFields.hora_fin = new Date();
    }
    // Lógica para cambiar a ASIGNADA si se asigna un responsable
    if (updateFields.responsable) {
        if (!Types.ObjectId.isValid(updateFields.responsable)) {
            return res.status(400).json({
                ok: false,
                msg: 'ID de responsable no válido.'
            });
        }
        updateFields.estado = updateFields.estado || 'ASIGNADA';
    }
    try {
        const tareaActualizada = await Tarea.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        )
        .populate('responsable', 'nombre')
        .populate('menu_id', 'nombre');

        if (!tareaActualizada) {
            res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada.'
            });
            return;
        }
        res.status(200).json({
            ok: true,
            msg: 'Tarea actualizada exitosamente.',
            tarea: tareaActualizada
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar la tarea. Hable con el administrador.'
        });
    }
}

// 9. ASIGNAR TAREA A UN RESPONSABLE
export const assignTarea = async (req: IRequest, res: Response) => {
    const { id } = req.params;
    const { responsableId } = req.body;
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(responsableId)) {
        res.status(400).json({
            ok: false,
            msg: 'ID de tarea o responsable no válido.'
        });
        return;
    }
    try {
        const tareaAsignada = await Tarea.findByIdAndUpdate(
            id,
            { responsable: responsableId, estado: 'ASIGNADA' },
            { new: true }
        ).populate('responsable', 'nombre');
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al asignar la tarea. Hable con el administrador.'
        });
    }
}
// 10. ELIMINAR TAREA
export const deleteTarea = async (req: IRequest, res: Response) => {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) { 
        res.status(400).json({
            ok: false,
            msg: 'ID de tarea no válido.'   
        });
        return;
    }
    try {
        const tareaEliminada = await Tarea.findByIdAndDelete(id);
        if (!tareaEliminada) {
            res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada.'
            });
            return;
        }
        res.status(200).json({
            ok: true,
            msg: 'Tarea eliminada exitosamente.',
            tarea: tareaEliminada
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar la tarea. Hable con el administrador.'
        });
    }
}
