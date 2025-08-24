import { Router } from "express";
import {
  clientsDelete,
  clientsGet,
  clientsPost,
  clientsPut,
} from "./clients.controller";

const router = Router();

router.get("/", clientsGet);
router.post("/", clientsPost);
router.put("/:id", clientsPut);
router.delete("/:id", clientsDelete);

export default router;
