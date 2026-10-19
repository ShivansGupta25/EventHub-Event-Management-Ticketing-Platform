import { listPublicEvents, getPublicEvent } from '../services/event.service.js';

export async function listEvents(req, res) {
  const result = await listPublicEvents(req.query);

  return res.status(200).json(result);
}

export async function getEvent(req, res) {
  const event = await getPublicEvent(req.params.eventId);

  return res.status(200).json({
    data: event,
  });
}
