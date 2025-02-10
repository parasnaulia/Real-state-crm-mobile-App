const userDetailsPage = async (req, res, next) => {
  const { groupName } = req.params;
  if (groupName === "Organization") {
    console.log(groupName);
  }

  try {
    if (groupName === "Organization") {
      next();
    } else {
    }
  } catch (e) {
    console.log("There is Some Error In Insertting Data to db " + e);
  }
};
module.exports = { userDetailsPage };
