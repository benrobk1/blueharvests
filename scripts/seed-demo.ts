import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DEMO_PASSWORD = 'demo123456';

const DEMO_DATA = {
  farms: [
    { farm_name: 'Green Valley Farm', zip_code: '10001', email: 'farmer1@demo.com', full_name: 'Sarah Green' },
    { farm_name: 'Sunrise Orchards', zip_code: '10001', email: 'farmer2@demo.com', full_name: 'John Sunrise' }
  ],
  products: [
    { name: 'Organic Tomatoes', price: 4.99, unit: 'lb', available_quantity: 50, description: 'Fresh vine-ripened tomatoes' },
    { name: 'Fresh Lettuce', price: 2.99, unit: 'head', available_quantity: 40, description: 'Crisp butter lettuce' },
    { name: 'Sweet Corn', price: 3.49, unit: 'dozen', available_quantity: 30, description: 'Sweet yellow corn' },
    { name: 'Strawberries', price: 5.99, unit: 'lb', available_quantity: 25, description: 'Juicy red strawberries' },
    { name: 'Cucumbers', price: 2.49, unit: 'lb', available_quantity: 35, description: 'Garden fresh cucumbers' },
    { name: 'Bell Peppers', price: 3.99, unit: 'lb', available_quantity: 30, description: 'Mixed color bell peppers' },
    { name: 'Zucchini', price: 2.79, unit: 'lb', available_quantity: 40, description: 'Green zucchini squash' },
    { name: 'Apples', price: 4.49, unit: 'lb', available_quantity: 60, description: 'Crisp red apples' },
    { name: 'Carrots', price: 2.29, unit: 'lb', available_quantity: 50, description: 'Sweet orange carrots' },
    { name: 'Blueberries', price: 6.99, unit: 'pint', available_quantity: 20, description: 'Fresh blueberries' },
    { name: 'Spinach', price: 3.49, unit: 'bunch', available_quantity: 35, description: 'Baby spinach' },
    { name: 'Kale', price: 2.99, unit: 'bunch', available_quantity: 30, description: 'Curly kale' }
  ],
  consumers: [
    { email: 'consumer1@demo.com', full_name: 'Jane Smith', zip_code: '10001', delivery_address: '123 Main St, New York, NY 10001', phone: '555-0101' },
    { email: 'consumer2@demo.com', full_name: 'Bob Johnson', zip_code: '10001', delivery_address: '456 Park Ave, New York, NY 10001', phone: '555-0102' },
    { email: 'consumer3@demo.com', full_name: 'Alice Williams', zip_code: '10001', delivery_address: '789 Broadway, New York, NY 10001', phone: '555-0103' },
    { email: 'consumer4@demo.com', full_name: 'Charlie Brown', zip_code: '10001', delivery_address: '321 5th Ave, New York, NY 10001', phone: '555-0104' },
    { email: 'consumer5@demo.com', full_name: 'Diana Davis', zip_code: '10001', delivery_address: '654 Madison Ave, New York, NY 10001', phone: '555-0105' },
    { email: 'consumer6@demo.com', full_name: 'Eva Martinez', zip_code: '10001', delivery_address: '987 Lexington Ave, New York, NY 10001', phone: '555-0106' }
  ],
  driver: { email: 'driver@demo.com', full_name: 'Mike Driver', license_number: 'NY1234567', vehicle_type: 'Van', vehicle_make: 'Ford', vehicle_year: '2020' },
  leadFarmer: { email: 'leadfarmer@demo.com', full_name: 'Sarah Organizer', farm_name: 'Hub Farm', zip_code: '10001' }
};

