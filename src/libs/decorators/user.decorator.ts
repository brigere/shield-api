import { createParamDecorator } from 'routing-controllers';

export function CurrentUser() {
  return createParamDecorator({
    required: true,
    value: (action): AuthenticatedUser => {
      return action.request.user as AuthenticatedUser;
    },
  });
}

export type AuthenticatedUser = {
  userId: number;
  email: string;
};
