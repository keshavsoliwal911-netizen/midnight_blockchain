import assert from 'node:assert/strict';
import test from 'node:test';
import { PartyStateModel } from '../lib/rsvp-model.js';

test('accepts an invited RSVP and permits a private modification', () => {
  const party = new PartyStateModel(100, 2);
  party.addRsvp('guest-a', 'ATTENDING', 50, true);
  party.addRsvp('guest-a', 'MAYBE', 60, true);
  assert.equal(party.guestCount, 1);
  assert.equal(party.getResponse('guest-a'), 'MAYBE');
});

test('rejects a non-invited RSVP', () => {
  const party = new PartyStateModel(100, 2);
  assert.throws(() => party.addRsvp('guest-a', 'ATTENDING', 50, false), /Invitation/);
});

test('rejects RSVP after deadline', () => {
  const party = new PartyStateModel(100, 2);
  assert.throws(() => party.addRsvp('guest-a', 'ATTENDING', 101, true), /deadline/);
});

test('enforces capacity only for new guests', () => {
  const party = new PartyStateModel(100, 1);
  party.addRsvp('guest-a', 'ATTENDING', 1, true);
  party.addRsvp('guest-a', 'NOT_ATTENDING', 2, true);
  assert.throws(() => party.addRsvp('guest-b', 'MAYBE', 3, true), /capacity/);
});

test('rejects all changes after the host closes the party', () => {
  const party = new PartyStateModel(100, 2);
  party.close('host');
  assert.throws(() => party.addRsvp('guest-a', 'ATTENDING', 1, true), /closed/);
});

test('rejects unauthorized host operations', () => {
  const party = new PartyStateModel(100, 2);
  assert.throws(() => party.close('guest-a'), /Only the host/);
});
