import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';

@Injectable()
export class GoogleService {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(config.googleClientId);
  }

  async verifyToken(idToken: string) {
    const clientId = config.googleClientId;
    if (!clientId) {
      throw new UnauthorizedException('GOOGLE_CLIENT_ID not configured');
    }
    const ticket = await this.client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new UnauthorizedException('Invalid Google token');
    }
    if (!payload.email_verified) {
      throw new UnauthorizedException('Google email not verified');
    }
    if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
      throw new UnauthorizedException('Invalid token issuer');
    }
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  }
}
