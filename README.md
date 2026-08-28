# GuardAI — AI Safety & Governance Layer

![Status](https://img.shields.io/badge/Status-Prototype_in_Development-blue)
![Hackathon](https://img.shields.io/badge/Hackathon-PEC_Techathon_4.0-success)

## 📌 Project Overview
Organizations adopting Large Language Models (LLMs) face significant compliance risks due to the accidental exposure of sensitive data. **GuardAI** is an AI-powered proxy framework designed to identify Personally Identifiable Information (PII), mask sensitive information before it reaches external AI models, and generate secure audit logs. 

This project is being developed for the **PEC Techathon 4.0 / Cognizant Techathon** under the *AI & Agentic* category.

## 👥 Team Details
**Team Name:** Kairo Bytes
**College:** Panimalar Engineering College, Chennai

**Team Members:**
* Kumaran M 
* Mohamed Mahir M 
* Naveen R 
* Mohammad Shahul Hameed M 

**Faculty Mentor:** Vasanthi R 

## 🚀 Key Features
* **Real-Time PII Detection:** Accurate identification of structured and unstructured sensitive data using advanced NLP and regex.
* **Seamless Masking & De-masking:** Replaces sensitive entities with synthetic tokens (e.g., `<PERSON_1>`) before sending prompts to the LLM, and restores them when delivering the response back to the user.
* **Low-Latency Proxy:** Engineered to add minimal overhead (<50ms) to the standard AI response time.
* **Compliance Audit Logging:** Maintains 100% tamper-evident logs of flagged transactions for security and compliance auditing.

## 💻 Technology Stack
* **Backend Gateway:** Python (FastAPI) 
* **AI & NLP Engine:** Microsoft Presidio, SpaCy
* **Frontend Dashboard:** React.js / Node.js
* **Database & Caching:** SQLite (Audit Logs), Redis (Token Mapping Vault)

## ⚙️ High-Level Architecture Flow
1. **User Input:** User submits a prompt containing sensitive data.
2. **Interception:** GuardAI Gateway intercepts the request.
3. **Sanitization:** NLP engines detect PII and replace it with secure tokens.
4. **LLM Processing:** The masked prompt is forwarded to the external LLM API (e.g., OpenAI, Gemini).
5. **De-anonymization:** GuardAI receives the LLM response and swaps the tokens back to their original text.
6. **Delivery & Logging:** The clean response is delivered to the user, and the event is recorded in the audit database.
