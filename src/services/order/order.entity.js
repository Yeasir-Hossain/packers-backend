import generateMailTemplate from '../../utils/generateMailTemplate';
import Products from '../product/product.schema';
import Request from '../request/request.schema';
import Discount from '../discount/discount.schema';
import Cart from '../cart/cart.schema';
import User from '../user/user.schema';
import Orders from './order.schema';
import fs from 'fs';
import path from 'path';
import { sendNotification } from '../notification/notification.function';

//   these are the set to validate the request query.
const allowedQuery = new Set(['page', 'limit', 'sort', 'orderNumber', 'status', 'date', '_id', 'id', 'user']);

/**
 * This function is for payment through ssl commerz
 * Discount conditions are checked if there are any
 * @param discountItemsTotal calculates the total price of the items where discount is applicable
 * @param nondiscountItemsTotal calculates the total price of the items where discount is not applicable
 * @param {Object} req - The request object have the information about the order, userid and productid.
 * after order the selected item quantity is subtracted from the main product collection
 * @redirects to the success, fail or cancel url
 */
export const registerOrder = ({ db, sslcz, settings }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' || req.body[k] !== undefined);
    if (!validobj) return res.status(400).send({ message: 'Bad Request', status: false });
    const cart = await db.findOne({ table: Cart, key: { user: req.user.id, body: req.body } });
    req.body = { ...req.body, products: cart?.products, requests: cart?.requests, discountApplied: cart?.discountApplied?.code };

    // Fetch products and requests
    const { products, requests, discountApplied } = req.body;
    const productIds = products ? products.map((product) => product.product) : [];
    const requestIds = requests ? requests.map((request) => request.request) : [];
    const [productsData, requestsData] = await Promise.all([
      db.find({ table: Products, key: { query: { '_id': { '$in': productIds } }, allowedQuery: allowedQuery, paginate: false } }),
      db.find({ table: Request, key: { query: { '_id': { '$in': requestIds } }, allowedQuery: allowedQuery, paginate: false } })
    ]);

    let totalPrice = 0;
    let productNames = [];
    let productCategories = [];
    let discountItemsTotal = 0;
    let nondiscountItemsTotal = 0;

    if (products?.length > 0) {
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
    }
    if (requests?.length > 0) {
      for (const orderedRequest of requests) {
        const element = requestsData.find((request) => orderedRequest.request.toString() === request._id.toString());
        if (!element) continue;
        productNames.push(element.name);
        productCategories.push('request');
        totalPrice += (element.price + element.tax + element.fee) * orderedRequest.requestQuantity;
      }
    }
    // Discount calculation
    let discount = 0;
    if (discountApplied) {
      discount = await db.findOne({ table: Discount, key: { code: discountApplied, paginate: false } });
      if (!discount) return res.status(400).send({ message: 'Coupon not found', status: false });
      const currentDate = new Date();
      if (new Date(discount.expiry_date) < currentDate) return res.status(400).send({ message: 'Coupon expired', status: false });
      if (discount.limit < discount.usedBy.length) return res.status(400).send({ message: 'Coupon expired', status: false });
      const used = discount.usedBy.find((user) => user.user.toString() === req.user.id);
      if (used) return res.status(400).send({ message: { message: 'Bad Request', status: false } });
      if (discount.percentage) {
        discount = (discountItemsTotal * discount.percentage) / 100;
      } else {
        discount = discount.amount;
      }
    }

    totalPrice = totalPrice + nondiscountItemsTotal - discount;
    if (isNaN(totalPrice)) return res.status(400).send({ message: 'Bad Request', status: false });

    req.body.user = req.user.id;
    req.body.insideDhaka ? totalPrice += 99 : totalPrice += 150;

    const order = await db.create({ table: Orders, key: req.body });
    if (!order) return res.status(400).send({ message: 'Bad Request', status: false });

    // Generate and send to redirect
    const data = {
      total_amount: totalPrice.toFixed(2),
      currency: 'BDT',
      tran_id: `${'PP' + Date.now().toString(36).toUpperCase()}`,
      success_url: `${settings.domain}ordersuccess/${order.id}`,
      fail_url: `${settings.domain}orderfail`,
      cancel_url: `${settings.domain}orderfail`,
      ipn_url: `${settings.domain}orderipn`,
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
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};


/**
 * This function updates status of the order and clears the user cart after successful payment
 * @param {Object} req - The request object have the response from ssl commerz.
 * @returns {Object} the order
 */
export const orderSuccess = ({ db, ws, mail, sslcz, settings }) => async (req, res) => {
  try {
    sslcz.validate({ val_id: req.body.val_id }).then(async (data) => {
      if (data.amount != req.body.value_a) {
        return res.redirect('http://localhost:3000');
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
      await db.update({ table: Cart, key: { user: order.user, body: { products: [], requests: [] } } });
      const emailTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'order.ejs'), 'utf-8');
      const options = {
        order: order,
        serverLink: `${settings.domain}`,
        homeLink: `${settings.domain}`,
        toplogo: `${settings.domain}images/toplogo.png`,
        whitelogo: `${settings.domain}images/logowhitetext.png`,
        orderlogo: `${settings.domain}images/orderlogo.png`
      };
      sendNotification(db, ws, [{ '_id': order.user }], 'Your order has been placed', 'cart');
      const html = generateMailTemplate(emailTemplate, options);
      const maillog = await mail({ receiver: order.email, subject: 'Order mail', body: html, type: 'html' });
      if (!maillog) {
        const currentDate = new Date();
        const logMessage = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()} ${currentDate.getHours()}:${currentDate.getMinutes()}: Email sending failed for order ID ${order.id}: ${maillog?.rejected?.join(',')}\n`;
        const logStream = fs.createWriteStream(path.join(path.resolve(), 'logs', 'order_email_log.txt'), { flags: 'a' });
        logStream.write(logMessage);
        logStream.end();
      }
      if (req.body.val_id) {
        res.redirect(settings.frontendURL + 'home/checkout?order=success?orderid=' + order.id);
      }
    });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
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
    // res.redirect('frontendurl');
    res.status(200).send(order);
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
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
      order.status = data.status === 'success' ? 'refunded' : 'refundProcessing';
      order.save();
      res.status(200).send(order);
    });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
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
    if (!order.refundRefid) return res.staus(400).send({ message: 'Refund has not been initialized', status: false });
    const data = {
      refund_ref_id: order.refundRefid
    };
    sslcz.refundQuery(data).then(data => {
      order.status = data.status === 'success' ? 'refunded' : 'refundProcessing';
      order.save();
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
    res.status(500).send({ message: 'Something went wrong', status: false });
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
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};


/**
 * This function gets all the orders in the database
 * @param {Object} req - The request object have the information about page and any other filter.
 * @returns {Object} all the orders
 */
export const getAllOrders = ({ db }) => async (req, res) => {
  try {
    // stringify
    // datewise query={
    //   date= { '$and':{ '$gt': Date, '$lt': Date} }
    // }
    const order = await db.find({
      table: Orders, key: {
        query: req.query, allowedQuery: allowedQuery, paginate: true, populate: {
          path: 'user products.product requests.request', select: 'fullName email phone address name description origin images quantity price category tags link status'
        }
      }
    });
    order ? res.status(200).send(order) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param getSingleOrder function is used to get a single order from the orders collection
 * @param req.params.id This is the id of the order.
 * @returns the order
 */
export const getSingleOrder = ({ db }) => async (req, res) => {
  try {
    const order = await db.findOne({
      table: Orders, key: {
        id: req.params.id, populate: {
          path: 'user products.product requests.request', select: 'fullName email phone address name description origin images quantity price category tags link status tax fee'
        }
      }
    });
    order ? res.status(200).send(order) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param getUserOrder function is used to get a single order from the orders collection
 * @param req.params.id This is the id of the user.
 * @returns the order
 */
export const getUserOrder = ({ db }) => async (req, res) => {
  try {
    const order = await db.find({ table: Orders, key: { query: { ...req.query, user: req.user.id }, allowedQuery: allowedQuery, populate: { path: 'user products.product requests.request' } } });
    order ? res.status(200).send(order) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};


/**
 * @param updateOrder function updates the single order by id
 * @param req.params.id is the id of the product sent in the params
 * @returns the order after update
 */
export const updateOrder = ({ db }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' || req.body[k] !== undefined);
    if (!validobj) return res.status(400).send({ message: 'Bad Request', status: false });
    const order = await db.update({ table: Orders, key: { id: req.params.id, body: req.body } });
    order ? res.status(200).send(order) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param removeOrder function updates the single order by id
 * @param req.params.id is the id of the product sent in the params
 * @returns successful or failed
 */
export const removeOrder = ({ db }) => async (req, res) => {
  try {
    if (!req.body.id.length) return res.send(400).send({ message: 'Bad Request', status: false });
    const order = await db.removeAll({ table: Orders, key: { id: { '$in': req.body.id } } });
    order.deletedCount < 1 ? res.status(400).send({ message: 'Order not found', status: false }) : res.status(200).send({ message: 'Deleted Successfully', status: true });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param getCustomer function gets the customers details in the admin dashboar
 * @returns the customers data
 */
export const getCustomer = () => async (req, res) => {
  try {
    const pipeline = [
      {
        $lookup: {
          from: User.collection.name,
          localField: 'user',
          foreignField: '_id',
          as: 'userData',
        },
      },
      {
        $unwind: '$userData',
      },
      {
        $group: {
          _id: '$user',
          customerName: { $first: '$userData.fullName' },
          phone: { $first: '$userData.phone' },
          location: { $first: '$userData.address' },
          orders: {
            $push: {
              products: '$products',
              requests: '$requests',
              total: '$total',
            },
          },
          totalAmountSpent: { $sum: '$total' },
          totalItems: { $sum: { $add: [{ $size: '$products' }, { $size: '$requests' }] } },
        },
      },
    ];
    const customers = await Orders.aggregate(pipeline);
    customers ? res.status(200).send(customers) : res.status(400).send({ message: 'Bad Request', status: false });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};