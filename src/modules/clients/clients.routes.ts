import { Router } from "express";
import {
  clientsDelete,
  clientsGet,
  clientsPost,
  clientsPut,
} from "./clients.controller";
import { check } from "express-validator";
import { validarCampos } from "../../middlewares/validar-campos";
import { existeDUI } from "../../utils/db-validators";

const router = Router();

router.get("/", clientsGet);
router.post(
  "/",
  [
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
    validarCampos,
  ],
  clientsPost
);
router.put("/:id", clientsPut);
router.delete("/:id", clientsDelete);

export default router;
