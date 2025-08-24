import { Router } from "express";
import clientsRoutes from "./clients/clients.routes";

const router = Router();

router.use("/clients", clientsRoutes);

export default router;
