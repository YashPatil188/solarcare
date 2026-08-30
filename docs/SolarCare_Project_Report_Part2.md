
# CHAPTER 3 – PROBLEM DEFINITION AND OBJECTIVES

## 3.1 Drawbacks of Existing Systems

The analysis of existing solar service management systems reveals a multifaceted set of drawbacks that collectively result in poor service quality, customer dissatisfaction, operational inefficiency, and an inability to scale. These drawbacks are not isolated technical shortcomings but are systemic failures rooted in the fundamental mismatch between the informal tools currently in use and the structured demands of a growing solar maintenance business.

The first and most significant drawback is the complete absence of transparency for the customer. When a solar system owner experiences a problem and calls their service provider, they enter a black box. They have no way to know whether their complaint has been logged, who has been assigned to resolve it, when the technician will arrive, or what the current status of their ticket is. This lack of visibility creates anxiety, erodes trust, and leads to a flood of follow-up calls that burden the service company's administrative staff. Studies in customer service management consistently show that transparency — the ability for a customer to track the status of their service request — is one of the strongest drivers of customer satisfaction, independent of the actual resolution time.

The second drawback is the disconnected nature of the technician's workflow. In the current informal model, a technician receives a phone call from a manager, is verbally briefed about a job, travels to the site, performs the work, and reports completion via another phone call. There is no structured capture of what work was done, what parts were used, how long the job took, or what the customer's feedback was. This lack of structured data capture means that the service company has no way to build a performance record for individual technicians, identify training gaps, or use historical service data to improve future operations.

The third drawback is the complete absence of an intelligent triage mechanism. When a customer reports a solar system issue, they typically lack the technical vocabulary to describe it accurately. A customer might say "my solar is not working," which could refer to anything from a blown fuse to a damaged panel to an inverter firmware issue. Without an intelligent first-level support mechanism, every complaint must be escalated directly to a technician, even when many issues can be self-resolved with basic guided troubleshooting. This leads to unnecessary site visits, wasted technician time, and avoidable service costs.

The fourth drawback is the manual and error-prone nature of AMC management. Annual Maintenance Contracts are the primary revenue model for solar service companies, yet the management of AMC subscriptions — tracking which customers are covered, when contracts expire, how many services have been consumed versus remaining — is done entirely through manual record-keeping. This leads to missed renewal opportunities, billing disputes, and an inability to proactively reach out to customers whose contracts are approaching expiry.

The fifth drawback is the language barrier. Solar installations in India are widely distributed across rural and semi-urban areas where customers may not be comfortable communicating in English. Existing digital tools offer no vernacular language support, making them inaccessible to a significant portion of the potential user base.

## 3.2 Problem Definition

The core problem addressed by SolarCare can be stated as follows: The solar energy post-installation services market lacks a dedicated, integrated digital platform that provides structured service request management, transparent real-time status tracking, AI-assisted customer support, and field operations management across all stakeholders — customers, technicians, and administrators — in a single, accessible, cost-effective system.

More specifically, the problem manifests in three dimensions. The operational dimension includes the inability to efficiently assign, track, and close service tickets; the lack of a systematic mechanism for capturing field service data; and the absence of a structured AMC subscription management system. The customer experience dimension includes the lack of visibility into service status, the absence of self-service troubleshooting tools, the inability to report issues through rich media (photos, voice), and the unavailability of the platform in local languages. The business intelligence dimension includes the complete absence of structured data capture that would enable analytics, predictive maintenance planning, or performance benchmarking.

## 3.3 Proposed System

SolarCare proposes a comprehensive, cloud-native, role-based solar maintenance management platform that resolves all identified drawbacks through a carefully designed combination of modern web technologies, AI capabilities, and a serverless backend architecture.

The proposed system replaces the existing informal workflow with a structured digital process. Customer complaint registration is replaced by a multi-modal service request system supporting typed text, structured questionnaires, photo attachments, voice notes, and AI-assisted chat. Manual technician assignment via phone call is replaced by an admin dashboard where tickets are prioritized and assigned with a single action. Technician verbal reporting is replaced by a structured mobile completion workflow requiring written remarks and photographic proof. Manual AMC records are replaced by a database-driven subscription management system with automated status tracking and AI plan recommendations. Phone-based customer status inquiries are replaced by a real-time ticket tracker accessible 24/7 from any device.

The system achieves all of this without requiring a traditional server-side backend, by leveraging Supabase's Backend-as-a-Service infrastructure. Database-level Row-Level Security policies enforce data isolation between user roles, eliminating the need for a custom API layer while maintaining enterprise-grade security. This architectural choice significantly reduces infrastructure costs and operational complexity, making the system viable for small and medium solar service businesses.

