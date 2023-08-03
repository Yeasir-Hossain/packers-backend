import Category from './category.schema';

/**
 * these are the set to validate the request query.
 */
const allowedQuery = new Set(['type']);

/**
 * @param registerCategoty function is used to register a category to the catrgory collection
 * @param {Object} req This is the req object.
 * @returns
 */
export const registerCategory = ({ db }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' && req.body[k] !== null);
    if (!validobj) res.status(400).send('Bad request');
    let newcategory = {
      name: req.body.categoryname,
      slug: req.body.categoryslug,
    };
    let subcategory = {
      name: req.body.subcategoryname,
      type: 'subcategory',
      slug: req.body.subcategoryslug,
    };
    const exist = await db.findOne({ table: Category, key: { slug: req.body.categoryslug } });
    if (exist) {
      const newsubcategory = await db.create({ table: Category, key: subcategory });
      if (!newsubcategory) return res.status(400).send('Bad request');
      exist.subcategory = [...(exist.subcategory || []), newsubcategory.id];
      console.log(exist);
      exist.save();
      return res.status(200).send(exist);
    }
    if (subcategory.slug) {
      const newsubcategory = await db.create({ table: Category, key: subcategory });
      if (!newsubcategory) return res.status(400).send('Bad request');
      newcategory = { ...newcategory, subcategory: [newsubcategory.id] };
    }
    const category = await db.create({ table: Category, key: newcategory });
    if (!category) return res.status(400).send('Bad request');
    return res.status(200).send(category);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param getAllCategory function is used to get all the categories from the category collection
 * there is page query and other queries for this function which page of the data it need to show
 * @returns all the categories
 */
export const getAllCategory = ({ db }) => async (req, res) => {
  try {
    const categories = await db.find({ table: Category, key: { query: { type: 'category' }, allowedQuery: allowedQuery, paginate: false, populate: { path: 'subcategory' } } });
    if (!categories) return res.status(400).send('Bad request');
    return res.status(200).send(categories);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param updateCategory function is used to update the category
 * there is page query and other queries for this function which page of the data it need to show
 * @returns the category
 */
export const updateCategory = ({ db }) => async (req, res) => {
  try {
    const categories = await db.update({ table: Category, key: { id: req.param.id, body: req.body } });
    if (!categories) return res.status(400).send('Bad request');
    return res.status(200).send(categories);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param removeCategory function removes the single category by id
 * @param req.params.id is the id of the category sent in the params
 * @returns success or failed
 */
export const removeCategory = ({ db }) => async (req, res) => {
  try {
    if (!req.body.id.length) return res.send(400).send('Bad Request');
    const category = await db.removeAll({ table: Category, key: { id: { $in: req.body.id } } });
    if (!category) return res.status(404).send({ message: 'Category not found' });
    res.status(200).send({ message: 'Deleted Successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};