begin;

revoke all on all functions in schema kaleidoscope from public, anon, authenticated;
grant execute on all functions in schema kaleidoscope to service_role;

alter default privileges in schema kaleidoscope
  revoke all on tables from public, anon, authenticated;
alter default privileges in schema kaleidoscope
  revoke all on sequences from public, anon, authenticated;
alter default privileges in schema kaleidoscope
  revoke all on functions from public, anon, authenticated;

alter default privileges in schema kaleidoscope
  grant select, insert on tables to service_role;
alter default privileges in schema kaleidoscope
  grant usage, select on sequences to service_role;
alter default privileges in schema kaleidoscope
  grant execute on functions to service_role;

commit;
