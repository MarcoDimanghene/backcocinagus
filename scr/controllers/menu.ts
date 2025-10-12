import { Request, Response } from 'express';
import Menu from '../models/menu';
import Tarea from '../models/tarea';


// Controlador para crear un nuevo ítem en el menú (solo accesible para Admin y Regente)
export const createMenu = async (req: Request, res: Response) => {
    const { nombre, descripcion, disponible, tarea } = req.body;
    try {
        const newMenuItem = new Menu({ nombre, descripcion, disponible, tarea });
        await newMenuItem.save();
        res.status(201).json({
            ok: true,
            msg: "Ítem de menú creado correctamente",
            menuItem: newMenuItem
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: "Error al crear el menú"
        });
    }
};

// Controlador para obtener todos los ítems del menú, incluyendo las tareas
export const getMenus = async (req: Request, res: Response) => {
    try {
        const menu = await Menu.find().populate('tarea');
        res.status(200).json({
            ok: true,
            menuItems: menu
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener los ítems del menú. Hable con el administrador.'
        });
    }
};

// Controlador para obtener un ítem del menú por su ID, incluyendo las tareas
export const getMenuById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const menuItem = await Menu.findById(id).populate('tarea');
        if (!menuItem) {
            res.status(404).json({
                ok: false,
                msg: 'Ítem del menú no encontrado'
            });
            return;
        }
        res.status(200).json({
            ok: true,
            menuItem
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener el ítem del menú. Hable con el administrador.'
        });
    }
}

// Controlador para actualizar un ítem del menú (solo accesible para Admin y Regente)
export const updateMenu = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre, descripcion, disponible, tarea } = req.body;
    try {
        
        const updatedFields: any = { };
        if(nombre) updatedFields.nombre = nombre;
        if(descripcion) updatedFields.descripcion = descripcion;
        if(disponible) updatedFields.disponible = disponible;
        if(tarea) updatedFields.tarea = tarea;
        

        const updatedMenu = await Menu.findByIdAndUpdate(id, 
            updatedFields,
            { new: true });
        if (!updatedMenu) {
            res.status(404).json({
                ok: false,
                msg: "Ítem del menú no encontrado"
            });
            return;
        }
        res.status(200).json({
            ok: true,
            msg: "Ítem del menú actualizado correctamente",
            menuItem: updatedMenu
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: "Error al actualizar el ítem del menú"
        });
    }
};

// Controlador para eliminar un ítem del menú (solo accesible para Admin y Regente)
export const deleteMenu = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const deletedMenu = await Menu.findByIdAndDelete(id);
        if (!deletedMenu) {
            return res.status(404).json({
                ok: false,
                msg: "Ítem del menú no encontrado"
            });
        }
        res.status(200).json({
            ok: true,
            msg: "Ítem del menú eliminado"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: "Error al eliminar el ítem del menú"
        });
    }
};
export const loadMenu = async (req: Request, res: Response) => {
    const {menuId, fecha} = req.body;
    try {
        const menuTemplate = await Menu.findById(menuId).populate('tarea');
        if(!menuTemplate){
                res.status(404).json({
                ok: false,
                msg: "No se encuentra el menu"
            });
            return;
        }
        const nuevasTareas= [];
        for (const tareaOriginal of (menuTemplate as any).tarea as any[]) {
            const nuevaTarea = new Tarea({
                nombre: tareaOriginal.nombre,
                descripcion: tareaOriginal.descripcion,
                menu_id: tareaOriginal.menu_id,
                estado: 'pendiente',
                fecha: new Date(fecha),
            });
            await nuevaTarea.save();
            nuevasTareas.push(nuevaTarea._id);
        }
                res.status(201).json({
            ok: true,
            msg: `Tareas del menú '${menuTemplate.nombre}' cargadas para la fecha ${fecha}`,
            tareas: nuevasTareas
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: "Error al cargar las tareas del menú"
        });
    }
}
