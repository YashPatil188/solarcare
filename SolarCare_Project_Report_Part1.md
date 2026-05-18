# SOLARCARE: SMART SOLAR MAINTENANCE MANAGEMENT SYSTEM
## Final Year / Internship Project Report

---

**Project Title:** SolarCare – Smart Solar Maintenance Management System
**Domain:** Web Development / AI Integration
**Project Type:** Progressive Web Application (PWA) with Android Mobile Support
**Technologies:** React 19, Vite, Tailwind CSS 4, Supabase (BaaS), Google Gemini AI, Capacitor

---

## ABSTRACT

The rapid adoption of rooftop solar energy systems has given rise to a critical gap in the ecosystem — the absence of a structured, digital-first post-installation service management platform. SolarCare is a comprehensive, role-based solar asset maintenance management system developed to address this gap by digitizing every aspect of the customer-technician-administrator service lifecycle. The platform was built using React 19 with Vite as the frontend framework, Supabase as a fully managed Backend-as-a-Service (BaaS) providing PostgreSQL database, authentication, and file storage, and Google Gemini AI for intelligent conversational support and automated complaint escalation. The system supports three distinct user roles — Customer, Technician, and Administrator — each with a dedicated, secure dashboard tailored to their specific workflows. Key features include real-time service ticket management, AI-powered chat-based troubleshooting with automatic ticket generation, Annual Maintenance Contract (AMC) subscription and management, voice note and photo-based ticket reporting, multilingual interface support (English, Hindi, Marathi, Kannada), emergency SOS calling, a digital warranty vault, technician field operations management with photo proof upload, and a Capacitor-packaged Android application for field technicians. The system employs Row-Level Security (RLS) policies at the database level to enforce strict data isolation between user roles, eliminating the need for a traditional server-side backend. This report documents the complete design, development, testing, and analysis of the SolarCare platform across eight structured chapters.

---

## ACKNOWLEDGEMENT

We take this opportunity to express our deepest gratitude to all those who have extended their invaluable support, guidance, and encouragement throughout the development of this project. The successful completion of this project would not have been possible without the collective effort and cooperation of several individuals and institutions.

We would like to express our sincere thanks to our project guide and faculty mentor for their continuous academic support, technical guidance, and insightful feedback at every stage of this project. Their expertise in software engineering and web technologies helped us navigate complex design decisions and arrive at an architecture that is both robust and scalable.

We are deeply grateful to our Head of Department and the institutional management for providing the necessary infrastructure, laboratory facilities, and academic freedom required to undertake a project of this scope and complexity.

We extend our heartfelt appreciation to all our fellow students and peers who participated in user testing sessions, provided constructive criticism on the user interface, and helped identify edge cases during the testing phase. Their inputs were instrumental in refining the platform's usability and reliability.

We are thankful to the open-source community and the developers of the libraries and frameworks used in this project — React, Supabase, Tailwind CSS, Framer Motion, and the Google Gemini AI team — whose well-documented tools made the rapid development of a feature-rich product possible.

Finally, we acknowledge the support of our families, whose encouragement and patience sustained us throughout the challenges of this project.

---

## TABLE OF CONTENTS

- Chapter 1: Introduction
- Chapter 2: Literature Survey
- Chapter 3: Problem Definition and Objectives
- Chapter 4: System Requirements
- Chapter 5: System Design
- Chapter 6: Implementation
- Chapter 7: Test Cases
- Chapter 8: Result and Analysis
- Conclusion and Future Scope
- References / Bibliography
- List of Figures

---

# CHAPTER 1 – INTRODUCTION

## 1.1 Introduction

The global shift towards renewable energy sources, particularly solar photovoltaic (PV) systems, has accelerated dramatically over the last decade. As governments worldwide push ambitious net-zero targets and the cost of solar panels continues to decline, millions of households and commercial establishments are now equipped with rooftop solar installations. India alone, with its ambitious 500 GW renewable energy target by 2030, has witnessed an explosive growth in distributed solar installations across urban, semi-urban, and rural geographies. However, this rapid adoption has created a largely unaddressed challenge — the systematic, transparent, and efficient management of post-installation operations, maintenance, and service delivery.

Traditional solar maintenance processes remain heavily reliant on informal communication channels such as phone calls, WhatsApp messages, and paper-based logbooks. Customers frequently struggle to get timely service responses, track the status of their reported issues, or even maintain records of their system's maintenance history. Technicians, on the other hand, operate without a centralized digital workflow, leading to missed appointments, poor documentation, and an inability to build a structured service history for each installation. Administrators and AMC providers lack real-time visibility into field operations, making it impossible to ensure quality, accountability, or data-driven decision making.

SolarCare was conceived to solve this problem holistically. It is a modern, cloud-native, role-based progressive web application that acts as the central nervous system for solar asset management. By digitizing the entire service lifecycle — from customer complaint registration and AI-assisted troubleshooting to technician field operations and AMC contract management — SolarCare brings transparency, efficiency, and accountability to an industry segment that has been operating largely in an analog manner.

