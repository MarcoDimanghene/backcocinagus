// Archivo: src/database/config.ts
import mongoose from "mongoose";

export const dbConnection = async() => {
    try {
        const dbURL = process.env.DB_URL;
        if (!dbURL){
            throw new Error('La URL no está correctamente definida en las variables de entorno');
        }
        await mongoose.connect(dbURL);
        console.log('✅ Conexión a la base de datos exitosa.');
    } catch(error){
        console.error('❌ Error en la conexión a la Base de Datos:', error);
        throw new Error('Error en la conexión a la Base de Datos');
    }
}