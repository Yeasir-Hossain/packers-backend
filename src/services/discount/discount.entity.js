import Discount from './discount.schema';

/**
 * @param registerDiscount function is used to register a discount to the discount collection
 * @param {Object} req This is the req object.
 * @returns the discount
 */
export const registerDiscount = ({ db }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' && req.body[k] !== null);
    if (!validobj) res.status(400).send('Bad request');
    const discount = await db.create({ table: Discount, key: req.body });
    if (!discount) return res.status(400).send('Bad request');
    return res.status(200).send(discount);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param getAllDiscount function is used to get all the discounts from the discount collection
 * there is page query and other queries for this function which page of the data it need to show
 * @returns all the categories
 */
export const getAllDiscount = ({ db }) => async (req, res) => {
  try {
    const discount = await db.find({ table: Discount, key: { paginate: false, populate: { path: 'category usedBy.user' } } });
    if (!discount) return res.status(400).send('Bad request');
    return res.status(200).send(discount);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param removeDiscount function removes the single discount by id
 * @param req.params.id is the id of the discount sent in the params
 * @returns success or failed
 */
export const removeDiscount = ({ db }) => async (req, res) => {
  try {
    if (!req.body.id.length) return res.send(400).send('Bad Request');
    const discount = await db.removeAll({ table: Discount, key: { id: { $in: req.body.id } } });
    if (discount.deletedCount < 1) return res.status(404).send({ message: 'Coupon not found' });
    res.status(200).send({ message: 'Deleted Successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param useDiscount function add the single discount by code
 * @param {Object} req This is the req object.
 * @returns percentage or amount
 */
export const useDiscount = ({ db }) => async (req, res) => {
  try {
    const { code } = req.query;
    const discount = await db.findOne({ table: Discount, key: { code: code, paginate: false } });
    if (!discount) return res.status(404).send({ message: 'Coupon not found' });
    if (new Date(discount.expiry_date) < new Date()) return res.status(404).send({ message: 'Coupon expired' });
    if (discount.limit < discount.usedBy.length) return res.status(404).send({ message: 'Coupon expired' });
    const used = discount.usedBy.find(user => { return user.user.toString() === req.user.id; });
    if (used) return res.status(404).send({ message: 'Bad request' });
    discount.usedBy.push({ user: req.user.id });
    discount.save();
    if (discount.amount) return res.status(200).send({ amount: discount.amount });
    res.status(200).send({ percentage: discount.percentage });
  } catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param useDiscount function removes the single discount by code
 * @param {Object} req This is the req object.
 * @returns percentage or amount
 */
export const abandonDiscount = ({ db }) => async (req, res) => {
  try {
    const { code } = req.query;
    const discount = await db.findOne({ table: Discount, key: { code: code, paginate: false } });
    const newUsedBy = discount.usedBy.filter((user) => { return user.user.toString() !== req.user.id; });
    discount.usedBy = newUsedBy;
    discount.save();
    return res.status(200).send({ success: true, message: 'Coupon removed' });
  } catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};