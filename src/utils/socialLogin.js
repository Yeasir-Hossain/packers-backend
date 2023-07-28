import User from '../services/user/user.schema';

/**
 * email permissions in facebook developer is needed to access the email from facebook profile
 * @param {*} all the params are the required felds in the user schema
 */
export default async function socialLogin(id, name, picture, email, db) {
  if (!email) email = id;
  const user = await db.findOne({ table: User, key: { email: email } });
  if (user) return user;
  const registereduser = await db.create({
    table: User, key: {
      fullName: name,
      email: email,
      avatar: picture
    }
  });
  if (!registereduser) return null;
  return registereduser;
}