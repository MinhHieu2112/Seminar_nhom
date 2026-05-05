import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatar: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'missing_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'missing_client_secret',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:8000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  /**
   * Passport calls this after Google returns the OAuth code and exchanges it
   * for an access token. We extract the relevant profile fields and pass them
   * to the route handler via `req.user`.
   */
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { id, displayName, emails, photos } = profile;

    const googleProfile: GoogleProfile = {
      googleId: id,
      email: emails?.[0]?.value ?? '',
      name: displayName ?? '',
      avatar: photos?.[0]?.value ?? '',
    };

    done(null, googleProfile);
  }
}