## 3.4 Advantages of the Proposed System

The proposed SolarCare system offers a comprehensive set of advantages over existing approaches, spanning technical, operational, and user experience dimensions.

From a technical standpoint, the serverless architecture built on Supabase eliminates server management overhead and provides automatic scalability. The React 19 frontend with Vite build optimization delivers near-instant page loads. The Capacitor-based Android application provides native-quality mobile experience without requiring a separate React Native codebase, significantly reducing development effort and maintenance burden.

From an operational standpoint, the structured ticketing system provides complete audit trails for every service interaction. The admin dashboard aggregates all operational data — open tickets, pending AMC requests, customer verification queue, and user management — into a single interface, replacing multiple separate tools and workflows. The technician dashboard with GPS navigation and direct calling eliminates the need for technicians to context-switch between multiple apps during field operations.

From a user experience standpoint, the AI-powered chat module provides intelligent first-level support that resolves simple issues without requiring technician intervention, reducing unnecessary service calls by an estimated 20-30%. The multilingual interface ensures accessibility for customers across diverse linguistic backgrounds. The voice and photo ticket reporting mechanism allows technically non-literate users to report issues effectively and accurately.

## 3.5 Objectives

The primary objectives of the SolarCare project are as follows:

1. To design and develop a multi-role progressive web application that provides dedicated, secure, role-specific interfaces for customers, technicians, and administrators in the solar maintenance ecosystem.

2. To implement a comprehensive service ticket management system that tracks the complete lifecycle of a service request from initial registration through technician assignment, field execution, and final closure, with real-time status visibility for all stakeholders.

3. To integrate Google Gemini AI to provide intelligent, domain-aware conversational support to solar system owners, including automated troubleshooting guidance and AI-assisted service ticket generation.

4. To develop a complete Annual Maintenance Contract management module that supports plan subscription, admin approval workflows, service utilization tracking, warranty management, and AI-powered plan recommendations.

5. To build a mobile-optimized technician field operations interface, deployable as a native Android application via Capacitor, that supports ticket management, GPS-based navigation, direct customer communication, completion documentation, and photo proof upload.

6. To implement database-level Row-Level Security policies that enforce strict data isolation between user roles without requiring a traditional server-side API layer.

7. To provide multilingual interface support for English, Hindi, Marathi, and Kannada, ensuring accessibility for a diverse user base across Indian geographies.

8. To establish a controlled customer onboarding process through a pre-registration and verification workflow that ensures only authorized customers can create accounts on the platform.

## 3.6 Scope

The scope of the SolarCare project encompasses the full-stack development of a production-ready solar maintenance management platform. The scope includes the design and implementation of three role-based web application interfaces (customer, technician, administrator), the complete PostgreSQL database schema with six migration versions, the Row-Level Security policy layer, the Google Gemini AI integration for the chat module, the Supabase Storage integration for media file management, the AMC subscription management system with AI recommendation engine, the multilingual internationalization system supporting four languages, the Capacitor Android application packaging configuration, and a comprehensive testing suite covering unit, integration, functional, security, and performance dimensions.

The scope explicitly does not include IoT-based real-time energy generation monitoring (deferred for future enhancement), a native iOS application, an integrated payment gateway for AMC purchases (the current workflow uses an admin-approval pending payment model), or predictive maintenance using machine learning models trained on historical service data (identified as a future research direction).

---

# CHAPTER 4 – SYSTEM REQUIREMENTS

## 4.1 System Analysis

The system analysis phase involved a thorough examination of the stakeholders, their roles, their information needs, and the workflows that connect them. The SolarCare system was analyzed from three perspectives: the customer perspective, the technician perspective, and the administrator perspective.

From the customer perspective, the primary need is a simple, reliable mechanism to get help when their solar system is not functioning optimally. Customers need to be able to describe their problem (through text, voice, or photos), receive immediate guidance, and then track the progress of their service request without making repeated phone calls. Customers also need visibility into their AMC coverage status, warranty information, and system performance metrics.

From the technician perspective, the primary need is a mobile-optimized task management interface that provides all the information required to efficiently complete a field service job. This includes the customer's address with navigation assistance, contact details for direct communication, a description of the reported issue, and a structured workflow for documenting and submitting completion evidence.

From the administrator perspective, the primary need is a comprehensive operational dashboard that provides real-time visibility into all open tickets, enables efficient technician assignment, manages the customer database, handles AMC subscriptions, and provides oversight of all user roles on the platform.

The system analysis also identified the critical security requirement: data must be strictly isolated between roles. A customer must never be able to see another customer's tickets or system data. A technician must only see tickets assigned to them. Only administrators should have access to the complete dataset. This requirement drove the decision to implement Row-Level Security at the database level rather than relying on application-level filtering.

