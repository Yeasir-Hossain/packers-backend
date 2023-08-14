import Notification from './notification.schema';


/**
 * @param recieveNotification function is used to recieve all the notifications of the user
 * @param {Object} req This is the req object.
 * @returns
 */
export const recieveNotification = ({ db }) => async (req, res) => {
  try {
    const notification = await db.findOne({ table: Notification, key: { user: req.user.id } });
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