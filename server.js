const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { promisify } = require('util');
const convert = require('heic-convert');
const path = require('path');

// Tạo thư mục lưu trữ file upload nếu chưa tồn tại
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Cấu hình multer để lưu file tạm thời
const upload = multer({ dest: uploadDir });

const app = express();
const PORT = 3000;

// Route upload và xử lý file
app.post('/convert-heic', upload.single('file'), async (req, res) => {
    try {
        // Kiểm tra file upload
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        // Đọc file HEIC
        const inputBuffer = await promisify(fs.readFile)(req.file.path);

        // Chuyển đổi sang JPEG
        const outputBuffer = await convert({
            buffer: inputBuffer, // Buffer từ file HEIC
            format: 'JPEG',      // Định dạng đầu ra
            quality: 1           // Chất lượng JPEG (0 - 1)
        });

        // Tạo file JPEG tạm thời để trả về
        const outputPath = path.join(uploadDir, `${req.file.filename}.jpg`);
        await promisify(fs.writeFile)(outputPath, outputBuffer);

        // Trả file JPEG đã chuyển đổi
        res.download(outputPath, 'converted.jpg', async (err) => {
            if (err) {
                console.error('Error sending file:', err);
            }
            // Xóa file tạm sau khi gửi xong
            fs.unlinkSync(req.file.path);
            fs.unlinkSync(outputPath);
        });
    } catch (err) {
        console.error('Error processing file:', err);
        res.status(500).send('An error occurred while processing the file.');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
