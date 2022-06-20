module.exports = (key) => {
  const parts = key.split(':');
  return parseInt(parts[1], 10)
};