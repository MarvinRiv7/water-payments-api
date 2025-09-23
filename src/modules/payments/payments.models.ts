import { model, Schema } from "mongoose";
import { IPayment } from "./payments.interface";

export const paymentSchema = new Schema<IPayment>({
  client: {
    type: Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  mes: {
    type: String,
    required: true,
  },
  anio: {
    type: Number,
    required: true,
  },
  monto: {
    type: Number,
    required: true,
  },
  fechaPago: {
    type: Date,
    default: Date.now,
  },
  estado: {
    type: String,
    enum: ["pagado", "pendiente"],
    default: "pagado",
  },
});

paymentSchema.methods.toJSON = function () {
  const { __v, ...payment } = this.toObject();
  return payment;
};

export const Payment = model<IPayment>("Payment", paymentSchema);
