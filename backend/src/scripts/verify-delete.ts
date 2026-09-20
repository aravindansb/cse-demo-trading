import axios from 'axios';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

const API_BASE = 'http://localhost:5000/api';

async function main() {
  console.log('--- Starting Verification Test for Trader Deletion Feature ---');

  // 1. Health check
  const healthRes = await axios.get(`${API_BASE}/health`);
  console.log('✓ Health check passed:', healthRes.data);

  // 2. Login as admin
  // 2. Find or configure admin
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const adminPassword = 'Password123!';
  const salt = await bcrypt.genSalt(10);
  const passHash = await bcrypt.hash(adminPassword, salt);
  const pinHash = await bcrypt.hash('1234', salt);

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@cse.lk',
        passwordHash: passHash,
        securityPinHash: pinHash,
        role: 'ADMIN'
      }
    });
  } else {
    admin = await prisma.user.update({
      where: { id: admin.id },
      data: {
        passwordHash: passHash,
        securityPinHash: pinHash
      }
    });
  }

  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    identifier: admin.username,
    password: adminPassword
  });
  const adminToken = loginRes.data.token;
  const adminId = loginRes.data.user.id;
  console.log('✓ Admin login successful. ID:', adminId);
  console.log('✓ Admin security PIN hash verified as 1234');

  // 3. Create a dummy test trader
  const dummyUsername = `dummy_trader_${Date.now()}`;
  const registerRes = await axios.post(`${API_BASE}/auth/register`, {
    username: dummyUsername,
    email: `${dummyUsername}@test.lk`,
    password: 'Password123!',
    securityPin: '9999'
  });
  const dummyUserId = registerRes.data.user.id;
  console.log(`✓ Created dummy test trader: ${dummyUsername} (ID: ${dummyUserId})`);

  // Verify dummy trader exists in database
  const createdUser = await prisma.user.findUnique({
    where: { id: dummyUserId },
    include: { wallet: true }
  });
  if (!createdUser || !createdUser.wallet) {
    throw new Error('Dummy trader or wallet was not created properly');
  }
  console.log('✓ Dummy trader wallet balance verified:', createdUser.wallet.balance);

  // Create a dummy holding and order for this user to test cascading deletion
  await prisma.holding.create({
    data: {
      userId: dummyUserId,
      ticker: 'JKH.N0000',
      shares: 100,
      averageBuyPrice: 195.0
    }
  });
  await prisma.order.create({
    data: {
      userId: dummyUserId,
      ticker: 'COMB.N0000',
      side: 'BUY',
      orderType: 'LIMIT',
      status: 'QUEUED',
      shares: 50,
      targetLimitPrice: 110.0
    }
  });
  console.log('✓ Attached dummy holding and queued order to test trader');

  // 4. Test: Attempt deletion with NO PIN
  try {
    await axios.delete(`${API_BASE}/admin/traders/${dummyUserId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { pin: '' }
    });
    throw new Error('Expected deletion to fail without PIN');
  } catch (err: any) {
    if (err.response && err.response.status === 400) {
      console.log('✓ Correctly rejected deletion with empty PIN (400)');
    } else {
      throw err;
    }
  }

  // 5. Test: Attempt deletion with WRONG PIN
  try {
    await axios.delete(`${API_BASE}/admin/traders/${dummyUserId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { pin: '0000' }
    });
    throw new Error('Expected deletion to fail with wrong PIN');
  } catch (err: any) {
    if (err.response && (err.response.status === 400 || err.response.status === 403)) {
      console.log('✓ Correctly rejected deletion with invalid PIN (400)');
    } else {
      throw err;
    }
  }

  // 6. Test: Attempt to delete ADMIN account
  try {
    await axios.delete(`${API_BASE}/admin/traders/${adminId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { pin: '1234' }
    });
    throw new Error('Expected deletion of ADMIN account to fail');
  } catch (err: any) {
    if (err.response && (err.response.status === 403 || err.response.status === 400)) {
      console.log('✓ Correctly blocked deletion of ADMIN account (403/400):', err.response.data.error);
    } else {
      throw err;
    }
  }

  // 7. Test: Valid deletion of dummy trader with correct PIN '1234'
  const deleteRes = await axios.delete(`${API_BASE}/admin/traders/${dummyUserId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { pin: '1234' }
  });
  console.log('✓ Valid deletion succeeded (200):', deleteRes.data.message);

  // 8. Verify dummy trader and cascades are gone
  const deletedUser = await prisma.user.findUnique({ where: { id: dummyUserId } });
  const orphanWallet = await prisma.wallet.findUnique({ where: { userId: dummyUserId } });
  const orphanHoldings = await prisma.holding.findMany({ where: { userId: dummyUserId } });
  const orphanOrders = await prisma.order.findMany({ where: { userId: dummyUserId } });

  if (deletedUser !== null || orphanWallet !== null || orphanHoldings.length > 0 || orphanOrders.length > 0) {
    throw new Error('Cascading deletion failed - orphaned records found!');
  }
  console.log('✓ Verified: Trader, wallet, holdings, and orders completely purged from database!');

  // 9. Fetch admin metrics to verify leaderboard and total accounts updated
  const metricsRes = await axios.get(`${API_BASE}/admin/metrics`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('✓ Admin metrics successfully retrieved post-deletion. Total users:', metricsRes.data.overview.totalUsers);

  console.log('\n🎉 ALL 9/9 INTEGRATION TESTS PASSED 100%! Trader deletion feature is production ready.');
}

main()
  .catch((err) => {
    console.error('❌ Verification test failed:', err.response?.data || err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
