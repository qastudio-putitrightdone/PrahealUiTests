import { User } from './User';

export class Users {
  static readonly SUPER_ADMIN = new User('Super Admin', '8888888888', 'admin@123');
  static readonly MEDICAL_DIRECTOR = new User('Medical Director', '', '');
  static readonly CONSULTANT = new User('Consultant', '', '');
  static readonly RECEPTIONIST = new User('Receptionist', '', '');
}

export const { SUPER_ADMIN, MEDICAL_DIRECTOR, CONSULTANT, RECEPTIONIST } = Users;
