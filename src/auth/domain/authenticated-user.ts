export type AuthenticatedUserProps = {
  id: string;
  username: string;
  email: string;
};

export class AuthenticatedUser {
  readonly id: string;
  readonly username: string;
  readonly email: string;

  constructor(props: AuthenticatedUserProps) {
    this.id = props.id;
    this.username = props.username;
    this.email = props.email;
  }
}
