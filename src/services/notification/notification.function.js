import User from '../user/user.schema';
import Notification from './notification.schema';

//   these are the set to validate the request query.
const allowedQuery = new Set(['$or']);

/**
 * @param sendNotification function is used to send the notifications of the user
 * @returns true/false
 */
export const sendNotification = async (db, ws, query, message, type) => {
  try {
    const users = await db.find({ table: User, key: { query: { '$or': query }, allowedQuery: allowedQuery, paginate: false } });
    const docs = new Set(users.map(user => ({ user: user._id.toString(), message, type, time: Date.now() })));
    const notification = await db.bulkCreate({ table: Notification, docs: [...docs] });
    if (!notification.length) return false;
    ws.to([...docs].map(doc => doc.user)).emit('notification', { message, type, time: Date.now() });
    return true;
  }
  catch (err) {
    console.log(err);
  }
};