export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (!parsed.success) {
      const errors = parsed.error.issues.map((err) => ({
        path: err.path.join('.').replace(/^body\.|^query\.|^params\./, ''),
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: errors[0]?.message || 'Validation error',
        errors
      });
    }

    // Assign sanitized data if available
    if (parsed.data.body) req.body = parsed.data.body;
    if (parsed.data.query) req.query = parsed.data.query;
    if (parsed.data.params) req.params = parsed.data.params;

    next();
  } catch (err) {
    next(err);
  }
};
