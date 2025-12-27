// Generate proper extension icons
// Run with: node scripts/create-icons.js

const fs = require('fs');
const path = require('path');

// Simple PNG generator for extension icons
// Creates colored squares with a dumbbell emoji-like design

function createPNG(size) {
    // PNG file structure
    const width = size;
    const height = size;

    // Create raw pixel data (RGBA)
    const pixels = Buffer.alloc(width * height * 4);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = size * 0.4;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;

            // Calculate gradient colors (orange to purple)
            const gradientT = y / height;
            const r = Math.round(255 * (1 - gradientT * 0.5));  // Orange to purple red component
            const g = Math.round(140 * (1 - gradientT));        // Decreasing green
            const b = Math.round(gradientT * 130);              // Increasing blue

            // Calculate distance from center for circle mask
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Round corner mask
            const cornerRadius = size * 0.15;
            let isInside = true;

            // Check corners
            const corners = [
                [cornerRadius, cornerRadius],
                [width - cornerRadius, cornerRadius],
                [cornerRadius, height - cornerRadius],
                [width - cornerRadius, height - cornerRadius]
            ];

            for (const [cx, cy] of corners) {
                const inCornerRegion =
                    (x < cornerRadius && y < cornerRadius && cx === cornerRadius && cy === cornerRadius) ||
                    (x > width - cornerRadius && y < cornerRadius && cx === width - cornerRadius && cy === cornerRadius) ||
                    (x < cornerRadius && y > height - cornerRadius && cx === cornerRadius && cy === height - cornerRadius) ||
                    (x > width - cornerRadius && y > height - cornerRadius && cx === width - cornerRadius && cy === height - cornerRadius);

                if (inCornerRegion) {
                    const cdx = x - cx;
                    const cdy = y - cy;
                    if (Math.sqrt(cdx * cdx + cdy * cdy) > cornerRadius) {
                        isInside = false;
                    }
                }
            }

            if (isInside) {
                // Draw a simple dumbbell shape in white
                const barWidth = size * 0.08;
                const barLength = size * 0.5;
                const weightRadius = size * 0.18;
                const weightOffset = size * 0.28;

                // Check if pixel is part of dumbbell
                const isBar = Math.abs(y - centerY) < barWidth / 2 &&
                    Math.abs(x - centerX) < barLength / 2;

                const leftWeightDist = Math.sqrt(
                    Math.pow(x - (centerX - weightOffset), 2) +
                    Math.pow(y - centerY, 2)
                );
                const rightWeightDist = Math.sqrt(
                    Math.pow(x - (centerX + weightOffset), 2) +
                    Math.pow(y - centerY, 2)
                );

                const isWeight = leftWeightDist < weightRadius || rightWeightDist < weightRadius;

                if (isBar || isWeight) {
                    // White dumbbell
                    pixels[idx] = 255;     // R
                    pixels[idx + 1] = 255; // G
                    pixels[idx + 2] = 255; // B
                    pixels[idx + 3] = 255; // A
                } else {
                    // Gradient background
                    pixels[idx] = r;       // R
                    pixels[idx + 1] = g;   // G
                    pixels[idx + 2] = b;   // B
                    pixels[idx + 3] = 255; // A
                }
            } else {
                // Transparent
                pixels[idx] = 0;
                pixels[idx + 1] = 0;
                pixels[idx + 2] = 0;
                pixels[idx + 3] = 0;
            }
        }
    }

    return createMinimalPNG(width, height, pixels);
}

function createMinimalPNG(width, height, pixels) {
    const zlib = require('zlib');

    // Add filter byte (0) at the start of each row
    const rawData = Buffer.alloc(height * (width * 4 + 1));
    for (let y = 0; y < height; y++) {
        rawData[y * (width * 4 + 1)] = 0; // Filter byte
        pixels.copy(rawData, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
    }

    // Compress with zlib
    const compressed = zlib.deflateSync(rawData, { level: 9 });

    // PNG signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8;  // Bit depth
    ihdrData[9] = 6;  // Color type: RGBA
    ihdrData[10] = 0; // Compression
    ihdrData[11] = 0; // Filter
    ihdrData[12] = 0; // Interlace
    const ihdr = createChunk('IHDR', ihdrData);

    // IDAT chunk
    const idat = createChunk('IDAT', compressed);

    // IEND chunk
    const iend = createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);

    const typeBuffer = Buffer.from(type);
    const crc = crc32(Buffer.concat([typeBuffer, data]));
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc >>> 0, 0);

    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = [];

    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c;
    }

    for (let i = 0; i < buf.length; i++) {
        crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }

    return crc ^ 0xFFFFFFFF;
}

// Generate icons
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [16, 48, 128];

for (const size of sizes) {
    const png = createPNG(size);
    const filename = path.join(iconsDir, `icon${size}.png`);
    fs.writeFileSync(filename, png);
    console.log(`Created ${filename} (${png.length} bytes)`);
}

console.log('Icons generated successfully!');
