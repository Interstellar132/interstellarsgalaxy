function diff(oldObj, newObj, keys) {
  const changes = [];

  for (const key of keys) {
    if (oldObj[key] !== newObj[key]) {
      changes.push({
        name: key,
        old: String(oldObj[key] ?? 'None'),
        new: String(newObj[key] ?? 'None')
      });
    }
  }

  return changes;
}

module.exports = { diff };
