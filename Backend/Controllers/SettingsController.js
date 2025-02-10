const addCategory = async (req, connection) => {
  const { name, MainOrgName } = req.body;

  if (!name || !MainOrgName) {
    throw new Error("Missing required fields: 'name' or 'MainOrgName'.");
  }

  try {
    // Check if the category exists
    const [existingRows] = await connection.query(
      `SELECT * FROM catagory WHERE Catagory = ? AND Organization_Name_Catagories = ?`,
      [name, MainOrgName]
    );

    if (existingRows.length > 0) {
      console.warn("Category already exists:", name);
      throw new Error("Category already exists for this organization.");
    }

    // Insert new category
    const [insertResult] = await connection.query(
      `INSERT INTO catagory (Catagory, Organization_Name_Catagories) VALUES (?, ?)`,
      [name, MainOrgName]
    );

    console.log("Category inserted with ID:", insertResult.insertId);
    return { categoryId: insertResult.insertId };
  } catch (error) {
    console.error("Error inserting category:", error.message);
    throw new Error("Unable to insert category.");
  }
};

// Helper Function to Associate User with Category
const associateUserWithCategory = async (req, connection) => {
  const { userId } = req.body;
  const { categoryId } = req;

  if (!userId || !categoryId) {
    throw new Error("Missing required fields: 'userId' or 'categoryId'.");
  }

  try {
    // Associate User with Category
    await connection.query(
      `INSERT INTO UserACategory (User_id_CA, Category_UserA) VALUES (?, ?)`,
      [userId, categoryId]
    );
    console.log(
      "User successfully associated with category:",
      userId,
      categoryId
    );
  } catch (error) {
    console.error("Error associating user with category:", error.message);
    throw new Error("Unable to associate user with category.");
  }
};

module.exports = { addCategory, associateUserWithCategory };
