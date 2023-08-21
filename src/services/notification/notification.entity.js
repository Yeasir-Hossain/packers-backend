import Notification from './notification.schema';


// these are the set to validate the query.
const allowedQuery = new Set(['user', 'sortBy']);

/**
 * @param recieveNotification function is used to recieve all the notifications of the user
 * @param {Object} req This is the req object.
 * @returns
 */
export const recieveNotification = ({ db }) => async (req, res) => {
  try {
    const notification = await db.find({ table: Notification, key: { query: { user: req.user.id, sortBy: 'time:desc' }, allowedQuery: allowedQuery, paginate: false } });
    notification ? res.status(200).send(notification) : res.status(400).send({ message: 'No Notifications Found', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param removeNotification function is used to remove one notification
 * @param {Object} req This is the req object.
 * @returns
 */
export const removeNotification = ({ db }) => async (req, res) => {
  try {
    const notification = await db.remove({ table: Notification, key: { id: req.params.id } });
    notification ? res.status(200).send({ message: 'Deleted Successfully', status: true }) : res.status(400).send({ message: 'Notification not found', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};