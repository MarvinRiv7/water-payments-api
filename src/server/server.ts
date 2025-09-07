import express, { Application } from "express";

import cors from "cors";
import clientsRoutes from "../modules/modules.routes";
import { dbConnection } from "../database/config";

class Server {
  private app: Application;
  private port: string;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || "8081";
    this.conectarDB()
    this.middlewarws();
    this.routes();
  }
  async conectarDB() {
    await dbConnection()
  }
  middlewarws() {
    this.app.use(cors());
    this.app.use(express.static("public"));
    this.app.use(express.json());
  }
  routes() {
    this.app.use("/api", clientsRoutes);
  }
  listen() {
    this.app.listen(this.port, () => {
      console.log(`Server is running on port: ${this.port}`);
    });
  }
}

export default Server;
