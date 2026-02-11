import * as bcrypt from 'bcrypt';

const saltRound = 10;
export const hashPassword = async (plainPassword: string): Promise<string> => {
  try {
    return await bcrypt.hash(plainPassword, saltRound);
  } catch (error) {
    throw error;
  }
};

export const comparePassword = async (
  plainPassword: string,
  hashPassword: string,
): Promise<boolean> => {
  try {
    return await bcrypt.compare(plainPassword, hashPassword);
  } catch (error) {
    throw error;
  }
};
