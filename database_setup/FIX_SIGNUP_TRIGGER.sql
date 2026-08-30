-- FIX FOR SIGNUP ERRORS:
-- This updates the trigger to allow ANYONE to sign up for testing purposes.
-- If the email is in the customers_master list, it will auto-link their solar system.
-- If the email is NOT in the list, it will just create a standard account without crashing.

create or replace function public.handle_new_user() 
returns trigger as $$
declare
  master_record public.customers_master%rowtype;
begin
  -- Check if email exists in customers_master
  select * into master_record from public.customers_master where email = new.email;
  
  if found then
    -- 1. Create Profile (Auto-filled from Master)
    insert into public.profiles (id, name, phone, address, role)
    values (new.id, master_record.name, master_record.phone, master_record.address, 'customer');

    -- 2. Create Solar System (Auto-filled from Master)
    insert into public.solar_systems (customer_id, capacity_kw, installation_date, amc_status, amc_valid_until)
    values (new.id, master_record.system_capacity_kw, master_record.installation_date, master_record.amc_status, master_record.amc_valid_until);
  else
    -- ALWAYS ALLOW SIGNUP FOR TESTING
    insert into public.profiles (id, name, role)
    values (new.id, coalesce(new.raw_user_meta_data->>'name', 'New Customer'), coalesce(new.raw_user_meta_data->>'role', 'customer'));
  end if;

  return new;
end;
$$ language plpgsql security definer;
