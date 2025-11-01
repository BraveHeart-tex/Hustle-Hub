# Hustle Hub

Hustle Hub is a browser extension that helps you organize and manage your work items in one centralized place. It serves as a personal productivity dashboard that integrates with various work tools to give you a comprehensive overview of your tasks, meetings, and code reviews.

## Purpose

Hustle Hub was created to solve the problem of context switching between different work platforms. Instead of constantly jumping between Jira, GitLab, Google Calendar, and other tools, Hustle Hub brings all your important work information into a single, convenient dashboard.

## Features

### Calendar Integration

- View your upcoming Google Calendar events
- See meeting details including attendees and status
- Quick access to join links for virtual meetings

### Jira Ticket Management

- Track your assigned Jira tickets
- Filter tickets by different statuses
- Stay on top of your development tasks

### GitLab Merge Requests

- Monitor your GitLab merge requests
- See MR status, approvals, and comments
- Filter MRs by project or status
- Quickly identify MRs that need your attention

### Rich Text Notes

- Create and manage notes with a powerful rich text editor
- Support for formatting, lists, and task lists
- Keep track of important information

### Dark/Light Mode

- Switch between dark and light themes
- Comfortable viewing experience in any environment

## Installation

1. Clone the repository

   ```
   git clone https://github.com/BraveHeart-tex/Hustle-Hub
   cd hustle-hub
   ```

2. Install dependencies

   ```
   yarn install
   ```

3. Add environment variables

   ```
     VITE_GITLAB_REDIRECT_URI='YOUR_GITLAB_REDIRECT_URI'
     VITE_GOOGLE_CALENDAR_REDIRECT_URI='YOUR_GOOGLE_CALENDAR_REDIRECT_URI'
     VITE_BASE_API_URL='YOUR_BASE_API_URL'
     VITE_RELEASE_REVIEWER_USER_ID='YOUR_RELEASE_REVIEWER_USER_ID'
   ```

4. Start the development server
   ```
   yarn dev
   ```

## Building for Production

```
yarn build
```

To build for Firefox:

```
yarn build:firefox
```

## Deployment

You can use the included script to deploy the extension locally:

```
./deploy-local.sh
```

This will create a folder on your Desktop with the built extension.

## Technologies

- WXT (Web Extension Tools)
- React 19
- TailwindCSS
- Radix UI Components
- TipTap Rich Text Editor
- React Query
