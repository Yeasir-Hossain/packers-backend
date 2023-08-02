import generateMailTemplate from '../../utils/generateMailTemplate';
import Products from '../product/product.schema';
import Request from '../request/request.schema';
import Discount from '../discount/discount.schema';
import Cart from '../cart/cart.schema';
import Orders from './order.schema';
import fs from 'fs';
import path from 'path';

/**
 * these are the set to validate the request query.
 */
const allowedQuery = new Set(['page', 'limit', 'sort', 'orderNumber']);

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

    // Fetch products and requests
    const { products, requests, discountApplied } = req.body;
    const productIds = products ? products.map((product) => product.product) : [];
    const requestIds = requests ? requests.map((request) => request.request) : [];
    const [productsData, requestsData] = await Promise.all([
      Products.find({ _id: { $in: productIds } }),
      Request.find({ _id: { $in: requestIds } }),
    ]);

    let totalPrice = 0;
    let productNames = [];
    let productCategories = [];
    let discountItemsTotal = 0;
    let nondiscountItemsTotal = 0;

    for (const orderedProduct of products) {
      const element = productsData.find((product) => orderedProduct.product.toString() === product._id.toString());
      if (!element) continue;
      if (element.quantity < orderedProduct.productQuantity) {
        return res.status(400).send(`${element.name} is out of stock.`);
      }
      const productPrice = element.price + element.tax + element.fee;
      if (discountApplied && element.category.toString() === discount.category && element.subcategory.toString() === discount.subcategory) {
        discountItemsTotal += productPrice * orderedProduct.productQuantity;
      } else {
        nondiscountItemsTotal += productPrice * orderedProduct.productQuantity;
      }
      productNames.push(element.name);
      productCategories.push(element.category.name);
      element.quantity -= orderedProduct.productQuantity;
      await element.save();
    }

    for (const orderedRequest of requests) {
      const element = requestsData.find((request) => orderedRequest.request.toString() === request._id.toString());
      if (!element) continue;
      productNames.push(element.name);
      productCategories.push('request');
      totalPrice += (element.price + element.tax + element.fee) * orderedRequest.requestQuantity;
    }

    // Discount calculation
    let discount = 0;
    if (discountApplied) {
      discount = await db.findOne({ table: Discount, key: { code: discountApplied, paginate: false } });
      if (!discount) return res.status(404).send({ message: 'Coupon not found' });
      const currentDate = new Date();
      if (new Date(discount.expiry_date) < currentDate) return res.status(404).send({ message: 'Coupon expired' });
      if (discount.limit < discount.usedBy.length) return res.status(404).send({ message: 'Coupon expired' });
      const used = discount.usedBy.find((user) => user.user.toString() === req.user.id);
      if (used) return res.status(404).send({ message: 'Bad request' });
      if (discount.percentage) {
        discount = (discountItemsTotal * discount.percentage) / 100;
      } else {
        discount = discount.amount;
      }
    }

    totalPrice = totalPrice + nondiscountItemsTotal - discount;
    if (isNaN(totalPrice)) return res.status(400).send('Bad request');

    req.body.user = req.user.id;
    req.body.insideDhaka ? totalPrice += 99 : totalPrice += 150;

    const order = await db.create({ table: Orders, key: req.body });
    if (!order) return res.status(400).send('Bad request');

    // Generate and send to redirect
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
      discount_amount: 0,
      emi_option: 0,
      value_a: totalPrice.toFixed(2)
    };

    sslcz.init(data).then(apiResponse => {
      let GatewayPageURL = apiResponse.GatewayPageURL;
      order.sessionkey = apiResponse.sessionkey;
      order.total = totalPrice;
      order.save();
      res.send({ url: GatewayPageURL });
    });
  } catch (err) {
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
export const orderSuccess = ({ db, mail, sslcz }) => async (req, res) => {
  try {
    const data = {
      val_id: req.body.val_id
    };
    sslcz.validate(data).then(async (data) => {
      if (data.amount != req.body.value_a) {
        return res.redirect('http://localhost:3000');
        // return res.status(400).send('Amount does not match');
      }
      const order = await db.update({
        table: Orders, key: {
          id: req.params.id, body: {
            val_id: data.val_id,
            trxID: data.tran_id,
            bankTranid: data.bank_tran_id,
            storeAmount: data.store_amount,
            status: 'paid'
          }, populate: { path: 'products.product requests.request' }
        }
      });
      await db.update({ table: Cart, key: { user: order.user, key: { body: { products: [], requests: [] } } } });
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
      // res.redirect('frontend url');
      res.status(200).send(order);
    });
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * This function updates the status of the order to failed
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
    res.redirect('fronendurl');
    res.status(200).send(order);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * This function initiates a refund for the specific order
 * @param {Object} req - The request object have the response from ssl commerz.
 * @returns {Object} the order
 */
export const refundOrder = ({ db, sslcz }) => async (req, res) => {
  try {
    const order = await db.findOne({ table: Orders, key: { id: req.params.id } });
    const data = {
      refund_amount: order.total,
      refund_remarks: req.body.remarks || '',
      bank_tran_id: order.bankTranid,
    };
    sslcz.initiateRefund(data).then(data => {
      if (data.status === 'failed') return res.status(400).send(data);
      order.refundRefid = data.refund_ref_id;
      order.status = data.status === 'success' ? 'refunded' : 'processing';
      order.save();
      res.status(200).send(order);
    });
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * This function queries a refund for the specific order
 * @param {Object} req - The request object have the response from ssl commerz.
 * @returns {Object} the order
 */
export const refundStatus = ({ db, sslcz }) => async (req, res) => {
  try {
    const order = await db.findOne({ table: Orders, key: { id: req.params.id } });
    const data = {
      refund_ref_id: order.refundRefid
    };
    sslcz.refundQuery(data).then(data => {
      res.status(200).send({
        initiated_on: data.initiated_on,
        refunded_on: data.refunded_on,
        status: data.status,
        errorReason: data.errorReason
      });
    });
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * This function queries a refund for the specific order
 * @param {Object} req - The request object have the response from ssl commerz.
 * @returns {Object} the order
 */
export const transactionStatus = ({ db, sslcz }) => async (req, res) => {
  try {
    const order = await db.findOne({ table: Orders, key: { id: req.params.id } });
    const data = {
      tran_id: order.trxID
    };
    sslcz.transactionQueryByTransactionId(data).then(data => {
      res.status(200).send(data);
    });
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