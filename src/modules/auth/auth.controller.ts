import { Request, Response } from "express";
import { loginUser } from "./auth.service";

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const token = await loginUser(username, password);
    res.json({ token });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};
