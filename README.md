
# CV Tailor Assistant

This application helps users tailor their CVs to specific job descriptions using AI.

## Project info

**URL**: https://lovable.dev/projects/d2b4dbf1-dbf2-4628-b314-5a2969d21712

## Environment Variables

This project uses environment variables for configuration. Here's how to set them up:

### Required Environment Variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon/public key

### Development Setup

1. Create a `.env.local` file in the root of your project with the following variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

2. For local development, the application includes fallback values, but it's recommended to set these variables for consistent behavior across environments.

### Production Setup

When deploying to production:

1. Set the environment variables in your hosting platform's configuration:
   - If using Lovable's deployment: Click on Share -> Publish, then configure these variables in the deployment settings.
   - If using a custom deployment: Configure these variables in your hosting provider's environment settings.

2. The production environment should not rely on fallback values for security and reliability reasons.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/d2b4dbf1-dbf2-4628-b314-5a2969d21712) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (for backend functionality and authentication)
- Anthropic API (for CV tailoring)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/d2b4dbf1-dbf2-4628-b314-5a2969d21712) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
