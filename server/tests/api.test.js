import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Workspace } from '../src/models/Workspace.js';
import { WorkspaceMembership } from '../src/models/WorkspaceMembership.js';
import { Project } from '../src/models/Project.js';
import { Task } from '../src/models/Task.js';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/taskflow_pro_test';

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  // Clear test DB collections
  await User.deleteMany({});
  await Workspace.deleteMany({});
  await WorkspaceMembership.deleteMany({});
  await Project.deleteMany({});
  await Task.deleteMany({});
});

afterAll(async () => {
  await User.deleteMany({});
  await Workspace.deleteMany({});
  await WorkspaceMembership.deleteMany({});
  await Project.deleteMany({});
  await Task.deleteMany({});
  await mongoose.connection.close();
});

describe('TaskFlow Pro API Suite', () => {
  let userAToken = '';
  let userAId = '';
  let userBToken = '';
  let userBId = '';
  let workspaceAId = '';
  let privateProjectId = '';
  let createdTaskId = '';

  it('1. GET /health - should report API healthy and database connected', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database).toBe('connected');
  });

  it('2. POST /api/auth/register - should register User A with default workspace', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Developer',
        email: 'alice@example.com',
        password: 'Password123!',
        title: 'Tech Lead'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.defaultWorkspace).toBeDefined();

    userAToken = res.body.token;
    userAId = res.body.user._id;
    workspaceAId = res.body.defaultWorkspace._id;
  });

  it('3. POST /api/auth/register - should register User B', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Outsider',
        email: 'bob@example.com',
        password: 'Password123!',
        title: 'Consultant'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    userBToken = res.body.token;
    userBId = res.body.user._id;
  });

  it('4. POST /api/auth/login - should authenticate user and issue cookie/token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('5. POST /api/projects - User A creates a PRIVATE project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        workspaceId: workspaceAId,
        name: 'Top Secret Falcon',
        key: 'TSF',
        description: 'Classified architecture refactor',
        visibility: 'private',
        priority: 'urgent'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.project.name).toBe('Top Secret Falcon');
    expect(res.body.project.visibility).toBe('private');

    privateProjectId = res.body.project._id;
  });

  it('6. SECURITY / AUTHORIZATION TEST: User B CANNOT read User A private project', async () => {
    const res = await request(app)
      .get(`/api/projects/${privateProjectId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    // Must be rejected with 403 Forbidden
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('7. SECURITY / AUTHORIZATION TEST: User B CANNOT modify User A private project', async () => {
    const res = await request(app)
      .put(`/api/projects/${privateProjectId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        name: 'Hacked Project Name'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('8. POST /api/tasks - User A creates a task in the project', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        projectId: privateProjectId,
        title: 'Audit cryptographic primitives',
        description: 'Verify HMAC signatures and token salts',
        status: 'todo',
        priority: 'high',
        subtasks: [
          { title: 'Check salt generation', completed: false }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.task.title).toBe('Audit cryptographic primitives');
    expect(res.body.task.taskNumber).toBe(1);

    createdTaskId = res.body.task._id;
  });

  it('9. PATCH /api/tasks/:id/status - updates task status for Kanban drag-and-drop', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${createdTaskId}/status`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        status: 'in_progress',
        order: 1
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.task.status).toBe('in_progress');
  });

  it('10. GET /api/reports - generates authorized workspace metrics', async () => {
    const res = await request(app)
      .get(`/api/reports?workspaceId=${workspaceAId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.metrics.totalTasks).toBe(1);
    expect(res.body.metrics.inProgressTasks).toBe(1);
  });

  it('11. GET /api/reports/export-csv - exports authorized CSV report stream', async () => {
    const res = await request(app)
      .get(`/api/reports/export-csv?workspaceId=${workspaceAId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Audit cryptographic primitives');
  });
});