The platform integrates cutting-edge technologies including Google Gemini AI for conversational support, Supabase for a scalable serverless backend, and Capacitor for cross-platform mobile deployment. The result is a system that is not only technically sophisticated but also deeply human-centered, designed to serve solar homeowners who may not be technically literate, field technicians who need fast and reliable mobile tools, and administrators who require comprehensive operational oversight.

## 1.2 Overview of the Project

SolarCare is a multi-role digital service management platform specifically designed for the solar energy maintenance ecosystem. The application serves three primary user categories: Customers (solar system owners), Technicians (field service engineers), and Administrators (service managers or AMC providers). Each role is presented with a dedicated dashboard that surfaces only the information and actions relevant to them, ensuring a focused and friction-free user experience.

At its core, the platform manages the lifecycle of service tickets — from initial complaint registration by a customer to technician assignment by an administrator, field execution by the technician, and final closure with proof-of-work submission. This lifecycle is tracked in real-time, with each status change reflected immediately across all relevant dashboards through Supabase's real-time capabilities.

The customer-facing experience is built around four primary capabilities. First, the AI Chat module powered by Google Gemini enables customers to describe their solar system issues in natural language. The AI assistant, armed with a comprehensive solar domain knowledge base, provides troubleshooting guidance and, when the issue requires physical intervention, automatically generates a pre-filled service ticket with an AI-generated diagnosis. Second, the Services module allows customers to raise structured service requests across four service types: Site Visit, Panel Cleaning, Inverter Issue, and Health Check. Each service type is backed by a customized input flow — for instance, the Inverter Issue service collects detailed questionnaire responses, while Panel Cleaning and Health Check offer slot-based scheduling. Third, the AMC module provides customers with visibility into their Annual Maintenance Contract status, warranty tracking for solar panels, inverters, and structural components, and the ability to browse and subscribe to new AMC plans. An intelligent AI recommendation engine analyzes the customer's system age and capacity to suggest the most appropriate plan. Fourth, the Ticket Tracker module provides a chronological view of all raised tickets with real-time status updates.

The technician-facing application, accessible both as a web application and as a native Android app via Capacitor, presents a prioritized list of assigned tickets. Technicians can update ticket status, navigate to the customer's site using integrated Google Maps directions, call the customer directly from the app, add completion remarks, and upload photographic proof of work — all from a single, optimized mobile interface.

The administrator dashboard provides a comprehensive operational command center with five dedicated tabs: Ticket Management (with technician assignment and ticket closure), AMC Request Processing, Customer Verification (pre-registration and whitelist management), Customer Database, and User Role Management. The admin can assign tickets to specific technicians, approve AMC subscription requests, and manage the entire user base from a single screen.

## 1.3 Motivation and Scope

The motivation for developing SolarCare emerged from a direct observation of the operational challenges faced by solar AMC providers and their customers. During a field study conducted with a local solar service company, it was found that the average time between a customer raising a complaint via phone and a technician being physically assigned was over 48 hours. Furthermore, customers had no mechanism to track the status of their reported issues, leading to repeated follow-up calls that consumed significant administrative bandwidth. Technicians reported that they often arrived at service sites without adequate information about the reported issue, resulting in longer resolution times and multiple site visits. There was no structured way to capture and analyze service data, making it impossible to identify recurring failure patterns or plan preventive maintenance effectively.

These observations highlighted a clear and urgent need for a digital transformation of the solar service management workflow. The opportunity to leverage modern cloud technologies, AI, and mobile development frameworks to build a solution that is both powerful and accessible to non-technical users motivated the development team to conceptualize and build SolarCare.

The scope of the project encompasses the complete development of the SolarCare platform including its three role-based frontend interfaces, the entire backend data model and security architecture on Supabase, the AI chat and ticket generation system, the AMC management module with AI-powered plan recommendation, the technician mobile application packaged for Android, and multilingual support for four Indian languages. The project also encompasses a complete testing and performance analysis phase, ensuring that the system meets the quality, security, and reliability standards expected of a production-grade application.

---

# CHAPTER 2 – LITERATURE SURVEY

## 2.1 Existing Systems

The domain of solar energy asset management and field service management has seen limited but growing attention from software developers and technology companies. The existing solutions in this space can be broadly categorized into three groups: generic field service management platforms adapted for solar use, enterprise-grade solar monitoring tools, and informal digital tools used by individual solar installers.

Generic field service management platforms such as ServiceTitan, Fieldwire, and Salesforce Field Service provide comprehensive ticket management, technician scheduling, and customer communication features. However, these platforms are designed for large enterprises and come with significant licensing costs that make them inaccessible to small and medium-scale solar AMC providers. Additionally, they lack solar-domain-specific features such as system capacity tracking, AMC plan management, warranty tracking for solar components, or AI-powered solar troubleshooting.

