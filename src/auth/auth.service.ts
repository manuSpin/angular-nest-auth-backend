import { LoginDto } from './dto/login.dto';
import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/auth.entity';
import { Model } from 'mongoose';
import * as bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload';
import { LoginResponse } from './interfaces/login-response';
import { CreateUserDto, RegisterUserDto, UpdateAuthDto } from './dto';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService
  ) { }


  public async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const { password, ...userData } = createUserDto;
      const newUser = new this.userModel({
        password: bcryptjs.hashSync(password, 10),
        ...userData
      });

      await newUser.save();

      const { password: _, ...user } = newUser.toJSON();

      return user;

    } catch (error) {
      if (error.code = 11000) {
        throw new BadRequestException(createUserDto.email + ' already exist.');
      } else {
        throw new InternalServerErrorException('Something went wrong.');
      }
    }
  }

  public async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Not valid credentials - email.');
    }

    if (!bcryptjs.compareSync(password, user.password)) {
      throw new UnauthorizedException('Not valid credentials - password');
    }

    const { password: _, ...rest } = user.toJSON();

    return {
      user: rest,
      token: this.getJwtToken({ id: user.id })
    }
  }

  public getJwtToken(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

  public async register(registerDto: RegisterUserDto): Promise<LoginResponse> {

    const user: User = await this.create(registerDto);

    return {
      user: user,
      token: this.getJwtToken({ id: user._id })
    }
  }

  public findAll() {
    return this.userModel.find();
  }

  public async findUserById(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    const {password, ...rest } = user.toJSON();

    return rest;
  }

  public checkToken(user: User): LoginResponse {

    return { user: user, token: this.getJwtToken({id: user._id})}
  }

  // public findOne(id: number) {
  //   return `This action returns a #${id} auth`;
  // }

  // public update(id: number, updateAuthDto: UpdateAuthDto) {
  //   return `This action updates a #${id} auth`;
  // }

  // public remove(id: number) {
  //   return `This action removes a #${id} auth`;
  // }
}
