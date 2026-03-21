import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { exportJWK, importSPKI } from 'jose';
import { config } from '../config';

interface JwksResponse {
  keys: object[];
}

@ApiTags('jwks')
@Controller({ version: VERSION_NEUTRAL, path: '.well-known' })
export class JwksController {
  private cachedJwks: JwksResponse | null = null;

  @Get('jwks.json')
  @ApiOperation({ summary: 'Get JSON Web Key Set' })
  async getJwks(): Promise<JwksResponse> {
    if (this.cachedJwks) {
      return this.cachedJwks;
    }

    const publicKeyPem = Buffer.from(config.JWT_PUBLIC_KEY, 'base64').toString('utf8');
    const publicKey = await importSPKI(publicKeyPem, 'RS256');
    const jwk = await exportJWK(publicKey);

    this.cachedJwks = { keys: [{ ...jwk, alg: 'RS256', use: 'sig' }] };
    return this.cachedJwks;
  }
}
