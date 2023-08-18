import Cart from './cart.schema';

/**
 * @param userCart function is used to register cart
 * @param {Object} req This is the req object.
 * @returns the cart
 */
export const registerCart = ({ db }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' || req.body[k] !== undefined);
    if (!validobj) return res.status(400).send({ message: 'Bad Request', status: false });
    const previousCart = await db.findOne({ table: Cart, key: { user: req.user.id, paginate: false } });
    if (previousCart) {
      if (req.body.products) {
        for (const product of req.body.products) {
          previousCart.products = [...(previousCart.products || []), product];
        }
      }
      previousCart.save();
      return res.status(200).send(previousCart);
    }
    req.body.user = req.user.id;
    const cart = await db.create({ table: Cart, key: req.body });
    cart ? res.status(200).send(cart) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param updateCart function is used to update the user cart
 * @param {Object} req This is the req object.
 * @returns the cart
 */
export const updateCart = ({ db }) => async (req, res) => {
  try {
    console.log(req.body);
    const cart = await db.findOne({ table: Cart, key: { user: req.user.id, paginate: false } });
    if (req.body.products) {
      for (const product of req.body.products) {
        const itemIndex = cart.products.findIndex((item) => item.product == product.product);
        if (itemIndex > -1) {
          if (cart.products[itemIndex].productQuantity === product.productQuantity) return res.status(400).send({ message: 'Item already added', status: false });
          product.productQuantity < 1 ? cart.products.splice(itemIndex, 1) : cart.products[itemIndex].productQuantity = product.productQuantity;
        }
        else { return res.status(400).send({ message: 'Illegal activity detected', status: false }); }
      }
    }
    if (req.body.requests) {
      for (const request of req.body.requests) {
        const itemIndex = cart.requests.findIndex((item) => item.request == request.request);
        if (itemIndex > -1) {
          request.requestQuantity < 1 ? cart.requests.splice(itemIndex, 1) : cart.requests[itemIndex].requestQuantity = request.requestQuantity;
        }
        else { return res.status(400).send({ message: 'Illegal activity detected', status: false }); }
      }
    }
    if (req.body.discountApplied) cart.discountApplied = req.body.discountApplied;
    cart.save();
    const response = await db.populate(cart, { path: 'products.product requests.request' });
    return res.status(200).send(response);

  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param getUserCart function is used to get user cart
 * @param {Object} req This is the req object.
 * @returns the cart
 */
export const getUserCart = ({ db }) => async (req, res) => {
  try {
    const cart = await db.findOne({ table: Cart, key: { user: req.user.id, paginate: false, populate: { path: 'products.product requests.request' } } });
    cart ? res.status(200).send(cart) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};