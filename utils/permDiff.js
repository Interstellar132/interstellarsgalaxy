const { PermissionsBitField } = require('discord.js');

/**
 * Compare channel permission overwrites
 * @param {Collection<Snowflake, PermissionOverwrites>} oldOverwrites 
 * @param {Collection<Snowflake, PermissionOverwrites>} newOverwrites 
 */
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

    if (addedAllow.length || removedAllow.length || addedDeny.length || removedDeny.length) {
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

/**
 * Compare two role objects for property changes
 * @param {Role} oldRole 
 * @param {Role} newRole 
 */
function diffRole(oldRole, newRole) {
  const changes = [];

  if (oldRole.name !== newRole.name) {
    changes.push({ field: 'Name', before: oldRole.name, after: newRole.name });
  }
  if (oldRole.color !== newRole.color) {
    changes.push({ field: 'Color', before: `#${oldRole.color.toString(16).padStart(6, '0')}`, after: `#${newRole.color.toString(16).padStart(6, '0')}` });
  }
  if (oldRole.hoist !== newRole.hoist) {
    changes.push({ field: 'Hoist', before: oldRole.hoist, after: newRole.hoist });
  }
  if (oldRole.mentionable !== newRole.mentionable) {
    changes.push({ field: 'Mentionable', before: oldRole.mentionable, after: newRole.mentionable });
  }

  // Permissions diff
  const oldPerms = new PermissionsBitField(oldRole.permissions);
  const newPerms = new PermissionsBitField(newRole.permissions);
  const added = newPerms.missing(oldPerms);
  const removed = oldPerms.missing(newPerms);

  if (added.length || removed.length) {
    changes.push({ field: 'Permissions', added, removed });
  }

  return changes;
}

module.exports = { diffOverwrites, diffRole };
