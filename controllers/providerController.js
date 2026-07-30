import * as providerService from "../services/providerService.js";

export const searchProviders = async (req, res) => {
  try {
    const { service, location } = req.query;

    const providers = await providerService.search(
      service,
      location
    );

    res.json(providers);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};