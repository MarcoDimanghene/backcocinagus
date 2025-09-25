import { Request, Response } from "express";
import Tarea from '../models/tarea';
import Menu from '../models/menu';
import User from '../models/user';

export const createTask = async (req: Request, res: Response) => {
    const { nombre, descripcion, menu_id, estado, responsable } = req.body;
    try {
        // 1. Crear la nueva tarea en la base de datos
        const nuevaTarea = new Tarea({
            nombre,
            descripcion,
            menu_id,
            estado,
            responsable
        });
        await nuevaTarea.save();

        // 2. Encontrar el menú y actualizar su campo 'tarea'
        await Menu.findByIdAndUpdate(
            menu_id,
            { $push: { tarea: nuevaTarea._id } }, // Usamos $push para agregar el ID de la nueva tarea al array
            { new: true, useFindAndModify: false }
        );

        res.status(201).json({
            ok: true,
            msg: "Tarea creada y asociada al menú correctamente",
            tarea: nuevaTarea
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: "Error al crear la tarea. Hable con el administrador."
        });
    }
};
export const getTasks = async (req: Request, res: Response) => {
    try {
        const tareas = await Tarea.find()
            .populate('menu_id', 'nombre descripcion')
            .populate('responsable', 'username rol');
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
export const getTaskById = async (req: Request, res: Response) => {
    const { id } = req.params; 
    try {
        const tarea = await Tarea.findById(id)
            .populate('menu_id', 'nombre descripcion')
            .populate('responsable', 'username rol');
        if (!tarea) {
            return res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada'
            });
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

export const updateTaskState = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        const taskToUpdate = await Tarea.findById(id);
        if (!taskToUpdate) {
            return res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada'
            });
        }
        taskToUpdate.estado = estado;
        if (estado === 'en_proceso') {
            taskToUpdate.hora_inicio = new Date();
        }

        if (estado === 'terminado') {
            taskToUpdate.hora_fin = new Date();
        }
        
        const tareaActualizada = await taskToUpdate.save();
        
        res.status(200).json({
            ok: true,
            msg: 'Estado de la tarea actualizado correctamente',
            tarea: tareaActualizada
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar el estado de la tarea. Hable con el administrador.'
        });
    }
};

export const updateTask = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    try {
        const updatedFields: any = {};
        if(nombre) updatedFields.nombre = nombre;
        if(descripcion) updatedFields.descripcion = descripcion;

        const taskToUpdate = await Tarea.findByIdAndUpdate(
            id,
            updatedFields,
            { new: true } // Para retornar el documento actualizado
        )
        if (!taskToUpdate) {
            return res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada'
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar la tarea. Hable con el administrador.'
        });
    }
}

export const assignTask = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { responsableId } = req.body;
    try {
        const tarea = await Tarea.findById(id);
        if (!tarea) {
            res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada'
            });
            return;
        }
        if (tarea.responsable){
            res.status(400).json({
                ok: false,
                msg: 'La tarea ya tiene un responsable asignado'
            });
            return;
        }
        // Verificar que el usuario existe
        const usuario = await User.findById(responsableId);
        if (!usuario) {
            res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado'
            });
            return;
        }
        tarea.responsable = responsableId;
        tarea.estado = 'asignada';
        await tarea.save();
        res.status(200).json({
            ok: true,
            msg: 'Tarea asignada correctamente',
            tarea
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al asignar la tarea. Hable con el administrador.'
        });
    }
};
// Controlador para obtener las tareas asignadas a un usuario específico
export const getTasksByUser = async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
        const tareas = await Tarea.find({ responsable: userId })
            .populate('menu_id', 'nombre descripcion')
            .populate('responsable', 'username rol');
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
};

// Controlador para eliminar una tarea (solo accesible para Admin y Regente)
export const deleteTask = async (req: Request, res: Response) => {
    const { id } = req.body; // Ahora el ID viene en el cuerpo

    try {
        // Encontrar la tarea para obtener el ID del menú antes de eliminarla
        const tareaEliminada = await Tarea.findById(id);

        if (!tareaEliminada) {
            return res.status(404).json({
                ok: false,
                msg: 'Tarea no encontrada'
            });
        }

        // Eliminar la referencia de la tarea en el menú asociado
        await Menu.findByIdAndUpdate(
            tareaEliminada.menu_id,
            { $pull: { tarea: tareaEliminada._id } },
            { new: true }
        );

        // Ahora sí, eliminar la tarea de la base de datos
        await Tarea.findByIdAndDelete(id);

        res.status(200).json({
            ok: true,
            msg: 'Tarea eliminada correctamente',
            id_tarea_eliminada: id // Agregamos el ID de la tarea eliminada en su propio campo
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar la tarea. Hable con el administrador.'
        });
    }
};