import { Request, Response } from "express";
import User from "../models/user";
import bcrypt from 'bcryptjs';
import { generateJWT } from "../helper/generateJWT";


// Interfaz para extender el objeto Request
interface IRequest extends Request {
    uid?: string;
    usuario?: string;
}

export const createUser = async (req: Request, res: Response) => {
    const { username, password, rol } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            res.status(400).json({ message: 'El usuario ya existe' });
            return
        }

        const newUsuario = new User({ username, rol });
    //encriptamos la contraseña
        const salt = bcrypt.genSaltSync(10);
        newUsuario.passwordHash = bcrypt.hashSync(password, salt);

        await newUsuario.save();
        
    // generar JWT
        const token = await generateJWT(newUsuario.id);

        res.status(201).json({
            ok: true,
            msg: 'Usuario creado correctamente',
            uid: newUsuario.id,
            token
        });
    

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear el usuario' });
    }
}
// Controlador para el login de usuarios
export const loginUser = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
        const usuario = await User.findOne ({ username });
        if (!usuario || !bcrypt.compareSync(password, usuario.passwordHash)) {
            return res.status(400).json({ message: 'Credenciales incorrectas' });
        }

        const token = await generateJWT(usuario.id);

        res.json({
            ok: true,
            uid: usuario.id,
            rol: usuario.rol,
            username: usuario.username,
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
}
// renovar token
export const renewToken = async (req: IRequest, res: Response) => {
    const uid = req.uid as string;
    const usuario = req.usuario;

    try {
        const token = await generateJWT(uid);

        res.json({
            ok: true,
            usuario,
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
}

//modifcar contraseña
export const changePassword = async (req: IRequest, res: Response) => {
    const {id} = req.params;
    const { newPassword } = req.body;
    try {
        const usuario = await User.findById(id);
        if (!usuario) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return
        }
        const salt = bcrypt.genSaltSync(10);
        usuario.passwordHash = bcrypt.hashSync(newPassword, salt);
        
        await usuario.save();
        res.json({ message: 'Contraseña actualizada correctamente' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar la contraseña' });
    }
}

//Eliminar usuario
export const deleteUser = async (req: IRequest, res: Response) => {
    const {id} = req.params;

    try {
        const deteleUser = await User.findById(id);
        if (!deteleUser) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        await User.findByIdAndDelete(id);
        res.json({ message: 'Usuario eliminado correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el usuario' });
    }
}

// cambiar estado
export const changeState = async (req: IRequest, res: Response) => {
    const {id} = req.params;
    const { active } = req.body;

    try {
        const usuario = await User.findById(id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        usuario.active = active;
        await usuario.save();

        res.json({ message: 'Estado del usuario actualizado correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar el estado del usuario' });
    }
}
//editar usuario 

export const editUser = async (req: Request, res: Response) =>{
    const {id} = req.params;
    const {username, password, rol} = req.body
    try {
        let passwordHash = undefined;
        if (password) {
            const salt = bcrypt.genSaltSync(10);
            passwordHash = bcrypt.hashSync(password, salt);
        }
        const updateFields: any = { };
        if (username) updateFields.username = username;
        if (passwordHash) updateFields.passwordHash = passwordHash;
        if (rol) updateFields.rol = rol;

        const usuario = await User.findByIdAndUpdate(id,
            updateFields,
            {new: true});
        if(!usuario){
            res.status(404).json({
                ok: false,
                msg: "No se encuentra usuario"
            })
            return;
        }
        
        res.status(200).json({
            ok: true,
            msg: "Se editó el usuario correctamente",
            usuario
        });
    } catch (error) {
        console.error(error);
        res.json({message: "Error al modificar usuario"})
    }
}
export const getAllUsers = async (req: IRequest, res: Response) => {
    try {
        // Obtenemos todos los usuarios, excluyendo el hash de la contraseña por seguridad
        const usuarios = await User.find()
            .select('-passwordHash') 
            .sort({ username: 1 }); // Opcional: ordenar por nombre de usuario
            
        res.status(200).json({
            ok: true,
            msg: "Listado de usuarios obtenido.",
            usuarios // Devolvemos el array de usuarios
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener los usuarios. Hable con el administrador.'
        });
    }  
}