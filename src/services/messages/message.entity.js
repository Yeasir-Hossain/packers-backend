import Message from './message.entity';

/**
 * these are the set to validate the request query.
 */
const allowedQuery = new Set(['support', 'page', 'limit']);

/**
 * @param sendMessage function is used to recieve message from the user
 * @param {Object} req This is the req object.
 * @returns the message
 */
export const sendMessage = async ({ ws, db }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' && req.body[k] !== null);
    if (!validobj) res.status(400).send('Bad request');
    const messageDoc = {
      support: req.params.id,
      message: req.body.message,
      sender: req.user.id,
    };
    sendMessageEvent(ws, db, req.params.id, messageDoc);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param sendMessageEvent function is used to create a message for the support chat and send it to the reciever
 * @param {Object} req This is the req object.
 * @returns the message
 */
export const sendMessageEvent = async (ws, db, room, msgdoc) => {
  try {
    const message = await db.create({ table: Message, key: msgdoc });
    if (!message) throw new Error('message not saved');
    ws.to(room).emit('message', message);
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