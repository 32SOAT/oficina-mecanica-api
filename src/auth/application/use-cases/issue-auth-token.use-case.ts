import { Inject } from '@nestjs/common';
import { AuthenticatedUserOutput, LoginOutput } from '../dto/auth.dto';
import { TOKEN_SERVICE, TokenService } from '../ports/token.service.port';

export class IssueAuthTokenUseCase {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  execute(user: AuthenticatedUserOutput): LoginOutput {
    const token = this.tokenService.sign({
      sub: user.id,
      email: user.email,
      username: user.username,
    });

    return { user, token };
  }
}
