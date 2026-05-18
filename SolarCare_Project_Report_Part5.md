# CHAPTER 7 – TEST CASES

## 7.1 Testing Overview

The SolarCare platform underwent a comprehensive multi-phase testing strategy covering functional correctness, module-level integration, user interface responsiveness, security policy enforcement, and performance under simulated load conditions. All test cases were designed following the IEEE 829 Software Test Documentation standard. Test cases include a unique Test Case ID, a descriptive scenario, step-by-step execution instructions, defined input data, expected output, actual result observed during testing, and pass/fail status.

---

## 7.2 Module 1: Login Module Test Cases

| Test Case ID | Scenario | Steps | Input | Expected Output | Actual Result | Status |
|---|---|---|---|---|---|---|
| TC-LOGIN-01 | Valid customer login | 1. Navigate to /login 2. Enter valid email 3. Enter valid password 4. Click Login | Email: customer@test.com Password: Test@1234 | Redirect to /customer-dashboard | Redirected to customer dashboard | PASS |
| TC-LOGIN-02 | Valid admin login | 1. Navigate to /login 2. Enter admin email 3. Enter admin password 4. Click Login | Email: admin@solarcare.com Password: Admin@1234 | Redirect to /admin-dashboard | Redirected to admin dashboard | PASS |
| TC-LOGIN-03 | Valid technician login | 1. Navigate to /login 2. Enter technician email 3. Enter password 4. Click Login | Email: tech@solarcare.com Password: Tech@1234 | Redirect to /technician-dashboard | Redirected to technician dashboard | PASS |
| TC-LOGIN-04 | Invalid password | 1. Navigate to /login 2. Enter valid email 3. Enter incorrect password 4. Click Login | Email: customer@test.com Password: wrongpass | Display error: "Invalid login credentials" | Error toast shown with message | PASS |
| TC-LOGIN-05 | Empty email field | 1. Navigate to /login 2. Leave email blank 3. Enter password 4. Click Login | Email: (empty) Password: Test@1234 | Form validation prevents submission | HTML5 required field validation triggered | PASS |
| TC-LOGIN-06 | Invalid email format | 1. Navigate to /login 2. Enter invalid email 3. Enter password 4. Click Login | Email: notanemail Password: Test@1234 | Form validation error on email field | Email format validation shown | PASS |
| TC-LOGIN-07 | Non-existent user | 1. Navigate to /login 2. Enter unregistered email 3. Enter any password 4. Click Login | Email: ghost@nobody.com Password: any | Display error: "Invalid login credentials" | Error toast displayed | PASS |
| TC-LOGIN-08 | Session persistence | 1. Log in successfully 2. Close browser tab 3. Reopen application URL | Previous valid session | Automatically logged in, redirected to dashboard | Session restored from localStorage | PASS |
| TC-LOGIN-09 | Sign out functionality | 1. Log in as any user 2. Click Logout button | Authenticated session | Redirect to /login page, session cleared | Redirected to login, localStorage cleared | PASS |
| TC-LOGIN-10 | Direct URL access (unauthenticated) | 1. Without logging in, navigate directly to /admin-dashboard | No active session | Redirect to /login | Redirected to /login | PASS |
| TC-LOGIN-11 | Cross-role URL access (customer tries admin route) | 1. Log in as customer 2. Navigate to /admin-dashboard in URL bar | Customer session | Redirect to / (root redirect) | Redirected to customer dashboard | PASS |

---

## 7.3 Module 2: Registration / Signup Test Cases

