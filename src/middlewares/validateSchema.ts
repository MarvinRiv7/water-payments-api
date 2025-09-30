import { NextFunction, Request, Response } from "express";
import { ZodSchema, ZodError } from "zod";

export const validateSchema =
  (schema: ZodSchema, source: "body" | "params" = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req[source]);
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          errors: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      console.error("❌ Error inesperado en validateSchema:", error);
      return res.status(500).json({
        msg: "Error inesperado en validación",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
