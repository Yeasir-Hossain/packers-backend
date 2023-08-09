import Notification from './notification.schema';


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