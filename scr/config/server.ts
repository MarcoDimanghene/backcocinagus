import express, { Express } from "express";
import cors from "cors";
import { dbConnection } from "../database/config";
import authRouter from "../routes/auth";
import menuRouter from "../routes/menu";
import tareaRouter from "../routes/tareas";


export class Servercfg {
    app: Express;
    port: string | number | undefined;
     // Rutas base para los diferentes recursos de la API
    authPath: string;
    menuPath: string;
    tareaPath: string;

    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.authPath = "/api/auth";
        this.menuPath = "/api/menu";
        this.tareaPath = "/api/tarea";

        // Los middlewares y rutas se configuran en el constructor
        this.middlewares();
        this.routes();
    }

    async conectarDB(): Promise<void> {
        await dbConnection();
    }

    middlewares() {
        this.app.use(express.json());
        this.app.use(cors());
    }

    routes() {
        // Conectamos cada router a su ruta base correspondiente
        this.app.use(this.authPath, authRouter);
        this.app.use(this.menuPath, menuRouter);
        this.app.use(this.tareaPath, tareaRouter);
    }

    
    listen(): void {
        this.app.listen(this.port, () => {
            console.log(`Corriendo en puerto ${this.port}`);
        });
    }

    // Nuevo método 'start' para iniciar el servidor de forma segura
    async start(): Promise<void> {
        await this.conectarDB();
        this.listen();
    }
}