import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new ConflictException('Email already registered');
      }
      if (dto.phone && existingUser.phone === dto.phone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    // Hash password
    const saltRounds = this.config.get<number>('BCRYPT_SALT_ROUNDS') || 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Generate email verification token
    const verificationToken = await this.createEmailVerificationToken(user.email);

    // TODO: Send verification email via SendGrid
    // await this.sendVerificationEmail(user.email, verificationToken);

    // Return user without password
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  async login(dto: LoginDto) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is banned
    if (user.isBanned) {
      throw new UnauthorizedException('Your account has been suspended. Please contact support.');
    }

    // Verify password
    const passwordValid = await bcrypt.compare(dto.password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Return user without password
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_SECRET'),
      });

      // Check if token exists in database and is not revoked
      const storedToken = await this.prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          userId: payload.sub,
          isRevoked: false,
        },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.isBanned) {
        throw new UnauthorizedException('User not found or banned');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      // Revoke old refresh token
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });

      // Store new refresh token
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken: string) {
    // Revoke refresh token
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        token: refreshToken,
      },
      data: {
        isRevoked: true,
      },
    });

    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // Generate reset token
    const resetToken = await this.createPasswordResetToken(email);

    // TODO: Send password reset email via SendGrid
    // await this.sendPasswordResetEmail(email, resetToken);

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    // Find valid reset token
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = this.config.get<number>('BCRYPT_SALT_ROUNDS') || 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await this.prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Revoke all refresh tokens for this user
    const user = await this.prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (user) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: user.id },
        data: { isRevoked: true },
      });
    }

    return { message: 'Password reset successfully' };
  }

  async verifyEmail(token: string) {
    // Find valid verification token
    const verificationToken = await this.prisma.emailVerificationToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verificationToken) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Update user email verification status
    await this.prisma.user.update({
      where: { email: verificationToken.email },
      data: { emailVerified: true },
    });

    // Mark token as used
    await this.prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { used: true },
    });

    return { message: 'Email verified successfully' };
  }

  // Helper methods
  private async generateTokens(userId: string, email: string, role: string) {
    const payload = {
      sub: userId,
      email,
      role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN') || '7d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '30d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    };
  }

  private async storeRefreshToken(userId: string, token: string) {
    const expiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN') || '30d';
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  private async createEmailVerificationToken(email: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    await this.prisma.emailVerificationToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    return token;
  }

  private async createPasswordResetToken(email: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now

    await this.prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    return token;
  }
}
