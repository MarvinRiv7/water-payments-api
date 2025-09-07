import { Env } from "../types/Env";
import "dotenv/config";

export const env: Env = {
  PORT: Number(process.env.PORT || 8081),
   MONGODB_CNN: process.env.MONGODB_CNN || '',
};
