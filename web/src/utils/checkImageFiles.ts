import { acceptedImageTypes } from '../api/steps'

// Same limits as the server (server/src/images/validateImages.ts)
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_IMAGES_PER_UPLOAD = 10

/**
 * Checks chosen files before uploading, so obvious mistakes are caught before anything is saved.
 * Returns an error message, or null when the files look fine. The server checks again.
 */
export function checkImageFiles(files: File[]): string | null {
    if (files.length > MAX_IMAGES_PER_UPLOAD) return `Högst ${MAX_IMAGES_PER_UPLOAD} bilder åt gången`

    for (const file of files) {
        if (!acceptedImageTypes.includes(file.type)) {
            return `${file.name} är inte en bild som stöds (JPG, PNG, WebP eller GIF)`
        }
        if (file.size > MAX_IMAGE_BYTES) return `${file.name} är större än 10 MB`
    }

    return null
}
