import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-discord';

export interface DiscordProfile {
  discordId: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor() {
    super({
      clientID: process.env.DISCORD_CLIENT_ID || 'missing_client_id',
      clientSecret:
        process.env.DISCORD_CLIENT_SECRET || 'missing_client_secret',
      callbackURL:
        process.env.DISCORD_CALLBACK_URL ||
        'http://localhost:8000/api/v1/auth/discord/callback',
      scope: ['identify', 'email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): void {
    const { id, username, email, avatar } = profile;

    // Discord avatar URL format
    const avatarUrl = avatar
      ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`
      : '';

    const discordProfile: DiscordProfile = {
      discordId: id,
      email: email ?? '',
      name: username ?? '',
      firstName: '',
      lastName: '',
      avatar: avatarUrl,
    };

    done(null, discordProfile);
  }
}
