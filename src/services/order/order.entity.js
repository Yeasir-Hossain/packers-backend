import Products from '../product/product.schema';
import Orders from './order.schema';

/**
 * these are the set to validate the request query.
 */
const allowedQuery = new Set(['page', 'limit', 'paginate']);

/**
 * Creates a new  order in the database.
 * @param {Object} req - The request object have the information about the order, userid and productid.
 * after order the selected item quantity is subtracted from the main product collection
 * @returns {Object} The created order.
 * @throws {Error} If the request body does not have any value in any key then it will throw error.
 */
export const registerOrder = ({ db }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' && req.body[k] !== null);
    if (!validobj) res.status(400).send('Missing fields');
    req.body.products.map(async (product) => {
      const element = await Products.findOne({ table: Products, key: { id: product.product } });
      const newquantity = element.quantity - product.quantity;
      element.quantity = newquantity;
      await element.save();
      // db.update({ table: Products, key: { id: product, body: { quantity: newquantity } } });
    });
    db.create({ table: Orders, key: { ...req.body } })
      .then(async order => {
        await db.save(order);
        res.status(200).send(order);
      })
      .catch(({ message }) => res.status(400).send({ message }));
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param getSingleOrder function is used to get a single order from the products collection
 * @param req.params.id This is the id of the order.
 * @returns the product
 */
export const getSingleOrder = ({ db }) => async (req, res) => {
  try {
    const order = await db.findOne({ table: Orders, key: { id: req.params.id } });
    res.status(200).send(order);
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
    const orders = await db.find({ table: Orders, key: { query: req.query, allowedQuery: allowedQuery, paginate: true, populate: { path: 'user products.product' } } });
    res.status(200).send(orders);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};


export const removeOrder = ({ db }) => async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db.remove({ table: Orders, key: { id } });
    if (!order) return res.status(404).send({ message: 'Orde not found' });
    res.status(200).send({ message: 'Deleted Successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};