| Test Case ID | Scenario | Steps | Input | Expected Output | Actual Result | Status |
|---|---|---|---|---|---|---|
| TC-SIGNUP-01 | Valid customer signup (pre-registered email) | 1. Admin pre-registers email 2. Customer navigates to /signup 3. Fills all fields 4. Submits form | Email: preregistered@test.com Name: Test User Password: Test@1234 | Account created, profile and solar system auto-provisioned, redirect to /login | Account created successfully, profile auto-populated | PASS |
| TC-SIGNUP-02 | Signup with non-whitelisted email | 1. Navigate to /signup 2. Enter email NOT in customers_master 3. Fill remaining fields 4. Submit | Email: random@unknown.com | Error: "Email not found in customer records. Please contact support." | DB trigger raised exception, error displayed | PASS |
| TC-SIGNUP-03 | Password too short | 1. Navigate to /signup 2. Enter valid pre-registered email 3. Enter 5-char password 4. Submit | Password: Ab1! (< 6 chars) | Supabase Auth password strength error | Error displayed: password minimum length | PASS |
| TC-SIGNUP-04 | Duplicate signup attempt | 1. Customer already has account 2. Try to sign up again with same email | Email: existing@test.com | Error: "User already registered" | Supabase Auth duplicate error shown | PASS |
| TC-SIGNUP-05 | Auto-population of solar system on signup | 1. Admin pre-registers with 5kW, 2024 install date 2. Customer signs up | Pre-registered data | customer_dashboard shows 5kW system, correct install date | Dashboard shows correct system data | PASS |
| TC-SIGNUP-06 | Empty required fields | 1. Navigate to /signup 2. Leave name field empty 3. Submit | Name: (empty) | HTML5 required field validation prevents submission | Validation triggered | PASS |
| TC-SIGNUP-07 | Valid admin creation via Supabase dashboard | Admin manually creates user with role='admin' in metadata via Supabase UI | role: 'admin' in raw_user_meta_data | Admin profile created, can access /admin-dashboard | Admin profile created, access granted | PASS |

---

## 7.4 Module 3: Service Request / Ticket Module Test Cases

| Test Case ID | Scenario | Steps | Input | Expected Output | Actual Result | Status |
|---|---|---|---|---|---|---|
| TC-TICKET-01 | Customer raises Site Visit ticket | 1. Login as customer 2. Go to Services 3. Click Site Visit 4. Fill description 5. Submit | Issue Type: site_visit Description: System not generating expected output | Ticket created in DB with status='raised', visible in customer's ticket list | Ticket created and visible in services page | PASS |
| TC-TICKET-02 | Customer raises Panel Cleaning with slot | 1. Login as customer 2. Services → Panel Cleaning 3. Select available time slot 4. Submit | Service: panel_cleaning Slot: tomorrow 10am | Ticket created with booking_date set, status='raised' | Ticket with booking_date created | PASS |
| TC-TICKET-03 | Customer raises Inverter Issue via questionnaire | 1. Login as customer 2. Services → Inverter Issue 3. Fill questionnaire answers 4. Submit | Error code: E07, Frequency: Daily | Ticket created with service_metadata containing questionnaire JSON | Ticket with questionnaire metadata created | PASS |
| TC-TICKET-04 | Admin views new ticket | 1. Login as admin 2. Open Admin Dashboard → Tickets tab | Previously raised customer ticket | Ticket appears in admin ticket list with customer name and system capacity | Ticket visible with all customer details | PASS |
| TC-TICKET-05 | Admin assigns technician | 1. Login as admin 2. Find unassigned ticket 3. Select technician from dropdown | Technician: John Tech | Ticket status changes to 'assigned', technician_id updated in DB | Status updated, technician can now see ticket | PASS |
| TC-TICKET-06 | Technician views assigned ticket | 1. Login as technician 2. Open Technician Dashboard | Ticket assigned to this technician | Ticket visible in technician's task list | Ticket visible with customer details | PASS |
| TC-TICKET-07 | Technician starts work | 1. Login as technician 2. Find assigned ticket 3. Click "Start Work" | Ticket in 'assigned' state | Ticket status changes to 'in_progress' | Status updated to in_progress | PASS |
| TC-TICKET-08 | Technician completes work with photo | 1. Technician clicks "Mark Completed" 2. Adds remarks 3. Selects photo 4. Submits | Remarks: "Replaced fuse, system restored" Photo: work_proof.jpg | Photo uploaded to Supabase Storage, ticket_updates record created, status='completed' | Photo URL saved, completion record created, status updated | PASS |
| TC-TICKET-09 | Technician submit without photo | 1. Technician opens completion form 2. Adds remarks 3. Does NOT select photo 4. Submits | Remarks: "Done" Photo: none | Error toast: "Photo proof is required" | Error displayed, submission blocked | PASS |
| TC-TICKET-10 | Technician submit without remarks | 1. Opens completion form 2. Does NOT add remarks 3. Selects photo 4. Submits | Remarks: (empty) | Error toast: "Please add remarks" | Error displayed, submission blocked | PASS |
| TC-TICKET-11 | Admin closes completed ticket | 1. Login as admin 2. Find completed ticket 3. Click "Close Ticket" 4. Confirm | Ticket in 'completed' state | Ticket status changes to 'closed' | Status updated to 'closed' | PASS |
| TC-TICKET-12 | Customer cannot see other customers' tickets | 1. Login as customer A 2. Inspect API responses | Customer A's session | Only customer A's tickets returned | RLS enforced — only own tickets visible | PASS |

