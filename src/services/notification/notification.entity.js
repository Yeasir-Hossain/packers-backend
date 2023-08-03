import User from '../user/user.schema';
import Notification from './notification.schema';

/**
 * these are the set to validate the request query.
 */
const allowedQuery = new Set(['$or']);

/**
 * @param recieveNotification function is used to recieve all the notifications of the user
 * @param {Object} req This is the req object.
 * @returns
 */
export const recieveNotification = ({ db }) => async (req, res) => {
  try {
    const notification = await db.findOne({ table: Notification, key: { user: req.user.id } });
    if (!notification) return res.status(400).send([]);
    res.status(200).send(notification);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param sendNotification function is used to send the notifications of the user
 * @param {Object} req This is the req object.
 * @returns
 */
export const sendNotification = (db, ws, query, message, type) => async () => {
  try {
    const users = await db.find({ table: User, key: { query: { '$or': query }, allowedQuery: allowedQuery, paginate: false } });
    const docs = new Set(users.map(user => ({ user: user._id.toString(), message, type })));
    const notification = await db.bulkCreate({ table: Notification, docs: [...docs] });
    if (!notification.length) throw new Error('Cannot update notification');
    ws.to([...docs].map(doc => doc.user)).emit('notification', { message, type });
  }
  catch (err) {
    console.log(err);
  }
};

/**
 * @param removeNotification function is used to remove one notification
 * @param {Object} req This is the req object.
 * @returns
 */
export const removeNotification = ({ db }) => async (req, res) => {
  try {
    const notification = await db.findOne({ table: Notification, key: { id: req.params.id } });
    if (!notification) return res.status(404).send({ message: 'Notification not found' });
    res.status(200).send({ message: 'Deleted Successfully' });
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};