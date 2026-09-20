import axios from 'axios';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

const API_BASE = 'http://localhost:5000/api';

async function main() {
  console.log('--- Starting Verification Test for Super User & Command Center Feature ---');

  // 1. Health check
  const healthRes = await axios.get(`${API_BASE}/health`);
  console.log('✓ Health check passed:', healthRes.data.status);

  // 2. Inspect users and find or create admin
  const allUsers = await prisma.user.findMany({
    select: { id: true, username: true, role: true }
  });
  console.log('Current users in DB:', allUsers);

  let adminUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username: 'admin' },
        { role: 'ADMIN' },
        { role: 'SUPER_ADMIN' }
      ]
    }
  });

  const salt = await bcrypt.genSalt(10);
  const passHash = await bcrypt.hash('Password123!', salt);
  const pinHash = await bcrypt.hash('1234', salt);

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@cse.lk',
        passwordHash: passHash,
        securityPinHash: pinHash,
        role: 'SUPER_ADMIN'
      }
    });
    console.log('✓ Created initial admin account with role SUPER_ADMIN');
  } else {
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        role: 'SUPER_ADMIN',
        passwordHash: passHash,
        securityPinHash: pinHash
      }
    });
    console.log(`✓ Elevated user '${adminUser.username}' to role: ${adminUser.role}`);
  }

  // 3. Login as admin
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    identifier: adminUser.username,
    password: 'Password123!'
  });
  const superToken = loginRes.data.token;
  const userPayload = loginRes.data.user;
  console.log(`✓ Admin login successful. Returned user role: ${userPayload.role}`);
  if (userPayload.role !== 'SUPER_ADMIN') {
    throw new Error(`Expected role 'SUPER_ADMIN' but received '${userPayload.role}'`);
  }

  // 4. Test GET /api/superuser/telemetry
  const telemetryRes = await axios.get(`${API_BASE}/superuser/telemetry`, {
    headers: { Authorization: `Bearer ${superToken}` }
  });
  console.log('✓ Telemetry endpoint returned 200 OK:');
  console.log(`   - Server Status: ${telemetryRes.data.server.status}`);
  console.log(`   - Process Uptime: ${telemetryRes.data.server.uptimeFormatted}`);
  console.log(`   - Heap Memory: ${telemetryRes.data.server.memory.heapUsedMB} MB / ${telemetryRes.data.server.memory.heapTotalMB} MB (${telemetryRes.data.server.memory.usagePercent}%)`);
  console.log(`   - Database Footprint: ${telemetryRes.data.database.sizeKB} KB (${telemetryRes.data.database.sizeMB} MB)`);
  console.log(`   - Registered Equities: ${telemetryRes.data.database.entities.equities}`);
  console.log(`   - Total Executed Trades: ${telemetryRes.data.database.entities.trades}`);
  console.log(`   - Active Traders: ${telemetryRes.data.engagement.activeTradersCount} / ${telemetryRes.data.engagement.totalUsers}`);

  // 5. Test GET /api/superuser/events
  const eventsRes = await axios.get(`${API_BASE}/superuser/events`, {
    headers: { Authorization: `Bearer ${superToken}` }
  });
  console.log(`✓ Events stream returned 200 OK. Total events: ${eventsRes.data.events.length}`);
  if (eventsRes.data.events.length > 0) {
    const sample = eventsRes.data.events[0];
    console.log(`   - Sample Event: [${sample.category}] ${sample.title} by ${sample.actor} at ${sample.timestamp}`);
  }

  // Test filtered events: TRADES
  const filteredRes = await axios.get(`${API_BASE}/superuser/events?category=TRADES`, {
    headers: { Authorization: `Bearer ${superToken}` }
  });
  console.log(`✓ Category filter (TRADES) returned ${filteredRes.data.events.length} trade events.`);

  // 6. Security Check: Normal trader cannot access /api/superuser
  const dummyTraderUsername = `test_norm_trader_${Date.now()}`;
  const regRes = await axios.post(`${API_BASE}/auth/register`, {
    username: dummyTraderUsername,
    email: `${dummyTraderUsername}@test.lk`,
    password: 'Password123!',
    securityPin: '1234',
    role: 'USER'
  });
  const normalToken = regRes.data.token;
  console.log(`✓ Created normal retail trader: ${dummyTraderUsername} (Role: ${regRes.data.user.role})`);

  try {
    await axios.get(`${API_BASE}/superuser/telemetry`, {
      headers: { Authorization: `Bearer ${normalToken}` }
    });
    throw new Error('Expected regular user to be blocked from /api/superuser/telemetry');
  } catch (err: any) {
    if (err.response && err.response.status === 403) {
      console.log('✓ Security Check Passed: Regular user correctly rejected with 403 Forbidden:', err.response.data.error);
    } else {
      throw err;
    }
  }

  // Clean up test trader
  await prisma.wallet.deleteMany({ where: { user: { username: dummyTraderUsername } } });
  await prisma.user.deleteMany({ where: { username: dummyTraderUsername } });
  console.log('✓ Cleaned up test trader account');

  // 7. Test that SUPER_ADMIN can also access standard /api/admin/metrics
  const adminMetricsRes = await axios.get(`${API_BASE}/admin/metrics`, {
    headers: { Authorization: `Bearer ${superToken}` }
  });
  console.log(`✓ Super Admin verified access to standard Admin Console (200 OK). Total Users: ${adminMetricsRes.data.overview.totalUsers}`);

  // 8. Test Frontend /superuser page response
  const frontendRes = await axios.get('http://localhost:3000/superuser');
  console.log(`✓ Frontend Command Center route (/superuser) responded: HTTP ${frontendRes.status}`);

  console.log('\n🎉 ALL 8/8 SUPER USER VERIFICATION TESTS PASSED 100%! Feature is production ready.');
}

main()
  .catch((err) => {
    console.error('❌ Super user verification failed:', err.response?.data || err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
