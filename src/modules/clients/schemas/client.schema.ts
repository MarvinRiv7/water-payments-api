import { z } from "zod";

export const clientBaseSchema = z.object({
  dui: z.string().regex(/^\d{8}-\d+$/, {
    message:
      "El DUI debe tener 8 dígitos, un guion y al menos 1 dígito después (ej: 01234567-8 o 01234567-89)",
  }),

  nombre: z
    .string()
    .regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s\-,]+$/, {
      message:
        "El nombre solo puede contener letras, espacios, guiones y comas",
    })
    .min(3, { message: "El nombre debe tener al menos 3 caracteres" }),

  apellido: z
    .string()
    .regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s\-,]+$/, {
      message:
        "El apellido solo puede contener letras, espacios, guiones y comas",
    })
    .min(3, { message: "El apellido debe tener al menos 3 caracteres" }),

  referencia: z.string().optional(),
  ultimoMes: z.number().min(1).max(12),
  ultimoAnio: z.number().min(2025),
  estado: z.enum(["Activo", "Desconectado", "Exonerado"]),
  pagoTipo: z.enum(["maximo", "medio", "minimo"]),
  observaciones: z.string().optional(),
  mesesAtrasados: z.number().optional(),
});

export const clientCreateSchema = clientBaseSchema;
export type ClientCreateInput = z.infer<typeof clientCreateSchema>;

export const clientUpdateSchema = clientBaseSchema
  .omit({
    dui: true,
    ultimoMes: true,
    ultimoAnio: true,
  })
  .extend({
    id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: "No es un ID válido de Mongo" }),
  });
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>;

export const clientDeleteSchema = z.object({
  id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, { message: "No es un ID válido de Mongo" }),
});

export type ClientDeleteInput = z.infer<typeof clientDeleteSchema>;
