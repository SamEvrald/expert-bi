require('dotenv').config();

const { sequelize } = require('../src/config/sequelize');
const { User, Project, Dataset } = require('../src/models');

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');

    // Force sync (recreate tables)
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created');

    // Create sample users
    const users = await User.bulkCreate([
      {
        name: 'Demo User',
        email: 'demo@expertbi.com',
        password: 'Demo123!',
        plan: 'free',
        emailVerified: true,
        isActive: true
      },
      {
        name: 'Premium User',
        email: 'premium@expertbi.com',
        password: 'Premium123!',
        plan: 'premium',
        emailVerified: true,
        isActive: true
      },
      {
        name: 'John Smith',
        email: 'john@company.com',
        password: 'John123!',
        plan: 'free',
        emailVerified: true,
        isActive: true
      }
    ], {
      individualHooks: true // This ensures password hashing hooks run
    });

    console.log('✅ Sample users created');

    // Create sample projects
    const projects = await Project.bulkCreate([
      {
        name: 'Sales Analysis Project',
        description: 'Analyzing quarterly sales data and customer trends',
        userId: users[0].id,
        status: 'active'
      },
      {
        name: 'Marketing Campaign Analysis',
        description: 'Evaluating the effectiveness of recent marketing campaigns',
        userId: users[1].id,
        status: 'active'
      },
      {
        name: 'Customer Behavior Study',
        description: 'Understanding customer purchase patterns and preferences',
        userId: users[1].id,
        status: 'active'
      },
      {
        name: 'Inventory Management',
        description: 'Optimizing stock levels and supply chain efficiency',
        userId: users[2].id,
        status: 'active'
      }
    ]);

    console.log('✅ Sample projects created');

    console.log(`
🎉 Database seeded successfully!

Sample Users:
- demo@expertbi.com (password: Demo123!) - Free Plan
- premium@expertbi.com (password: Premium123!) - Premium Plan  
- john@company.com (password: John123!) - Free Plan

Sample Projects:
${projects.map(p => `- ${p.name} (${p.status})`).join('\n')}

You can now start the server and test the API endpoints.
    `);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

seedDatabase();