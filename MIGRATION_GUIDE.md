# NOBIS Client Dashboard — Wiring Summary

## What's Been Done (Steps 1–5 of Phase 1)

All infrastructure and plumbing is in place. The project is ready to connect to your live backend.

### New Files (21 files, ~920 lines)

| File | Purpose |
|------|---------|
| **Auth Infrastructure** | |
| `src/main.tsx` | ✏️ Modified — Auth0Provider wraps the app |
| `src/components/AuthAxiosBootstrap.tsx` | Attaches Bearer token to every API request |
| `src/components/ProtectedRoute.tsx` | Redirects to /login if not authenticated |
| `src/contexts/AppStateContext.tsx` | Fetches + holds user profile after login |
| `src/pages/Login.tsx` | Auth0 redirect login, rebuilt with shadcn/Tailwind |
| `src/pages/AuthCallback.tsx` | Handles Auth0 redirect back |
| **API Client** | |
| `src/lib/api.ts` | Centralized Axios instance with auth interceptor |
| `src/lib/constants.ts` | localStorage key constants |
| **Service Layer (7 files)** | |
| `src/services/auth.ts` | Login, profile endpoints |
| `src/services/applicant.ts` | Applicant CRUD |
| `src/services/applicantDocResults.ts` | Full applicant detail with docs |
| `src/services/dashboard.ts` | Dashboard stats + recent activity |
| `src/services/flow.ts` | Flow CRUD |
| `src/services/upload.ts` | S3 file upload |
| `src/services/verificationResult.ts` | Verification result CRUD |
| `src/services/client.ts` | Client profile update |
| **React Query Hooks (5 files)** | |
| `src/hooks/useApplicants.ts` | Applicant list, detail, create, update, delete |
| `src/hooks/useDashboardStats.ts` | Dashboard stats with auto-refresh |
| `src/hooks/useFlows.ts` | Flow list, detail, create, update, delete |
| `src/hooks/useUploadFile.ts` | File upload mutation |
| `src/hooks/useAuth.ts` | Login mutations, auth check, logout |
| **Types** | |
| `src/types/applicant.ts` | Shared TypeScript interfaces |

### Modified Files (4 files)

| File | Change |
|------|--------|
| `src/App.tsx` | Routes renamed `/admin/*` → `/client/*`, auth routes added, ProtectedRoute wrapping, AppStateProvider added |
| `src/main.tsx` | Auth0Provider wrapping with full config |
| `src/components/admin/AdminSidebar.tsx` | Nav routes → `/client/*`, labels match old sidebar, Auth0 logout |
| `package.json` | Added `@auth0/auth0-react` and `axios` |

### Route Mapping (Old → New)

| Old Route | New Route | Status |
|-----------|-----------|--------|
| `/login` | `/login` | ✅ Built |
| `/callback` | `/callback` | ✅ Built |
| `/client` | `/client` | ✅ Routed (page needs API wiring) |
| `/client/users` | `/client/users` | ✅ Routed (page needs API wiring) |
| `/client/users/:id` | `/client/users/:id` | ✅ Routed (page needs API wiring) |
| `/client/flows` | `/client/flows` | ✅ Routed (page needs API wiring) |
| `/client/aml-sanctions` | `/client/aml-sanctions` | ✅ Routed (mock data OK for now) |
| `/client/risk-fraud` | `/client/risk-fraud` | ✅ Routed (mock data OK for now) |
| `/client/settings` | `/client/settings` | ✅ Routed (partially wired) |
| `/client/admin-profile` | `/client/admin-profile` | ✅ Routed (placeholder) |
| `/client/activity` | `/client/activity` | ✅ Routed (partially wired) |

---

## What's Still Needed (Step 6 — Wire Pages to Real Data)

The hooks and services are ready. The pages still use hardcoded mock data. Here's what to do for each:

### Dashboard.tsx — Replace hardcoded stats
```tsx
// Add this:
import { useDashboardStats, useRecentActivity } from "@/hooks/useDashboardStats";

// In component:
const { data: stats, isLoading, error } = useDashboardStats();
const { data: recentData } = useRecentActivity();

// Replace hardcoded values with:
// stats?.totalApplicants, stats?.approved, stats?.pending, stats?.rejected
// recentData for the recent verifications list
```

### Applicants.tsx — Replace mockApplicants array
```tsx
// Add this:
import { useApplicantsQuery } from "@/hooks/useApplicants";

// Replace:
const [applicants, setApplicants] = useState(mockApplicants);
// With:
const { data, isLoading } = useApplicantsQuery({ page, limit: 10, searchText: searchQuery });
const applicants = data?.applicants || [];

// Delete the entire mockApplicants array (~200 lines)
// Add a data mapping function for the API response shape
```

### ApplicantDetails.tsx — Replace mock detail data
```tsx
// Add this:
import { getApplicantFullDetails } from "@/services/applicantDocResults";

// In component:
const { id } = useParams();
const [applicant, setApplicant] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (id) {
    getApplicantFullDetails(id)
      .then(data => { setApplicant(data.applicant); setLoading(false); })
      .catch(() => setLoading(false));
  }
}, [id]);

// Replace demo image imports with actual URLs from API response
// Remove: import carolSelfie, carolIdFront, etc.
```

### Flows.tsx — Replace localStorage with API
```tsx
// Add this:
import { useFlowsQuery, useCreateFlow, useDeleteFlow } from "@/hooks/useFlows";

// Replace localStorage logic with:
const { data: flowsData, isLoading } = useFlowsQuery({ page: 1, searchText: searchQuery });
const flows = flowsData?.flows || [];
const createFlow = useCreateFlow();
const deleteFlow = useDeleteFlow();

// Delete: STORAGE_KEY, getStoredFlows() function
```

---

## Setup Instructions

1. Copy `.env.example` to `.env` and fill in your Auth0 + API values
2. Run `npm install`
3. Run `npm run dev`
4. Visit `http://localhost:5173` — should redirect to `/login`
5. Auth0 values needed from your Auth0 dashboard:
   - Domain (e.g., `your-tenant.auth0.com`)
   - Client ID
   - API Audience
6. Add `http://localhost:5173/callback` to Auth0's Allowed Callback URLs
7. Add `http://localhost:5173/login` to Auth0's Allowed Logout URLs
8. Add `http://localhost:5173` to Auth0's Allowed Web Origins

---

## Architecture

```
User hits /client/* 
  → ProtectedRoute checks Auth0 
    → Not logged in? → /login → Auth0 redirect → /callback → /client
    → Logged in? → Render page
      → AuthAxiosBootstrap attaches Bearer token to all Axios requests
      → AppStateContext fetches user profile from /clients/profile
      → Pages use React Query hooks → services → Axios (api.ts) → Backend
```