---

## 7.5 Module 4: AI Chat Module Test Cases

| Test Case ID | Scenario | Steps | Input | Expected Output | Actual Result | Status |
|---|---|---|---|---|---|---|
| TC-AI-01 | Start new conversation | 1. Login as customer 2. Navigate to /ai-chat | Authenticated customer session | New conversation created, welcome screen shown | New chatbot_conversations record created | PASS |
| TC-AI-02 | Send solar troubleshooting query | 1. Type solar issue message 2. Press Send | "My inverter is showing error E07" | AI provides specific E07 troubleshooting steps | Gemini returns relevant solar guidance | PASS |
| TC-AI-03 | AI triggers ticket creation prompt | 1. Describe issue requiring technician visit | "My panels are physically damaged after storm" | AI responds with guidance AND displays TicketPrompt card | [TICKET_REQUIRED] signal detected, TicketPrompt shown | PASS |
| TC-AI-04 | Customer confirms AI ticket creation | 1. TicketPrompt displayed 2. Click "Create Ticket" | Pending ticket data from AI | Ticket created in DB, conversation status set to 'converted_to_ticket' | Ticket created, conversation status updated | PASS |
| TC-AI-05 | Customer dismisses ticket prompt | 1. TicketPrompt displayed 2. Click "Dismiss" | Pending ticket data | TicketPrompt hidden, conversation continues normally | pendingTicket state cleared | PASS |
| TC-AI-06 | Conversation history persistence | 1. Send messages in conversation 2. Close page 3. Reopen AI Chat | Previous conversation ID | Previous messages visible in history sidebar | Messages loaded from chatbot_messages table | PASS |
| TC-AI-07 | Start new conversation | 1. Click "+" button in AI Chat header | Active conversation | New empty conversation started | New chatbot_conversations record created | PASS |
| TC-AI-08 | Delete conversation | 1. Open history sidebar 2. Hover over conversation 3. Click trash icon | Existing conversation | Conversation and all messages deleted | chatbot_conversations and related messages deleted (CASCADE) | PASS |
| TC-AI-09 | Quick action buttons | 1. Open AI Chat with no messages 2. Click "🔧 Troubleshoot Issue" | Pre-defined prompt | Message sent automatically, AI responds | sendMessage called with preset prompt | PASS |
| TC-AI-10 | AI handles off-topic questions | 1. Ask question unrelated to solar | "What is the stock price of Apple?" | AI politely redirects to solar topics | AI response redirects to solar domain | PASS |

---

## 7.6 Module 5: AMC Module Test Cases

| Test Case ID | Scenario | Steps | Input | Expected Output | Actual Result | Status |
|---|---|---|---|---|---|---|
| TC-AMC-01 | View AMC plans (no active plan) | 1. Login as customer with no AMC 2. Navigate to /amc | No active subscription | Shop view displayed with available plans | Plans fetched and displayed | PASS |
| TC-AMC-02 | AI recommendation engine | 1. Customer with 3kW, 3-year-old system views AMC page | System: 3kW, age: 3 years | Silver plan recommended with personalized message | Silver tier recommended correctly | PASS |
| TC-AMC-03 | Subscribe to AMC plan | 1. Select a plan 2. Click "Buy Now" | Plan: Silver | AMC subscription request created with status='pending_payment' | amc_subscriptions record created | PASS |
| TC-AMC-04 | View pending subscription status | 1. After subscribing 2. View AMC dashboard | Pending subscription | Dashboard view shows "Pending Approval" badge | Pending status displayed correctly | PASS |
| TC-AMC-05 | Admin approves AMC request | 1. Login as admin 2. AMC tab 3. Click "Approve & Activate" | Pending subscription | Subscription status changes to 'active', dates set | amc_subscriptions updated to active | PASS |
| TC-AMC-06 | View active AMC status | 1. Customer whose AMC was approved 2. Views AMC page | Active subscription | Dashboard shows plan name, validity date, services remaining | Active subscription details displayed | PASS |
| TC-AMC-07 | Warranty details display | 1. Login as customer with active AMC 2. View AMC page | Active subscription | Warranty section shows Panel: 25yr, Inverter: 10yr, Structure: 5yr | All warranty details displayed correctly | PASS |

