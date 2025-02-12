import { v4 as uuidv4 } from 'uuid';

// Function to generate and return a UUID
export function generateUUID(prefix) {
  const uuidWithoutHyphens = uuidv4().replace(/-/g, ''); // Remove hyphens from the UUID
  return `${prefix}${uuidWithoutHyphens}`;
}

export function generatePassword(length = 12) {
  const uuidWithoutHyphens = uuidv4().replace(/-/g, ''); // Remove hyphens from the UUID
  return uuidWithoutHyphens.slice(0, length); // Return the specified length of characters
}


