# رفع الحلقات على يوتيوب أوتوماتيك (إعداد مرة واحدة)

بعد الإعداد ده، كل حلقة بتترفع من GitHub Actions بالعنوان والوصف والتاجز والترجمة والصورة المصغّرة وقائمة التشغيل، من غير ما تفتح يوتيوب.

## 1. مشروع Google Cloud (5 دقايق)
1. افتح https://console.cloud.google.com/ وبنفس حساب جوجل بتاع القناة، اعمل **New Project** (اسمه مثلًا `youssef-channel`).
2. **APIs & Services → Library** → دوّر على **YouTube Data API v3** → **Enable**.
3. **APIs & Services → OAuth consent screen** → External → اسم التطبيق أي حاجة، إيميلك → Save. في **Audience** اضغط **Publish app** (عشان التوكن ما ينتهيش كل 7 أيام). هيقولك إنه "unverified"؛ عادي، إنت بس اللي هتستخدمه.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID** → Application type: **Desktop app** → Create → **Download JSON**، وسمّي الملف `client_secret.json`.

## 2. التصريح للقناة (دقيقتين، على جهازك)
في فولدر فيه `client_secret.json` وملف `publish/yt_auth.py` من الريبو:
```bash
pip install google-auth-oauthlib
```
```bash
python yt_auth.py
```
هيفتح المتصفح: اختار حساب القناة، اضغط **Continue** على تحذير unverified، ووافق. هيكتب ملف `token.json`.

## 3. السرّ في GitHub
في الريبو: **Settings → Secrets and variables → Actions → New repository secret**:
- الاسم `YT_TOKEN_JSON`، والقيمة: محتوى `token.json` كله.
وبعدين امسح `token.json` و`client_secret.json` من جهازك (أو خليهم في مكان آمن).

## 4. الرفع
من دلوقتي أنا بشغّل الـworkflow `Upload to YouTube` لكل حلقة. بيرفعها **private** الأول عشان تراجعها؛ وأول ما تقول "انشر" بنغيّرها لـpublic (أو بنرفعها public على طول لو تحب).

> ملاحظة: جوجل بتخلي الفيديوهات اللي بتترفع من مشروع API لسه ما اتراجعش (audit) **private** لحد ما يتراجع. لو حصل كده، بتضغط Public من YouTube Studio بإيدك (ثانية واحدة)، وكل الميتاداتا والترجمة والصورة بتكون جاهزة. ولو عايز، نقدّم على الـaudit من نفس الصفحة (مجاني، بياخد أيام).
