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
> - 📧 Email: rahulkrwhy000@gmail.com
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

## 🏗️ Architecture Decisions

### **Why These Technologies?**

#### **Next.js 16 (App Router)**

- ✅ **Server-side rendering** for better SEO
- ✅ **API Routes** eliminate need for separate backend
- ✅ **File-based routing** simplifies navigation
- ✅ **Built-in optimization** (images, fonts, code splitting)

#### **Supabase (PostgreSQL + Storage)**

- ✅ **Real-time capabilities** for future features
- ✅ **Built-in authentication** (ready for user accounts)
- ✅ **S3-compatible storage** with presigned URLs
- ✅ **Row Level Security** for data protection
- ✅ **Free tier** suitable for MVP

#### **Client-Side Recording (MediaRecorder API)**

- ✅ **No server load** - processing happens in browser
- ✅ **High quality** - direct capture without compression
- ✅ **Privacy** - video never touches server until user uploads
- ❌ **Browser compatibility** - requires modern browsers

#### **Presigned URLs for Upload**

- ✅ **Bypasses server limits** - Vercel's 4.5MB limit avoided
- ✅ **Faster uploads** - direct to storage, no proxy
- ✅ **Scalable** - no server bandwidth consumption
- ✅ **Secure** - temporary, scoped URLs

#### **Canvas-Based Trimming**

- ✅ **No external dependencies** - pure browser APIs
- ✅ **Free** - no FFmpeg licensing or server costs
- ✅ **Client-side** - no server processing needed
- ❌ **Performance** - can be slow for long videos
- ❌ **Quality loss** - re-encoding reduces quality slightly

### **Key Design Patterns**

1. **Metadata-Based Trimming**

   - Store `trim_start` and `trim_end` in database
   - Video player respects these values
   - No file re-encoding needed (fast!)
   - Similar to YouTube's approach

2. **Direct-to-Storage Uploads**

   - Generate presigned URL server-side
   - Upload directly from browser to Supabase
   - Save metadata after upload completes
   - Prevents server bottlenecks

3. **Optimistic UI Updates**

   - Show loading states immediately
   - Update UI before server confirms
   - Better perceived performance

4. **Progressive Enhancement**
   - Core features work without JavaScript
   - Enhanced features for modern browsers
   - Graceful degradation

## 🚀 Production Improvements

### **Critical for Production**

#### 1. **User Authentication** 🔐

**Current State**: Anyone can upload (security risk)

**Production Solution**:

```typescript
// Add Supabase Auth
import { createServerClient } from "@supabase/ssr";

// Protect upload routes
if (!session) {
  return new Response("Unauthorized", { status: 401 });
}
```

**Benefits**:

- User-specific video libraries
- Delete own videos
- Private/public videos
- Prevent abuse

---

#### 2. **Rate Limiting** ⏱️

**Current State**: No upload limits

**Production Solution**:

```typescript
// Use Upstash Redis + Vercel Edge Config
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 uploads per hour
});
```

**Benefits**:

- Prevent spam
- Reduce storage costs
- Protect against abuse

---

#### 3. **Video Processing Pipeline** 🎬

**Current State**: Browser-based trimming (slow, quality loss)

**Production Solution**:

- **Option A**: Server-side FFmpeg on VPS
  ```bash
  # Deploy to DigitalOcean/AWS with FFmpeg
  ffmpeg -i input.webm -ss 5 -t 15 -c copy output.mp4
  ```
- **Option B**: Use Mux/Cloudinary API
  ```typescript
  // Cloudinary video transformation
  cloudinary.video("video_id", {
    start_offset: 5,
    end_offset: 20,
  });
  ```

**Benefits**:

- Faster processing
- Better quality
- No browser freezing
- Consistent results

---

#### 4. **CDN Integration** 🌍

**Current State**: Videos served directly from Supabase

**Production Solution**:

```typescript
// Use Cloudflare CDN
const videoUrl = `https://cdn.scapture.com/${videoId}`;

// Or Vercel Edge Network
export const config = {
  runtime: "edge",
};
```

**Benefits**:

- Faster global delivery
- Reduced bandwidth costs
- Better caching
- DDoS protection

---

#### 5. **Error Tracking** 🐛

**Current State**: Console.log only

**Production Solution**:

```typescript
// Add Sentry
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

**Benefits**:

- Real-time error alerts
- Stack traces
- User context
- Performance monitoring

---

#### 6. **Analytics & Monitoring** 📊

**Current State**: Basic view counts

**Production Solution**:

```typescript
// Add Vercel Analytics + PostHog
import { Analytics } from "@vercel/analytics/react";
import posthog from "posthog-js";

// Track user behavior
posthog.capture("video_uploaded", {
  duration: videoDuration,
  trimmed: isTrimmed,
});
```

**Benefits**:

- User behavior insights
- Conversion tracking
- Performance metrics
- A/B testing capability

---

### **Performance Optimizations**

