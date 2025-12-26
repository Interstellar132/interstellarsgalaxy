function diffOverwrites(oldOverwrites, newOverwrites) {
  const changes = [];

  for (const [id, newOW] of newOverwrites) {
    const oldOW = oldOverwrites.get(id);

    const oldAllow = oldOW?.allow?.toArray() || [];
    const oldDeny = oldOW?.deny?.toArray() || [];
    const newAllow = newOW.allow.toArray();
    const newDeny = newOW.deny.toArray();

    const addedAllow = newAllow.filter(p => !oldAllow.includes(p));
    const removedAllow = oldAllow.filter(p => !newAllow.includes(p));

    const addedDeny = newDeny.filter(p => !oldDeny.includes(p));
    const removedDeny = oldDeny.filter(p => !newDeny.includes(p));

    if (
      addedAllow.length ||
      removedAllow.length ||
      addedDeny.length ||
      removedDeny.length
    ) {
      changes.push({
        id,
        type: newOW.type, // role or member
        addedAllow,
        removedAllow,
        addedDeny,
        removedDeny
      });
    }
  }

  return changes;
}

module.exports = { diffOverwrites };
