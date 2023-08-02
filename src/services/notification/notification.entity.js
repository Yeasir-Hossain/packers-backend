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
 * @param sendNotification function is used to send the notifications of the user
 * @param {Object} req This is the req object.
 * @returns
 */
export const sendNotification = async (op, rooms, data) => {
  try {
    let docs = {};
    for (let user of rooms) {
      docs = {
        ...docs,
        user: user,
        notifications: {
          data
        }
      };
    }
    // const notification = await op.db.findOne({ table: Notification, key: { user: req.user.id } });
    if (!notification) {
      // const newnotification = await op.db.create({ table: Notification, key: { user: req.user.id, notifications: { data } } });
      op.ws.to(rooms).emit('notification', newnotification);
      return;
    }
    notification.notifications = [...(notification.notifications || []), { data }];
    notification.save();
    op.ws.to(rooms).emit('notification', notification);
    return;
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
    const notification = await db.findOne({ table: Notification, key: { user: req.user.id } });
    if (!notification) return res.status(400).send('Bad Request');
    const updatedNotifications = notification.notifications.filter(notification => { return notification.id != req.params.id; });
    notification.notifications = updatedNotifications;
    notification.save();
    res.status(200).send(notification);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};