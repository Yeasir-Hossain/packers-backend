import generateMailTemplate from '../../utils/generateMailTemplate';
import Products from '../product/product.schema';
// import User from '../user/user.schema';
import Orders from './order.schema';
import fs from 'fs';
import path from 'path';

/**
 * these are the set to validate the request query.
 */
const allowedQuery = new Set(['page', 'limit', 'sort', 'orderNumber']);

/**
 * This function is for payment through ssl commerz
 * @param {Object} req - The request object have the information about the order, userid and productid.
 * after order the selected item quantity is subtracted from the main product collection
 * @redirects to the success, fail or cancel url
 */
export const registerOrder = ({ db, mail, sslcz }) => async (req, res) => {
  try {
    // const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' && req.body[k] !== null);
    // if (!validobj) res.status(400).send('Bad request');
    // req.body?.products?.map(async (product) => {
    //   const element = await db.findOne({ table: Products, key: { id: product.product } });
    //   if (element.quantity < product.productQuantity) return res.status(400).send(`${element.name} is out of stock.`);
    //   const newquantity = element.quantity - product.productQuantity;
    //   element.quantity = newquantity;
    //   await element.save();
    // });
    // req.body.user = req.user.id;
    const test = {
      name: 'hello',
      value: 'world',
    };
    const data = {
      total_amount: 100,
      currency: 'BDT',
      tran_id: 'REF1234', // use unique tran_id for each api call
      success_url: 'http://localhost:4000/api/ordersuccess',
      fail_url: 'http://localhost:3000/fail',
      cancel_url: 'http://localhost:3000/cancel',
      ipn_url: 'http://localhost:4000/api/ipn',
      shipping_method: 'Courier',
      product_name: 'Computer.',
      product_category: 'Electronic',
      product_profile: 'general',
      cus_name: 'Customer Name',
      cus_email: 'customer@example.com',
      cus_add1: 'Dhaka',
      cus_add2: 'Dhaka',
      cus_city: 'Dhaka',
      cus_state: 'Dhaka',
      cus_postcode: '1000',
      cus_country: 'Bangladesh',
      cus_phone: '01711111111',
      cus_fax: '01711111111',
      ship_name: 'Customer Name',
      ship_add1: 'Dhaka',
      ship_add2: 'Dhaka',
      ship_city: 'Dhaka',
      ship_state: 'Dhaka',
      ship_postcode: 1000,
      ship_country: 'Bangladesh',
      emi_option: 0,
      value_a: `${test}`
    };
    sslcz.init(data).then(apiResponse => {
      let GatewayPageURL = apiResponse.GatewayPageURL;
      res.redirect(GatewayPageURL);
      console.log('Redirecting to: ', GatewayPageURL);
    });
    // // payment method needs to be added here // order price discount calculation
    // const order = await db.create({ table: Orders, key: { body: req.body, populate: { path: 'user products.product requests.request', } } });
    // if (!order) return res.status(400).send('Bad request');
    // const emailTemplate = fs.readFileSync(path.join(__dirname, 'order.ejs'), 'utf-8');
    // const options = {
    //   order: order,
    //   serverLink: 'http://localhost:4000/',
    //   homeLink: 'http://localhost:4000/'
    // };
    // const html = generateMailTemplate(emailTemplate, options);
    // // req.user.email is need to be put into the reciever
    // mail({ receiver: 'yeasir06@gmail.com', subject: 'Order mail', body: html, type: 'html' });
    // return res.status(200).send(order);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * This function registers the order after successful payment
 * @param {Object} req - The request object have the information about page and any other filter.
 * @returns {Object} all the orders
 */

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