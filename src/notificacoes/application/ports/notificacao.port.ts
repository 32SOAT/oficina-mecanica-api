import { EnviarEmailInput } from '../dto/enviar-email.input';

export const NOTIFICACAO_PORT = 'NOTIFICACAO_PORT';

export abstract class NotificacaoPort {
  abstract enviarEmail(input: EnviarEmailInput): Promise<void>;
}
