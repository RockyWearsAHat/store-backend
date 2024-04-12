const router = require("express").Router();
const Sequelize = require("sequelize");
const { Category, Product } = require("../../models");

// The `/api/categories` endpoint

router.get("/", async (req, res) => {
  // find all categories
  // be sure to include its associated Products
  const categories = await Category.findAll({
    attributes: [["id", "category_id"], "category_name"],
    include: [
      {
        model: Product,
        attributes: [
          ["id", "product_id"],
          "product_name",
          [Sequelize.literal("CONCAT('$', price)"), "price"],
          "stock",
        ],
      },
    ],
  });
  res.json(categories);
});

router.get("/:id", async (req, res) => {
  //Find a category
  const category = await Category.findOne({
    where: { id: req.params.id },
    attributes: [["id", "category_id"], "category_name"],
    include: [
      {
        model: Product,
        attributes: [
          ["id", "product_id"],
          "product_name",
          [Sequelize.literal("CONCAT('$', price)"), "price"],
          "stock",
        ],
      },
    ],
  });

  //If no found category, return error
  if (!category) {
    return res.json({ error: `Category id ${req.params.id} not found` });
  }

  return res.json(category);
});

router.post("/", async (req, res) => {
  //Get category name
  const { categoryName, category_name } = req.body;

  //If category name is not provided return error
  if (!categoryName && !category_name) {
    return res.json({
      error: "Category name (categoryName/category_name) is required",
    });
  }

  //Create a new category
  const newCategory = await Category.create({
    category_name: categoryName || category_name,
  });

  return res.json(newCategory);
});

router.put("/:id", async (req, res) => {
  //Get the category name
  const { categoryName, category_name } = req.body;
  if (!categoryName && !category_name) {
    return res.json({
      error: "Category name (categoryName/category_name) is required",
    });
  }

  //Find category
  const foundCategory = await Category.findOne({
    where: { id: req.params.id },
  });

  //If category not found return error
  if (!foundCategory || foundCategory.length === 0) {
    return res.json({ error: `Category id ${req.params.id} not found` });
  }
  //Update a category by its `id` value
  await Category.update(
    { category_name: categoryName ? categoryName : category_name },
    {
      where: { id: req.params.id },
    }
  );

  //Find updated category
  const updatedCategory = await Category.findOne({
    where: { id: req.params.id },
    attributes: [["id", "category_id"], "category_name"],
    include: [
      {
        model: Product,
        attributes: [
          ["id", "product_id"],
          "product_name",
          [Sequelize.literal("CONCAT('$', price)"), "price"],
          "stock",
        ],
      },
    ],
  });

  return res.json(updatedCategory);
});

router.delete("/:id", async (req, res) => {
  const foundCategory = await Category.findOne({
    where: { id: req.params.id },
  });

  //If category not found return error
  if (!foundCategory || foundCategory.length === 0) {
    return res.json({ error: `Category id ${req.params.id} not found` });
  }

  // delete a category by its `id` value
  await Category.destroy({ where: { id: req.params.id } }).then((data) => {
    console.log(data);
  });

  return res.json({ ok: "Category successfully deleted" });
});

module.exports = router;
