const router = require("express").Router();
const Sequelize = require("sequelize");
const { Product, Category, Tag, ProductTag } = require("../../models");

// The `/api/products` endpoint

// get all products
router.get("/", async (req, res) => {
  // find all products
  // be sure to include its associated Category and Tag data
  const products = await Product.findAll({
    attributes: [
      "id",
      "product_name",
      [Sequelize.literal("CONCAT('$', price)"), "price"],
      "stock",
    ],
    include: [
      {
        model: Category,
      },
      {
        model: Tag,
        through: ProductTag,
      },
    ],
  });

  const formattedProducts = products.map((product) => ({
    id: product.id,
    product_name: product.product_name,
    price: product.price,
    stock: product.stock,
    category: {
      category_id: product.category?.id,
      category_name: product.category?.category_name,
    },
    tags: product.tags?.map((tag) => ({
      tag_id: tag.id,
      tag_name: tag.tag_name,
    })),
  }));

  res.json(formattedProducts);
});

// get one product
router.get("/:id", async (req, res) => {
  // find a single product by its `id`
  // be sure to include its associated Category and Tag data
  const product = await Product.findOne({
    where: {
      id: req.params.id,
    },
    attributes: [
      "id",
      "product_name",
      [Sequelize.literal("CONCAT('$', price)"), "price"],
      "stock",
    ],
    include: [
      {
        model: Category,
      },
      {
        model: Tag,
        through: ProductTag,
      },
    ],
  });

  if (!product || product.length === 0) {
    return res.json({ error: "No product found with this id" });
  }

  const formattedProduct = {
    id: product.id,
    product_name: product.product_name,
    price: product.price,
    stock: product.stock,
    category: {
      category_id: product.category?.id,
      category_name: product.category?.category_name,
    },
    tags: product.tags?.map((tag) => ({
      tag_id: tag.id,
      tag_name: tag.tag_name,
    })),
  };

  res.json(formattedProduct);
});

// create new product
router.post("/", (req, res) => {
  /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
  */
  const { product_name, price, stock, tagIds } = req.body;
  if (!product_name || !price || !stock) {
    res.status(400).json({
      message:
        "Missing required information, product_name, price, and stock is required, please structure your request like this: \n{\n\tproduct_name: 'Basketball',\n\tprice: 200.00,\n\tstock: 3,\n\ttagIds: [1, 2, 3]",
    });
    return;
  }

  if (!tagIds) {
    req.body.tagIds = [];
  }

  Product.create(req.body)
    .then((product) => {
      // if there's product tags, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      }
      // if no product tags, just respond
      res.status(200).json(product);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// update product
router.put("/:id", async (req, res) => {
  // update product data
  const product = await Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  });

  if (req.body.category) {
    const category = await Category.findByPk(
      req.body.category.category_id
        ? req.body.category.category_id
        : req.body.category.categoryId
    );

    if (!category || category.length === 0) {
      return res.json({
        error: `No category found with id ${
          req.body.category.category_id
            ? req.body.category.category_id
            : req.body.category.categoryId
        }`,
      });
    }
    await Product.update(req.body.category, {
      where: {
        id: req.params.id,
      },
    });
  }

  if (req.body.tags || (req.body.tagIds && req.body.tagIds.length)) {
    console.log("Running tag update");
    let productTags = [];
    if (req.body.tags) {
      for (let i = 0; i < req.body.tags.length; i++) {
        productTags.push(req.body.tags[i].tag_id);
      }
    } else {
      productTags = req.body.tagIds;
    }

    const currentTagsOnProduct = await ProductTag.findAll({
      where: { product_id: req.params.id },
    });
    // create filtered/mapped list of new tag_ids (I didn't like filter here as it worked to toggle tags, if 1 was passed as a tag again
    // it would remove tag 1 instead of keeping the tag and adding the other tags, maybe for an actual ecommerce site this would function
    // differently, especially if the tag system was a toggle system on the front end, but as for passing the data directly in insomnia
    // I didn't think it made a ton of sense with the filter, however this is a really helpful trick)

    //I also wrote this at 4 am so I am really sorry about the spaghetti code and this being not the best function
    let productTagsToAdd = productTags
      // .filter((tag_id) => !productTagIds.includes(tag_id)) // Works to toggle tags if tag exists and is passed again it removes tag
      .map((tag_id) => {
        return {
          product_id: req.params.id,
          tag_id,
        };
      });

    let productTagsToRemove = currentTagsOnProduct.map(({ tag_id }) => {
      return {
        product_id: req.params.id,
        tag_id,
      };
    });

    productTagsToRemove.forEach(async (tagToRemove) => {
      await ProductTag.destroy({ where: tagToRemove });
    });

    await ProductTag.bulkCreate(productTagsToAdd);
  }

  const updatedProduct = await Product.findOne({
    where: {
      id: req.params.id,
    },
    attributes: [
      "id",
      "product_name",
      [Sequelize.literal("CONCAT('$', price)"), "price"],
      "stock",
    ],
    include: [
      {
        model: Category,
      },
      {
        model: Tag,
        through: ProductTag,
      },
    ],
  });

  const formattedProduct = {
    id: updatedProduct.id,
    product_name: updatedProduct.product_name,
    price: updatedProduct.price,
    stock: updatedProduct.stock,
    category: {
      category_id: updatedProduct.category.id,
      category_name: updatedProduct.category.category_name,
    },
    tags: updatedProduct.tags.map((tag) => ({
      tag_id: tag.id,
      tag_name: tag.tag_name,
    })),
  };

  return res.json(formattedProduct);
});

router.delete("/:id", async (req, res) => {
  // delete one product by its `id` value
  const foundProduct = await Product.findByPk(req.params.id);

  if (!foundProduct || foundProduct.length === 0) {
    return res.json({ error: `No product found with id ${req.params.id}` });
  }

  await Product.destroy({
    where: { id: req.params.id },
  });

  res.json({ message: `Product id ${req.params.id} deleted` });
});

module.exports = router;