---

## 7.7 Module 6: Admin Module Test Cases

| Test Case ID | Scenario | Steps | Input | Expected Output | Actual Result | Status |
|---|---|---|---|---|---|---|
| TC-ADMIN-01 | Pre-register new customer | 1. Login as admin 2. Verification tab 3. Fill pre-registration form 4. Submit | Name, Email, Phone, Capacity, Address | Customer record created in customers_master table with status='pre_registered' | Record created, appears in pending verification list | PASS |
| TC-ADMIN-02 | Verify/Activate customer | 1. Find pending customer 2. Click "Verify & Activate" | Pre-registered customer | Customer status updated to 'verified', can now sign up | customerService.verifyCustomer() updates status | PASS |
| TC-ADMIN-03 | Change user role | 1. Login as admin 2. Users tab 3. Select new role from dropdown for a user | User: Tech User, Role: technician | Profile role updated in database | Role updated, user redirected to technician dashboard on next login | PASS |
| TC-ADMIN-04 | Admin dashboard stats accuracy | 1. Login as admin 2. View stats row | Current DB state | Total tickets, Pending verifications, Active customers, AMC requests counts match DB | Stats computed correctly from live data | PASS |
| TC-ADMIN-05 | Admin cannot see chatbot messages | 1. Login as admin 2. No chatbot management UI | Admin session | Admin has no access to individual customer chat contents via UI | No chat UI exposed in admin dashboard | PASS |
| TC-ADMIN-06 | Search/filter in customer list | 1. Login as admin 2. Customers tab 3. Observe customer list | All verified customers | Active customer database displayed | Customer list displayed with system capacity and verified badge | PASS |

---

## 7.8 Security Testing Test Cases

| Test Case ID | Scenario | Steps | Input | Expected Output | Actual Result | Status |
|---|---|---|---|---|---|---|
| TC-SEC-01 | RLS: Customer cannot read another customer's tickets | 1. Customer A logs in 2. Manually craft API request for Customer B's ticket ID | Customer A's JWT, Customer B's ticket UUID | Empty result (no data returned) | Zero rows returned by Supabase RLS | PASS |
| TC-SEC-02 | RLS: Customer cannot write to another customer's tickets | 1. Customer A logs in 2. Craft API INSERT with customer_id = Customer B's UUID | Customer A's JWT, Customer B's UUID | INSERT rejected by RLS with_check policy | INSERT failed with RLS violation | PASS |
| TC-SEC-03 | RLS: Technician cannot access admin-only customers_master | 1. Login as technician 2. Direct Supabase query against customers_master | Technician JWT | Empty result | Zero rows returned | PASS |
| TC-SEC-04 | RLS: Customer cannot access other customers' solar systems | 1. Login as customer 2. Query solar_systems without customer_id filter | Customer JWT | Only own solar system returned | Only own system row returned | PASS |
| TC-SEC-05 | JWT expiry handling | 1. Artificially expire access token 2. Perform any database operation | Expired JWT | Supabase client auto-refreshes token using refresh token | Token refreshed silently, request succeeded | PASS |
| TC-SEC-06 | Unauthorized route access (no session) | 1. Open application in fresh browser 2. Navigate directly to /customer-dashboard | No JWT in localStorage | Redirect to /login | Redirected to /login by ProtectedRoute | PASS |
| TC-SEC-07 | HTTPS enforcement | 1. Attempt HTTP connection to Supabase URL | HTTP request | Request upgraded to HTTPS by Supabase infrastructure | All connections over HTTPS/TLS | PASS |
| TC-SEC-08 | API key exposure check | 1. Inspect browser localStorage, network requests | Supabase Anon Key visible | Anon key is public (by design) but RLS prevents data leakage | Anon key visible but data access controlled by RLS | PASS |
| TC-SEC-09 | File upload type restriction | 1. Login as technician 2. Attempt to upload .exe file as proof | File: malware.exe | Client-side file type validation rejects non-image files | accept="image/*" attribute blocks non-image files | PASS |
| TC-SEC-10 | Controlled signup enforcement | 1. Attempt to create account with email not in customers_master | Email: hacker@random.com | Registration rejected with error message | DB trigger raises exception, signup fails | PASS |
