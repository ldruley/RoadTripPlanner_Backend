import { Injectable, Logger } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth-guard';

export class DebugJwtAuthGuard extends JwtAuthGuard {
  private logger = new Logger('DebugJwtAuthGuard');

  async canActivate(context) {
    this.logger.debug('DebugJwtAuthGuard.canActivate called');
    try {
      const result = await super.canActivate(context);
      // eslint-disable-next-line @typescript-eslint/no-base-to-string,@typescript-eslint/restrict-template-expressions
      this.logger.debug(`Guard result: ${result}`);
      return result;
    } catch (error) {
      this.logger.error(`Guard error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
