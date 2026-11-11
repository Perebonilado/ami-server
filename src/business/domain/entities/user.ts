export interface UserProps {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  businessName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  verified: boolean;
  suspended: boolean;
}

export class User {
  constructor(public readonly props: UserProps) {}

  get id() {
    return this.props.id;
  }
  get name() {
    return this.props.name;
  }
  get email() {
    return this.props.email;
  }
  get isAdmin() {
    return this.props.isAdmin;
  }
  get suspended() {
    return this.props.suspended;
  }
}
