import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './controllers/auth/auth.controller';
import { SessionGuard } from './guards/session/session.guard';
import { SessionsRepository } from './repositories/sessions/sessions.repository';
import { UsersRepository } from './repositories/users/users.repository';
import { AuthService } from './services/auth/auth.service';
import { PasswordHasher } from './services/password-hasher/password-hasher.service';
import { UserAccountsService } from './services/user-accounts/user-accounts.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordHasher,
    UsersRepository,
    SessionsRepository,
    UserAccountsService,
    // Registered here, not in core: the guard needs AuthService, and core may not
    // import a feature module. Global all the same — every route is denied by default.
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
  exports: [UserAccountsService],
})
export class AuthModule {}
