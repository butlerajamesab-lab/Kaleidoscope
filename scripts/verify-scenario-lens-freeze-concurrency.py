"""Concurrency regression for a disposable database rebuilt from real migrations.

Never run this fixture against production: it commits synthetic local scenarios.
Baseline mode proves the original REPEATABLE READ bypass; fixed mode rejects it
and proves both normal READ COMMITTED lock orderings with independent sessions.
"""
import argparse
import os
import threading
import time
import uuid

import psycopg

parser = argparse.ArgumentParser()
parser.add_argument("--baseline", action="store_true")
args = parser.parse_args()
database_url = os.environ["TEST_DATABASE_URL"]
if "127.0.0.1:54322/" not in database_url:
    raise SystemExit("This fixture requires the disposable local Supabase database")


def connect():
    return psycopg.connect(database_url, autocommit=True)


def fixture(lens_count=3):
    """Insert valid synthetic rows through the actual installed constraints."""
    with connect() as c:
        token = str(uuid.uuid4())
        snapshots = []
        for kind in ("baseline", "changed"):
            snapshots.append(c.execute(
                "insert into kaleidoscope.state_snapshot "
                "(external_snapshot_id,snapshot_kind,as_of_date,jurisdiction_scope,snapshot_hash) "
                "values (%s,%s,current_date,'[]',%s) returning state_snapshot_id",
                ("test-freeze-" + kind + token, kind, "a" * 64),
            ).fetchone()[0])
        change = c.execute(
            "insert into kaleidoscope.change_set "
            "(external_change_set_id,baseline_snapshot_id,changed_snapshot_id,input_hash,output_hash) "
            "values (%s,%s,%s,%s,%s) returning change_set_id",
            ("test-freeze-" + token, *snapshots, "b" * 64, "c" * 64),
        ).fetchone()[0]
        scenario = c.execute(
            "insert into kaleidoscope.scenario "
            "(external_scenario_id,baseline_snapshot_id,change_set_id,scenario_hash) "
            "values (%s,%s,%s,%s) returning scenario_id",
            ("test-freeze-" + token, snapshots[0], change, "d" * 64),
        ).fetchone()[0]
        lenses = []
        for i in range(4):
            lens = c.execute(
                "insert into kaleidoscope.lens_manifest "
                "(lens_id,lens_version,purpose,rule_manifest_id,rule_manifest_hash,"
                "unresolved_behavior,no_mutation,manifest_hash) "
                "values (%s,'1.0.0','isolated concurrency test',%s,%s,'preserve',true,%s) "
                "returning lens_manifest_id",
                ("test-freeze-" + token + str(i), token, "e" * 64, "f" * 64),
            ).fetchone()[0]
            lenses.append(lens)
            if i < lens_count:
                insert_lens(c, scenario, lens, i + 1)
        return scenario, lenses


def insert_lens(c, scenario, lens, order):
    c.execute("insert into kaleidoscope.scenario_lens values (%s,%s,%s)",
              (scenario, lens, order))


def insert_run(c, scenario):
    c.execute(
        "insert into kaleidoscope.projection_run "
        "(scenario_id,engine_version,canonicalization_version,run_status,input_hash,human_review_state) "
        "values (%s,'isolated-freeze-test','1.0.0','unresolved',%s,'required')",
        (scenario, "a" * 64),
    )


def attempt(c, operation, result, done):
    try:
        operation()
        c.execute("commit")
        result.append("accepted")
    except psycopg.Error as error:
        c.execute("rollback")
        result.append(error.sqlstate)
    finally:
        done.set()


def wait_for_advisory_lock(pid):
    deadline = time.monotonic() + 5
    with connect() as observer:
        while time.monotonic() < deadline:
            waiting = observer.execute(
                "select exists(select 1 from pg_locks "
                "where pid=%s and locktype='advisory' and not granted)", (pid,),
            ).fetchone()[0]
            if waiting:
                return
            time.sleep(0.02)
    raise AssertionError("competing session never waited for the actual scenario advisory lock")


def race(isolation, lens_first=False, expect="23514", fixed_snapshot=False):
    scenario, lenses = fixture(2 if lens_first else 3)
    with connect() as first, connect() as second:
        first.execute("begin")
        if lens_first:
            insert_lens(first, scenario, lenses[2], 3)
        else:
            insert_run(first, scenario)
        second.execute("begin isolation level " + isolation)
        # Establish the exact stale snapshot described by review 4313007889.
        second.execute("select count(*) from kaleidoscope.projection_run").fetchone()
        result, done = [], threading.Event()
        operation = (lambda: insert_run(second, scenario)) if lens_first else (
            lambda: insert_lens(second, scenario, lenses[3], 4))
        worker = threading.Thread(target=attempt, args=(second, operation, result, done), daemon=True)
        worker.start()
        if fixed_snapshot:
            assert done.wait(5), "fixed-snapshot write should fail before lock acquisition"
        else:
            wait_for_advisory_lock(second.info.backend_pid)
        first.execute("commit")
        worker.join(5)
        assert not worker.is_alive(), "competing write did not complete"
        assert result == [expect], (isolation, lens_first, result, expect)
    with connect() as c:
        count = c.execute("select count(*) from kaleidoscope.scenario_lens where scenario_id=%s",
                          (scenario,)).fetchone()[0]
        assert count == (4 if args.baseline else 3), count
        run_count = c.execute("select count(*) from kaleidoscope.projection_run where scenario_id=%s",
                              (scenario,)).fetchone()[0]
        assert run_count == (0 if lens_first and fixed_snapshot else 1), run_count


if args.baseline:
    race("repeatable read", expect="accepted")
    print("PASS: reproduced original stale-snapshot lens append after committed run")
else:
    race("read committed")
    race("read committed", lens_first=True, expect="accepted")
    for isolation in ("repeatable read", "serializable"):
        race(isolation, expect="25000", fixed_snapshot=True)
        race(isolation, lens_first=True, expect="25000", fixed_snapshot=True)
    print("PASS: both READ COMMITTED lock orderings; both fixed-snapshot modes rejected on both paths")
