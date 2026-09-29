import { describe, expect, it } from 'vitest'
import { MAX_IMAGE_BYTES, MAX_IMAGES_PER_UPLOAD, checkImageFiles } from './checkImageFiles'

function makeFile(name: string, type: string, sizeBytes = 10): File {
    return new File([new Uint8Array(sizeBytes)], name, { type })
}

describe('checkImageFiles', () => {
    it('accepts no files at all', () => {
        expect(checkImageFiles([])).toBeNull()
    })

    it('accepts JPG, PNG, WebP and GIF images', () => {
        const files = [
            makeFile('a.jpg', 'image/jpeg'),
            makeFile('b.png', 'image/png'),
            makeFile('c.webp', 'image/webp'),
            makeFile('d.gif', 'image/gif'),
        ]

        expect(checkImageFiles(files)).toBeNull()
    })

    it('rejects a file that is not a supported image', () => {
        expect(checkImageFiles([makeFile('ritning.pdf', 'application/pdf')])).toBe(
            'ritning.pdf är inte en bild som stöds (JPG, PNG, WebP eller GIF)',
        )
    })

    it('accepts an image of exactly the maximum size and rejects a larger one', () => {
        expect(checkImageFiles([makeFile('ok.jpg', 'image/jpeg', MAX_IMAGE_BYTES)])).toBeNull()
        expect(checkImageFiles([makeFile('stor.jpg', 'image/jpeg', MAX_IMAGE_BYTES + 1)])).toBe(
            'stor.jpg är större än 10 MB',
        )
    })

    it('rejects more than the maximum number of images', () => {
        const files = Array.from({ length: MAX_IMAGES_PER_UPLOAD + 1 }, (_, i) => makeFile(`${i}.png`, 'image/png'))

        expect(checkImageFiles(files)).toBe(`Högst ${MAX_IMAGES_PER_UPLOAD} bilder åt gången`)
    })
})
