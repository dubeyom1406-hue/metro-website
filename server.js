const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'content.json');
const UPLOAD_DIR = path.join(__dirname, 'assets', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Email OTP Logic Removed as per user request

const server = http.createServer((req, res) => {
    // console.log(`${req.method} ${req.url}`);

    // CORS Headers (for safety, though served locally)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API: Get Content
    if (req.url === '/api/content' && req.method === 'GET') {
        fs.readFile(DATA_FILE, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Could not read data' }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            }
        });
        return;
    }

    // API: Login
    if (req.url === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { password } = JSON.parse(body);

                // Read current password from DB
                const currentData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
                const savedPassword = currentData.admin?.password || 'Metro@2026'; // Fallback

                if (password === savedPassword) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, token: 'metro-secure-session-v1' }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Incorrect Password' }));
                }
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: 'Invalid Request' }));
            }
        });
        return;
    }

    // AUTH MIDDLEWARE (Simple Check)
    // APIs that require protection
    if (['/api/save', '/api/upload', '/api/delete-image'].some(route => req.url.startsWith(route))) {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (authHeader !== 'Bearer metro-secure-session-v1') {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Unauthorized: Please Login' }));
            return;
        }
    }

    // API: Save Content
    if (req.url === '/api/save' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                fs.writeFile(DATA_FILE, JSON.stringify(parsed, null, 4), 'utf8', (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: 'Write failed' }));
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    }
                });
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // API: Upload Image (Base64)
    if (req.url === '/api/upload' && req.method === 'POST') {
        let body = '';
        // Increase limit implicitly by handling streams manually, but in Node default is usually fine for reasonable images.
        // For large chunks, we should be careful, but local usage is fine.
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { name, image } = JSON.parse(body);
                // image is "data:image/png;base64,....."
                const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

                if (!matches || matches.length !== 3) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, error: 'Invalid base64 string' }));
                }

                const buffer = Buffer.from(matches[2], 'base64');
                const timestamp = Date.now();
                const cleanName = name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
                const filename = `${timestamp}_${cleanName}`;
                const savePath = path.join(UPLOAD_DIR, filename);

                fs.writeFile(savePath, buffer, (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: 'File save failed' }));
                    } else {
                        // Return relative path for frontend
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, path: `assets/uploads/${filename}` }));
                    }
                });

            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: 'Invalid Upload JSON' }));
            }
        });
        return;
    }

    // API: Delete Image
    if (req.url.startsWith('/api/delete-image') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { imagePath } = JSON.parse(body);

                // Validate image path to prevent directory traversal
                if (!imagePath || typeof imagePath !== 'string' || !imagePath.includes('assets/uploads/')) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Invalid image path' }));
                    return;
                }

                const fullPath = path.join(__dirname, imagePath);

                // Double check the path is within our upload directory
                const normalizedPath = path.normalize(fullPath);
                const uploadDirNormalized = path.normalize(UPLOAD_DIR);

                if (!normalizedPath.startsWith(uploadDirNormalized)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Invalid path' }));
                    return;
                }

                fs.unlink(fullPath, (err) => {
                    if (err) {
                        console.error('Delete error:', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: 'File delete failed' }));
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    }
                });
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: 'Invalid Delete JSON' }));
            }
        });
        return;
    }

    // Static File Serving
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';
    if (filePath.startsWith('./admin')) filePath = './admin/index.html'; // Basic SPA routing for admin

    const extname = path.extname(filePath);
    let contentType = mimeTypes[extname] || 'application/octet-stream';

    // Allow serving from assets/uploads
    // Logic: if dynamic path, we try to find it.

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code == 'ENOENT') {
                // Try admin rewrite if inside admin? No, we just need basic.
                fs.readFile('./404.html', (err, content) => {
                    res.writeHead(404);
                    res.end('404 Not Found');
                });
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + err.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
