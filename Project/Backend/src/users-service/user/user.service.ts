import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { UpdateProfileDto, ChangePasswordDto } from '../dto';

/**
 * Utility function to strip sensitive data (password) before sending user payload to the caller.
 * @param user - The raw User entity object
 * @returns - A sanitized user object without the password field
 */
function stripPassword(user: User): Omit<User, 'password'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = user;
  return rest;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Retrieves the sanitized profile data for a given user.
   *
   * @param userId - UUID of the user
   * @returns Sanitized User object
   * @throws NotFoundException if user is not found
   */
  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return stripPassword(user);
  }

  /**
   * Updates partial fields of a user's profile and returns the updated sanitized profile.
   *
   * @param userId - UUID of the user
   * @param dto - Data Transfer Object containing updatable fields like avatar, bio, and coverPhoto
   * @returns Updated sanitized User object
   * @throws NotFoundException if user is not found
   */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.timezone !== undefined) user.timezone = dto.timezone;
    if (dto.preferences !== undefined) user.preferences = dto.preferences;
    if (dto.country !== undefined) user.country = dto.country;
    if (dto.city !== undefined) user.city = dto.city;
    if (dto.postalCode !== undefined) user.postalCode = dto.postalCode;
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.dob !== undefined) user.dob = dto.dob;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;
    if (dto.coverPhoto !== undefined) user.coverPhoto = dto.coverPhoto;
    if (dto.bio !== undefined) user.bio = dto.bio;

    await this.userRepo.save(user);
    return stripPassword(user);
  }

  /**
   * Handles user password rotation. Validates old password and hashes the new one.
   *
   * @param userId - UUID of the user
   * @param dto - ChangePasswordDto containing old and new passwords
   * @returns Object indicating success flag
   * @throws ForbiddenException if trying to change Google OAuth passwords or wrong old password
   * @throws NotFoundException if user is not found
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ success: boolean }> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .where('user.id = :id', { id: userId })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.password) {
      throw new ForbiddenException(
        'Cannot change password for an account created with Google Sign-in',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new ForbiddenException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepo.save(user);
    return { success: true };
  }

  /**
   * Retrieves a paginated list of all users, typically utilized by admin dashboards.
   *
   * @param page - Current page number (1-indexed)
   * @param limit - Count of items per page
   * @returns Object containing a paginated array of sanitized users and the total count
   */
  async adminListUsers(
    page = 1,
    limit = 20,
  ): Promise<{ data: Omit<User, 'password'>[]; total: number }> {
    const [users, total] = await this.userRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const data = users.map(stripPassword);
    return { data, total };
  }

  /**
   * Toggles a user's active status (suspend/activate). Protects admin accounts from suspension.
   *
   * @param userId - UUID of the user
   * @returns Updated sanitized User object
   * @throws NotFoundException if user is not found
   * @throws ForbiddenException if attempting to lock an admin scope account
   */
  async adminToggleUser(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .where('user.id = :id', { id: userId })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot disable admin account');
    }

    user.isActive = !user.isActive;
    await this.userRepo.save(user);
    return stripPassword(user);
  }

  /**
   * A low-level fetch utility useful for internal microservice pipeline interactions.
   * Skips stripping password.
   *
   * @param userId - UUID of the user
   * @returns Raw User entity or null
   */
  async findById(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId } });
  }
}
