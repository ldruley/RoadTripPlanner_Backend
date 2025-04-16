import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { Request } from 'express';
import { OAuthUser } from '../../types/oauth-user.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    // Explicitly telling TypeScript I know these environment variables are defined
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email', 'profile'],
      passReqToCallback: true, // ✅ Enables access to `req` in validate
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;

    const email = emails?.[0]?.value;
    const username = email?.split('@')[0];
    const picture = photos?.[0]?.value;
    const fullname =
      `${name?.givenName ?? ''} ${name?.familyName ?? ''}`.trim();

    if (!email || !username) {
      throw new Error('Missing email or username from Google profile');
    }

    const user: OAuthUser = {
      email,
      fullname,
      username,
      picture,
    };

    const platform = req.query?.platform ?? req.headers['x-platform'] ?? 'web';

    const result = await this.authService.findOrCreateUserFromOAuth(user);

    // Attach platform info in case you want to handle it later
    return done(null, {
      ...result,
      platform,
    });
  }
}
