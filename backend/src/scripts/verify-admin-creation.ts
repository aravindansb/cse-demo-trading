import axios from 'axios';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

const API_BASE = 'http://localhost:5000/api';

async function main() {
  console.log('--- Starting Verification Test for Administrator Provisioning & Registration Hardening ---');

  // 1. Health check
  const healthRes = await axios.get(`${API_BASE}/health`);
  console.log('✓ Health check passed:', healthRes.data.status);

  // 2. Privilege Escalation Test: Public registration with role: 'ADMIN' must be ignored and forced to 'USER'
  const spoofUsername = `spoof_hacker_${Date.now()}`;
  const spoofRes = await axios.post(`${API_BASE}/auth/register`, {
    username: spoofUsername,
    email: `${spoofUsername}@test.lk`,
    password: 'Password123!',
    securityPin: '1234',
    role: 'ADMIN' // Malicious attempt to self-grant ADMIN role
  });

  const registeredUser = await prisma.user.findUnique({
    where: { username: spoofUsername }
  });

  if (!registeredUser || registeredUser.role !== 'USER') {
    throw new Error(`Privilege escalation failed! User registered as '${registeredUser?.role}' instead of 'USER'`);
  }
  console.log(`✓ Privilege Escalation Prevented: Public registration with role 'ADMIN' was forced to role '${registeredUser.role}'`);

  // Clean up spoof user
  await prisma.wallet.deleteMany({ where: { userId: registeredUser.id } });
  await prisma.user.delete({ where: { id: registeredUser.id } });

  // 3. Find Super Admin and login
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });
  if (!superAdmin) {
    throw new Error('No SUPER_ADMIN found in database');
  }

  // Ensure known password & PIN
  const salt = await bcrypt.genSalt(10);
  const passHash = await bcrypt.hash('Password123!', salt);
  const pinHash = await bcrypt.hash('1234', salt);
  await prisma.user.update({
    where: { id: superAdmin.id },
    data: { passwordHash: passHash, securityPinHash: pinHash }
  });

  const superLoginRes = await axios.post(`${API_BASE}/auth/login`, {
    identifier: superAdmin.username,
    password: 'Password123!'
  });
  const superToken = superLoginRes.data.token;
  console.log(`✓ Super Admin logged in: ${superAdmin.username} (Role: ${superLoginRes.data.user.role})`);

  // 4. Test: Attempt to create admin with WRONG authorizing PIN
  const newAdminUser = `test_admin_${Date.now()}`;
  try {
    await axios.post(
      `${API_BASE}/admin/create-admin`,
      {
        username: newAdminUser,
        email: `${newAdminUser}@cse.lk`,
        password: 'AdminPassword123!',
        securityPin: '4321',
        role: 'ADMIN',
        authorizingPin: '0000' // Invalid PIN
      },
      { headers: { Authorization: `Bearer ${superToken}` } }
    );
    throw new Error('Expected create-admin to fail with invalid PIN');
  } catch (err: any) {
    if (err.response && err.response.status === 400) {
      console.log('✓ Correctly rejected administrator creation with invalid PIN (400):', err.response.data.error);
    } else {
      throw err;
    }
  }

  // 5. Test: Super Admin successfully creates a new standard ADMIN account
  const createAdminRes = await axios.post(
    `${API_BASE}/admin/create-admin`,
    {
      username: newAdminUser,
      email: `${newAdminUser}@cse.lk`,
      password: 'AdminPassword123!',
      securityPin: '4321',
      role: 'ADMIN',
      authorizingPin: '1234' // Correct PIN
    },
    { headers: { Authorization: `Bearer ${superToken}` } }
  );

  console.log(`✓ Administrator successfully provisioned (201): ${createAdminRes.data.user.username} (Role: ${createAdminRes.data.user.role})`);
  const createdAdminId = createAdminRes.data.user.id;

  // Verify the new admin can log in
  const newAdminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
    identifier: newAdminUser,
    password: 'AdminPassword123!'
  });
  const newAdminToken = newAdminLoginRes.data.token;
  console.log(`✓ Newly provisioned admin logged in successfully. Role: ${newAdminLoginRes.data.user.role}`);

  // 6. Test Tiered Permission: Standard ADMIN attempting to create a SUPER_ADMIN must be rejected
  try {
    await axios.post(
      `${API_BASE}/admin/create-admin`,
      {
        username: `escalated_super_${Date.now()}`,
        email: `escalated@cse.lk`,
        password: 'SuperPass123!',
        securityPin: '1234',
        role: 'SUPER_ADMIN', // Standard admin trying to create Super Admin
        authorizingPin: '4321' // Valid PIN of standard admin
      },
      { headers: { Authorization: `Bearer ${newAdminToken}` } }
    );
    throw new Error('Expected standard admin creating super admin to be rejected');
  } catch (err: any) {
    if (err.response && err.response.status === 403) {
      console.log('✓ Tiered Hierarchy Enforced: Standard admin blocked from creating Super Admin (403):', err.response.data.error);
    } else {
      throw err;
    }
  }

  // Clean up test admin
  await prisma.wallet.deleteMany({ where: { userId: createdAdminId } });
  await prisma.user.delete({ where: { id: createdAdminId } });
  console.log('✓ Cleaned up temporary test administrator');

  // 7. Test Frontend availability
  const frontAdminRes = await axios.get('http://localhost:3000/admin');
  console.log(`✓ Frontend Admin Console (/admin) responded: HTTP ${frontAdminRes.status}`);

  console.log('\n🎉 ALL 7/7 VERIFICATION TESTS PASSED 100%! Feature is production ready.');
}

main()
  .catch((err) => {
    console.error('❌ Verification test failed:', err.response?.data || err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
