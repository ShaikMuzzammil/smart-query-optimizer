export interface DemoDoc {
  fileName: string;
  fileType: 'txt' | 'md';
  content: string;
}

export const DEMO_DOCUMENTS: DemoDoc[] = [
  {
    fileName: 'privacy-policy.md',
    fileType: 'md',
    content: `# Privacy Policy

Last updated: March 2026

We collect information you provide directly, such as your name, email address, and payment details when you create an account. We also collect usage data automatically, including pages visited, search queries, and device information.

## How We Use Your Data

Your data is used to provide and improve our services, personalize your experience, and communicate with you about updates. We do not sell personal information to third parties.

## Refund Policy

Customers may request a refund within 30 days of purchase if they are not satisfied with the service. Refund requests should be sent to billing@example.com with the order number. Approved refunds are processed within 5-7 business days to the original payment method.

## Data Retention

We retain account data for as long as your account is active. Search logs are retained for 90 days for analytics purposes, after which they are anonymized.

## Security

We use industry-standard encryption (AES-256) to protect data at rest and TLS 1.3 for data in transit. Access to production systems is restricted to authorized personnel and protected by multi-factor authentication.

## Your Rights

You may request a copy of your data, ask us to correct inaccuracies, or request deletion of your account. Contact privacy@example.com to exercise these rights. We will respond within 30 days.

## Changes to This Policy

We may update this privacy policy from time to time. Material changes will be communicated via email at least 14 days before they take effect.`,
  },
  {
    fileName: 'production-error-log.txt',
    fileType: 'txt',
    content: `Production Error Log - Application Server

2026-03-01 09:14:22 ERROR [api-gateway] Connection timeout while calling payments-service after 5000ms. Retrying (attempt 1 of 3).
2026-03-01 09:14:28 ERROR [api-gateway] Connection timeout while calling payments-service after 5000ms. Retrying (attempt 2 of 3).
2026-03-01 09:14:35 ERROR [api-gateway] Connection timeout while calling payments-service after 5000ms. Retrying (attempt 3 of 3).
2026-03-01 09:14:35 CRITICAL [api-gateway] payments-service unreachable after 3 attempts. Returning 503 to client. Affected endpoint: /api/v1/checkout

2026-03-01 09:20:11 WARNING [auth-service] High latency detected on token validation (avg 1200ms over last 5 minutes). Possible database connection pool exhaustion.
2026-03-01 09:21:03 ERROR [auth-service] Failed to acquire database connection from pool after 10000ms timeout. Pool size: 20, active: 20, waiting: 47.
2026-03-01 09:22:45 INFO [auth-service] Database connection pool size increased to 50. Latency recovering.

2026-03-01 10:05:18 ERROR [search-indexer] Failed to process file upload chunk for document id 8821a. Exception: UnicodeDecodeError - invalid byte sequence at offset 14392.
2026-03-01 10:05:19 INFO [search-indexer] Marked document 8821a as failed. Retry scheduled in 60 seconds with fallback encoding.
2026-03-01 10:06:25 INFO [search-indexer] Document 8821a successfully indexed using fallback encoding (latin-1).

2026-03-01 11:42:09 CRITICAL [billing] Webhook signature verification failed for incoming event evt_3F9q. Possible spoofed request from IP 203.0.113.42. Request blocked.
2026-03-01 11:42:10 WARNING [billing] Rate limit exceeded for IP 203.0.113.42 - blocking for 1 hour.

2026-03-01 14:30:55 ERROR [notification-service] Failed to send email notification to user 5512: SMTP connection refused. Retrying via fallback provider.
2026-03-01 14:31:02 INFO [notification-service] Email sent successfully via fallback provider (attempt 2).

2026-03-01 16:18:40 ERROR [websocket-gateway] Client disconnected unexpectedly during file upload progress stream. fileId=9930b, progress=64%. Resuming on reconnect.
2026-03-01 16:19:02 INFO [websocket-gateway] Client reconnected. Resumed progress stream for fileId=9930b from 64%.

Summary: Total errors today: 8 (3 critical, 5 error level). Primary recurring issue: payments-service intermittent timeout requiring infrastructure review. Database connection pool sizing should be revisited for auth-service.`,
  },
  {
    fileName: 'customer-feedback-q1.txt',
    fileType: 'txt',
    content: `Customer Feedback Summary - Q1 2026

Review 1 (5 stars): "This product has completely transformed how our team works. The search feature is incredibly fast and the AI suggestions are spot on. Customer support resolved my billing issue within minutes. Highly recommend!"

Review 2 (2 stars): "The interface looks great but performance has been a real issue lately. Search queries that used to take a second now take 5-10 seconds during peak hours. Also experienced an error when uploading large PDF files - got a generic error message with no explanation."

Review 3 (4 stars): "Overall a solid tool. The analytics dashboard gives great insight into usage patterns. One suggestion: it would be helpful if the refund policy was easier to find - I had to search through three different pages before finding it."

Review 4 (1 star): "Extremely frustrated. I requested a refund two weeks ago and have not received any update. Customer service has not responded to my emails. The product itself is fine when it works, but the lack of communication is unacceptable."

Review 5 (5 stars): "Switched from a competitor and the difference in speed is night and day. The query optimizer actually understands what I'm looking for even when I make typos. Great job to the engineering team."

Review 6 (3 stars): "Decent product but the learning curve is steep for new users. A guided onboarding tour would help a lot. Also noticed the mobile experience feels like an afterthought - buttons are too small and the layout breaks on smaller screens."

Review 7 (4 stars): "Customer support team was very responsive and helped me recover a deleted file. The version history feature saved me a lot of stress. Would love to see bulk export options added in a future update."

Review 8 (2 stars): "Pricing feels steep compared to alternatives, especially for small teams. The feature set is good but I'm not sure it justifies the cost yet. Considering downgrading my plan."

Key themes: performance complaints during peak hours, refund process communication gaps, strong praise for search and query optimizer accuracy, requests for better onboarding and mobile experience, and pricing concerns from smaller teams.`,
  },
  {
    fileName: 'engineering-meeting-notes.md',
    fileType: 'md',
    content: `# Engineering Sync - Weekly Notes

## Attendees
Priya (Backend Lead), Marcus (Frontend), Sofia (DevOps), Daniel (Product)

## Performance Investigation

The team discussed the ongoing performance issue affecting search latency during peak hours (2pm-5pm UTC). Root cause appears to be connection pool exhaustion on the auth-service database. Sofia proposed increasing the pool size from 20 to 50 connections and adding read replicas for the auth database. Priya will benchmark search response times before and after the change.

Action item: Sofia to deploy connection pool increase by Friday. Priya to add monitoring dashboard for pool utilization.

## Refund Workflow Automation

Daniel raised customer complaints about slow refund processing (currently manual, taking 1-2 weeks). Proposal: automate refund approval for requests under $50 submitted within 30 days of purchase, using the existing billing webhook infrastructure. Marcus will scope the frontend changes needed for a self-service refund request form.

Action item: Marcus to deliver wireframes for self-service refund form by next sync. Daniel to confirm policy thresholds with finance.

## Error Handling Improvements

Several production errors this week were related to unhandled exceptions during file uploads (encoding errors, oversized files). Priya proposed a centralized error handling middleware that returns structured, user-friendly error messages instead of generic 500 errors. This ties into the broader error handling epic planned for next quarter.

Action item: Priya to draft RFC for centralized error middleware.

## Onboarding & Mobile Experience

Marcus shared mockups for a new guided onboarding tour that highlights the search bar, upload zone, and analytics dashboard for first-time users. The team agreed this should ship alongside mobile responsiveness improvements, since feedback indicates both are pain points for new users.

Action item: Marcus to finalize onboarding tour copy and animations. Target ship date: end of next sprint.

## AI Features Update

The team reviewed early results from the Gemini-powered query optimizer integration. Query expansion suggestions have improved search relevance in internal testing by approximately 18 percent. Next step is to extend AI assistance to document summarization and Q&A over uploaded files.

Action item: Daniel to prepare announcement copy for the new AI insights feature.

## Next Sync
Scheduled for next Tuesday at 10am UTC. Priya to bring connection pool benchmark results.`,
  },
  {
    fileName: 'api-documentation-excerpt.md',
    fileType: 'md',
    content: `# API Reference - Search & Files

## Authentication

All API requests require a valid session token passed in the Authorization header. Tokens are obtained via the auth endpoints and expire after 30 days.

## Search Endpoint

POST /api/search

Executes a full-text search across the authenticated user's indexed documents using the query optimizer and BM25 ranking engine.

Request body fields: query (string, required) is the raw search query. limit (number, optional) is the maximum number of results to return, defaulting to 10. filters (object, optional) supports sentiment, fileType, dateRange, and minWordCount.

Response includes the optimizer breakdown (corrected query, expanded terms, ranking strategy), an array of ranked results with relevance scores and highlighted snippets, and timing information.

## Query Optimizer Endpoint

POST /api/search/optimize

Returns the optimizer's analysis of a query without executing the full search - useful for showing "Did you mean?" suggestions before the user submits.

## File Upload Endpoint

POST /api/upload

Accepts multipart form data with a file field. Supported types: txt, md, pdf, docx. Maximum file size: 10MB. Returns the created file record with status processing; NLP analysis (keywords, sentiment, readability, entity extraction, issue detection) runs synchronously and the response includes the completed analysis.

## Rate Limits

The query optimizer endpoint is rate-limited to prevent abuse. Exceeding the limit returns HTTP 429 with a Retry-After header.

## Error Handling

All endpoints return structured JSON errors in the form of an error field with a human-readable message, along with an appropriate HTTP status code. File processing failures set the file's status field to failed and populate errorMessage with details and a suggested fix.

## Extending With New File Types

To add support for a new file type, implement a text extractor, register the new MIME type and extension in the upload validator, and add the extension to the fileType enum in the File model schema.`,
  },
];
