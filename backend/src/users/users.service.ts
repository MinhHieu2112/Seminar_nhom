import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { hashPassword } from '@/helpers/util';
import { PrismaService } from '@/prisma/prisma.service';
import { User } from '@prisma/client';
import aqp from 'api-query-params';

@Injectable()
export class UsersService {
  // Khai báo constructor giúp có biến this.prisma
  constructor(private prisma: PrismaService) {}
  // Check unique email
  isExisting = async (email: string) => {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    return existingUser;
  };

  /* ======================= CREATE USER =======================*/

  async create(createUserDto: CreateUserDto, currentUser?: User) {
    try {
      // Lấy dữ liệu từ DTO
      const { name, email, password, phone, role, avatar } = createUserDto;

      // Kiểm tra email đã tồn tại chưa
      const isExist = await this.isExisting(email);
      if (isExist) {
        throw new BadRequestException(
          `Email ${email} đã được sử dụng. Vui lòng chọn email khác.`,
        );
      }

      // hash password
      const hashPass = await hashPassword(password);

      //Xử lý role
      let finalRole = 'customer';
      if (role && currentUser?.role === 'admin') {
        finalRole = role;
      }

      // Lưu vào database thông qua prisma
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          passwordHash: hashPass,
          phone,
          avatar,
          role: finalRole as any,
        },
      });

      return {
        message: 'Đã tạo tài khoản thành công !',
        id: user.id,
      };
    } catch (error) {
      throw error;
    }
  }

  /* ======================= FIND ALL USER =======================*/

  async findAll(query: any) {
    // 1. aqp cần một chuỗi query string.
    // Nếu query đã là object, một số bản aqp yêu cầu bạn dùng req.url hoặc xử lý filter thủ công
    const { filter, sort } = aqp(query);

    // 2. Lấy giá trị current và pageSize từ object query
    // Dùng dấu + để ép kiểu sang số (vì query params luôn là string)
    const current = +query.current || 1;
    const pageSize = +query.pageSize || 10;

    // 3. Xóa các tham số phân trang khỏi filter
    // để Prisma không tìm các cột mang tên 'current', 'pageSize' trong DB
    delete filter.current;
    delete filter.pageSize;

    const totalItems = await this.prisma.user.count({
      where: filter as any,
    });

    const skip = (current - 1) * pageSize;

    const results = await this.prisma.user.findMany({
      where: filter as any,
      skip: skip, // qua trang
      take: pageSize, // lấy bao nhiêu bản ghi
      orderBy: sort as any,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return {
      meta: {
        current,
        pageSize,
        pages: Math.ceil(totalItems / pageSize),
        total: totalItems,
      },
      results,
    };
  }

  /* ======================= FIND ONE USER =======================*/

  async findOne(id: number) {
    return await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  /* ======================= FIND BY EMAIL USER =======================*/

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new BadRequestException(`Vui lòng kiểm tra lại tài khoản!`);
    } else {
      return user;
    }
  }

  /* ======================= UPDATE USER =======================*/

  async update(updateUserDto: UpdateUserDto) {
    // Tách id ra khỏi data để update
    const { id, ...data } = updateUserDto;
    return await this.prisma.user.update({
      where: { id: +id },
      data: {
        ...data,
      },
    });
  }

  /* ======================= DELETE USER =======================*/

  async remove(id: number) {
    // check id
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new BadRequestException(`Người dùng không tồn tại!`);
    } else {
      // Xoá user
      return await this.prisma.user.delete({
        where: { id },
      });
    }
  }
}
