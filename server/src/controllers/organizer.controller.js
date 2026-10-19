import {
  createOrganizerEvent,
  updateOrganizerEvent,
  publishOrganizerEvent,
} from '../services/organizer.service.js';

export async function createEvent(req, res) {
  const event = await createOrganizerEvent(req.user.id, req.body);

  return res.status(201).json({
    data: event,
  });
}

export async function updateEvent(req, res) {
  const event = await updateOrganizerEvent(
    req.params.id,
    req.user.id,
    req.body
  );

  return res.status(200).json({
    data: event,
  });
}

export async function publishEvent(req, res) {
  const event = await publishOrganizerEvent(req.params.id, req.user.id);

  return res.status(200).json({
    data: event,
  });
}
