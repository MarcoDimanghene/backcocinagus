import { validarJWT } from "../middleware/validarJWT";
import { validarRol } from "../middleware/validarRol";
import { recolectarErrores } from "../middleware/recolectarErrores";
import { Router } from "express";
import { check } from 'express-validator';
import { assignTask, createTask, deleteTask, getTasks, updateTaskState, updateTask, getTaskById } from "../controllers/tareas";


const router = Router();

router.post("/create-tarea",
    [
        validarJWT,
        validarRol('admin', 'regente'),
        check("nombre", "El nombre de la tarea es obligatorio").notEmpty(),
        check("menu_id", "El ID del menú asociado es obligatorio y debe ser un ID válido de MongoDB").isMongoId(),
        check("estado", "El estado de la tarea debe ser uno de los siguientes valores: 'asignada', 'pendiente', 'en_proceso', 'terminado'").optional().isIn(['asignada', 'pendiente', 'en_proceso', 'terminado']),
        recolectarErrores
    ], createTask
);
router.patch("/assign-tarea/:id",
    [
        validarJWT,
        validarRol('admin', 'regente'),
        check("responsable", "El ID del usuario responsable es obligatorio y debe ser un ID válido de MongoDB").isMongoId(),
        recolectarErrores
    ], assignTask
);
router.get("/get-tareas",
    [
        validarJWT,
        recolectarErrores
    ], getTasks
);
router.get("/get-tarea/:id",
    [
        validarJWT,
        check("id", "El ID de la tarea es obligatorio y debe ser un ID válido de MongoDB").isMongoId(),
        recolectarErrores
    ], getTaskById
);
router.patch("/update-tareaState/:id",
    [
        validarJWT,
        check("id", "El ID de la tarea es obligatorio y debe ser un ID válido de MongoDB").isMongoId(),
        check("estado", "El estado de la tarea es obligatorio y debe ser uno de los siguientes valores: 'asignada', 'pendiente', 'en_proceso', 'terminado'").isIn(['asignada', 'pendiente', 'en_proceso', 'terminado']),
        recolectarErrores
    ], updateTaskState
);
router.patch("/update-tarea/:id",
    [
        validarJWT,
        validarRol('admin', 'regente'),
        check("id", "El ID del cocinero es obligatorio y debe ser un ID válido de MongoDB").isMongoId(),
        check("nombre", "El nombre de la tarea es obligatorio").optional().notEmpty(),
        recolectarErrores
    ], updateTask

);
router.delete("/delete-tarea",
    [
        validarJWT,
        validarRol('admin', 'regente'),
        check("id", "El ID de la tarea es obligatorio y debe ser un ID válido de MongoDB").isMongoId(),
        recolectarErrores
    ], deleteTask
);

export default router;
