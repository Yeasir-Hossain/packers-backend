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
export const sendMessage = ({ db }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' && req.body[k] !== null);
    if (!validobj) res.status(400).send('Bad request');
    if (!req.body.support) return res.status(400).send('Bad request');
    req.body.sender = req.user.id;
    const message = await db.create({ table: Message, key: req.body });
    if (!message) return res.status(400).send('Bad request');
    // message socket format
    // {message, sender, reciever, time}
    res.status(200).send(message);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
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