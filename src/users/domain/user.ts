export type UserProps = {
  id?: string;
  username: string;
  email: string;
  password?: string;
};

export class User {
  readonly id?: string;
  readonly username: string;
  readonly email: string;
  readonly password?: string;

  constructor(props: UserProps) {
    this.id = props.id;
    this.username = props.username;
    this.email = props.email;
    this.password = props.password;
  }

  static create(props: { username: string; email: string; password?: string }): User {
    return new User(props);
  }

  update(props: { username?: string; email?: string }): User {
    return new User({
      id: this.id,
      username: props.username ?? this.username,
      email: props.email ?? this.email,
      password: this.password,
    });
  }
}
