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
 * Creates a new  order in the database.
 * @param {Object} req - The request object have the information about the order, userid and productid.
 * after order the selected item quantity is subtracted from the main product collection
 * @returns {Object} The created order.
 * @throws {Error} If the request body does not have any value in any key then it will throw error.
 */
export const registerOrder = ({ db, mail }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' && req.body[k] !== null);
    if (!validobj) res.status(400).send('Bad request');
    req.body?.products?.map(async (product) => {
      const element = await db.findOne({ table: Products, key: { id: product.product } });
      if (element.quantity < product.productQuantity) return res.status(400).send(`${element.name} is out of stock.`);
      const newquantity = element.quantity - product.productQuantity;
      element.quantity = newquantity;
      await element.save();
    });
    req.body.user = req.user.id;
    const order = await db.create({ table: Orders, key: { body: req.body, populate: { path: 'user products.product requests.request', } } });
    if (!order) return res.status(400).send('Bad request');
    const emailTemplate = fs.readFileSync(path.join(__dirname, 'order.ejs'), 'utf-8');
    const options = {
      order: order,
      serverLink: 'http://localhost:4000/',
      homeLink: 'http://localhost:4000/'
    };
    const html = generateMailTemplate(emailTemplate, options);
    // req.user.email is need to be put into the reciever
    mail({ receiver: 'yeasir06@gmail.com', subject: 'Order mail', body: html, type: 'html' });
    return res.status(200).send(order);
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
    const order = await db.findOne({ table: Orders, key: { user: req.params.id, populate: { path: 'user products.product' } } });
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
