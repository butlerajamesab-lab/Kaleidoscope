begin;
revoke all on schema kaleidoscope from service_role;
drop schema if exists kaleidoscope cascade;
commit;
