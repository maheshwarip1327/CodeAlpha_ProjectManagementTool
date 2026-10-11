import dotenv from 'dotenv';
import { User } from '../src/models/User.js';
import { Workspace } from '../src/models/Workspace.js';
import { WorkspaceMembership } from '../src/models/WorkspaceMembership.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

dotenv.config();

const createAdmin = async () => {
  try {
    const args = process.argv.slice(2);
    const email = args[0] || process.env.ADMIN_EMAIL;
    const password = args[1] || process.env.ADMIN_PASSWORD;
    const name = args[2] || process.env.ADMIN_NAME || 'System Administrator';

    if (!email || !password) {
      console.error('\n[Error] Missing admin credentials.');
      console.log('Usage: node scripts/createAdmin.js <email> <password> [name]');
      console.log('Example: node scripts/createAdmin.js admin@taskflowpro.com SuperAdminPass123! "Lead Admin"\n');
      console.log('Or configure ADMIN_EMAIL, ADMIN_PASSWORD in your environment before running.\n');
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('[Error] Admin password must be at least 8 characters long for security.');
      process.exit(1);
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (existing.systemRole === 'admin') {
        console.log(`[Admin Setup] User ${email} is already a system administrator.`);
      } else {
        existing.systemRole = 'admin';
        existing.status = 'active';
        await existing.save();
        console.log(`[Admin Setup] Successfully promoted existing user ${email} to System Administrator!`);
      }
      await disconnectDB();
      process.exit(0);
    }

    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      title: 'Global Administrator',
      systemRole: 'admin',
      status: 'active'
    });

    // Create system administrative workspace
    const workspace = await Workspace.create({
      name: `${name}'s Operations`,
      slug: `ops-${Date.now().toString().slice(-4)}`,
      description: 'Central operations workspace',
      owner: admin._id,
      plan: 'team'
    });

    await WorkspaceMembership.create({
      workspace: workspace._id,
      user: admin._id,
      role: 'owner'
    });

    console.log('\n======================================================');
    console.log('SYSTEM ADMINISTRATOR CREATED SUCCESSFULLY:');
    console.log(`Name:  ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role:  ${admin.systemRole}`);
    console.log('======================================================\n');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Admin Setup Error] Failed to create administrator:', err);
    process.exit(1);
  }
};

createAdmin();
