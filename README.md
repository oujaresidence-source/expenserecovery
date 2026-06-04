# استعادة مصاريف الشقق

تطبيق عربي RTL بسيط لإعادة بناء مصاريف الشقق من ذاكرة المؤسس.

الفكرة ليست Expense Tracker تقليدي، وليست ERP مالي. التجربة أقرب إلى:

> Google Form على steroids

يفتح المؤسس الشقة، ينزل في نموذج عربي طويل، وكل المصاريف المحتملة موجودة ككروت جاهزة. يجاوب فقط:

- نعم
- لا
- لا أتذكر

ثم يضيف المبلغ إذا كان يتذكره، أو يختار نطاق تقريبي.

## الصفحات

- لوحة التحكم
- الشقق
- إعادة بناء الشقة
- التصدير

## التشغيل

```bash
npm install
npm run dev
```

## النشر على Netlify

تمت إضافة `netlify.toml`، لذلك Netlify يعرف الإعدادات تلقائياً:

- Build command: `npm run build`
- Publish directory: `.next`

ارفع المشروع إلى GitHub ثم اربطه مع Netlify.

## قاعدة البيانات

الملف [supabase/schema.sql](supabase/schema.sql) يحتوي نسخة مبسطة:

- apartments
- expenses

## ربط Supabase

1. افتح Supabase وأنشئ Project جديد.
2. من Supabase افتح **SQL Editor**.
3. انسخ محتوى `supabase/schema.sql` وشغّله.
4. من **Project Settings → API** انسخ:
   - Project URL
   - anon public key
5. في Netlify افتح المشروع ثم:
   - **Site configuration**
   - **Environment variables**
   - أضف:

```bash
NEXT_PUBLIC_SUPABASE_URL=ضع رابط مشروع Supabase هنا
NEXT_PUBLIC_SUPABASE_ANON_KEY=ضع anon public key هنا
```

6. اعمل deploy جديد من Netlify.

لا تضع `service_role` في Netlify ولا ترسله لأي أحد. التطبيق يحتاج anon public key فقط.

إذا لم يجد التطبيق مفاتيح Supabase، سيستخدم حفظ محلي في المتصفح كخطة احتياطية.
