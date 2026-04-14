# ClinixGlow & Graftscope Partner Dashboard

Partner dashboard sistemi - ClinixGlow & Graftscope Global Partner Program için.

## Teknoloji Stack

- **Frontend**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + custom components
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Email + Google OAuth)
- **State Management**: Zustand + TanStack Query
- **Charts**: Recharts

## Kurulum

### 1. Supabase Projesi Oluştur

1. [Supabase](https://supabase.com) hesabı oluştur
2. Yeni proje oluştur (Region: Singapore)
3. SQL Editor'da `supabase/migrations/001_schema.sql` dosyasını çalıştır

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Gerekli değişkenler:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key

### 3. Supabase Auth Ayarları

1. Supabase Dashboard > Authentication > Settings
2. Site URL: `http://localhost:3000` (development)
3. Redirect URL'leri ekle:
   - `http://localhost:3000/dashboard`
4. Google OAuth için:
   - Google Cloud Console'da OAuth 2.0 client oluştur
   - Authorized redirect URI: `https://[project-ref].supabase.co/auth/v1/callback`

### 4. Google OAuth Setup

1. [Google Cloud Console](https://console.cloud.google.com/)'da:
   - New project oluştur
   - Credentials > OAuth 2.0 Client ID
   - Authorized redirect URI: `https://[project-ref].supabase.co/auth/v1/callback`

2. Supabase Dashboard > Authentication > Providers > Google:
   - Client ID ve Secret ekle

### 5. Admin Kullanıcı Oluştur

SQL Editor'da çalıştır:

```sql
-- Kendi auth user ID'n ile değiştir
INSERT INTO admins (user_id, name, email, role) 
VALUES ('your-auth-user-uuid', 'Your Name', 'your@email.com', 'super_admin');
```

## Geliştirme

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) adresinde aç.

## Deploy

### Vercel

1. GitHub'a push et
2. Vercel'de new project oluştur
3. Environment variables'ları ekle
4. Deploy et

### Environment Variables (Production)

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Proje Yapısı

```
dashboard/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login, Register
│   │   ├── admin/            # Admin panel
│   │   ├── dashboard/        # Partner dashboard
│   │   └── api/             # API routes
│   ├── components/
│   │   ├── ui/              # UI components (Button, Card, etc.)
│   │   └── dashboard/        # Dashboard specific components
│   ├── hooks/               # React hooks
│   ├── lib/
│   │   └── supabase/        # Supabase clients
│   └── types/               # TypeScript types
├── supabase/
│   └── migrations/          # Database schema
└── package.json
```

## Sayfalar

### Partner Dashboard (`/dashboard`)
- Overview - Ana sayfa, istatistikler
- Commissions - Komisyon geçmişi
- Simulator - Kazanç hesaplayıcı
- Profile - Profil düzenleme

### Admin Panel (`/admin`)
- Partners - Partner yönetimi, başvuru onay/red
- Settings - Fiyatlandırma, komisyon oranları
- Reports - Analitikler, grafikler

## Özellikler

- [x] Email + Google OAuth authentication
- [x] Partner registration & login
- [x] Partner dashboard (overview, commissions, simulator, profile)
- [x] Admin panel (partner management, settings, reports)
- [x] Commission tracking & tiers (Silver/Gold/Platinum)
- [x] Income simulator with 12-month projection
- [x] Charts & analytics (Recharts)
- [x] Multi-country support (PH, VN, TH)
- [x] Responsive design
- [x] RLS (Row Level Security) policies

## Sonraki Adımlar

- [ ] Email notifications (welcome, commission paid, tier upgrade)
- [ ] Password reset flow
- [ ] Real-time updates
- [ ] PWA support
- [ ] Dark mode toggle
- [ ] Mobile app (React Native)

## Destek

Herhangi bir sorun için issue açabilirsin.
