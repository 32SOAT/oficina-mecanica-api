import { Injectable, Inject } from '@nestjs/common';
import { AuthenticatedUserReadModel, LoginReadModel } from '../read-models/auth-read-model';
import { TOKEN_SERVICE, TokenService } from '../ports/token.service.port';

@Injectable()
export class IssueAuthTokenUseCase {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  execute(user: AuthenticatedUserReadModel): LoginReadModel {
    const token = this.tokenService.sign({
      sub: user.id,
      email: user.email,
      username: user.username,
    });

    return { user, token };
  }
}
