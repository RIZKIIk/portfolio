const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function decodeImage(file, maxSourceImageBytes, messages) {
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
        throw new Error('Pilih gambar JPG, PNG, atau WebP.');
    }
    if (file.size > maxSourceImageBytes) {
        throw new Error('Ukuran gambar maksimal 6 MB.');
    }
    if (!('createImageBitmap' in window)) {
        throw new Error(messages.unsupported);
    }

    const bitmap = await createImageBitmap(file);
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 40000000) {
        bitmap.close();
        throw new Error(messages.dimensions);
    }
    return bitmap;
}

async function encodeWebp(bitmap, sourceRect, outputSize, maxStoredImageBytes, messages) {
    const canvas = document.createElement('canvas');
    canvas.width = outputSize.width;
    canvas.height = outputSize.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error(messages.canvas);

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(
        bitmap,
        sourceRect.x,
        sourceRect.y,
        sourceRect.width,
        sourceRect.height,
        0,
        0,
        canvas.width,
        canvas.height
    );

    const optimizedImage = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.84));
    if (!optimizedImage) throw new Error(messages.encoding);
    if (optimizedImage.size > maxStoredImageBytes) {
        throw new Error(messages.size);
    }
    return optimizedImage;
}

/**
 * Ubah gambar latar menjadi WebP dengan sisi terpanjang maksimal 1600 px.
 *
 * @param {File} file Gambar sumber yang dipilih administrator.
 * @param {number} maxSourceImageBytes Batas ukuran file sumber.
 * @param {number} maxStoredImageBytes Batas ukuran hasil WebP.
 * @returns {Promise<Blob>} Gambar WebP hasil optimasi.
 */
export async function optimizeImage(file, maxSourceImageBytes, maxStoredImageBytes) {
    const bitmap = await decodeImage(file, maxSourceImageBytes, {
        unsupported: 'Browser ini belum mendukung optimasi gambar. Coba browser versi terbaru.',
        dimensions: 'Dimensi gambar terlalu besar. Gunakan gambar di bawah 40 megapiksel.'
    });
    try {
        const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        const optimizedImage = await encodeWebp(
            bitmap,
            { x: 0, y: 0, width: bitmap.width, height: bitmap.height },
            { width, height },
            maxStoredImageBytes,
            {
                encoding: 'Gambar gagal dioptimalkan. Coba file gambar lain.',
                size: 'Hasil gambar masih terlalu besar. Pilih gambar yang lebih kecil.',
                canvas: 'Gambar tidak dapat diproses oleh browser.'
            }
        );
        return optimizedImage;
    } finally {
        bitmap.close();
    }
}

/**
 * Pangkas foto profil menjadi gambar persegi sesuai kontrol crop dashboard.
 *
 * @param {File} file Gambar sumber yang dipilih administrator.
 * @param {{zoom: number, x: number, y: number}} crop Pengaturan zoom dan posisi.
 * @param {number} maxSourceImageBytes Batas ukuran file sumber.
 * @param {number} maxStoredImageBytes Batas ukuran hasil WebP.
 * @returns {Promise<Blob>} Foto profil WebP hasil crop.
 */
export async function optimizeProfileImage(file, crop, maxSourceImageBytes, maxStoredImageBytes) {
    const bitmap = await decodeImage(file, maxSourceImageBytes, {
        unsupported: 'Browser ini belum mendukung pemrosesan gambar.',
        dimensions: 'Dimensi gambar terlalu besar.'
    });
    try {
        const cropSize = Math.min(bitmap.width, bitmap.height) / (Number(crop.zoom) || 1);
        const sourceRect = {
            x: (bitmap.width - cropSize) * (Number(crop.x) / 100),
            y: (bitmap.height - cropSize) * (Number(crop.y) / 100),
            width: cropSize,
            height: cropSize
        };
        return await encodeWebp(
            bitmap,
            sourceRect,
            { width: 1200, height: 1200 },
            maxStoredImageBytes,
            {
                encoding: 'Crop gambar gagal dibuat.',
                size: 'Hasil foto masih terlalu besar. Coba atur crop atau pilih gambar lain.',
                canvas: 'Gambar tidak dapat diproses oleh browser.'
            }
        );
    } finally {
        bitmap.close();
    }
}

/**
 * Pangkas thumbnail proyek ke rasio 16:10 sesuai kontrol crop dashboard.
 *
 * @param {File} file Gambar sumber yang dipilih administrator.
 * @param {{zoom: number, x: number, y: number}} crop Pengaturan zoom dan posisi.
 * @param {number} maxSourceImageBytes Batas ukuran file sumber.
 * @param {number} maxStoredImageBytes Batas ukuran hasil WebP.
 * @returns {Promise<Blob>} Thumbnail WebP hasil crop.
 */
export async function optimizeProjectThumbnail(file, crop, maxSourceImageBytes, maxStoredImageBytes) {
    const bitmap = await decodeImage(file, maxSourceImageBytes, {
        unsupported: 'Browser ini belum mendukung pemrosesan gambar.',
        dimensions: 'Dimensi gambar terlalu besar.'
    });
    try {
        const ratio = 16 / 10;
        const cropWidth = Math.min(bitmap.width, bitmap.height * ratio) / (Number(crop.zoom) || 1);
        const cropHeight = cropWidth / ratio;
        const sourceRect = {
            x: (bitmap.width - cropWidth) * (Number(crop.x) / 100),
            y: (bitmap.height - cropHeight) * (Number(crop.y) / 100),
            width: cropWidth,
            height: cropHeight
        };
        return await encodeWebp(
            bitmap,
            sourceRect,
            { width: 1600, height: 1000 },
            maxStoredImageBytes,
            {
                encoding: 'Crop thumbnail gagal dibuat.',
                size: 'Thumbnail hasil crop terlalu besar. Coba gambar lain.',
                canvas: 'Thumbnail tidak dapat diproses oleh browser.'
            }
        );
    } finally {
        bitmap.close();
    }
}
