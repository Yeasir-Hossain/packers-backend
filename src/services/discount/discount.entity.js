import Discount from './discount.schema';

/**
 * @param registerDiscount function is used to register a discount to the discount collection
 * @param {Object} req This is the req object.
 * @returns the discount
 */
export const registerDiscount = ({ db }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' || req.body[k] !== undefined);
    if (!validobj) res.status(400).send({ message: 'Bad Request', status: false });
    const discount = await db.create({ table: Discount, key: req.body });
    discount ? res.status(200).send(discount) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param getAllDiscount function is used to get all the discounts from the discount collection
 * @param {Object} req - The request object have the information about page and any other filter.
 * @returns all the discounts
 */
export const getAllDiscount = ({ db }) => async (req, res) => {
  try {
    const discount = await db.find({ table: Discount, key: { paginate: false, populate: { path: 'category usedBy.user' } } });
    discount ? res.status(200).send(discount) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param removeDiscount function removes the discount by id
 * @param req.params.id is the id of the discount sent in the params
 * @returns success or failed
 */
export const removeDiscount = ({ db }) => async (req, res) => {
  try {
    if (!req.body.id.length) return res.send(400).send({ message: 'Bad Request', status: false });
    const discount = await db.removeAll({ table: Discount, key: { id: { $in: req.body.id } } });
    discount.deletedCount < 1 ? res.status(400).send({ message: 'Coupon not found', status: false }) : res.status(200).send({ message: 'Deleted Successfully', status: true });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param useDiscount function add the single discount by code
 * @param {Object} req This is the req object.
 * @returns percentage or amount
 */
export const useDiscount = ({ db }) => async (req, res) => {
  try {
    const discount = await db.findOne({ table: Discount, key: { code: req.query.code, paginate: false } });
    if (!discount) return res.status(400).send({ message: 'Coupon not found', status: false });
    // if (new Date(discount.expiry_date) < new Date()) return res.status(400).send({ message: 'Coupon expired', status: false });
    // if (discount.limit < discount.usedBy.length) return res.status(400).send({ message: 'Coupon expired', status: false });
    // const used = discount.usedBy.find(user => { return user.user.toString() === req.user.id; });
    // if (used) return res.status(400).send({ message: 'You have previously used this discount', status: false });
    discount.usedBy.push({ user: req.user.id });
    discount.limit -= 1;
    discount.save();
    discount.amount ? res.status(200).send({ code: discount.code, amount: discount.amount }) : res.status(200).send({ code: discount.code, percentage: discount.percentage });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param useDiscount function removes the discount by code
 * @param {Object} req This is the req object.
 * @returns percentage or amount
 */
export const abandonDiscount = ({ db }) => async (req, res) => {
  try {
    const discount = await db.findOne({ table: Discount, key: { code: req.query.code, paginate: false } });
    const newUsedBy = discount.usedBy.filter((user) => { return user.user.toString() !== req.user.id; });
    discount.usedBy = newUsedBy;
    discount.limit += 1;
    discount.save();
    res.status(200).send({ success: true, message: 'Coupon removed' });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};