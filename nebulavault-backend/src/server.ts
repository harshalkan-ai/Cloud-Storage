import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import All Routes
import authRoutes from './routes/authRoutes';
import folderRoutes from './routes/folderRoutes';
import fileRoutes from './routes/fileRoutes';
import shareRoutes from './routes/shareRoutes';
import trashRoutes from './routes/trashRoutes';

dotenv.config();

const app = express();

// Configure CORS explicitly to allow requests from frontend (localhost:3000)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Mount All API Routes
app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/trash', trashRoutes);

app.get('/', (req, res) => {
  res.send('🚀 NebulaVault API is 100% live with Auth, Folders, Files, Sharing, and Trash!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ NebulaVault Backend Connected!`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Files API:  http://localhost:${PORT}/api/files`);
  console.log(`📂 Folders API: http://localhost:${PORT}/api/folders`);
  console.log(`🤝 Shares API:  http://localhost:${PORT}/api/shares`);
  console.log(`🗑️  Trash API:   http://localhost:${PORT}/api/trash`);
});