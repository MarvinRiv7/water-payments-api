import { Router } from "express";
import clientsRoutes from "./clients/clients.routes";
import authRoutes from "./auth/auth.routes";
import paymentsRoutes from "./payments/payments.routes";

const router = Router();

router.use("/clients", clientsRoutes);
router.use("/auth", authRoutes);
router.use("/payments", paymentsRoutes);

export default router;
