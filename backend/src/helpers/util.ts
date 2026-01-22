import * as bcrypt from 'bcrypt';

const saltRound = 10;
export const hashPassword = async (plainPassword: string): Promise<string> => {
  try {
    return await bcrypt.hash(plainPassword, saltRound);
  } catch (error) {
    throw error;
  }
};
