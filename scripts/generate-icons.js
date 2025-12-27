// Script to generate properly sized icon PNGs
const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [16, 48, 128];

function createIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#FF8C00');  // Orange
    gradient.addColorStop(1, '#4B0082');  // Purple

    // Rounded rectangle
    const radius = size * 0.2;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw dumbbell icon
    ctx.fillStyle = 'white';
    const centerX = size / 2;
    const centerY = size / 2;
    const barWidth = size * 0.5;
    const barHeight = size * 0.1;
    const weightWidth = size * 0.15;
    const weightHeight = size * 0.35;

    // Horizontal bar
    ctx.fillRect(centerX - barWidth / 2, centerY - barHeight / 2, barWidth, barHeight);

    // Left weight
    ctx.fillRect(centerX - barWidth / 2, centerY - weightHeight / 2, weightWidth, weightHeight);

    // Right weight
    ctx.fillRect(centerX + barWidth / 2 - weightWidth, centerY - weightHeight / 2, weightWidth, weightHeight);

    return canvas.toBuffer('image/png');
}

// Generate icons
sizes.forEach(size => {
    const buffer = createIcon(size);
    fs.writeFileSync(`public/icons/icon${size}.png`, buffer);
    console.log(`Created icon${size}.png (${buffer.length} bytes)`);
});
