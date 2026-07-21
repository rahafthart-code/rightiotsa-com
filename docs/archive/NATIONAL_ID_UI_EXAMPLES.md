# National ID Field - UI Examples

## Registration Form (English)

```
┌────────────────────────────────────────────────────────────┐
│  Create New Account                                        │
│  Enter your details to start tracking your livestock      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Full Name *                                               │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Mohammed Ahmed                                     │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  National ID *                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ 1234567890                                      ✓  │   │  ← Green checkmark when valid
│  └────────────────────────────────────────────────────┘   │
│  10-digit number on your National ID card                 │
│                                                            │
│  Mobile Number *                                           │
│  ┌────────────────────────────────────────────────────┐   │
│  │ 0501234567                                         │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  [Continue with rest of form...]                          │
└────────────────────────────────────────────────────────────┘
```

## Validation States

### ✅ Valid State (10 digits entered)
```
National ID *
┌────────────────────────────────────────────────────┐
│ 1234567890                                      ✓  │  ← Green border + checkmark
└────────────────────────────────────────────────────┘
10-digit number on your National ID card
```

### ❌ Invalid State (less than 10 digits)
```
National ID *
┌────────────────────────────────────────────────────┐
│ 123456789                                       ✗  │  ← Red border + X icon
└────────────────────────────────────────────────────┘
National ID must be exactly 10 digits                 ← Error message
```

### ⚪ Neutral State (not yet touched)
```
National ID *
┌────────────────────────────────────────────────────┐
│ 1234567890                                         │  ← Gray border
└────────────────────────────────────────────────────┘
10-digit number on your National ID card
```

---

## Registration Form (Arabic)

```
┌────────────────────────────────────────────────────────────┐
│                                        إنشاء حساب جديد     │
│      أدخل بياناتك للبدء في تتبع أصولك الحيوانية          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                                          * الاسم الثنائي   │
│   ┌────────────────────────────────────────────────────┐  │
│   │                                     محمد أحمد     │  │
│   └────────────────────────────────────────────────────┘  │
│                                                            │
│                                    * رقم الهوية الوطنية   │
│   ┌────────────────────────────────────────────────────┐  │
│   │  ✓                                      1234567890 │  │  ← علامة صح خضراء عند الصحة
│   └────────────────────────────────────────────────────┘  │
│                 الرقم المكون من 10 أرقام الموجود على بطاقة الهوية الوطنية │
│                                                            │
│                                            * رقم الجوال   │
│   ┌────────────────────────────────────────────────────┐  │
│   │                                       0501234567   │  │
│   └────────────────────────────────────────────────────┘  │
│                                                            │
│                              [...بقية الحقول]              │
└────────────────────────────────────────────────────────────┘
```

## Arabic Validation States

### ✅ حالة صحيحة (10 أرقام)
```
* رقم الهوية الوطنية
┌────────────────────────────────────────────────────┐
│  ✓                                      1234567890 │  ← إطار أخضر + علامة صح
└────────────────────────────────────────────────────┘
الرقم المكون من 10 أرقام الموجود على بطاقة الهوية الوطنية
```

### ❌ حالة خاطئة (أقل من 10 أرقام)
```
* رقم الهوية الوطنية
┌────────────────────────────────────────────────────┐
│  ✗                                       123456789 │  ← إطار أحمر + علامة خطأ
└────────────────────────────────────────────────────┘
يجب أن يكون رقم الهوية 10 أرقام بالضبط              ← رسالة خطأ
```

---

## Profile Page Display

### English
```
┌─────────────────────────────────────────────────────┐
│  👤  Profile                                        │
│      Your personal data and account information    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ╔════════════════════════════════════════════════╗ │
│  ║ Full Name                                     ║ │
│  ║ Mohammed Ahmed                                ║ │
│  ╚════════════════════════════════════════════════╝ │
│                                                     │
│  ╔════════════════════════════════════════════════╗ │
│  ║ National ID                                   ║ │
│  ║ 1234567890                                    ║ │
│  ╚════════════════════════════════════════════════╝ │
│                                                     │
│  ╔════════════════════════════════════════════════╗ │
│  ║ Email Address                                 ║ │
│  ║ test@example.com                           ✓  ║ │
│  ║ Verified                                      ║ │
│  ╚════════════════════════════════════════════════╝ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Arabic
```
┌─────────────────────────────────────────────────────┐
│                                  الملف الشخصي  👤   │
│            بياناتك الشخصية ومعلومات الحساب         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ╔════════════════════════════════════════════════╗ │
│  ║                                   الاسم الكامل ║ │
│  ║                                    محمد أحمد   ║ │
│  ╚════════════════════════════════════════════════╝ │
│                                                     │
│  ╔════════════════════════════════════════════════╗ │
│  ║                             رقم الهوية الوطنية ║ │
│  ║                                    1234567890   ║ │
│  ╚════════════════════════════════════════════════╝ │
│                                                     │
│  ╔════════════════════════════════════════════════╗ │
│  ║                             البريد الإلكتروني ║ │
│  ║  ✓                           test@example.com  ║ │
│  ║                                      تم التحقق ║ │
│  ╚════════════════════════════════════════════════╝ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Visual Features

### Colors & Icons

**Valid State** (10 digits):
- Border: `border-emerald-500` (green)
- Focus Ring: `focus:ring-emerald-500`
- Icon: Green checkmark ✓ (`text-emerald-500`)

**Invalid State** (not 10 digits):
- Border: `border-red-500` (red)
- Focus Ring: `focus:ring-red-500`
- Icon: Red X ✗ (`text-red-500`)
- Error text: `text-red-400`

**Neutral State** (untouched):
- Border: `border-slate-700` (gray)
- Focus Ring: `focus:ring-emerald-500`

### Typography
- Input text: `text-slate-100` (light)
- Labels: `text-slate-300` (medium)
- Helper text: `text-slate-500` (dim)
- Error text: `text-red-400` (red)

### Spacing
- Input padding: `px-4 py-3`
- Rounded corners: `rounded-lg`
- Icon position: `absolute right-3`

---

## Code Example: Validation Logic

```javascript
// Validation function
const handleChange = (e) => {
  const { name, value } = e.target;
  
  if (name === 'nationalId') {
    setNationalIdTouched(true);
    const nationalIdRegex = /^\d{10}$/;  // Exactly 10 digits
    setNationalIdValid(nationalIdRegex.test(value));
  }
  
  setFormData({ ...formData, [name]: value });
};

// Form validation before submit
if (!nationalIdValid) {
  setError(
    i18n.language === 'ar' 
      ? 'يرجى إدخال رقم هوية وطنية صحيح (10 أرقام)'
      : 'Please enter a valid National ID (10 digits)'
  );
  return;
}
```

---

## Testing Checklist

- [ ] Field appears in registration form
- [ ] Accepts exactly 10 digits
- [ ] Rejects letters and special characters
- [ ] Shows green checkmark when valid
- [ ] Shows red X when invalid
- [ ] Displays error message (Arabic + English)
- [ ] maxLength prevents more than 10 characters
- [ ] Helper text displays correctly
- [ ] Sends national_id to backend API
- [ ] Stores in localStorage
- [ ] Displays in profile page
- [ ] Database saves value correctly
- [ ] RTL layout works in Arabic
