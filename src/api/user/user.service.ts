import { Service } from 'typedi';

@Service()
export class UserService {
  public findAll() {
    return 'this method returns all users';
  }
}
