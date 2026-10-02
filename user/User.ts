export class User {
  constructor(
    readonly role: string,
    readonly mobileNumber: string,
    readonly password: string,
  ) {}

  toString(): string {
    return this.role;
  }
}
