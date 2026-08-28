# Guide: Defining & Serving a Calculation Tool

This guide explains how to define a new calculation tool requirement and make it accessible under a dedicated product URL (e.g., `/product?id=33`).

---

## Workflow Overview

```
1. Define Tool Requirement  -->  2. Persist in Database  -->  3. Map User Permissions  -->  4. Serve via Unique URL
   (Inputs, Formula, UI)         (Insert App Entity)            (UsersNAppMapping)           (/product?id=33)
```

---

## Step-by-Step Implementation

### Step 1: Create an `App` Entity in the Database
An `App` entity represents the dynamic calculation tool. Save a record using TypeORM (`libs/db/src/entities/App.entity.ts`):

```typescript
import { AppDataSource, App } from '@calcversa/db';

const appRepository = AppDataSource.getRepository(App);

const app = appRepository.create({
  name: "Mortgage Loan Calculator",
  description: "Calculates monthly mortgage payments based on interest rate and loan term.",
  status: true,
  inputsConfig: {
    fields: [
      { name: "principal", label: "Loan Amount ($)", type: "number", default: 250000 },
      { name: "annualRate", label: "Interest Rate (%)", type: "number", default: 6.5 },
      { name: "years", label: "Term (Years)", type: "number", default: 30 }
    ]
  },
  formulaConfig: {
    expression: "PMT(principal, annualRate / 12 / 100, years * 12)"
  }
});

await appRepository.save(app);
```

### Step 2: Map Tool to User Account
Link the tool to the creator's account so that it remains account-specific:

```typescript
import { UsersNAppMapping } from '@calcversa/db';

const mappingRepository = AppDataSource.getRepository(UsersNAppMapping);

const mapping = mappingRepository.create({
  user_id: user.id,
  app_id: app.id,
  status: true
});

await mappingRepository.save(mapping);
```

### Step 3: Access Tool via Product URL
Navigate to the dedicated calculation tool URL in your web browser:
`http://localhost:3005/product?id=33`

The React frontend (`frontend/src/app/app.tsx`) will:
1. Extract `id=33` from query parameters.
2. Query NestJS API Gateway (`backend/api-gateway-nodejs/`) to check user authorization.
3. Dynamically build and display the input form for tool `33`.
4. Send input updates to Go Compute Engine (`backend/compute-service-golang/`) to evaluate results in real time.

---

## Related Documents
- `docs/architecture/data-model.md`
- `docs/adr/0003-account-specific-tool-schema.md`
- `frontend/src/app/app.tsx`
