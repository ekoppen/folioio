# Portfolio CMS with Local Backend

A professional portfolio content management system with local backend support, email services, and Docker deployment.

## 📧 Email Configuration

**New Feature**: Complete email service integration with Gmail SMTP and Resend support.

👉 **[Email Setup Guide](EMAIL_SETUP.md)** - Complete instructions for configuring email services

## 🔐 Admin Account Setup

**Create Admin Account**: Use the built-in script to easily create an admin account:

```bash
# Method 1: Using npm script (recommended)
npm run create-admin

# Method 2: Direct execution
node create-admin.js
```

The script will:
- ✅ Connect to your database
- ✅ Prompt for email and password
- ✅ Hash the password securely
- ✅ Create admin user or update existing user
- ✅ Provide login instructions

**Requirements:**
- Database must be running
- Environment variables set in `local-backend/.env`
- Database migrations completed

After creating an admin account, you can access:
- **Login**: `/auth`
- **Admin Panel**: `/admin`

## Project info

**URL**: https://lovable.dev/projects/e7a37f36-cd1c-48f8-bf75-76218e72287e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e7a37f36-cd1c-48f8-bf75-76218e72287e) and start prompting.

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

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e7a37f36-cd1c-48f8-bf75-76218e72287e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
