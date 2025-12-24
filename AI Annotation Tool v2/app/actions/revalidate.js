/**
 * Server Actions for revalidating pages and data
 * Used to refresh gallery after image uploads
 */

'use server';

import { revalidatePath } from 'next/cache';

/**
 * Revalidate the main page to refresh the image gallery
 */
export async function revalidateGallery() {
    try {
        revalidatePath('/');
        revalidatePath('/api/images');
        return { success: true };
    } catch (error) {
        console.error('Error revalidating gallery:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Revalidate a specific path
 * @param {string} path - The path to revalidate
 */
export async function revalidateSpecificPath(path) {
    try {
        revalidatePath(path);
        return { success: true };
    } catch (error) {
        console.error(`Error revalidating path ${path}:`, error);
        return { success: false, error: error.message };
    }
}