// Script to optimize releases.html
const fs = require('fs');
const path = require('path');

// Read the releases.html file
const filePath = path.join(__dirname, 'pages', 'releases.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Optimize srcset - reduce to reasonable sizes
html = html.replace(/srcset="[^"]+"/g, (match) => {
    // Extract the base URL
    const baseUrlMatch = match.match(/\/\/www\.blackbookrecs\.com\/cdn\/shop\/files\/([^?]+)\?v=([^&]+)/);
    if (!baseUrlMatch) return match;
    
    const baseUrl = baseUrlMatch[0];
    // Create optimized srcset with only necessary sizes
    return `srcset="${baseUrl}&width=400 400w, ${baseUrl}&width=600 600w, ${baseUrl}&width=800 800w, ${baseUrl}&width=1200 1200w"`;
});

// 2. Add lazy loading to all images
html = html.replace(/<img([^>]+)>/g, (match, attrs) => {
    if (!attrs.includes('loading=')) {
        return `<img${attrs} loading="lazy">`;
    }
    return match;
});

// 3. Add preconnect hints
const preconnectHtml = `
    <!-- Performance optimizations -->
    <link rel="preconnect" href="https://cdn.shopify.com">
    <link rel="preconnect" href="https://www.blackbookrecs.com">
    <link rel="dns-prefetch" href="https://cdn.shopify.com">
    <link rel="dns-prefetch" href="https://www.blackbookrecs.com">
`;
html = html.replace('</title>', '</title>' + preconnectHtml);

// 4. Move non-critical scripts to bottom and add async/defer
html = html.replace(/<script([^>]*?)src="([^"]+)"([^>]*?)><\/script>/g, (match, before, src, after) => {
    // Skip if already has async or defer
    if (before.includes('async') || before.includes('defer') || after.includes('async') || after.includes('defer')) {
        return match;
    }
    
    // Add defer to external scripts
    return `<script${before}src="${src}"${after} defer></script>`;
});

// 5. Optimize sizes attribute for responsive images
html = html.replace(/sizes="[^"]+"/g, 'sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"');

// 6. Add critical CSS inline
const criticalCSS = `
<style>
/* Critical CSS for faster initial render */
body { margin: 0; padding: 0; background: #000; color: #fff; }
.header { position: sticky; top: 0; z-index: 1000; background: #000; }
img { max-width: 100%; height: auto; }
.loading { opacity: 0; transition: opacity 0.3s; }
.loaded { opacity: 1; }
</style>
`;
html = html.replace('</head>', criticalCSS + '</head>');

// 7. Remove excessive animations to improve performance
html = html.replace(/animation:\s*[^;]+;/g, (match) => {
    // Keep only essential animations
    if (match.includes('fuzzy') || match.includes('float-particles')) {
        return '/* ' + match + ' */'; // Comment out heavy animations
    }
    return match;
});

// Write the optimized file
const outputPath = path.join(__dirname, 'pages', 'releases-optimized-auto.html');
fs.writeFileSync(outputPath, html);

console.log('Releases page optimized successfully!');
console.log(`Original size: ${fs.statSync(filePath).size / 1024}KB`);
console.log(`Optimized size: ${fs.statSync(outputPath).size / 1024}KB`);