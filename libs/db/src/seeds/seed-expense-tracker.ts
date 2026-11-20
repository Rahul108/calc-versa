import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { runMigrationsWithBaseline } from '../maintenance/run-migrations';
import { App } from '../entities/App.entity';
import { User } from '../entities/User.entity';
import { UsersNAppMapping } from '../entities/UsersNAppMapping.entity';
import { Permission } from '../entities/Permission.entity';
import { UserPermission } from '../entities/UserPermission.entity';
import { AppRecord } from '../entities/AppRecord.entity';

async function seedExpenseTracker() {
  console.log('🌱 Initializing AppDataSource...');
  await AppDataSource.initialize();
  const ran = await runMigrationsWithBaseline(AppDataSource);
  if (ran.length) console.log(`🗄️  Applied migrations: ${ran.join(', ')}`);

  // 1. Ensure Full Owner Permission exists
  let fullPerm = await AppDataSource.getRepository(Permission).findOne({
    where: { read: true, write: true },
  });
  if (!fullPerm) {
    fullPerm = AppDataSource.getRepository(Permission).create({
      name: 'owner_full_access',
      read: true,
      write: true,
    });
    fullPerm = await AppDataSource.getRepository(Permission).save(fullPerm);
  }

  // 2. Ensure Primary Admin User exists with valid bcrypt password hash (Password123!)
  const hashedPassword = '$2a$10$tnEuXJv5QtfxoyLLp09pyeh60R.1DOAVOLKtjDiocjXajNi6siupW';

  let adminUser = await AppDataSource.getRepository(User).findOne({
    where: { username: 'admin' },
  });
  if (!adminUser) {
    adminUser = AppDataSource.getRepository(User).create({
      username: 'admin',
      email: 'admin@calcversa.com',
      first_name: 'Super',
      last_name: 'Admin',
      address: 'HQ Office',
      contact_no: '+1-555-0199',
      password: hashedPassword,
      is_admin: true,
      status: true,
    });
    adminUser = await AppDataSource.getRepository(User).save(adminUser);
  } else {
    adminUser.password = hashedPassword;
    adminUser.is_admin = true;
    adminUser = await AppDataSource.getRepository(User).save(adminUser);
  }

  // 3. Create or Update 7-Member Expense Tracker Tool
  const appRepo = AppDataSource.getRepository(App);
  let expenseApp = await appRepo.findOne({
    where: { name: '7-Member Multi-User Expense Tracker' },
  });

  const inputsConfig = {
    sections: [
      {
        title: 'Daily Expense Record Form',
        fields: [
          {
            id: 'member_name',
            label: 'Member / User',
            type: 'select',
            defaultValue: 'Member 1 (John)',
            options: [
              'Member 1 (John)',
              'Member 2 (Alice)',
              'Member 3 (Rahat)',
              'Member 4 (David)',
              'Member 5 (Sophia)',
              'Member 6 (Kabir)',
              'Member 7 (Tariq)',
            ],
          },
          {
            id: 'expense_type',
            label: 'Expense Category',
            type: 'select',
            defaultValue: 'Food / Mess',
            options: ['Food / Mess', 'House Rent', 'Utilities', 'Transport', 'Entertainment', 'Misc'],
          },
          {
            id: 'expense_date',
            label: 'Expense Date',
            type: 'date',
            defaultValue: 'today',
          },
          {
            id: 'amount',
            label: 'Expense Amount',
            type: 'number',
            defaultValue: 150,
          },
          {
            id: 'additional_note',
            label: 'Additional Note / Description',
            type: 'text',
            defaultValue: 'Daily groceries',
          },
        ],
      },
    ],
  };

  // The compute engine reads `rules[].targetOutputId` (an earlier version of this seed used
  // `formulas[].target`, which the engine ignored, so saved entries had empty results).
  const formulaConfig = {
    rules: [{ targetOutputId: 'total_expense', expression: 'amount' }],
    outputs: [{ id: 'total_expense', label: 'Recorded total', format: 'currency' }],
  };

  const uiConfig = {
    toolType: 'tracker',
    currency: 'Tk',
    intervalModes: ['daily', 'weekly', 'monthly', 'all_time'],
    summaryMetrics: [{ key: 'amount', label: 'Total Expense', aggregation: 'sum' }],
    analytics: { amountField: 'amount', memberField: 'member_name', categoryField: 'expense_type' },
  };

  if (!expenseApp) {
    expenseApp = appRepo.create({
      id: '91956cd2-45e0-40f8-b378-c81fd2c3438d',
      name: '7-Member Multi-User Expense Tracker',
      description: 'Track daily expenses across 7 members, categorize spending, and analyze daily, weekly, and monthly totals.',
      status: true,
      inputsConfig,
      formulaConfig,
      uiConfig,
    });
    expenseApp = await appRepo.save(expenseApp);
    console.log(`✅ Created Expense Tracker tool: ${expenseApp.id}`);
  } else {
    expenseApp.inputsConfig = inputsConfig;
    expenseApp.formulaConfig = formulaConfig;
    expenseApp.uiConfig = uiConfig;
    await appRepo.save(expenseApp);
    console.log(`✅ Updated Expense Tracker tool: ${expenseApp.id}`);
  }

  // 4. Create User Mapping & Permission
  const mapRepo = AppDataSource.getRepository(UsersNAppMapping);
  let mapping = await mapRepo.findOne({
    where: { app_id: expenseApp.id, user_id: adminUser.id },
  });
  if (!mapping) {
    mapping = mapRepo.create({
      app_id: expenseApp.id,
      user_id: adminUser.id,
      status: true,
      is_owner: true,
    });
    await mapRepo.save(mapping);
  } else if (!mapping.is_owner) {
    mapping.is_owner = true;
    await mapRepo.save(mapping);
  }

  const userPermRepo = AppDataSource.getRepository(UserPermission);
  let userPerm = await userPermRepo.findOne({
    where: { app_id: expenseApp.id, user_id: adminUser.id },
  });
  if (!userPerm) {
    userPerm = userPermRepo.create({
      app_id: expenseApp.id,
      user_id: adminUser.id,
      permission_id: fullPerm.id,
    });
    await userPermRepo.save(userPerm);
  }

  // 5. Pre-populate Sample Expense Records across dates & members
  const recordRepo = AppDataSource.getRepository(AppRecord);

  // Clear existing demo records for clean state
  await recordRepo.delete({ app_id: expenseApp.id });

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const twoDaysAgoStr = new Date(Date.now() - 172800000).toISOString().split('T')[0];

  const sampleRecords = [
    { member_name: 'Member 1 (John)', expense_type: 'Food / Mess', amount: 350, additional_note: 'Fresh vegetables & rice', date: todayStr },
    { member_name: 'Member 2 (Alice)', expense_type: 'Utilities', amount: 1200, additional_note: 'High-speed Fiber Internet bill', date: todayStr },
    { member_name: 'Member 3 (Rahat)', expense_type: 'Food / Mess', amount: 280, additional_note: 'Dinner & snacks', date: todayStr },
    { member_name: 'Member 4 (David)', expense_type: 'Transport', amount: 150, additional_note: 'Metro train recharge', date: todayStr },
    { member_name: 'Member 5 (Sophia)', expense_type: 'Entertainment', amount: 450, additional_note: 'Weekend movie tickets', date: yesterdayStr },
    { member_name: 'Member 6 (Kabir)', expense_type: 'Food / Mess', amount: 500, additional_note: 'Shared mess monthly fish & meat', date: yesterdayStr },
    { member_name: 'Member 7 (Tariq)', expense_type: 'House Rent', amount: 3500, additional_note: 'Monthly room rent contribution', date: twoDaysAgoStr },
    { member_name: 'Member 1 (John)', expense_type: 'Misc', amount: 200, additional_note: 'Apartment cleaning supplies', date: twoDaysAgoStr },
  ];

  for (const r of sampleRecords) {
    const rec = recordRepo.create({
      app_id: expenseApp.id,
      user_id: adminUser.id,
      payload: {
        member_name: r.member_name,
        expense_type: r.expense_type,
        expense_date: r.date,
        amount: r.amount,
        additional_note: r.additional_note,
      },
      results: { total_expense: r.amount },
      record_date: r.date,
    });
    await recordRepo.save(rec);
  }

  console.log(`✅ Seeded ${sampleRecords.length} sample expense entries for all 7 members.`);
  await AppDataSource.destroy();
  console.log('🎉 Seeding completed successfully!');
}

seedExpenseTracker().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