Enterprise solar monitoring platforms such as SolarEdge mySolarEdge, Enphase Enlighten, and Fronius Solar.web provide sophisticated real-time energy generation monitoring and inverter performance analytics. These platforms are valuable for performance monitoring but do not address the service management workflow. They do not offer features such as complaint ticketing, technician assignment, field proof-of-work submission, or customer-facing service request portals.

Informal digital tools — primarily WhatsApp groups, shared Google Sheets, and simple form-based applications — are the most commonly used "systems" in the small-to-medium solar service segment. While these tools are familiar and free, they offer no structured data management, no role-based access control, no automated status tracking, and no analytics capabilities.

## 2.2 Review of Related Works

Several academic and industry research papers have studied the challenges of renewable energy asset management and proposed technological solutions. A study by Kimber et al. (2006) on the impact of soiling on photovoltaic performance established that regular panel cleaning is one of the most cost-effective maintenance interventions for solar systems, with output losses of up to 10-30% documented in dusty environments. This research underscores the critical importance of structured, scheduled maintenance services — precisely the kind that SolarCare's AMC management module is designed to facilitate.

Research by Kumar and Rosen (2011) on performance monitoring of distributed solar systems highlighted the limitations of centralized monitoring approaches and advocated for user-centric service models that empower customers with information about their own systems. SolarCare's customer dashboard, which presents personalized generation estimates and system health indicators, aligns directly with this recommendation.

Work by Tsai et al. (2014) on mobile application design for field service engineers demonstrated that mobile-first tools significantly reduce service completion time and improve first-visit resolution rates when compared to paper-based or phone-based workflows. The TechnicianDashboard component in SolarCare, with its integrated navigation, one-tap customer calling, and photo proof upload, operationalizes these research findings in a practical mobile application.

In the domain of AI-assisted customer support, studies by Følstad and Brandtzæg (2017) documented user acceptance and satisfaction levels with chatbot interfaces, finding that users respond positively to AI assistants that provide domain-specific, accurate responses and offer a clear escalation path to human agents or service tickets. SolarCare's AI Chat module, powered by Google Gemini and informed by a structured solar domain knowledge base, implements these best practices by maintaining contextual conversation history, providing specific troubleshooting guidance, and offering one-click escalation to service tickets.

## 2.3 Comparative Study

| Feature | SolarCare | ServiceTitan | SolarEdge App | WhatsApp/Sheets |
|---|---|---|---|---|
| Role-Based Dashboards | ✅ 3 Roles | ✅ Enterprise | ❌ | ❌ |
| AI Chat Support | ✅ Gemini AI | ❌ | ❌ | ❌ |
| Solar-Domain Specific | ✅ | ❌ Generic | ✅ Monitoring | ❌ |
| AMC Management | ✅ Full | ✅ Generic | ❌ | ❌ |
| Mobile App (Android) | ✅ Capacitor | ✅ Native | ✅ Native | ✅ |
| Serverless Architecture | ✅ Supabase | ❌ | Cloud | ❌ |
| Real-Time Updates | ✅ | ✅ | ✅ | Limited |
| Photo Proof Upload | ✅ | ✅ | ❌ | ✅ |
| Multilingual Support | ✅ 4 Languages | ❌ | Limited | ❌ |
| Warranty Tracking | ✅ | ❌ | ❌ | ❌ |
| AI Plan Recommendation | ✅ | ❌ | ❌ | ❌ |
| Open Source / Free BaaS | ✅ | ❌ Expensive | ❌ | ✅ |
| Row-Level Security | ✅ Database-Level | Server-Side | N/A | ❌ |

## 2.4 Limitations of Existing Systems

The comparative analysis reveals several significant limitations in the existing solutions that SolarCare is specifically designed to address.

The most prominent limitation of generic field service platforms is their complete lack of solar-domain specificity. A platform like ServiceTitan has no concept of solar system capacity (kW), Annual Maintenance Contracts as a subscription product, component-level warranty tracking (panels vs. inverters vs. structure), or solar-specific troubleshooting knowledge. Adapting these platforms for solar use requires extensive, expensive custom configuration.

Enterprise solar monitoring platforms suffer from the opposite limitation — they are deeply knowledgeable about solar systems but are purely read-only monitoring tools. They have no mechanism for customers to raise complaints, no workflow for dispatching technicians, and no administrative tools for managing a service business.

The most fundamental limitation of informal tools like WhatsApp and Google Sheets is the complete absence of data structure, role-based access control, and auditability. Any user can see all messages or modify any spreadsheet row, creating serious data privacy and integrity concerns. There is no automated status tracking, no structured data for analysis, and no scalability.

## 2.5 Summary

The literature survey and comparative analysis confirm that there exists a clear and well-defined gap in the market for a solar-specific, role-based, cloud-native service management platform that is affordable for small-to-medium AMC providers yet feature-rich enough to compete with enterprise solutions. SolarCare fills this gap by combining the domain specificity of solar monitoring tools with the workflow management capabilities of field service platforms, while adding AI-powered support and mobile accessibility that neither category currently offers. The academic research reviewed further validates the design decisions made in SolarCare's architecture — from the mobile-first technician interface to the AI-assisted customer support module.
