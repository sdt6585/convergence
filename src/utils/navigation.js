// src/lib/utils/navigation.js
import { base } from '$app/paths';

/**
 * Utility function to calculate paths in different environments
 * @param {string} path The path after the root url, 
 * @returns {string}  returns "https://rooturl" + path
 */
export function getPath(path) {
    return `${base}${path}`;
}