import { Router } from "express";
import { check } from 'express-validator';

import { createUser, loginUser, renewToken, changePassword, deleteUser, changeState, editUser, getAllUsers } from "../controllers/auth";
import { validarJWT } from "../middleware/validarJWT";
import { validarRol } from "../middleware/validarRol";
import { recolectarErrores } from "../middleware/recolectarErrores";

const router = Router();

// router.post(
//     "/register-initial",
//     [
//         check("username", "El nombre de usuario es obligatorio").notEmpty(),
//         check("password", "La contraseña es obligatoria y debe tener al menos 6 caracteres").isLength({ min: 6 }),
//         check("rol", "El rol es obligatorio").notEmpty(),
//         recolectarErrores
//     ],
//     createUser
// );

router.post("/register", 
    [
        validarJWT,
        validarRol('admin', 'regente'),
        check("username", "El nombre de usuario es obligatorio").notEmpty(),
        check("password", "La contraseña es obligatoria").notEmpty(),
        recolectarErrores,
    ],
    createUser);

router.post("/login", 
    [
        check("username", "El nombre de usuario es obligatorio").notEmpty(),
        check("password", "La nueva contraseña es obligatoria y debe tener al menos 6 caracteres").isLength({ min: 6 }),
        recolectarErrores,
    ],
    loginUser);

router.get("/renew", validarJWT, recolectarErrores, renewToken);

router.patch("/change-password/:id", 
    [
        validarJWT,
        validarRol('admin', 'regente'),
        check("password", "La nueva contraseña es obligatoria y debe tener al menos 6 caracteres").isLength({ min: 6 }),
        recolectarErrores,
    ],
    changePassword);

router.delete("/delete-user/:id", 
    [
        validarJWT,
        validarRol('admin'),
        recolectarErrores,
    ], deleteUser);
router.patch("/change-state/:id", 
    [
        validarJWT,
        validarRol('admin', 'regente'),
        check('active', 'El estado es obligatorio').isBoolean(),
        recolectarErrores,
    ], 
    changeState);
router.patch(
    "/edit-user/:id",
    [
        validarJWT,
        validarRol('admin', 'regente'),
        check("id", "El ID del usuario es obligatorio y debe ser un ID válido de MongoDB").isMongoId(),
        // Los campos a editar son opcionales
        check("username", "El nombre de usuario debe ser una cadena de texto").optional().notEmpty(),
        check("password", "La contraseña debe tener al menos 6 caracteres").optional().isLength({ min: 6 }),
        check("rol", "El rol debe ser una cadena de texto").optional().notEmpty(),
        recolectarErrores,
    ],
    editUser
);
router.get('/getAllUsers', [
    validarJWT,
    validarRol('admin', 'regente'),
    recolectarErrores
], getAllUsers);

export default router;