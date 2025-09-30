import { Router } from "express";
import {
  paymentsGet,
  obtenerMesesDisponibles,
  pagarMesesSeleccionados,
  pagosPorAnio,
  pagosPorClienteAnio,
  clientesAtrasados,
} from "./payments.controller";
import { authMiddleware } from "../../middlewares/validar-jwt";
import { param, body } from "express-validator";
import { validarCampos } from "../../middlewares/validar-campos";
import { Payment } from "./payments.models";
import { Client } from "../clients/clients.models";
import PDFDocument from "pdfkit";

const router = Router();

router.get("/", authMiddleware, paymentsGet);

// 🔹 Buscar meses por DUI
router.get(
  "/:dui/meses-disponibles",
  [
    authMiddleware,
    param("dui", "El DUI es obligatorio").notEmpty(),
    validarCampos,
  ],
  obtenerMesesDisponibles
);

router.get("/anio/:anio/client/:clientId", authMiddleware, pagosPorClienteAnio);

router.get("/anio/:anio", authMiddleware, pagosPorAnio);
router.get("/clientes/atrasados", authMiddleware, clientesAtrasados);


router.post(
  "/:dui/pagar-seleccion",
  [
    authMiddleware,
    param("dui", "El DUI es obligatorio").notEmpty(),
    body("meses", "Debes enviar al menos un mes a pagar")
      .isArray({ min: 1 })
      .withMessage("Meses debe ser un arreglo con al menos un elemento"),
    body("meses.*.mes", "El mes es obligatorio y debe ser entre 1 y 12")
      .notEmpty()
      .isInt({ min: 1, max: 12 }),
    body("meses.*.anio", "El año es obligatorio y mínimo debe ser 2025")
      .notEmpty()
      .isInt({ min: 2025 }),
    validarCampos,
  ],
  pagarMesesSeleccionados
);

export default router;
