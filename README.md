# 🎥 sCapture - Screen Recording & Sharing Platform

A modern, high-quality screen recording application with cloud storage, video trimming, and instant sharing capabilities.

## ✨ Features

- 🎬 **High-Quality Recording** - 8 Mbps video, 128 kbps audio
- ✂️ **Video Trimming** - Browser-based trimming with progress tracking
- ☁️ **Cloud Storage** - Direct-to-cloud uploads via Supabase
- 📊 **Analytics** - View counts and completion rate tracking
- 🔗 **Instant Sharing** - Generate shareable links immediately
- 🎨 **Modern UI** - Beautiful, responsive design with toast notifications
- 🚀 **Fast Uploads** - Presigned URLs bypass server limits

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (S3-compatible)
- **Video Processing**: Canvas API + MediaRecorder
- **Notifications**: Sonner (toast notifications)

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account ([supabase.com](https://supabase.com))
- Vercel account (for deployment, optional)

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/RahulKumar9988/sCapture.git
cd sCapture
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### A. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to initialize

#### B. Run Database Migration

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy the contents of `supabase-migration-trim.sql` (contact me for complete migration file)
3. Paste and run the SQL script
4. This creates the `videos` table with all required columns and policies

> **Need the migration file?** If you don't have `supabase-migration-trim.sql`, please contact me:
>
> - 💬 GitHub Discussions: [Open a discussion](https://github.com/RahulKumar9988/sCapture/discussions)
> - 📧 Email: rahulkumar9988@example.com
> - 🐛 Issues: [Report an issue](https://github.com/RahulKumar9988/sCapture/issues)

#### C. Set Up Storage

1. Go to **Storage** in Supabase Dashboard
2. Create a new bucket named `videos`
3. Set bucket to **Public** (or configure RLS policies)

#### D. Get S3 Credentials

1. Go to **Project Settings** → **API**
2. Copy your **Project URL** and **anon key**
3. Go to **Storage** → **Settings** → **S3 Access Keys**
4. Generate new S3 access keys

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Supabase S3 Storage (for direct uploads)
SUPABASE_S3_ENDPOINT=https://your-project.supabase.co/storage/v1/s3
SUPABASE_ACCESS_KEY_ID=your-s3-access-key
SUPABASE_SECRET_ACCESS_KEY=your-s3-secret-key
SUPABASE_BUCKET_NAME=videos
SUPABASE_REGION=us-east-1

# Optional: App URL (for sharing links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **Security Note**: Never commit `.env.local` to Git!

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
sCapture/
├── app/
│   ├── api/
│   │   ├── upload/
│   │   │   └── presigned/route.ts    # Generate presigned URLs
│   │   └── video/
│   │       ├── [id]/
│   │       │   ├── stream/route.ts   # Video proxy
│   │       │   ├── view/route.ts     # View counter
│   │       │   └── progress/route.ts # Analytics
│   │       └── create/route.ts       # Save video metadata
│   ├── record/page.tsx               # Recording interface
│   ├── watch/[id]/page.tsx           # Video player
│   └── page.tsx                      # Landing page
├── lib/
│   ├── db.ts                         # Supabase client
│   └── storage.ts                    # S3 client
└── supabase-migration-trim.sql       # Database schema
```

## 🎯 How It Works

### Recording Flow

1. User clicks "Start Recording"
2. Browser captures screen + audio (MediaRecorder API)
3. Video is recorded at 8 Mbps quality
4. User can preview and trim the recording

### Upload Flow

1. User clicks "Upload"
2. If trimmed: Browser re-encodes video using Canvas API
3. App requests presigned URL from `/api/upload/presigned`
4. Video uploads directly to Supabase Storage (bypasses server)
5. Metadata saved to database via `/api/video/create`
6. User gets shareable link

### Playback Flow

1. User opens watch page
2. Video streams via `/api/video/[id]/stream` (proxy)
3. If trimmed: Player auto-seeks to `trim_start` and stops at `trim_end`
4. View count increments automatically
5. Completion rate tracked on pause/end

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

> **Note:** This project was created as an assignment/portfolio piece. Feel free to use it for learning, evaluation, or reference purposes.

## 🙏 Acknowledgments

- Powered by [Supabase](https://supabase.com)
- UI components from [Lucide Icons](https://lucide.dev)
- Toast notifications by [Sonner](https://sonner.emilkowal.ski)

---

Made with ❤️ by [RahulKumar9988](https://github.com/RahulKumar9988)
