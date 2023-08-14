import Support from './support.schema';
import { sendMessageEvent } from '../messages/message.entity';
import { sendNotification } from '../notification/notification.function';
import Message from '../messages/message.schema';

/**
 * these are the set to validate the request body or query.
 */
const supportUpdateAllowed = new Set(['status', 'staff']);

/**
 * @param registerSupport function is used to create a support chat
 * @param {Object} req This is the req object.
 * @returns the support and the message sent by user and emits a message in admin
 */
export const registerSupport = ({ db, ws }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' || req.body[k] !== undefined);
    if (!validobj) res.status(400).send({ message: 'Bad Request', status: false });
    const supportDoc = {
      user: req.user.id,
      type: req.body.type
    };
    const support = await db.create({ table: Support, key: supportDoc });
    const messageDoc = {
      support: support.id,
      message: req.body.message,
      sender: req.user.id,
    };
    const message = await db.create({ table: Message, key: messageDoc });
    if (!support) return res.status(400).send({ message: 'Bad Request', status: false });
    sendNotification(db, ws, [{ 'role': 'staff' }, { 'access': 'support' }], 'There is a new suport request', 'account');
    await sendMessageEvent(ws, support.id, message);
    res.status(200).send(support);
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param getAllSupport function is used to get all the Support
 * @param {Object} req - The request object have the information filter.
 * @returns all the support
 */
export const getAllSupport = ({ db }) => async (req, res) => {
  try {
    const support = await db.find({
      table: Support, key: { paginate: false, populate: { path: 'user staff', select: 'fullName email' } }
    });
    support ? res.status(200).send(support) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param getSingleSupport function is used to get a signle support
 * @param req.params.id This is the id of the request.
 * @returns the request request
 */
export const getSingleSupport = ({ db }) => async (req, res) => {
  try {
    if (!req.params.id) return res.status(400).send({ message: 'Bad Request', status: false });
    const support = await db.findOne({
      table: Support, key: {
        id: req.params.id, paginate: false, populate: {
          path: 'user staff', select: 'fullName email'
        }
      }
    });
    support ? res.status(200).send(support) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param updateSupport function updates the single order by id
 * @param req.params.id is the id of the support sent in the params
 * @returns the support
 */
export const updateSupport = ({ db }) => async (req, res) => {
  try {
    const isValid = Object.keys(req.body).every(k => supportUpdateAllowed.has(k));
    if (!isValid) return res.status(400).send({ message: 'Bad Request', status: false });
    const support = await db.update({ table: Support, key: { id: req.params.id, body: req.body } });
    support ? res.status(200).send(support) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param acceptSupport function joins the support staff to the user support chat room
 * @param req.params.id is the id of the support sent in the params
 * @returns the support
 */
export const acceptSupport = ({ db, ws }) => async (req, res) => {
  try {
    if (!req.params.id) return res.status(400).send({ message: 'Bad Request', status: false });
    const support = await db.findOne({ table: Support, key: { id: req.params.id } });
    if (!support || support.staff) return res.status(400).send({ message: 'No room for new staff', status: false });
    support.staff = req.user.id;
    support.save();
    sendNotification(db, ws, [{ '_id': support.user }], 'Your support request has been accepted. Please check', 'account');
    res.status(200).send(support);
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param removeSupport function removes the support by the id array
 * @param req.params.id is the id of the Support sent in the params
 * @returns success or failed
 */
export const removeSupport = ({ db }) => async (req, res) => {
  try {
    if (!req.body.id.length) return res.send(400).send({ message: 'Bad Request', status: false });
    const support = await db.removeAll({ table: Support, key: { id: { $in: req.body.id } } });
    support.deletedCount < 1 ? res.status(400).send({ message: 'Coupon not found' }) : res.status(200).send({ message: 'Deleted Successfully', status: true });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param entry function is used to join a user/staff to the room
 * @param {Object} req - The request object have the information about page and any other filter.
 * @returns the messages of the support chat
 */
export const entry = async ({ data, session }) => {
  try {
    const { entry, room } = data;
    if (!session.user) throw new Error({ message: 'Bad Request', status: false });
    if (entry) {
      return session.join(room);
    }
    session.leave(room);
  }
  catch (err) {
    console.log(err);
  }
};
