import { auth } from '../middlewares';
import { recieveNotification, removeNotification } from './notification.entity';


export default function notification() {
  /**
   * GET /notification
   * @description this route is insert a category.
   * @response the notification.
   */
  this.route.get('/notification', auth, recieveNotification(this));
  // this.route.get('/moja', auth, sendNotification(this.db, this.ws, [], 'Hello its moja'));

  /**
 * POST /notification/:id
 * @description this route is used to remove a single notification
 * @response the notification.
 */
  this.route.delete('/notification/:id', auth, removeNotification(this));
}