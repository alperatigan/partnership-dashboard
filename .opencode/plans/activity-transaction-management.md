# Activity & Transaction Management Plan

## Hedef

Partner ve Admin panellerinde **para giriş/çıkış hareketlerini** yönetmek:
- **Admin panel**: Partner başına veya tüm partnerlerin transaction geçmişini görüntüle, yeni ödeme girişi yap
- **Partner dashboard**: Kendi transaction geçmişini görüntüle
- **Export**: Aylık/yıllık ve tarih aralığı ile CSV/Excel export

---

## 1. Database Şeması

### 1.1 Yeni Tablo: `transactions`

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  partner_id UUID REFERENCES partners(id),
  type TEXT NOT NULL CHECK (type IN ('commission', 'demo_bonus', 'setup_fee', 'customer_payment', 'refund', 'other')),
  direction TEXT NOT NULL CHECK (direction IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  reference TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  recorded_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);
```

### 1.2 View: `transactions_with_details`

Partner ve şirket bilgilerini join eden view.

---

## 2. API Endpoints

### Admin API (`/api/admin/transactions/`)
- `GET /` - List transactions (filter: company_id, partner_id, type, direction, date_range)
- `POST /` - Create transaction
- `GET /export` - Export as CSV (params: start_date, end_date)

### Partner API (`/api/transactions/`)
- `GET /` - List own transactions
- `GET /export` - Export own transactions

---

## 3. Admin Panel Değişiklikleri

### Sidebar'a Activity
```tsx
{ name: 'Activity', icon: Activity, href: '/admin/activity' }
```

### Company Switcher
Şirket seçimine ek olarak "partner" dropdown ekle (şirket içinde partner filtreleme)

### Activity Page (`/admin/activity`)
- Filtreler: Tarih aralığı, Tip, Yön, Partner (arama)
- Tablo: Tarih, Partner, Tip, Açıklama, Miktar, Durum
- Icon + renk bazlı tip gösterimi
- Pagination
- Export: Aylık, Yıllık, Tarih Aralığı

### Transaction Entry Dialog
- Partner seçimi
- Tip (Commission, Demo Bonus, Setup Fee, Customer Payment, Refund, Other)
- Yön (Gelir/Gider)
- Miktar, Currency, Açıklama, Referans

---

## 4. Partner Dashboard Değişiklikleri

### Sidebar'a Activity
```tsx
{ name: 'Activity', icon: Activity, href: '/dashboard/activity' }
```

### Activity Page (`/dashboard/activity`)
- Filtreler: Tarih aralığı, Tip
- Tablo: Tarih, Tip, Açıklama, Miktar, Durum
- Sadece kendi transaction'ları
- Export buttons

---

## 5. Export

### CSV Export
```typescript
export async function exportToCSV(data: Transaction[], filename: string)
```

---

## 6. Dosya Yapısı

```
src/
├── app/
│   ├── admin/(dashboard)/activity/page.tsx    # Admin activity
│   └── dashboard/activity/page.tsx            # Partner activity
├── components/
│   ├── admin/
│   │   ├── transaction-dialog.tsx
│   │   └── activity-table.tsx
│   └── dashboard/
│       └── activity-table.tsx
└── lib/
    └── export.ts
```

---

## 7. İş Sıralaması

**Phase 1 - Database**
- [ ] Migration: `transactions` tablosu
- [ ] Migration: View `transactions_with_details`

**Phase 2 - API**
- [ ] Admin transactions API (list, create, export)
- [ ] Partner transactions API (list, export)

**Phase 3 - Admin Panel**
- [ ] Sidebar Activity item
- [ ] CompanySwitcher partner dropdown
- [ ] Activity page
- [ ] Transaction dialog
- [ ] Export buttons

**Phase 4 - Partner Dashboard**
- [ ] Sidebar Activity item
- [ ] Activity page
- [ ] Export buttons

---

## 8. Notlar

- Mevcut `commissions` ve `payments` tabloları korunacak
- Transaction oluşturulduğunda `activity_log` tablosuna da kayıt
- Export server-side (streaming)