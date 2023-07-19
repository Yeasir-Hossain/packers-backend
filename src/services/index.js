import cart from './cart/cart';
import category from './category/category';
import demo from './demo/demo';
import discount from './discount/discount';
import order from './order/order';
import product from './product/product';
import request from './request/request';
import user from './user/user';

export const services = (app) => {
  app.configure(demo);
  app.configure(user);
  app.configure(cart);
  app.configure(product);
  app.configure(order);
  app.configure(request);
  app.configure(category);
  app.configure(discount);
};