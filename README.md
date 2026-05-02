# Poast

A modern, AI-powered consumer shipping application to buy and print labels instantly.

## Features

- **Instant Shipping Quotes:** Compare rates across multiple carriers instantly using the eHub API.
- **Label Purchasing & Printing:** Seamlessly buy and generate shipping labels (PDF/4x6 formats).
- **Secure Payments:** Integrated with Stripe for secure and reliable payment processing.
- **Address Autocomplete:** Powered by Google Maps API to ensure accurate delivery and return addresses.
- **Shipment History & Tracking:** User authentication and database management via Supabase to keep track of all your shipments.
- **AI Assistance:** Integrated with the Gemini API to provide smart, contextual help.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React
- **Backend:** Node.js, Express
- **Database & Auth:** Supabase
- **Integrations:** Stripe, eHub API, Google Maps API, Google Gemini API

## Getting Started

### Prerequisites

You will need Node.js installed on your machine, along with accounts for the following services to get API keys:
- [Supabase](https://supabase.com/)
- [Stripe](https://stripe.com/)
- [eHub](https://ehub.com/)
- [Google Cloud Console](https://console.cloud.google.com/) (for Google Maps API)
- [Google AI Studio](https://aistudio.google.com/) (for Gemini API)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd poast
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy the `.env.example` file to `.env` and fill in your API keys and credentials.
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   ```env
   # App URL (required for Stripe redirects)
   APP_URL=

   # Gemini API Key
   GEMINI_API_KEY=

   # eHub API Credentials
   EHUB_API_KEY=

   # Supabase Credentials
   SUPABASE_URL=
   SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=

   # Stripe Credentials
   STRIPE_SECRET_KEY=
   VITE_STRIPE_PUBLISHABLE_KEY=
   STRIPE_WEBHOOK_SECRET=

   # Google Maps API Key
   GOOGLE_MAPS_API_KEY=
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Architecture

Poast uses a full-stack architecture with a React frontend and an Express backend. The backend handles sensitive operations such as:
- Communicating with the eHub API to fetch rates and purchase labels.
- Creating Stripe Payment Intents and handling webhooks.
- Verifying secure rates to prevent tampering before purchase.
- Managing database records securely via Supabase Service Role.

## License

MIT
