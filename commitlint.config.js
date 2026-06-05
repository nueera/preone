module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type enums matching our project needs
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation changes
        'style',    // Code style (formatting, missing semi-colons, etc.)
        'refactor', // Code refactoring
        'perf',     // Performance improvements
        'test',     // Adding tests
        'build',    // Build system or external dependencies
        'ci',       // CI configuration
        'chore',    // Other changes that don't modify src or test files
        'revert',   // Revert a commit
      ],
    ],
    // Scope enums matching our portal structure
    'scope-enum': [
      2,
      'always',
      [
        'admin',        // Admin portal
        'teacher',      // Teacher portal
        'parent',       // Parent portal
        'crm',          // CRM module
        'auth',         // Authentication
        'api',          // API routes
        'db',           // Database/Prisma schema
        'ui',           // UI components
        'notifications',// Notification system
        'reports',      // Reports/Export
        'attendance',   // Attendance module
        'fees',         // Fee management
        'growth',       // Growth tracking
        'audit',        // Audit logging
        'branch',       // Multi-branch
        'passport',     // Childhood Passport
        'settings',     // Settings
        'core',         // Core infrastructure
      ],
    ],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [0], // Disable subject case enforcement
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [0], // Disable body line length
  },
};
