import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';

export interface FacebookProfile {
  facebookId: string;
  email: string;
  name: string;
  avatar: string;
}

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: process.env.FACEBOOK_APP_ID || 'missing_app_id',
      clientSecret: process.env.FACEBOOK_APP_SECRET || 'missing_app_secret',
      callbackURL:
        process.env.FACEBOOK_CALLBACK_URL ||
        'http://localhost:8000/api/v1/auth/facebook/callback',
      scope: ['email'],
      profileFields: ['id', 'displayName', 'emails', 'photos'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { id, displayName, emails, photos } = profile;

    const facebookProfile: FacebookProfile = {
      facebookId: id,
      email: emails?.[0]?.value ?? '',
      name: displayName ?? '',
      avatar: photos?.[0]?.value ?? '',
    };

    done(null, facebookProfile);
  }
}
