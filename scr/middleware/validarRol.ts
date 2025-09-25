import { Request, Response, NextFunction } from 'express';
import { IUser } from "../models/user";

interface IRequest extends Request {
    usuario?: IUser;
}
export const validarRol = (...rolesPermitidos: string[]) => {
    return (req: IRequest, res: Response, next: NextFunction) => {
        const usuario = req.usuario;
        if (!usuario) {
            return res.status(403).json({ msg: 'No tiene permisos para realizar esta acción' });
        }
        if (!rolesPermitidos.includes(usuario.rol)) {
            return res.status(403).json({ msg: 'No tiene permisos para realizar esta acción' });
        }
        next();
    }
}