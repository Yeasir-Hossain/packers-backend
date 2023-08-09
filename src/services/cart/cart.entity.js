import Cart from './cart.schema';

/**
 * @param userCart function is used to register cart
 * @param {Object} req This is the req object.
 * @returns the cart
 */
export const userCart = ({ db }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' && req.body[k] !== null);
    if (!validobj) res.status(400).send('Bad request');
    const previousCart = await db.findOne({ table: Cart, key: { user: req.user.id, paginate: false } });
    if (previousCart) {
      if (req.body.products) {
        for (const product of req.body.products) {
          const itemIndex = previousCart.products.findIndex((item) => item.product == product.product);
          if (itemIndex > -1) {
            product.productQuantity < 1 ? previousCart.products.splice(itemIndex, 1) : previousCart.products[itemIndex].productQuantity = product.productQuantity;
          }
          else {
            previousCart.products = [...(previousCart.products || []), product];
          }
        }
      }
      if (req.body.requests) {
        for (const request of req.body.requests) {
          const itemIndex = previousCart.requests.findIndex((item) => item.request == request.request);
          if (itemIndex > -1) {
            request.requestQuantity < 1 ? previousCart.requests.splice(itemIndex, 1) : previousCart.requests[itemIndex].requestQuantity = request.requestQuantity;
          }
          else {
            previousCart.requests = [...(previousCart.requests || []), request];
          }
        }
      }
      previousCart.save();
      return res.status(200).send(previousCart);
    }
    req.body.user = req.user.id;
    const cart = await db.create({ table: Cart, key: req.body });
    cart ? res.status(200).send(cart) : res.status(400).send('Bad request');
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
    cart ? res.status(200).send(cart) : res.status(400).send('Bad request');
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};