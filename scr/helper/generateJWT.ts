import jwt from "jsonwebtoken";

export const generateJWT = (uid: string): Promise<string> => {
    return new Promise ((resolve, reject) => {
        const payload = { uid };

        jwt.sign(payload, process.env.CLAVESECRETA as string, {
            expiresIn: '60d'
        }
        , (err, token) => {
            if (err) {
                console.log(err);
                reject('No se pudo generar el token');
            } else {
                resolve(token as string);
            }
        })
    })
}