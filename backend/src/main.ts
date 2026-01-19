import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Khởi tạo dotenv để đọc file .env
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001; // Ưu tiên dùng port từ .env, nếu không có thì dùng 5001

// 1. Cấu hình CORS
app.use(cors({
  origin: 'http://localhost:3000', // ĐỊA CHỈ FRONTEND CỦA BẠN
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// 2. Middleware
app.use(express.json()) // Để đọc được dữ liệu JSON từ body request

// 3. Route kiểm tra
app.get('/', (req, res) => {
  console.log("Có người vừa truy cập vào trang chủ!");
  return res.status(200).json({ message: "LuxDecor API is working!" });
});

// 4. Khởi động Server
app.listen(PORT, () => {
  console.log(`--- LUXDECOR BACKEND ---`)
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`)
  console.log(`👉 API Endpoint chính: http://localhost:${PORT}/`)
})