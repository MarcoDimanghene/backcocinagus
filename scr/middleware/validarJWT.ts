import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/user'
import jwt from 'jsonwebtoken';

interface IRequest extends Request {
    uid?: string;
    usuario?: IUser;
}

const validarJWT = async (req: IRequest, res: Response, next: NextFunction): Promise<void> => {
    const token = req.header('x-token');
    if(!token) {
        res.status(401).json({ msg: 'No hay token en la petición' });
        return;
    } 
    try {
        const {uid} = jwt.verify(token, process.env.CLAVESECRETA || '') as {uid: string};
        const usuario = await User.findById(uid);

        if (!usuario) {
            res.status(401).json({ msg: 'Token no válido - usuario no existe en DB' });
            return;
        }
        req.uid = uid;
        req.usuario = usuario;
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Token no válido' });
    }
}

export { validarJWT };