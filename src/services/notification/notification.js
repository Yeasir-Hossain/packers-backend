import { auth } from '../middlewares';
import { recieveNotification, removeNotification } from './notification.entity';
import { sendNotification } from './notification.function';


export default function notification() {
  /**
   * GET /notification
   * @description this route is insert a category.
   * @response the notification.
   */
  this.route.get('/notification', auth, recieveNotification(this));
  this.route.get('/moja', auth, async () => {
    sendNotification(this.db, this.ws, [{ id: { $in: ['64b4cbc2bb769ae707dbfb4f'] } }], 'Hello its moja22', 'cart');
  });

  /**
 * POST /notification/:id
 * @description this route is used to remove a single notification
 * @response the notification.
 */
  this.route.delete('/notification/:id', auth, removeNotification(this));
}