import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

// JWT_PUBLIC_KEY is read from process.env directly — valid exception for a
// shared package that cannot access a service's Zod config object.
// Every service that imports SharedMiddlewareModule must set JWT_PUBLIC_KEY
// as a base64-encoded RS256 public key PEM in its environment.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const publicKeyBase64 = process.env.JWT_PUBLIC_KEY;
    if (!publicKeyBase64) {
      throw new Error('JWT_PUBLIC_KEY environment variable is required');
    }
    const publicKey = Buffer.from(publicKeyBase64, 'base64').toString('utf8');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      algorithms: ['RS256'],
    });
  }

  validate(payload: JwtPayload): { userId: string; email: string } {
    return { userId: payload.sub, email: payload.email };
  }
}
