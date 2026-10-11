import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User.js';
import { Workspace } from '../src/models/Workspace.js';
import { WorkspaceMembership } from '../src/models/WorkspaceMembership.js';
import { Project } from '../src/models/Project.js';
import { ProjectMembership } from '../src/models/ProjectMembership.js';
import { Task } from '../src/models/Task.js';
import { Comment } from '../src/models/Comment.js';
import { Notification } from '../src/models/Notification.js';
import { ActivityLog } from '../src/models/ActivityLog.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

dotenv.config();

const seed = async () => {
  try {
    console.log('[Seed] Starting TaskFlow Pro demo seeding...');
    await connectDB();

    // Clear previous seeded demo records safely
    console.log('[Seed] Cleaning up previous demo data...');
    const demoEmails = [
      'alex.morgan@taskflow.demo',
      'sarah.chen@taskflow.demo',
      'marcus.vance@taskflow.demo',
      'elena.rostova@taskflow.demo'
    ];

    const existingDemoUsers = await User.find({ email: { $in: demoEmails } });
    const demoUserIds = existingDemoUsers.map((u) => u._id);

    if (demoUserIds.length > 0) {
      const demoWorkspaces = await Workspace.find({ owner: { $in: demoUserIds } });
      const demoWsIds = demoWorkspaces.map((w) => w._id);

      await Task.deleteMany({ workspace: { $in: demoWsIds } });
      await Comment.deleteMany({ user: { $in: demoUserIds } });
      await Notification.deleteMany({ recipient: { $in: demoUserIds } });
      await ActivityLog.deleteMany({ workspace: { $in: demoWsIds } });
      await ProjectMembership.deleteMany({ user: { $in: demoUserIds } });
      await Project.deleteMany({ workspace: { $in: demoWsIds } });
      await WorkspaceMembership.deleteMany({ workspace: { $in: demoWsIds } });
      await Workspace.deleteMany({ _id: { $in: demoWsIds } });
      await User.deleteMany({ _id: { $in: demoUserIds } });
    }

    console.log('[Seed] Creating demo team users...');
    const demoPassword = 'Password123!';

    const alex = await User.create({
      name: 'Alex Morgan',
      email: 'alex.morgan@taskflow.demo',
      password: demoPassword,
      title: 'Head of Product',
      systemRole: 'user',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      preferences: { theme: 'light', emailNotifications: true, taskUpdates: true }
    });

    const sarah = await User.create({
      name: 'Sarah Chen',
      email: 'sarah.chen@taskflow.demo',
      password: demoPassword,
      title: 'Senior Frontend Architect',
      systemRole: 'user',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
    });

    const marcus = await User.create({
      name: 'Marcus Vance',
      email: 'marcus.vance@taskflow.demo',
      password: demoPassword,
      title: 'Lead Cloud Engineer',
      systemRole: 'user',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    });

    const elena = await User.create({
      name: 'Elena Rostova',
      email: 'elena.rostova@taskflow.demo',
      password: demoPassword,
      title: 'Product Designer',
      systemRole: 'user',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
    });

    console.log('[Seed] Creating demo workspace...');
    const workspace = await Workspace.create({
      name: 'Acme Technologies (Demo)',
      slug: 'acme-tech-demo',
      description: 'Demonstration workspace for evaluating TaskFlow Pro collaboration capabilities',
      owner: alex._id,
      plan: 'pro'
    });

    // Workspace memberships
    await WorkspaceMembership.insertMany([
      { workspace: workspace._id, user: alex._id, role: 'owner' },
      { workspace: workspace._id, user: sarah._id, role: 'admin' },
      { workspace: workspace._id, user: marcus._id, role: 'member' },
      { workspace: workspace._id, user: elena._id, role: 'member' }
    ]);

    console.log('[Seed] Creating demo projects...');
    const projectAlpha = await Project.create({
      workspace: workspace._id,
      name: 'Mobile App Redesign v2',
      key: 'MAR',
      description: 'Revamping mobile client design system, onboarding flows, and offline sync performance',
      status: 'active',
      priority: 'high',
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      owner: alex._id,
      visibility: 'workspace',
      tags: ['Mobile', 'Design', 'iOS', 'Android'],
      color: '#4F46E5'
    });

    const projectBeta = await Project.create({
      workspace: workspace._id,
      name: 'Cloud Infrastructure Migration',
      key: 'CIM',
      description: 'Containerizing legacy microservices, establishing Kubernetes autoscaling and multi-region failover',
      status: 'active',
      priority: 'urgent',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      owner: marcus._id,
      visibility: 'workspace',
      tags: ['DevOps', 'AWS', 'Security'],
      color: '#0284C7'
    });

    const projectGamma = await Project.create({
      workspace: workspace._id,
      name: 'Customer Analytics Portal',
      key: 'CAP',
      description: 'Executive reporting dashboard with live funnel metrics and automated CSV summaries',
      status: 'planning',
      priority: 'medium',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      owner: sarah._id,
      visibility: 'workspace',
      tags: ['Analytics', 'BI', 'Reporting'],
      color: '#10B981'
    });

    // Project memberships
    await ProjectMembership.insertMany([
      { project: projectAlpha._id, user: alex._id, role: 'manager' },
      { project: projectAlpha._id, user: sarah._id, role: 'contributor' },
      { project: projectAlpha._id, user: elena._id, role: 'contributor' },
      { project: projectBeta._id, user: marcus._id, role: 'manager' },
      { project: projectBeta._id, user: alex._id, role: 'contributor' },
      { project: projectGamma._id, user: sarah._id, role: 'manager' },
      { project: projectGamma._id, user: elena._id, role: 'contributor' }
    ]);

    console.log('[Seed] Creating demo tasks...');
    const now = new Date();
    const tasksData = [
      {
        project: projectAlpha._id,
        workspace: workspace._id,
        taskNumber: 1,
        title: 'Complete Figma design system tokens',
        description: 'Standardize typography scale, color primitives, spacing units, and dark mode palette variables.',
        status: 'completed',
        priority: 'high',
        order: 0,
        creator: alex._id,
        assignee: elena._id,
        startDate: new Date(now.getTime() - 12 * 86400000),
        dueDate: new Date(now.getTime() - 3 * 86400000),
        labels: ['Design', 'UI Kit'],
        subtasks: [
          { title: 'Color ramp definitions', completed: true },
          { title: 'Typography styles', completed: true },
          { title: 'Button & Input component variants', completed: true }
        ]
      },
      {
        project: projectAlpha._id,
        workspace: workspace._id,
        taskNumber: 2,
        title: 'Implement interactive Kanban board with drag & drop',
        description: 'Build fluid board with column-level sorting, optimistic UI updates, and backend status persistence.',
        status: 'in_progress',
        priority: 'urgent',
        order: 0,
        creator: alex._id,
        assignee: sarah._id,
        startDate: new Date(now.getTime() - 4 * 86400000),
        dueDate: new Date(now.getTime() + 2 * 86400000),
        labels: ['Frontend', 'Kanban'],
        subtasks: [
          { title: 'Column layout with Tailwind', completed: true },
          { title: 'DnD drop zones', completed: true },
          { title: 'Optimistic state rollbacks on network failure', completed: false }
        ]
      },
      {
        project: projectAlpha._id,
        workspace: workspace._id,
        taskNumber: 3,
        title: 'Configure biometric authentication and session cookies',
        description: 'Integrate FaceID/TouchID prompt on mobile client and configure strict SameSite session tokens.',
        status: 'todo',
        priority: 'medium',
        order: 0,
        creator: alex._id,
        assignee: sarah._id,
        startDate: new Date(now.getTime() + 1 * 86400000),
        dueDate: new Date(now.getTime() + 7 * 86400000),
        labels: ['Auth', 'Security'],
        subtasks: [
          { title: 'Native biometric bridge', completed: false },
          { title: 'Fallback password prompt', completed: false }
        ]
      },
      {
        project: projectAlpha._id,
        workspace: workspace._id,
        taskNumber: 4,
        title: 'Conduct user testing session with 10 beta testers',
        description: 'Gather feedback on new onboarding navigation and task quick-create shortcuts.',
        status: 'backlog',
        priority: 'low',
        order: 0,
        creator: alex._id,
        assignee: elena._id,
        dueDate: new Date(now.getTime() + 14 * 86400000),
        labels: ['Research', 'QA']
      },
      {
        project: projectBeta._id,
        workspace: workspace._id,
        taskNumber: 1,
        title: 'Provision high-availability MongoDB replica cluster',
        description: 'Set up multi-AZ replica set with automated point-in-time backups and SSL encryption in transit.',
        status: 'completed',
        priority: 'urgent',
        order: 0,
        creator: marcus._id,
        assignee: marcus._id,
        startDate: new Date(now.getTime() - 6 * 86400000),
        dueDate: new Date(now.getTime() - 1 * 86400000),
        labels: ['Database', 'Infra'],
        subtasks: [
          { title: 'Cluster deployment', completed: true },
          { title: 'Connection pooling tuning', completed: true }
        ]
      },
      {
        project: projectBeta._id,
        workspace: workspace._id,
        taskNumber: 2,
        title: 'Configure automated Docker CI/CD deployment pipeline',
        description: 'Set up GitHub Actions to run test suite, build optimized images, and deploy to staging cluster.',
        status: 'in_review',
        priority: 'high',
        order: 0,
        creator: marcus._id,
        assignee: marcus._id,
        startDate: new Date(now.getTime() - 3 * 86400000),
        dueDate: new Date(now.getTime() + 1 * 86400000),
        labels: ['CI/CD', 'Docker']
      },
      {
        project: projectGamma._id,
        workspace: workspace._id,
        taskNumber: 1,
        title: 'Define executive reporting metrics and CSV export schema',
        description: 'Determine KPIs: project completion rates, velocity charts, team workload, and overdue ratios.',
        status: 'in_progress',
        priority: 'medium',
        order: 0,
        creator: sarah._id,
        assignee: sarah._id,
        startDate: new Date(now.getTime() - 1 * 86400000),
        dueDate: new Date(now.getTime() + 5 * 86400000),
        labels: ['Reporting', 'Analytics']
      }
    ];

    const createdTasks = await Task.insertMany(tasksData);

    console.log('[Seed] Adding sample comments and activity logs...');
    await Comment.create({
      task: createdTasks[1]._id,
      project: projectAlpha._id,
      user: alex._id,
      content: 'Sarah, the drag-and-drop response feels extremely smooth! Can we also include priority badges directly on the card face?'
    });

    await Comment.create({
      task: createdTasks[1]._id,
      project: projectAlpha._id,
      user: sarah._id,
      content: 'Already added! Color-coded priority pills and due date warnings are rendering on each card.'
    });

    await ActivityLog.insertMany([
      {
        workspace: workspace._id,
        project: projectAlpha._id,
        task: createdTasks[1]._id,
        user: alex._id,
        action: 'created_task',
        details: { title: createdTasks[1].title }
      },
      {
        workspace: workspace._id,
        project: projectAlpha._id,
        task: createdTasks[0]._id,
        user: elena._id,
        action: 'status_changed',
        details: { from: 'in_review', to: 'completed', title: createdTasks[0].title }
      }
    ]);

    await Notification.create({
      recipient: alex._id,
      sender: sarah._id,
      type: 'comment_added',
      title: 'New Comment',
      message: 'Sarah Chen commented on "Implement interactive Kanban board with drag & drop"',
      entityType: 'task',
      entityId: createdTasks[1]._id,
      link: `/app/projects/${projectAlpha._id}?task=${createdTasks[1]._id}`,
      isRead: false
    });

    console.log('[Seed] Demo data seeded successfully!');
    console.log('=====================================================');
    console.log('DEMO LOGIN CREDENTIALS:');
    console.log('Owner:    alex.morgan@taskflow.demo   / Password123!');
    console.log('Admin:    sarah.chen@taskflow.demo    / Password123!');
    console.log('Member:   marcus.vance@taskflow.demo  / Password123!');
    console.log('Designer: elena.rostova@taskflow.demo / Password123!');
    console.log('=====================================================');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error] Failed to seed demo database:', err);
    process.exit(1);
  }
};

seed();
