import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';

export interface GithubProfile {
  githubId: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || 'missing_client_id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'missing_client_secret',
      callbackURL:
        process.env.GITHUB_CALLBACK_URL ||
        'http://localhost:8000/api/v1/auth/github/callback',
      scope: ['user:email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): void {
    const { id, displayName, emails, photos } = profile;

    const githubProfile: GithubProfile = {
      githubId: id,
      email: emails?.[0]?.value ?? '',
      name: displayName ?? '',
      firstName: ' ',
      lastName: '',
      avatar: photos?.[0]?.value ?? '',
    };

    done(null, githubProfile);
  }
}