#### 7. **Video Streaming** 📺

**Current State**: Full video download

**Production Solution**:

```typescript
// Implement HLS/DASH streaming
import Hls from "hls.js";

const hls = new Hls();
hls.loadSource("video.m3u8");
hls.attachMedia(video);
```

**Benefits**:

- Adaptive bitrate
- Faster initial load
- Better mobile experience
- Reduced bandwidth

---

#### 8. **Database Optimization** 🗄️

**Current State**: Basic queries

**Production Solution**:

```sql
-- Add indexes
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_videos_views ON videos(views DESC);

-- Add materialized views for analytics
CREATE MATERIALIZED VIEW video_stats AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as uploads,
  AVG(views) as avg_views
FROM videos
GROUP BY DATE(created_at);
```

**Benefits**:

- Faster queries
- Better analytics
- Reduced database load

---

#### 9. **Caching Strategy** ⚡

**Current State**: No caching

**Production Solution**:

```typescript
// Add Redis caching
import { Redis } from "@upstash/redis";

// Cache video metadata
const cached = await redis.get(`video:${id}`);
if (cached) return cached;

// Cache for 1 hour
await redis.setex(`video:${id}`, 3600, videoData);
```

**Benefits**:

- Reduced database queries
- Faster page loads
- Lower costs

---

### **Security Enhancements**

#### 10. **Content Moderation** 🛡️

**Production Solution**:

- **Manual review queue** for first-time users
- **AI moderation** (Google Cloud Vision API)
- **Report/flag system** for inappropriate content
- **DMCA takedown** process

#### 11. **Data Privacy** 🔒

**Production Solution**:

- **GDPR compliance** - data deletion requests
- **Cookie consent** banner
- **Privacy policy** and terms of service
- **Data encryption** at rest and in transit

#### 12. **DDoS Protection** 🛡️

**Production Solution**:

- **Cloudflare** proxy
- **Rate limiting** on all endpoints
- **CAPTCHA** for uploads
- **IP blocking** for abusers

---

### **Cost Optimization**

#### 13. **Storage Management** 💰

**Current State**: Unlimited storage

**Production Solution**:

```typescript
// Auto-delete old videos
const OLD_VIDEO_DAYS = 90;

// Cron job
export async function cleanupOldVideos() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - OLD_VIDEO_DAYS);

  await supabase
    .from("videos")
    .delete()
    .lt("created_at", cutoff.toISOString())
    .eq("views", 0); // Only delete unwatched videos
}
```

**Benefits**:

- Reduced storage costs
- Faster queries
- Better performance

---

### **Scalability Improvements**

#### 14. **Database Sharding** 🔀

**For 1M+ videos**:

- Partition by date/region
- Read replicas for analytics
- Separate database for metadata vs. analytics

#### 15. **Microservices Architecture** 🏗️

**For high traffic**:

- Separate upload service
- Dedicated transcoding service
- Analytics service
- API gateway (Kong/Nginx)

---

## 📈 Estimated Production Costs

### **Small Scale** (1,000 users, 10,000 videos/month)

- **Supabase**: $25/month (Pro plan)
- **Vercel**: $20/month (Pro plan)
- **Cloudflare**: $0 (Free tier)
- **Total**: ~$45/month

### **Medium Scale** (10,000 users, 100,000 videos/month)

- **Supabase**: $599/month (Team plan)
- **Vercel**: $20/month (Pro plan)
- **Cloudflare**: $20/month (Pro plan)
- **Mux/Cloudinary**: $200/month (video processing)
- **Total**: ~$839/month

### **Large Scale** (100,000+ users)

- **AWS/GCP**: Custom pricing
- **CDN**: $500+/month
- **Video Processing**: $2,000+/month
- **Database**: $1,000+/month
- **Total**: $5,000+/month

---

## 🎯 Recommended Production Stack

```
Frontend:
├── Next.js 16 (App Router)
├── TypeScript
├── TailwindCSS
└── Vercel (hosting)

Backend:
├── Next.js API Routes
├── Supabase (database + auth + storage)
└── Redis (caching)

Video Processing:
├── Mux or Cloudinary (transcoding)
└── FFmpeg (server-side, if self-hosted)

Monitoring:
├── Sentry (error tracking)
├── Vercel Analytics (performance)
└── PostHog (product analytics)

Infrastructure:
├── Cloudflare (CDN + DDoS protection)
├── Upstash (Redis + rate limiting)
└── GitHub Actions (CI/CD)
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

> **Note:** This project was created as an assignment/portfolio piece. Feel free to use it for learning, evaluation, or reference purposes.

## 🙏 Acknowledgments

- Powered by [Supabase](https://supabase.com)
- UI components from [Lucide Icons](https://lucide.dev)
- Toast notifications by [Sonner](https://sonner.emilkowal.ski)

---

Made with ❤️ by [RahulKumar9988](https://github.com/RahulKumar9988)
