begin;

-- An append-only manifest must assign exactly one byte identity per external
-- artifact ID. A changed byte identity belongs in a superseding manifest.
-- Fail closed if preexisting rows violate the invariant; do not delete them.
do $$
begin
  if exists (
    select 1
    from kaleidoscope.source_artifact
    group by custody_manifest_id, external_artifact_id
    having count(*) > 1
  ) then
    raise exception using
      errcode = '23505',
      message = 'conflicting custody identities exist for a manifest and external artifact ID; reconcile before applying uniqueness';
  end if;
end;
$$;

create unique index if not exists source_artifact_manifest_external_identity_unique
  on kaleidoscope.source_artifact (custody_manifest_id, external_artifact_id);

commit;