## 4.2 Feasibility Study

**Technical Feasibility:** The technologies selected for SolarCare — React, Vite, Supabase, Tailwind CSS, and Capacitor — are all mature, well-documented, actively maintained open-source frameworks with large community support. The Google Gemini AI API provides a well-documented REST interface with a generous free tier suitable for development and initial production use. The technical team demonstrated proficiency with all selected technologies prior to project initiation, confirming technical feasibility.

**Economic Feasibility:** The serverless architecture choice was driven partly by economic considerations. Supabase offers a generous free tier that accommodates a development and early-production workload without cost. The React frontend is deployed as a static site, which can be hosted on free-tier CDN services such as Netlify or Vercel. The total infrastructure cost for the initial deployment is near zero, confirming strong economic feasibility for a startup or small business use case. Scaling to a paid Supabase plan becomes necessary only when the free tier limits are exceeded, at which point the business should already have sufficient revenue to support the cost.

**Operational Feasibility:** The system is designed to be intuitive for all three user roles. The customer interface presents a minimal, card-based layout familiar to users of modern mobile applications. The technician interface is optimized for one-handed use on a mobile device in a field environment. The administrator interface follows standard web application conventions for data management dashboards. Multilingual support further enhances operational feasibility for a diverse user base.

**Legal Feasibility:** All data processed by SolarCare is business operational data (service tickets, customer profiles, AMC subscriptions) that is owned by the operating solar service company. The platform does not process payment card data (AMC payments are handled offline with admin confirmation), eliminating PCI DSS concerns. User authentication is handled by Supabase's built-in authentication service, which is GDPR-compliant.

## 4.3 Functional Requirements

The functional requirements of the SolarCare system are organized by module and user role.

**Authentication and Authorization Module:**
- FR-01: The system shall support three user roles: customer, technician, and administrator.
- FR-02: The system shall authenticate users via email and password using Supabase Auth with JWT token management.
- FR-03: The system shall implement a controlled onboarding process where customers must be pre-registered by an administrator before they can create an account.
- FR-04: Upon customer registration, the system shall automatically provision a profile and solar system record using data from the pre-registration master record.
- FR-05: The system shall redirect authenticated users to their role-appropriate dashboard upon login.
- FR-06: The system shall protect all routes with role-based access control, preventing unauthorized access to other roles' interfaces.

**Service Ticket Management Module:**
- FR-07: Customers shall be able to raise service tickets for four service types: Site Visit, Panel Cleaning, Inverter Issue, and Health Check.
- FR-08: Each service type shall present a customized input form capturing relevant details.
- FR-09: Customers shall be able to attach photos and voice notes to service tickets.
- FR-10: Administrators shall be able to view all tickets across all customers and assign them to specific technicians.
- FR-11: The system shall support the following ticket status lifecycle: raised → assigned → in_progress → completed → closed.
- FR-12: Technicians shall be able to view their assigned tickets and update the status to in_progress.
- FR-13: Technicians shall be required to provide written remarks and photographic proof before marking a ticket as completed.
- FR-14: Administrators shall be able to close completed tickets.

**AI Chat Module:**
- FR-15: The system shall provide an AI-powered conversational chat interface for customers, powered by Google Gemini.
- FR-16: The AI assistant shall maintain conversation history within a session and across multiple sessions.
- FR-17: The AI assistant shall offer domain-specific solar troubleshooting guidance.
- FR-18: The system shall analyze chat conversations and, when a physical service is required, prompt the user to create a service ticket with pre-filled information derived from the conversation.
- FR-19: Customers shall be able to start new conversations, view conversation history, and delete conversations.

**AMC Management Module:**
- FR-20: The system shall display available AMC plans retrieved from the database.
- FR-21: The system shall display the customer's active AMC subscription status, validity period, and remaining service count.
- FR-22: The system shall display warranty expiry information for solar panels, inverters, and structural components.
- FR-23: An AI recommendation engine shall analyze the customer's system age and capacity to recommend the most suitable AMC plan.
- FR-24: Customers shall be able to submit an AMC plan subscription request.
- FR-25: Administrators shall be able to view and approve pending AMC subscription requests.

**Reporting Module:**
- FR-26: The system shall display ticket history with filtering by status.
- FR-27: The system shall display visual analytics (charts) for ticket distribution by type and status.

## 4.4 Non-Functional Requirements

**Performance:**
- NFR-01: The initial page load time shall be under 3 seconds on a standard 4G mobile connection.
- NFR-02: Database queries shall return results in under 500ms under normal load conditions.
- NFR-03: The AI chat module shall produce a response within 5 seconds of message submission.

