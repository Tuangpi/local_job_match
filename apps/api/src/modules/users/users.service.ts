import { prisma } from '../../lib/prisma.js';
import { notFound } from '../../common/errors.js';
import type { UpdateUserInput } from './users.schemas.js';

export interface CurrentUser {
  id: string;
  phone: string;
  name: string;
  preferredLanguage: string;
  status: string;
  roles: string[];
}

export async function getCurrentUser(userId: string): Promise<CurrentUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('User not found.');
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    preferredLanguage: user.preferredLanguage,
    status: user.status,
    roles: user.roles,
  };
}

export async function updateCurrentUser(
  userId: string,
  input: UpdateUserInput,
): Promise<CurrentUser> {
  const data: { name?: string; preferredLanguage?: string } = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.preferredLanguage !== undefined) data.preferredLanguage = input.preferredLanguage;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    preferredLanguage: user.preferredLanguage,
    status: user.status,
    roles: user.roles,
  };
}
