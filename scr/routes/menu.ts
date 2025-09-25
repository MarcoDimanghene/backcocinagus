import { validarJWT } from "../middleware/validarJWT";
import { validarRol } from "../middleware/validarRol";
import { recolectarErrores } from "../middleware/recolectarErrores";
import { Router } from "express";
import { check } from 'express-validator';
import { createMenu, deleteMenu, getMenuById, getMenus, loadMenu, updateMenu } from "../controllers/menu";

const router = Router();

router.post("/create-menu",
    [   
        validarJWT,
        validarRol('admin', 'regente'),
        check("nombre", "El nombre del ítem del menú es obligatorio").notEmpty(),
        check("descripcion", "La descripción del ítem del menú es obligatoria").notEmpty(),
        check("disponible", "El estado de disponibilidad es obligatorio y debe ser booleano").isBoolean(),
        check("tarea", "La tarea asociada debe ser un ID válido de MongoDB").optional().isMongoId(),
        recolectarErrores,
    ],createMenu,
);

router.get("/get-menus",
    [   
        recolectarErrores,
        validarJWT,
        check("tarea", "La tarea asociada debe ser un ID válido de MongoDB").optional().isMongoId(),
    ], getMenus,
);

router.get("/get-menu/:id",
    [
        validarJWT,
        recolectarErrores,
    ], getMenuById
);

router.patch("/update-menu/:id",
    [   
        validarJWT,
        validarRol('admin', 'regente'),
        check("nombre", "El nombre del ítem del menú es obligatorio").optional().notEmpty(),
        check("descripcion", "La descripción del ítem del menú es obligatoria").optional().notEmpty(),
        check("disponible", "El estado de disponibilidad es obligatorio y debe ser booleano").optional().isBoolean(),
        check("tarea.*", "La tarea asociada debe ser un ID válido de MongoDB").optional().isMongoId(),
        recolectarErrores,
    ], updateMenu
);
router.post("/load-menu-tasks/:id",
    [
        validarJWT,
        validarRol('admin', 'regente'),
        check("fecha", "La fecha es obligatoria y debe tener el formato YYYY-MM-DD").notEmpty().isISO8601(),
        recolectarErrores,
    ], loadMenu
);

router.delete("/delete-menu/:id",
    [
        recolectarErrores,
        validarJWT,
        validarRol('admin', 'regente'),
    ], deleteMenu
);

export default router;