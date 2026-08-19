export type RsvpResponse = 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE';

export class PartyStateModel {
  private readonly rsvps = new Map<string, RsvpResponse>();
  private closed = false;

  constructor(
    readonly deadline: number,
    readonly maxGuests: number,
    readonly hostId = 'host',
  ) {}

  addRsvp(guestId: string, response: RsvpResponse, now: number, invited: boolean) {
    if (this.closed) throw new Error('Party is closed');
    if (now > this.deadline) throw new Error('RSVP deadline has passed');
    if (!invited) throw new Error('Invitation is not valid');
    if (!this.rsvps.has(guestId) && this.maxGuests > 0 && this.rsvps.size >= this.maxGuests) {
      throw new Error('Guest capacity has been reached');
    }
    this.rsvps.set(guestId, response);
  }

  close(callerId = this.hostId) {
    if (callerId !== this.hostId) throw new Error('Only the host can close the party');
    this.closed = true;
  }
  get guestCount() { return this.rsvps.size; }
  get responseCount() { return this.rsvps.size; }
  getResponse(guestId: string) { return this.rsvps.get(guestId); }
}
