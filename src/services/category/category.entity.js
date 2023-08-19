import Category from './category.schema';

// these are the set to validate the request query.
const allowedQuery = new Set(['type']);

/**
 * @param registerCategoty function is used to register a category to the catrgory collection
 * @param {Object} req This is the req object.
 * @returns
 */
export const registerCategory = ({ db }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' || req.body[k] !== undefined);
    if (!validobj) res.status(400).send({ message: 'Bad Request', status: false });
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
      if (!newsubcategory) return res.status(400).send({ message: 'Bad Request', status: false });
      exist.subcategory = [...(exist.subcategory || []), newsubcategory.id];
      exist.save();
      return res.status(200).send(exist);
    }
    if (subcategory.slug) {
      const newsubcategory = await db.create({ table: Category, key: subcategory });
      if (!newsubcategory) return res.status(400).send({ message: 'Bad Request', status: false });
      newcategory = { ...newcategory, subcategory: [newsubcategory.id] };
    }
    const category = await db.create({ table: Category, key: newcategory });
    category ? res.status(200).send(category) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param getAllCategory function is used to get all the categories from the category collection
 * @param {Object} req - The request object have the information about page and any other filter.
 * @returns all the categories
 */
export const getAllCategory = ({ db }) => async (req, res) => {
  try {
    const category = await db.find({ table: Category, key: { query: { type: 'category' }, allowedQuery: allowedQuery, paginate: false, populate: { path: 'subcategory' } } });
    category ? res.status(200).send(category) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param updateCategory function is used to update the category
 * there is page query and other queries for this function which page of the data it need to show
 * @returns the category
 */
export const updateCategory = ({ db }) => async (req, res) => {
  try {
    if (!req.params.id) return res.status(400).send({ message: 'Bad Request', status: false });
    const category = await db.update({ table: Category, key: { id: req.params.id, body: req.body } });
    category ? res.status(200).send(category) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param removeCategory function removes the category by id
 * @param req.params.id is the id of the category sent in the params
 * @returns success or failed
 */
export const removeCategory = ({ db }) => async (req, res) => {
  try {
    if (!req.body.id.length) return res.send(400).send({ message: 'Bad Request', status: false });
    const category = await db.removeAll({ table: Category, key: { id: { $in: req.body.id } } });
    if (!category) return res.status(400).send({ message: 'Category not found' });
    res.status(200).send({ message: 'Deleted Successfully', status: true });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};