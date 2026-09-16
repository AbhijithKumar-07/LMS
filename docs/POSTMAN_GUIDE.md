# 🧪 Postman API Collection & Testing Guide

This directory contains the official **Postman Collection (v2.1.0)** for the Loan Management System (LMS). It enables evaluators and engineers to execute end-to-end API testing across Authentication, Borrower Onboarding, Business Rule Engine (BRE) Validation, Underwriting, Disbursement, Collections, and Real-Time Analytics.

---

## 📥 Import Instructions

1. Launch **Postman**.
2. Click **File** → **Import** (or press `Ctrl+O` / `Cmd+O`).
3. Select the file:
   ```text
   docs/postman_collection.json
   ```
4. Click **Import** to load the collection into your workspace.

---

## ⚙️ Collection Variables

The collection is pre-configured with dynamic variables and automated test scripts:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `baseUrl` | `http://localhost:4000` | LMS Backend Server Address |
| `token` | *(auto-managed)* | Current active JWT Bearer Token |
| `adminToken` | *(auto-managed)* | Saved Administrator JWT Token |
| `borrowerToken` | *(auto-managed)* | Saved Borrower JWT Token |
| `loanId` | *(auto-managed)* | ID of the active loan under lifecycle evaluation |

> **Automation Note:** Authentication and Loan Creation requests include embedded Postman test scripts that **automatically capture and store the JWT token and created Loan ID**, allowing you to execute the entire loan lifecycle sequentially without manual parameter copying.

---

## 🔄 End-to-End Lifecycle Execution Order

Execute the requests in the following sequence to test the entire loan lifecycle:

```mermaid
graph LR
    A[01. Register / Login] --> B[02. KYC & Salary Slip]
    B --> C[03. Apply Loan (BRE Check)]
    C --> D[04. Sanction Approve]
    D --> E[05. Disburse with UTR]
    E --> F[06. Record Repayment]
    F --> G[07. Auto-Closure & NOC]
```

### 1. System Health & Executive Overview
1. `00. System Health` → **Health Check**
   - **Endpoint:** `GET {{baseUrl}}/health`
   - **Expected Status:** `200 OK` (`{ "status": "ok" }`)
2. `01. Authentication` → **Login as Admin**
   - **Endpoint:** `POST {{baseUrl}}/api/auth/login`
   - Automatically stores `{{adminToken}}` and `{{token}}`.
3. `03. Executive Admin Analytics` → **Get Executive Admin Analytics & Activity Stream**
   - **Endpoint:** `GET {{baseUrl}}/api/dashboard/admin/analytics`
   - Returns portfolio KPIs, queue metrics, and the 10 most recent live operational audit events.

### 2. Borrower Onboarding & Credit Intake
1. `01. Authentication` → **Login as Borrower** (or **Register New Borrower**)
   - **Endpoint:** `POST {{baseUrl}}/api/auth/login`
   - Automatically stores `{{borrowerToken}}` and `{{token}}`.
2. `02. Borrower Portal` → **Step 1: Save Personal Details & KYC**
   - **Endpoint:** `POST {{baseUrl}}/api/borrower/personal-details`
   - Validates PAN (`ABCDE1234F`), Aadhaar (12 digits), income, and address.
3. `02. Borrower Portal` → **Step 2: Upload Salary Slip Document**
   - **Endpoint:** `POST {{baseUrl}}/api/borrower/salary-slip` *(multipart/form-data)*
   - Uploads applicant salary slip (PDF, JPG, PNG).
4. `02. Borrower Portal` → **Step 3: Apply for Loan**
   - **Endpoint:** `POST {{baseUrl}}/api/borrower/loans`
   - Evaluates server-side Business Rule Engine (BRE) rules, calculates simple interest, and creates loan with Status `APPLIED`.
   - Automatically captures and saves `{{loanId}}`.

### 3. Underwriting & Credit Sanction
1. `01. Authentication` → **Login as Sanction Officer**
2. `05. Sanction & Underwriting Desk` → **Get Pending Underwriting Queue**
   - **Endpoint:** `GET {{baseUrl}}/api/dashboard/sanction/loans`
3. `05. Sanction & Underwriting Desk` → **View Application Salary Slip Document**
   - **Endpoint:** `GET {{baseUrl}}/api/dashboard/documents/{{loanId}}/salary-slip`
4. `05. Sanction & Underwriting Desk` → **Approve Loan Sanction**
   - **Endpoint:** `PATCH {{baseUrl}}/api/dashboard/sanction/loans/{{loanId}}/approve`
   - Transitions loan to `SANCTIONED` and forwards to Disbursement Desk.

### 4. Treasury & Capital Disbursement
1. `01. Authentication` → **Login as Disbursement Officer**
2. `06. Disbursement Desk` → **Get Pending Disbursement Queue**
   - **Endpoint:** `GET {{baseUrl}}/api/dashboard/disbursement/loans`
3. `06. Disbursement Desk` → **Disburse Loan with UTR**
   - **Endpoint:** `PATCH {{baseUrl}}/api/dashboard/disbursement/loans/{{loanId}}/disburse`
   - Logs banking UTR reference, transitions status to `DISBURSED`, and activates loan in Collections recovery ledger.

### 5. Collections, Repayment & Automatic Closure
1. `01. Authentication` → **Login as Collection Officer**
2. `07. Collections & Recovery Hub` → **Get Active Loans Recovery Ledger**
   - **Endpoint:** `GET {{baseUrl}}/api/dashboard/collection/loans`
3. `07. Collections & Recovery Hub` → **Record Verified Repayment**
   - **Endpoint:** `POST {{baseUrl}}/api/dashboard/collection/loans/{{loanId}}/payments`
   - Records installment payment. When cumulative payments meet total scheduled repayment, the system automatically closes the loan (`CLOSED`) and issues NOC.
4. `07. Collections & Recovery Hub` → **Get Settled & NOC Archive**
   - **Endpoint:** `GET {{baseUrl}}/api/dashboard/collection/history`
   - Verifies the settled loan in historical closed archive.

---

## 👥 Seeded Role Credentials Matrix

All seeded demo accounts use the standard password: `Password@123`

| Role | Email | Scope of Access |
| :--- | :--- | :--- |
| **Admin** | `admin@lms.test` | Full portfolio overview, analytics dashboard, all workspace audit feeds |
| **Sales** | `sales@lms.test` | Prospect lead funnel and converted applications |
| **Sanction** | `sanction@lms.test` | Credit underwriting queue, document review, sanction/decline decisions |
| **Disbursement** | `disbursement@lms.test` | Capital payout queue, bank UTR logging, disbursement execution |
| **Collection** | `collection@lms.test` | Active loan recovery ledger, payment logging, loan settlement & NOC archive |
| **Borrower** | `borrower@lms.test` | KYC profile, salary slip upload, loan requests, repayment tracker |

---

## 🛡️ Security & Role-Based Access Control (RBAC)

The backend enforces strict JWT token verification and role authorization on every operational route. Calling a protected endpoint with an unauthorized role token returns `403 Forbidden` (`{ "message": "Forbidden: Insufficient permissions" }`).
