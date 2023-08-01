import generateMailTemplate from '../../utils/generateMailTemplate';
import Products from '../product/product.schema';
import Request from '../request/request.schema';
import Discount from '../discount/discount.schema';
import Cart from '../cart/cart.schema';
// import User from '../user/user.schema';
import Orders from './order.schema';
import fs from 'fs';
import path from 'path';

/**
 * these are the set to validate the request query.
 */
const allowedQuery = new Set(['page', 'limit', 'sort', 'orderNumber']);

/**
 * @param preparedata function prepares the total product category and product name for ssl commerz
 * @param {price,tax,fee,quantity,productname, productcategory}
 * after order the selected item quantity is subtracted from the main product collection
 */

/**
 * This function is for payment through ssl commerz
 * Discount conditions are checked if there are any
 * @param discountItemsTotal calculates the total price of the items where discount is applicable
 * @param nondiscountItemsTotal calculates the total price of the items where discount is not applicable
 * @param {Object} req - The request object have the information about the order, userid and productid.
 * after order the selected item quantity is subtracted from the main product collection
 * @redirects to the success, fail or cancel url
 */
export const registerOrder = ({ db, sslcz }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' && req.body[k] !== null);
    if (!validobj) return res.status(400).send('Bad request');
    let discount;
    if (req.body.discountApplied) {
      discount = await db.findOne({ table: Discount, key: { code: req.body.discountApplied, paginate: false } });
      if (!discount) return res.status(404).send({ message: 'Coupon not found' });
      if (new Date(discount.expiry_date) < new Date()) return res.status(404).send({ message: 'Coupon expired' });
      if (discount.limit < discount.usedBy.length) return res.status(404).send({ message: 'Coupon expired' });
      const used = discount.usedBy.find(user => { return user.user.toString() === req.user.id; });
      if (used) return res.status(404).send({ message: 'Bad request' });
    }
    let productNames = [];
    let productCategories = [];
    let totalPrice = 0, discountItemsTotal = 0, nondiscountItemsTotal = 0;
    if (req.body?.products) {
      for (const product of req.body.products) {
        const element = await db.findOne({ table: Products, key: { id: product.product } });
        if (element.quantity < product.productQuantity) return res.status(400).send(`${element.name} is out of stock.`);
        discount && element.category.toString() == discount.category && element.subcategory.toString() == discount.subcategory
          ? (discountItemsTotal += (element.price + element.tax + element.fee) * product.productQuantity)
          : (nondiscountItemsTotal += (element.price + element.tax + element.fee) * product.productQuantity);
        productNames.push(element.name);
        productCategories.push(element.category.name);
        const newQuantity = element.quantity - product.productQuantity;
        element.quantity = newQuantity;
        await element.save();
      }
    }
    !discount ? totalPrice = nondiscountItemsTotal : discount.percentage ? totalPrice = ((discountItemsTotal * (100 - discount.percentage)) / 100) + nondiscountItemsTotal : totalPrice = (discountItemsTotal - discount.amount) + nondiscountItemsTotal;
    if (req.body?.requests) {
      for (const request of req.body.requests) {
        const element = await db.findOne({ table: Request, key: { id: request.request } });
        productNames.push(element.name);
        productCategories.push('request');
        totalPrice += (element.price + element.tax + element.fee) * request.requestQuantity;
      }
    }
    req.body.user = req.user.id;
    req.body.insideDhaka ? totalPrice += 99 : totalPrice += 150;
    const order = await db.create({ table: Orders, key: req.body });
    if (!order) return res.status(400).send('Bad request');
    const data = {
      total_amount: totalPrice.toFixed(2),
      currency: 'BDT',
      tran_id: `${'PP' + Date.now().toString(36).toUpperCase()}`,
      success_url: `http://localhost:4000/api/ordersuccess/${order.id}`,
      fail_url: 'http://localhost:4000/api/orderfail',
      cancel_url: 'http://localhost:4000/api/orderfail',
      ipn_url: 'http://localhost:4000/api/orderipn',
      shipping_method: 'Courier',
      product_name: `${productNames.join()}`,
      product_category: `${productCategories.join()}`,
      product_profile: 'general',
      cus_name: `${order.shippingaddress.name ? order.shippingaddress.name : req.user.name}`,
      cus_email: `${order.email}`,
      cus_add1: `${order.shippingaddress.address}`,
      cus_add2: `${order.shippingaddress.address}`,
      cus_city: `${order.shippingaddress.city}`,
      cus_state: `${order.shippingaddress.city}`,
      cus_postcode: `${order.shippingaddress.zip}`,
      cus_country: 'Bangladesh',
      cus_phone: `${order.phone}`,
      ship_name: `${order.shippingaddress.name ? order.shippingaddress.name : req.user.fullName}`,
      ship_add1: `${order.shippingaddress.address}`,
      ship_add2: `${order.shippingaddress.address}`,
      ship_city: `${order.shippingaddress.city}`,
      ship_state: `${order.shippingaddress.city}`,
      ship_postcode: `${order.shippingaddress.zip}`,
      ship_country: 'Bangladesh',
      emi_option: 0,
      value_a: `${req.body.cart}`,
    };
    console.log(data);
    sslcz.init(data).then(apiResponse => {
      let GatewayPageURL = apiResponse.GatewayPageURL;
      order.sessionkey = apiResponse.sessionkey;
      order.total = totalPrice;
      order.save();
      res.send({ url: GatewayPageURL });
    });
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * This function updates status of the order and clears the user cart after successful payment
 * @param {Object} req - The request object have the response from ssl commerz.
 * @returns {Object} the order
 */
// eslint-disable-next-line no-unused-vars
export const orderSuccess = ({ db, mail }) => async (req, res) => {
  try {
    const order = await db.update({
      table: Orders, key: {
        id: req.params.id, body: {
          val_id: req.body.val_id,
          trxID: req.body.tran_id,
          bankTranid: req.body.bank_tran_id,
          status: 'paid'
        }, populate: { path: 'products.product requests.request' }
      }
    });
    // need to update cart
    // const cart = await db.update({ table: Cart, key: { id: req.body.value_a, } });
    const emailTemplate = fs.readFileSync(path.join(__dirname, 'order.ejs'), 'utf-8');
    const options = {
      order: order,
      serverLink: 'http://localhost:4000/',
      homeLink: 'http://localhost:5173/'
    };
    // eslint-disable-next-line no-unused-vars
    const html = generateMailTemplate(emailTemplate, options);
    // order.email is need to be put into the reciever
    // mail({ receiver: 'yeasir06@gmail.com', subject: 'Order mail', body: html, type: 'html' });
    // if (req.body.val_id) {
    //   res.redirect('http://localhost:5173');
    // }
    res.send(order);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * This function deletes the order after failed payment
 * @param {Object} req - The request object have the information about page and any other filter.
 * @returns {Object} the order
 */
export const orderFail = ({ db }) => async (req, res) => {
  try {
    const order = await db.update({
      table: Orders, key: {
        id: req.params.id, body: {
          failedReason: req.body.failedreason
        }, populate: { path: 'products.product requests.request' }
      }
    });
    console.log(order);
    res.send(order);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * This function gets all the orders in the database
 * @param {Object} req - The request object have the information about page and any other filter.
 * @returns {Object} all the orders
 */
export const getAllOrders = ({ db }) => async (req, res) => {
  try {
    const orders = await db.find({
      table: Orders, key: {
        query: req.query, allowedQuery: allowedQuery, paginate: true, populate: {
          path: 'user products.product requests.request', select: 'fullName email phone address productName description origin images quantity price category tags link status'
        }
      }
    });
    if (!orders) return res.status(400).send('Bad request');
    return res.status(200).send(orders);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param getSingleOrder function is used to get a single order from the orders collection
 * @param req.params.id This is the id of the order.
 * @returns the order
 */
export const getSingleOrder = ({ db }) => async (req, res) => {
  try {
    const order = await db.findOne({ table: Orders, key: { id: req.params.id, populate: { path: 'user products.product' } } });
    if (!order) return res.status(400).send('Bad request');
    return res.status(200).send(order);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param getUserOrder function is used to get a single order from the orders collection
 * @param req.params.id This is the id of the user.
 * @returns the order
 */
export const getUserOrder = ({ db }) => async (req, res) => {
  try {
    const order = await db.findOne({ table: Orders, key: { user: req.user.id, populate: { path: 'user products.product' } } });
    if (!order) return res.status(400).send('Bad request');
    return res.status(200).send(order);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};


/**
 * @param updateOrder function updates the single order by id
 * @param req.params.id is the id of the product sent in the params
 * @returns the order after update
 */
export const updateOrder = ({ db }) => async (req, res) => {
  try {
    const order = await db.update({ table: Orders, key: { id: req.params.id, body: req.body } });
    if (!order) return res.status(400).send('Bad request');
    return res.status(200).send(order);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param removeOrder function updates the single order by id
 * @param req.params.id is the id of the product sent in the params
 * @returns successful or failed
 */
export const removeOrder = ({ db }) => async (req, res) => {
  try {
    const order = await db.remove({ table: Orders, key: { id: req.params.id } });
    if (!order) return res.status(404).send({ message: 'Order not found' });
    res.status(200).send({ message: 'Deleted Successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};


// {
//   tran_id: 'REF1234',
//     val_id: '2307311711580TpruhTouBEb4Gf',
//       amount: '100.00',
//         card_type: 'VISA-Dutch Bangla',
//           store_amount: '97.50',
//             card_no: '418117XXXXXX7814',
//               bank_tran_id: '230731171158SpmdpoZNvCMQ6FL',
//                 status: 'VALID',
//                   tran_date: '2023-07-31 17:11:40',
//                     error: '',
//                       currency: 'BDT',
//                         card_issuer: 'TRUST BANK, LTD.',
//                           card_brand: 'VISA',
//                             card_sub_brand: 'Classic',
//                               card_issuer_country: 'Bangladesh',
//                                 card_issuer_country_code: 'BD',
//                                   store_id: 'yeasi64c7803069071',
//                                     verify_sign: '2421d0d4ff9d0558b3a71bc07e161ccc',
//                                       verify_key: 'amount,bank_tran_id,base_fair,card_brand,card_issuer,card_issuer_country,card_issuer_country_code,card_no,card_sub_brand,card_type,currency,currency_amount,currency_rate,currency_type,error,risk_level,risk_title,status,store_amount,store_id,tran_date,tran_id,val_id,value_a,value_b,value_c,value_d',
//                                         verify_sign_sha2: '1009b17045229680b00d27bc4c689aec09bf8b99344101936de43eb813f7d0aa',
//                                           currency_type: 'BDT',
//                                             currency_amount: '100.00',
//                                               currency_rate: '1.0000',
//                                                 base_fair: '0.00',
//                                                   value_a: '',
//                                                     value_b: '',
//                                                       value_c: '',
//                                                         value_d: '',
//                                                           subscription_id: '',
//                                                             risk_level: '0',
//                                                               risk_title: 'Safe'
// }