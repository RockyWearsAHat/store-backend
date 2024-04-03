const router = require("express").Router();
const Sequelize = require("sequelize");
const { Tag, Product, ProductTag } = require("../../models");

// The `/api/tags` endpoint
router.get("/", async (req, res) => {
  // find all tags
  // be sure to include its associated Product data
  const tags = await Tag.findAll({
    include: [
      {
        model: Product,
        through: ProductTag,
        attributes: [
          "id",
          "product_name",
          [Sequelize.literal("CONCAT('$', price)"), "price"],
          "stock",
        ],
        as: "products",
      },
    ],
  });

  const formattedTags = tags.map((tag) => ({
    id: tag.id,
    tag_name: tag.tag_name,
    products: tag.products.map((product) => ({
      product_id: product.id,
      product_name: product.product_name,
      price: product.price,
      stock: product.stock,
    })),
  }));

  res.json(formattedTags);
});

router.get("/:id", async (req, res) => {
  // find a single tag by its `id`
  // be sure to include its associated Product data

  const tag = await Tag.findOne({
    where: { id: req.params.id },
    include: [
      {
        model: Product,
        through: ProductTag,
        attributes: [
          "id",
          "product_name",
          [Sequelize.literal("CONCAT('$', price)"), "price"],
          "stock",
        ],
        as: "products",
      },
    ],
  });

  if (!tag || tag.length === 0) {
    return res.json({ error: `No tag found with id ${req.params.id}` });
  }

  const formattedTag = {
    id: tag.id,
    tag_name: tag.tag_name,
    products: tag.products.map((product) => ({
      product_id: product.id,
      product_name: product.product_name,
      price: product.price,
      stock: product.stock,
    })),
  };

  res.json(formattedTag);
});

router.post("/", async (req, res) => {
  // create a new tag
  const { tag_name, tagName } = req.body;

  if (!tagName && !tag_name) {
    return res.json({ error: "Tag name (tag_name/tagName) is required" });
  }

  const createdTag = await Tag.create({
    tag_name: tagName ? tagName : tag_name,
  });

  res.json(createdTag);
});

router.put("/:id", async (req, res) => {
  // update a tag's name by its `id` value
  const foundTag = await Tag.findOne({ where: { id: req.params.id } });

  if (!foundTag || foundTag.length === 0) {
    return res.json({ error: `Tag id ${req.params.id} not found` });
  }

  const { tag_name, tagName } = req.body;

  if (!tagName && !tag_name) {
    return res.json({ error: "Tag name (tag_name/tagName) is required" });
  }

  await Tag.update(
    { tag_name: tagName ? tagName : tag_name },
    { where: { id: req.params.id } }
  );

  const updatedTag = await Tag.findOne({
    where: { id: req.params.id },
    include: [
      {
        model: Product,
        through: ProductTag,
        attributes: [
          "id",
          "product_name",
          [Sequelize.literal("CONCAT('$', price)"), "price"],
          "stock",
        ],
        as: "products",
      },
    ],
  });

  const formattedTag = {
    id: updatedTag.id,
    tag_name: updatedTag.tag_name,
    products: updatedTag.products.map((product) => ({
      product_id: product.id,
      product_name: product.product_name,
      price: product.price,
      stock: product.stock,
    })),
  };

  res.json(formattedTag);
});

router.delete("/:id", async (req, res) => {
  // delete on tag by its `id` value
  const foundTag = await Tag.findOne({ where: { id: req.params.id } });

  if (!foundTag) {
    return res.json({ error: `Tag id ${req.query.id} not found` });
  }

  await Tag.destroy({ where: { id: req.params.id } });

  res.json({ success: `Tag id ${req.params.id} deleted` });
});

module.exports = router;
