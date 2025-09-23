import { Router } from "express";
import {
  clientsDelete,
  clientsGet,
  clientsPost,
  clientsPut,
  getClientStats,
} from "./clients.controller";
import { check } from "express-validator";
import { validarCampos } from "../../middlewares/validar-campos";
import { existeClientId, existeDUI } from "../../utils/db-validators";
import { authMiddleware } from "../../middlewares/validar-jwt";
import { Client } from "./clients.models";

const router = Router();

router.get("/", authMiddleware, clientsGet);
router.get("/stats", getClientStats);
router.get("/:dui", authMiddleware, async (req, res) => {
  try {
    const { dui } = req.params;
    const client = await Client.findOne({ dui });

    if (!client) {
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }

    res.status(200).json({ client });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener cliente" });
  }
});


router.post(
  "/",
  [
    authMiddleware,
    check("dui", "El dui no es valido")
      .notEmpty()
      .withMessage("El DUI es obligatorio")
      .matches(/^\d{8}-\d{1}$/)
      .withMessage(
        "El DUI debe tener 8 dígitos, un guion y 1 dígito al final (ej: 01234567-8)"
      )
      .custom(existeDUI),
    check("nombre", "El nombre no es valido")
      .notEmpty()
      .withMessage("El nombre es obligatorio")
      .isLength({ min: 3 }),
    check("apellido", "El apellido no es valido")
      .notEmpty()
      .withMessage("El apellido es obligatorio")
      .isLength({ min: 3 }),
    check("ultimoMes", "El ultimo mes es obligatorio")
      .notEmpty()
      .withMessage("El último mes es obligatorio")
      .isInt({ min: 1, max: 12 })
      .withMessage("El último mes debe estar entre 1 y 12"),
    check("ultimoAnio", "El último año es obligatorio")
      .notEmpty()
      .withMessage("El último año es obligatorio")
      .isInt({ min: 2025 })
      .withMessage("El último año debe ser 2025 o mayor"),
    check("estado")
      .notEmpty()
      .isIn(["Activo", "Desconectado", "Exonerado"])
      .withMessage("El estado debe ser Activo, Desconectado o Exonerado"),
  ],
  clientsPost
);
router.put(
  "/:id",
  [
    authMiddleware,
    check("id", "No es un ID valido").isMongoId(),
    check("id").custom(existeClientId),
    check("nombre", "El nombre no es valido")
      .notEmpty()
      .withMessage("El nombre es obligatorio")
      .isLength({ min: 3 }),
    check("apellido", "El apellido no es valido")
      .notEmpty()
      .withMessage("El apellido es obligatorio")
      .isLength({ min: 3 }),
    check("ultimoMes", "El ultimo mes es obligatorio")
      .notEmpty()
      .withMessage("El último mes es obligatorio")
      .isInt({ min: 1, max: 12 })
      .withMessage("El último mes debe estar entre 1 y 12"),
    check("ultimoAnio", "El último año es obligatorio")
      .notEmpty()
      .withMessage("El último año es obligatorio")
      .isInt({ min: 2025 })
      .withMessage("El último año debe ser 2025 o mayor"),
    check("estado")
      .notEmpty()
      .isIn(["Activo", "Desconectado", "Exonerado"])
      .withMessage("El estado debe ser Activo, Desconectado o Exonerado"),
    validarCampos,
  ],
  clientsPut
);
router.delete(
  "/:id",
  [
    authMiddleware,
    check("id", "No es un ID valido").isMongoId(),
    check("id").custom(existeClientId),
    validarCampos,
  ],
  clientsDelete
);

export default router;
