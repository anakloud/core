# ParentUP & PedConnect Student Profile Integration Architecture

This document describes the cross-service student profile integration between **ParentUP** (Parent Mobile App & Backend), **PedConnect** (Isolated White-Labeled Therapy Center Web Dashboard & Backend), and **Core** (Central Master Directory of Centers).

---

## Architecture Overview

- **Core Master Directory (`core_db.centers`)**: Stores the central catalog of onboarded therapy centers (`_id: 'CTR-100001'`, `name`, `slug`, `address`, `logoUri`). ParentUP queries Core to display the center catalog to parents.
- **ParentUP Database (`parentup_db`)**: Stores family profiles, master child demographic records (`children`), and parent-controlled center connection links (`center_kid`).
- **PedConnect Center Instance (`pedconnect_db`)**: Each therapy center runs its own white-labeled Docker container instance configured via environment variable `CENTER_ID="CTR-100001"`, storing center-specific operational student metadata (`students`), programs, and session schedules.


```mermaid
sequenceDiagram
    autonumber
    actor Parent as Parent (ParentUP App)
    participant PU_DB as ParentUP DB (parentup_db)
    participant PU_SVR as ParentUP Server (:3005)
    participant PC_SVR as PedConnect Server (:3006)
    participant PC_DB as PedConnect DB (pedconnect_db)
    actor Officer as Frontdesk Officer (PedConnect App)

    %% Step 1: Parent Invites Center
    rect rgb(240, 240, 255)
    Note over Parent, PU_DB: 1. Invitation Phase (ParentUP)
    Parent->>PU_SVR: Select Center (GraphQL: selectCenter)
    PU_SVR->>PU_DB: Create center_kid (ID: CKD-100001, status: 'pending')
    end

    %% Step 2: Center Inspects & Accepts Invitation
    rect rgb(240, 255, 240)
    Note over Officer, PC_DB: 2. Acceptance Phase (PedConnect)
    Officer->>PC_SVR: View Students / Pending Intake Requests
    PC_SVR->>PU_SVR: Fetch pending/connected kids for centerId (GraphQL)
    PU_SVR->>PU_DB: Query center_kid WHERE centerId = 'CTR-100001' AND status != 'revoked'
    PU_DB-->>PU_SVR: Return pending center_kid + child profile
    PU_SVR-->>PC_SVR: Child & Guardian Demographics
    PC_SVR-->>Officer: Display in "Pending Intake" Queue
    Officer->>PC_SVR: Click "Accept & Enroll" (Code: '23022')
    PC_SVR->>PU_SVR: Mutation acceptCenterKidInvitation(CKD-100001)
    PU_SVR->>PU_DB: Update center_kid status = 'connected'
    PC_SVR->>PC_DB: Insert local student record (ID: STU-100001, code: '23022', centerKidId: 'CKD-100001')
    end

    %% Step 3: Parent Revocation (If triggered)
    rect rgb(255, 240, 240)
    Note over Parent, PC_SVR: 3. Revocation Phase (ParentUP)
    Parent->>PU_SVR: Click "Revoke Center Access"
    PU_SVR->>PU_DB: Update center_kid status = 'revoked'
    PC_SVR->>PU_SVR: Subsequent profile request
    PU_SVR-->>PC_SVR: Access Revoked (null demographics)
    PC_SVR-->>Officer: UI displays "Access Revoked by Parent"
    end
```

---

## Identifier Conventions
- **Internal Database Linking**: Standard native MongoDB IDs (`_id`) are used for database indexes and primary key/foreign key relations.
- **Universal Public Identifier (`publicId`)**: An explicit top-level `publicId` field (e.g. `CHD-100001`, `STU-100001`, `CKD-100001`) is attached to student and child records for universal public referencing across PedConnect, TeachDay, PedMD, and ParentUP.

| Entity | Prefix | Example `publicId` | Internal `_id` | Database |
| :--- | :--- | :--- | :--- | :--- |
| Child Profile | `CHD` | `CHD-100001` | MongoDB ObjectId / UUID | `parentup_db` |
| Center Kid Connection | `CKD` | `CKD-100001` | MongoDB ObjectId / UUID | `parentup_db` |
| Local Center Student | `STU` | `STU-100001` | MongoDB ObjectId / UUID | `pedconnect_db` |
| Center / Branch | `CTR` | `CTR-100001` | MongoDB ObjectId / UUID | `pedconnect_db` |


---

## Data Models & Schemas

### 1. ParentUP Collections (`parentup_db`)

#### `center_kid` Collection
Junction document managed directly by the parent to grant, confirm, or revoke center access to a child's profile.
```typescript
export interface DbCenterKid {
  _id: string;              // e.g., 'CKD-100001'
  centerId: string;         // e.g., 'CTR-100001'
  childId: string;          // e.g., 'CHD-100001'
  parentId: string;         // e.g., 'PAR-100001'
  status: 'pending' | 'connected' | 'revoked';
  invitedAt: Date;
  connectedAt?: Date | null;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `children` Collection
Master demographic record maintained by the parent in ParentUP.
```typescript
export interface DbChild {
  _id: string;              // e.g., 'CHD-100001'
  parentId: string;
  firstName: string;
  lastName: string;
  nickname?: string | null;
  dob: string;
  gender: string;
  nationality?: string | null;
  language?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  photoUri?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2. PedConnect Collections (`pedconnect_db`)

#### `students` Collection
Local center-specific operational metadata. Holds references to ParentUP IDs (`centerKidId` and `parentupChildId`).
```typescript
export interface DbStudent {
  _id: string;              // e.g., 'STU-100001'
  centerId: string;         // e.g., 'CTR-100001'
  centerKidId: string;      // Points to 'CKD-100001' in parentup_db
  parentupChildId: string;  // Points to 'CHD-100001' in parentup_db
  code: string;             // Center-assigned student code (e.g. '23022')
  status: 'Active' | 'Inactive' | 'Pending';
  enrollmentDate: string;
  programManagerId?: string | null;
  internalNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Service API Integration Specifications

### 1. ParentUP GraphQL API
- `selectCenter(centerId: ID!, childId: ID!): CenterKid!`
  - Creates a new `center_kid` document in `parentup_db` with `status: 'pending'`.
- `acceptCenterKidInvitation(centerKidId: ID!, centerId: ID!): CenterKid!`
  - Updates `center_kid.status` to `'connected'`.
- `revokeCenterKidAccess(centerKidId: ID!): CenterKid!`
  - Updates `center_kid.status` to `'revoked'`.
- `Query.connectedCenterKids(centerId: ID!, status: String): [ConnectedChildPayload!]!`
  - Returns authorized child and family demographic records for the requesting center ID.

### 2. PedConnect GraphQL API
- `Query.students(status: StudentStatus): [Student!]!`
  - Fetches local operational students from `pedconnect_db.students` alongside pending invitations from `parentup-server`, joining demographics dynamically.
- `Mutation.acceptInvitation(centerKidId: ID!, code: String!, programManagerId: ID): Student!`
  - Invokes `acceptCenterKidInvitation` on ParentUP Server and creates the local `pedconnect_db.students` operational record.
