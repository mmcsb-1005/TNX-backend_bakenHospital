# Form Builder Architecture Documentation

## 📐 Design Decision: Single Model, Multiple Types

This module uses **Option 1: Single Form Model** with type differentiation through `formType` enum.

### ✅ Why This Approach?

1. **DRY Principle** - No code duplication
2. **Maintainability** - Single source of truth for form logic
3. **Scalability** - Easy to add new form types without creating new models
4. **Flexibility** - Shared features across all form types
5. **Clean Database** - Minimal tables (Form, FormField, FormSubmission)

---

## 🗂️ Module Structure

```
backend/src/modules/form/
├── form.controller.ts              # Main controller with type-specific methods
├── form-field.controller.ts        # Field management (add, update, delete, reorder)
├── form-submission.controller.ts   # Submission handling and export
├── form.routes.ts                  # All API routes
├── form.validation.ts              # Validation middleware (general + type-specific)
├── README.md                       # API documentation
└── ARCHITECTURE.md                 # This file
```

---

## 🎯 Form Types

### 1. EVALUATION (`formType: 'EVALUATION'`)
**Purpose:** Employee performance evaluations

**Frontend Route:** `/admin/evaluation-form`

**Backend Endpoints:**
```http
GET /api/forms/type/evaluation          # Get all evaluation forms
POST /api/forms (formType: EVALUATION)  # Create evaluation form
```

---

### 2. PRE_POST (`formType: 'PRE_POST'`)
**Purpose:** Pre-training and post-training assessments

**Frontend Route:** `/admin/pre-post-form`

**Backend Endpoints:**
```http
GET /api/forms/type/pre-post            # Get all pre-post forms
POST /api/forms (formType: PRE_POST)    # Create pre-post form
```

---

### 3. CUSTOM (`formType: 'CUSTOM'`)
**Purpose:** Generic custom forms (feedback, surveys, etc.)

**Frontend Route:** `/admin/forms` (general)

**Backend Endpoints:**
```http
GET /api/forms/type/custom              # Get all custom forms
POST /api/forms (formType: CUSTOM)      # Create custom form
```

---

## 🔄 How Types Work

### Database Level
```prisma
model Form {
  formType FormType @default(CUSTOM)  // EVALUATION | PRE_POST | CUSTOM
}
```

### Controller Level
```typescript
// General - All forms
FormController.getAllForms()          // Returns all forms

// Type-specific - Filtered by type
FormController.getEvaluationForms()   // Returns only EVALUATION forms
FormController.getPrePostForms()      // Returns only PRE_POST forms
FormController.getCustomForms()       // Returns only CUSTOM forms
```

### Route Level
```typescript
// General route with optional filter
GET /api/forms?formType=EVALUATION

// Dedicated type-specific routes
GET /api/forms/type/evaluation
GET /api/forms/type/pre-post
GET /api/forms/type/custom
```

---

## 🛠️ Adding New Form Type

To add a new form type (e.g., SURVEY):

### 1. Update Prisma Schema
```prisma
enum FormType {
  EVALUATION
  PRE_POST
  CUSTOM
  SURVEY    // ← Add new type
}
```

### 2. Run Migration
```bash
npx prisma migrate dev --name add_survey_form_type
```

### 3. Add Controller Method
```typescript
// form.controller.ts
static async getSurveyForms(req: Request, res: Response) {
  const forms = await prisma.form.findMany({
    where: { formType: 'SURVEY' }
  })
  // ...
}
```

### 4. Add Route
```typescript
// form.routes.ts
router.get('/forms/type/survey', authMiddleware, FormController.getSurveyForms)
```

### 5. Add Validation (Optional)
```typescript
// form.validation.ts
static validateSurveyForm(req: Request, res: Response, next: NextFunction) {
  req.body.formType = 'SURVEY'
  // ...custom validation
  next()
}
```

That's it! No need to create new models or duplicate controllers.

---

## 🎨 Frontend Integration

### Evaluation Forms Page
```typescript
// /admin/evaluation-form/page.tsx
const { data } = await api.get('/api/forms/type/evaluation')
```

### Pre-Post Forms Page
```typescript
// /admin/pre-post-form/page.tsx
const { data } = await api.get('/api/forms/type/pre-post')
```

### Create Form
```typescript
// Evaluation form
await api.post('/api/forms', {
  title: 'Q1 2026 Evaluation',
  formType: 'EVALUATION'
})

// Pre-post form
await api.post('/api/forms', {
  title: 'Training Assessment',
  formType: 'PRE_POST'
})
```

---

## 🔐 Shared Features

All form types share these features:

- ✅ Dynamic field builder (drag & drop)
- ✅ Field validation rules
- ✅ Multiple field types (TEXT, SELECT, RATING, etc.)
- ✅ Form activation/deactivation
- ✅ Form duplication
- ✅ Submission tracking
- ✅ CSV export
- ✅ Response validation

---

## 📊 Data Flow

```
Frontend Page (by type)
    ↓
API Route (/forms/type/evaluation)
    ↓
Controller Method (getEvaluationForms)
    ↓
Prisma Query (where: { formType: 'EVALUATION' })
    ↓
Database (Form table filtered by formType)
    ↓
Response (only EVALUATION forms)
```

---

## 🚀 Benefits of This Architecture

### For Development:
- Single codebase to maintain
- Consistent API patterns
- Easy testing (one set of tests)
- Quick feature additions

### For Database:
- Normalized structure
- No redundant tables
- Easy queries with filtering
- Better performance

### For Frontend:
- Consistent API interface
- Reusable components
- Type-specific pages with shared logic
- Clear separation of concerns

---

## 📝 Best Practices

1. **Always specify formType** when creating forms
2. **Use dedicated routes** for type-specific operations
3. **Filter at query level** for better performance
4. **Validate form type** before processing
5. **Document new types** when adding them

---

## ⚠️ Common Pitfalls to Avoid

❌ **Don't** create separate models for each type
❌ **Don't** duplicate controller logic
❌ **Don't** hardcode form types in multiple places
❌ **Don't** forget to update the enum when adding types

✅ **Do** use the formType enum
✅ **Do** leverage existing controller methods
✅ **Do** filter by formType in queries
✅ **Do** maintain type-specific validations in one place

---

## 🔍 Troubleshooting

**Issue:** Forms from different types mixing up

**Solution:** Always filter by formType in queries:
```typescript
const forms = await prisma.form.findMany({
  where: { formType: 'EVALUATION' }  // ← Don't forget this
})
```

**Issue:** Can't distinguish form types in frontend

**Solution:** Use dedicated API routes:
```typescript
// Use this
GET /api/forms/type/evaluation

// Instead of
GET /api/forms  // Returns all types mixed
```

---

This architecture ensures the backend stays clean, organized, and easy to maintain! 🎉
