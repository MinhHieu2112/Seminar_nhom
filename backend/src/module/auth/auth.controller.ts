// src/module/auth/auth.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body; // BE nhận email/password từ Frontend gửi lên

    // Tìm user trong Database MySQL qua Prisma
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    // Kiểm tra user và mật khẩu (Lưu ý: Thực tế nên dùng bcrypt để so sánh pass đã mã hóa)
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Nếu đúng, trả về object user mà FE đang chờ
    return res.status(200).json(user);
    
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server nội bộ' });
  }
};