**Security:**
- NFR-04: All data transmission between the client and Supabase shall be encrypted via TLS/HTTPS.
- NFR-05: Row-Level Security policies shall ensure that no user can access data belonging to another user outside their authorized scope.
- NFR-06: Authentication tokens (JWTs) shall be managed by Supabase Auth and shall expire after the configured session duration.
- NFR-07: File uploads to Supabase Storage shall be validated for type and size on the client side before transmission.

**Usability:**
- NFR-08: The customer interface shall be fully functional on mobile devices with screen widths from 375px upwards.
- NFR-09: The system shall support four languages: English, Hindi, Marathi, and Kannada, with all UI strings internationalized via i18next.
- NFR-10: Interactive elements shall provide visual feedback (loading states, success/error toasts) within 200ms of user action.

**Reliability:**
- NFR-11: The system shall leverage Supabase's 99.9% uptime SLA for backend services.
- NFR-12: The AI chat module shall gracefully handle API errors, displaying an appropriate error message to the user without crashing.

**Scalability:**
- NFR-13: The Supabase PostgreSQL backend shall support horizontal scaling through connection pooling and read replicas as the user base grows.
- NFR-14: The static frontend, deployed via Vite build, shall be served from a CDN to support global distribution without additional configuration.

## 4.5 Software Requirements

| Component | Technology | Version |
|---|---|---|
| Frontend Framework | React | 19.2.0 |
| Build Tool | Vite | 7.3.1 |
| CSS Framework | Tailwind CSS | 4.1.18 |
| Routing | React Router DOM | 7.13.0 |
| Animation Library | Framer Motion | 12.34.0 |
| Icon Library | Lucide React | 0.563.0 |
| Charts Library | Recharts | 3.7.0 |
| Backend-as-a-Service | Supabase JS | 2.95.3 |
| AI SDK | Google Generative AI | 0.24.1 |
| OpenAI Compatible SDK | OpenAI | 6.35.0 |
| Internationalization | i18next + react-i18next | 25.8.6 + 16.5.4 |
| Mobile Bridge | Capacitor | 8.1.0 |
| Linting | ESLint | 9.39.1 |
| Node.js | Runtime | ≥ 18.0.0 |
| Package Manager | npm | ≥ 9.0.0 |

## 4.6 Hardware Requirements

**Development Machine:**
- Processor: Intel Core i5 (8th Gen or above) or equivalent
- RAM: Minimum 8 GB (16 GB recommended)
- Storage: 20 GB free disk space (for dependencies and build artifacts)
- Operating System: Windows 10/11, macOS 12+, or Ubuntu 20.04+
- Browser: Google Chrome 120+ / Mozilla Firefox 115+ / Microsoft Edge 120+

**Production Server (Supabase Managed):**
- Supabase Free Tier: Shared infrastructure, 500 MB database, 1 GB storage, 50,000 monthly active users
- Supabase Pro Tier (for scaling): 8 GB database, 100 GB storage, dedicated compute

**Android Device (for Technician App):**
- Android Version: 8.0 (Oreo) or above
- RAM: Minimum 2 GB
- Storage: 100 MB free for app installation
- Network: 4G LTE connectivity for real-time operations

## 4.7 User Requirements

**Customer Requirements:**
- The customer requires a simple, clean mobile-first interface accessible from any smartphone browser.
- The customer requires the ability to describe their issue in their preferred language (English, Hindi, Marathi, or Kannada).
- The customer requires real-time visibility into the status of their service requests.
- The customer requires access to their AMC contract details and warranty information at any time.
- The customer requires a direct emergency contact mechanism (SOS call) for critical system failures.
- The customer requires an intelligent assistant that can provide immediate guidance without waiting for a technician.

**Technician Requirements:**
- The technician requires a mobile-optimized interface that works reliably on low-to-mid range Android smartphones.
- The technician requires a clear, prioritized view of all assigned service jobs.
- The technician requires integrated GPS navigation to customer sites without switching apps.
- The technician requires a one-tap calling capability to contact customers.
- The technician requires a simple, guided workflow for documenting job completion with photos and remarks.
- The technician requires the ability to complete all field tasks without access to a laptop or desktop computer.

**Administrator Requirements:**
- The administrator requires a comprehensive operational dashboard accessible from a desktop or laptop browser.
- The administrator requires the ability to manage the customer onboarding pipeline through pre-registration and verification workflows.
- The administrator requires an efficient ticket management interface with technician assignment capabilities.
- The administrator requires an AMC request processing interface to approve or reject customer subscription requests.
- The administrator requires complete visibility into all users, their roles, and the ability to modify user roles as needed.
