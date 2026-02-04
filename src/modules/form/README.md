# Form Builder API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_token>
```

---

## Form Management

### 1. Get All Forms
```http
GET /forms
GET /forms?formType=EVALUATION    # Filter by type
GET /forms?formType=PRE_POST      # Filter by type
GET /forms?formType=CUSTOM        # Filter by type
```

### 2. Get Forms by Type (Dedicated Routes)
```http
GET /forms/type/evaluation    # Get evaluation forms only
GET /forms/type/pre-post      # Get pre-post forms only
GET /forms/type/custom        # Get custom forms only
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx",
      "title": "Customer Feedback",
      "description": "Feedback form",
      "formType": "CUSTOM",
      "isActive": true,
      "fields": [...],
      "_count": {
        "submissions": 10
      },
      "createdAt": "2026-01-26T...",
      "updatedAt": "2026-01-26T..."
    }
  ],
  "message": "Forms retrieved successfully"
}
```

### 2. Get Form by ID
```http
GET /forms/:id
```

### 3. Create Form
```http
POST /forms
```

**Body:**
```json
{
  "title": "Customer Feedback",
  "description": "Please provide your feedback",
  "formType": "CUSTOM",     // EVALUATION | PRE_POST | CUSTOM
  "isActive": true
}
```

**Pro Tip:** Use type-specific validation by specifying formType in the request.
The backend will auto-validate based on the form type.

### 4. Update Form
```http
PUT /forms/:id
```

**Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "isActive": false
}
```

### 5. Delete Form
```http
DELETE /forms/:id
```

### 6. Toggle Form Status
```http
PATCH /forms/:id/toggle
```

### 7. Duplicate Form
```http
POST /forms/:id/duplicate
```

---

## Form Field Management

### 1. Add Field
```http
POST /forms/:id/fields
```

**Body:**
```json
{
  "label": "Full Name",
  "fieldType": "TEXT",
  "placeholder": "Enter your name",
  "required": true,
  "validation": {
    "minLength": 3,
    "maxLength": 100
  }
}
```

**Field Types:**
- `TEXT` - Single line text input
- `TEXTAREA` - Multi-line text area
- `NUMBER` - Numeric input
- `EMAIL` - Email input with validation
- `DATE` - Date picker
- `SELECT` - Dropdown select
- `RADIO` - Radio buttons
- `CHECKBOX` - Checkboxes
- `FILE` - File upload
- `RATING` - Star rating

**For SELECT, RADIO, CHECKBOX:**
```json
{
  "label": "Choose Option",
  "fieldType": "SELECT",
  "required": true,
  "options": ["Option 1", "Option 2", "Option 3"]
}
```

### 2. Update Field
```http
PUT /forms/:id/fields/:fieldId
```

### 3. Delete Field
```http
DELETE /forms/:id/fields/:fieldId
```

### 4. Reorder Fields (Drag & Drop)
```http
PATCH /forms/:id/fields/reorder
```

**Body:**
```json
{
  "fieldOrders": [
    { "fieldId": "field1", "order": 0 },
    { "fieldId": "field2", "order": 1 },
    { "fieldId": "field3", "order": 2 }
  ]
}
```

---

## Form Submissions

### 1. Submit Form (Public)
```http
POST /forms/:id/submit
```

**Body:**
```json
{
  "userId": "user123",
  "responses": {
    "field_id_1": "John Doe",
    "field_id_2": "john@example.com",
    "field_id_3": 5
  }
}
```

### 2. Get Form Submissions
```http
GET /forms/:id/submissions?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  },
  "message": "Submissions retrieved successfully"
}
```

### 3. Get Single Submission
```http
GET /submissions/:id
```

### 4. Delete Submission
```http
DELETE /submissions/:id
```

### 5. Export Submissions as CSV
```http
GET /forms/:id/export
```

Returns a CSV file with all submissions.

---

## Form Types

- `EVALUATION` - Employee evaluation forms
- `PRE_POST` - Pre/Post training assessment
- `CUSTOM` - Custom forms

---

## Validation Rules (JSON)

```json
{
  "minLength": 5,
  "maxLength": 100,
  "min": 1,
  "max": 10,
  "pattern": "^[a-zA-Z]+$",
  "email": true
}
```

---

## Error Responses

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Server Error
