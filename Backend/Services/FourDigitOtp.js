function generateRandomNumber(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

module.exports = { generateRandomNumber };
