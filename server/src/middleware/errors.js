// Central error handler: turns known errors into clean 4xx responses.
export function errorHandler(err, req, res, next) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON' });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors ?? {}).map((e) => e.message);
    return res.status(400).json({ error: messages.length ? messages.join('; ') : err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid value for ${err.path}` });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'A part with that name already exists' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
