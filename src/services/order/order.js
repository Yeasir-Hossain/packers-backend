import { getAllOrders, getSingleOrder, registerOrder, removeOrder } from './order.entity';

export default function order() {

  /**
   * POST /order
   * @description this route is insert a order
   * @response the order.
   */
  this.route.post('/order', registerOrder(this));

  /**
   * GET /order
   * @description this route is used to get all orders.
   * @response all the orders.
   */
  this.route.get('/order', getAllOrders(this));

  // /**
  //  * GET /order/:id
  //  * @description this route is used to get a single order.
  //  * @response the order that the user is looking for.
  //  */
  this.route.get('/order/:id', getSingleOrder(this));

  /**
   * GET /products/:id
   * @description this route is used to delete a single product.
   * @response success or failed
   */
  this.route.get('/order/:id', removeOrder(this));
}