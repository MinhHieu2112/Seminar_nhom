import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';

export interface LinkedinProfile {
  linkedinId: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

@Injectable()
export class LinkedinStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor() {
    super({
      clientID: process.env.LINKEDIN_CLIENT_ID || 'missing_client_id',
      clientSecret:
        process.env.LINKEDIN_CLIENT_SECRET || 'missing_client_secret',
      callbackURL:
        process.env.LINKEDIN_CALLBACK_URL ||
        'http://localhost:8000/api/v1/auth/linkedin/callback',
      scope: ['openid', 'profile', 'email'],
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      profileURL: 'https://api.linkedin.com/v2/userinfo',
      state: false,
    } as any);
  }

  userProfile(accessToken: string, done: (err?: any, profile?: any) => void) {
    const oauth2 = (this as any)._oauth2;
    // Force the use of Authorization: Bearer <token> header for OIDC
    // Note: the oauth library has a typo in this method name (lowercase 'f')
    oauth2.useAuthorizationHeaderforGET(true);

    oauth2.get(
      'https://api.linkedin.com/v2/userinfo',
      accessToken,
      (err: any, body: any) => {
        if (err) {
          // Log chi tiết lỗi ra Terminal để "bắt bệnh"
          console.error('LinkedIn API Error:', err);

          // Trả về thông báo lỗi chi tiết hơn thay vì undefined
          const errorMsg = err.data
            ? JSON.parse(err.data).message
            : 'Unknown Error';
          return done(new Error(`LinkedIn Profile Fetch Failed: ${errorMsg}`));
        }
        try {
          const json = JSON.parse(body);
          done(null, json);
        } catch (e) {
          done(e);
        }
      },
    );
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: (err: any, user: any, info?: any) => void,
  ): void {
    // LinkedIn OIDC returns profile in an OIDC-standard format
    // Map fields carefully based on the new OIDC response structure
    const linkedinProfile: LinkedinProfile = {
      linkedinId: profile.sub || profile.id,
      email: profile.email || profile.emails?.[0]?.value || '',
      name:
        profile.name ||
        (profile.given_name
          ? `${profile.given_name} ${profile.family_name}`
          : '') ||
        profile.displayName ||
        '',
      firstName: profile.given_name || '',
      lastName: profile.family_name || '',
      avatar: profile.picture || profile.photos?.[0]?.value || '',
    };

    done(null, linkedinProfile);
  }
}