async function seedDemo() {
  console.log('🌱 Starting demo data seed...\n');

  try {
    // 1. Create farmer users
    console.log('Creating farmer accounts...');
    const farmerIds: { [email: string]: string } = {};
    
    for (const farmer of DEMO_DATA.farms) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: farmer.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: farmer.full_name }
      });

      if (authError) {
        console.error(`Failed to create farmer ${farmer.email}:`, authError.message);
        continue;
      }

      farmerIds[farmer.email] = authData.user!.id;

      // Update profile
      await supabase
        .from('profiles')
        .update({
          full_name: farmer.full_name,
          zip_code: farmer.zip_code,
          approval_status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', authData.user!.id);

      // Add farmer role
      await supabase
        .from('user_roles')
        .insert({ user_id: authData.user!.id, role: 'farmer' });

      // Create farm profile
      const { data: farmProfile } = await supabase
        .from('farm_profiles')
        .insert({
          farmer_id: authData.user!.id,
          farm_name: farmer.farm_name,
          description: `Fresh produce from ${farmer.farm_name}`,
          location: `New York, NY ${farmer.zip_code}`
        })
        .select()
        .single();

      console.log(`✅ Created farmer: ${farmer.full_name} (${farmer.farm_name})`);

      // Create products for this farm
      const productsPerFarm = Math.ceil(DEMO_DATA.products.length / DEMO_DATA.farms.length);
      const farmProducts = DEMO_DATA.products.slice(
        DEMO_DATA.farms.indexOf(farmer) * productsPerFarm,
        (DEMO_DATA.farms.indexOf(farmer) + 1) * productsPerFarm
      );

      for (const product of farmProducts) {
        await supabase
          .from('products')
          .insert({
            farm_profile_id: farmProfile.id,
            ...product
          });
      }
      console.log(`  → Added ${farmProducts.length} products`);
    }

    // 2. Create consumer accounts
    console.log('\nCreating consumer accounts...');
    const consumerIds: string[] = [];

    for (const consumer of DEMO_DATA.consumers) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: consumer.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: consumer.full_name }
      });

      if (authError) {
        console.error(`Failed to create consumer ${consumer.email}:`, authError.message);
        continue;
      }

      consumerIds.push(authData.user!.id);

      // Update profile
      await supabase
        .from('profiles')
        .update({
          full_name: consumer.full_name,
          zip_code: consumer.zip_code,
          delivery_address: consumer.delivery_address,
          phone: consumer.phone,
          approval_status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', authData.user!.id);

      // Add consumer role
      await supabase
        .from('user_roles')
        .insert({ user_id: authData.user!.id, role: 'consumer' });

      console.log(`✅ Created consumer: ${consumer.full_name}`);
    }

    // 3. Create driver account
    console.log('\nCreating driver account...');
    const { data: driverAuth, error: driverError } = await supabase.auth.admin.createUser({
      email: DEMO_DATA.driver.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_DATA.driver.full_name }
    });

    if (!driverError && driverAuth.user) {
      await supabase
        .from('profiles')
        .update({
          full_name: DEMO_DATA.driver.full_name,
          license_number: DEMO_DATA.driver.license_number,
          vehicle_type: DEMO_DATA.driver.vehicle_type,
          vehicle_make: DEMO_DATA.driver.vehicle_make,
          vehicle_year: DEMO_DATA.driver.vehicle_year,
          approval_status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', driverAuth.user.id);

      await supabase
        .from('user_roles')
        .insert({ user_id: driverAuth.user.id, role: 'driver' });

      console.log(`✅ Created driver: ${DEMO_DATA.driver.full_name}`);
    }

    // 4. Create lead farmer account
    console.log('\nCreating lead farmer account...');
    const { data: leadAuth, error: leadError } = await supabase.auth.admin.createUser({
      email: DEMO_DATA.leadFarmer.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_DATA.leadFarmer.full_name }
    });

    if (!leadError && leadAuth.user) {
      await supabase
        .from('profiles')
        .update({
          full_name: DEMO_DATA.leadFarmer.full_name,
          farm_name: DEMO_DATA.leadFarmer.farm_name,
          zip_code: DEMO_DATA.leadFarmer.zip_code,
          approval_status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', leadAuth.user.id);

      await supabase
        .from('user_roles')
        .insert({ user_id: leadAuth.user.id, role: 'lead_farmer' });

      console.log(`✅ Created lead farmer: ${DEMO_DATA.leadFarmer.full_name}`);
    }

    // 5. Create market config
    console.log('\nCreating market config...');
    await supabase
      .from('market_configs')
      .upsert({
        zip_code: '10001',
        delivery_fee: 7.50,
        minimum_order: 25.00,
        cutoff_time: '23:59:00',
        delivery_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        active: true
      }, { onConflict: 'zip_code' });

    console.log('✅ Market config created');

    console.log('\n✨ Demo data seeded successfully!\n');
    console.log('📝 Login credentials:');
    console.log('   Password for all demo accounts: demo123456');
    console.log('   Farmers: farmer1@demo.com, farmer2@demo.com');
    console.log('   Consumers: consumer1@demo.com through consumer6@demo.com');
    console.log('   Driver: driver@demo.com');
    console.log('   Lead Farmer: leadfarmer@demo.com\n');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedDemo();
