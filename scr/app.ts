// Archivo: index.ts (o el archivo principal de tu app)
import { Servercfg } from './config/server';
import dotenv from 'dotenv';

// ¡Cargar las variables de entorno ANTES que todo lo demás!
dotenv.config();

const server = new Servercfg();
server.start();