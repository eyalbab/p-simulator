import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User, UserDocument } from './schemas/user.schema';

type AuthUserResponse = {
  id: string;
  email: string;
  name: string;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ token: string }> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    let user: UserDocument;
    try {
      user = await this.userModel.create({
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        name: dto.name,
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }

    const token = await this.generateToken(user);
    return { token };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ token: string; user: AuthUserResponse }> {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = await this.generateToken(user);
    return {
      token,
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
      },
    };
  }

  async validateUserById(userId: string): Promise<AuthUserResponse> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      id: String(user._id),
      email: user.email,
      name: user.name,
    };
  }

  private async generateToken(user: UserDocument): Promise<string> {
    return this.jwtService.signAsync({
      sub: String(user._id),
      email: user.email,
    });
  }
}
