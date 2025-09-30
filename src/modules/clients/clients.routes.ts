import { Router } from "express";
import {
  clientsDelete,
  clientsGet,
  clientsPost,
  clientsPut,
  getClientByDui,
  getClientStats,
} from "./clients.controller";
import { body, check, param } from "express-validator";
import { validarCampos } from "../../middlewares/validar-campos";
import { authMiddleware } from "../../middlewares/validar-jwt";
import { validateSchema } from "../../middlewares/validateSchema";
import {
  clientBaseSchema,
  clientCreateSchema,
  clientDeleteSchema,
  clientUpdateSchema,
} from "./schemas/client.schema";
import z from "zod";
import { id } from "zod/locales";
import { validateClientExists } from "../../utils/db-validators";

const router = Router();

router.get("/", authMiddleware, clientsGet);
router.get("/stats", getClientStats);
router.get("/:dui", authMiddleware, getClientByDui);

router.post(
  "/",
  authMiddleware,
  validateSchema(clientCreateSchema, "body"),
  clientsPost
);
router.put(
  "/:id",
  authMiddleware,
  validateSchema(z.object({ id: clientUpdateSchema.shape.id }), "params"),
  validateSchema(clientUpdateSchema.omit({ id: true }), "body"),
  validateClientExists,
  clientsPut
);
router.delete(
  "/:id",
  authMiddleware,
  validateSchema(clientDeleteSchema, "params"),
  validateClientExists,
  clientsDelete
);

export default router;
