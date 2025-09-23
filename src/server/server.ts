import express, { Application } from "express";

import cors from "cors";
import clientsRoutes from "../modules/modules.routes";
import authRoutes from "../modules/modules.routes";
import paymentsRoutes from "../modules/modules.routes";
import { dbConnection } from "../database/config";
import { createDefaultUser } from "../services/auth.service";

class Server {
  private app: Application;
  private port: string;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || "8081";
    this.conectarDB();
    this.createUser()
    this.middlewarws();
    this.routes();
  }
  async createUser () {
    await createDefaultUser()
  }
  async conectarDB() {
    await dbConnection();
  }
  middlewarws() {
    this.app.use(cors());
    this.app.use(express.static("public"));
    this.app.use(express.json());
  }
  routes() {
    this.app.use("/api", clientsRoutes);
    this.app.use("/api", authRoutes);
    this.app.use("/api", paymentsRoutes);
  }
  listen() {
    this.app.listen(this.port, () => {
      console.log(`Server is running on port: ${this.port}`);
    });
  }
}

export default Server;
