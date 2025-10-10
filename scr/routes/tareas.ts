import { validarJWT } from "../middleware/validarJWT";
import { validarRol } from "../middleware/validarRol";
import { recolectarErrores } from "../middleware/recolectarErrores";
import { Router } from "express";
import { check } from 'express-validator';
import { createTarea, getAllTasks, getTareaById, getTasksDay, takeTarea, updateTareaState, cloneTarea, updateTareaDetails, assignTarea, deleteTarea } from "../controllers/tareas";


const router = Router();

router.post("/create-tarea",
    [
        validarJWT,
        validarRol('admin', 'regente'),
        check("nombre", "El nombre de la tarea es obligatorio").notEmpty(),
        check("menu_id", "El ID del menú asociado es obligatorio y debe ser un ID válido de MongoDB").isMongoId(),
        check("estado", "El estado de la tarea debe ser uno de los siguientes valores: 'asignada', 'pendiente', 'en_proceso', 'terminado'").optional().isIn(['asignada', 'pendiente', 'en_proceso', 'terminado']),
        recolectarErrores
    ],
    createTarea
);
router.get("/get-tarea-day",
    [
        validarJWT,
        check("date", "La fecha es obligatoria y debe ser una fecha válida").isDate(),
        recolectarErrores
    ],
    getTasksDay
);

router.patch("/take-tarea/:id",
    [
        validarJWT,
        check("id", "El ID de la tarea es obligatorio y debe ser un ID válido de MongoDB").isMongoId(),
        recolectarErrores
    ],
    takeTarea
);

router.patch("/updateState-tarea/:id",
    [
        validarJWT,
        check("id", "El ID de la tarea es obligatorio y debe ser un ID válido de MongoDB").isMongoId(),
        check("estado", "El estado de la tarea es obligatorio y debe ser uno de los siguientes valores: 'asignada', 'pendiente', 'en_proceso', 'terminado'").isIn(['asignada', 'pendiente', 'en_proceso', 'terminado']),
        recolectarErrores
    ],
    updateTareaState
);


router.get("/get-tareas/id",
    [
        validarJWT,
        recolectarErrores
    ],
    getTareaById
);

router.get("/get-tareas",
    [
        validarJWT,
        recolectarErrores
    ],
    getAllTasks
)
router.post("/clonetask/:id",
    [
        validarJWT,
        validarRol('admin', 'regente'),
        check("id", "El ID de la tarea es obligatorio y debe ser un ID válido de MongoDB").isMongoId(),
        recolectarErrores
    ],
    cloneTarea
);
router.patch("/update-detalle-tarea/:id",
    [
        validarJWT,
        validarRol('admin', 'regente'),
        check("id", "El ID de la tarea es obligatorio y debe ser un ID válido de MongoDB").isMongoId(),
        recolectarErrores
    ],
    updateTareaDetails
);
router.patch("/assign-tarea/:id",
    [
        validarJWT,
        validarRol('admin', 'regente'),
        check("id", "El ID de la tarea es obligatorio y debe ser un ID válido de MongoDB").isMongoId(),
        recolectarErrores
    ],
    assignTarea
);
router.delete("/delete-tarea/:id",
    [
        validarJWT,
        validarRol('admin', 'regente'),
        check("id", "El ID de la tarea es obligatorio y debe ser un ID válido de MongoDB").isMongoId(),
        recolectarErrores
    ],
    deleteTarea
);

export default router;
