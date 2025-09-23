import { User } from "../modules/auth/auth.models";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt";

export const createDefaultUser = async () => {
  const existing = await User.findOne({ username: process.env.DEFAULT_USER });
  if (!existing) {
    const hashdPassword = await bcrypt.hash(process.env.DEFAULT_PASS!, 10);
    await User.create({
      username: process.env.DEFAULT_USER!,
      password: hashdPassword,
    });
    console.log("Default user created");
  }
};

export const loginUser = async (username: string, password: string) => {
  const user = await User.findOne({ username });
  if (!user) throw new Error("Usuario no encontrado");

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) throw new Error("Contraseña incorrecta");

  const token = generateToken({ id: user._id, username: user.username });
  return token;
};
