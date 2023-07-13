import demo from './demo/demo';
import order from './order/order';
import product from './product/product';
import user from './user/user';

export const services = (app) => {
  app.configure(demo);
  app.configure(user);
  app.configure(product);
  app.configure(order);
};
