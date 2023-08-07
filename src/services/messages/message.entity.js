import Message from './message.entity';

/**
 * these are the set to validate the request query.
 */
const allowedQuery = new Set(['support', 'page', 'limit']);

/**
 * @param initiateMessage function is used to create a message for the support chat
 * @param {Object} req This is the req object.
 * @returns the message
 */
export const sendMessage = async (ws, db, room, sender, msg) => {
  try {
    const message = await db.create({ table: Message, key: { msg, sender } });
    if (!message) throw new Error('message not saved');
    // message socket format
    // {message, sender, reciever, time}
  }
  catch (err) {
    console.log(err);
  }
};

/**
 * @param getMessage function is used to create a message for the support chat
 * @param {Object} req - The request object have the information about page and any other filter.
 * @returns the messages of the support chat
 */
export const getMessage = ({ db }) => async (req, res) => {
  try {
    if (!req.params.id) return res.status(400).send('Bad request');
    const message = await db.find({ table: Message, key: { query: { support: req.params.id }, allowedQuery: allowedQuery } });
    if (!message) return res.status(400).send('Bad request');
    res.status(200).send(message);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};