const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const User = require("../models/User");
const {
  PlaidApi,
  PlaidEnvironments,
  Configuration,
  Products,
  CountryCode,
} = require("plaid");

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
      },
    },
  })
);

/**
 * POST /api/plaid/create-link-token
 * Creates a Plaid link token to initialize the Link flow on the client.
 */
router.post("/create-link-token", protect, async (req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: req.user._id.toString() },
      client_name: "Oinky",
      products: [Products.Auth],
      country_codes: [CountryCode.Us],
      language: "en",
    });
    res.json({ success: true, link_token: response.data.link_token });
  } catch (err) {
    console.error("Plaid create-link-token error:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Could not create Plaid link token." });
  }
});

/**
 * POST /api/plaid/exchange-token
 * Exchanges a public_token from the client for a permanent access_token.
 * Saves the access_token on the User document.
 */
router.post("/exchange-token", protect, async (req, res) => {
  try {
    const { public_token } = req.body;
    if (!public_token) {
      return res.status(400).json({ success: false, message: "public_token is required." });
    }
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    const access_token = response.data.access_token;
    await User.findByIdAndUpdate(req.user._id, { plaidAccessToken: access_token });
    res.json({ success: true });
  } catch (err) {
    console.error("Plaid exchange-token error:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Could not exchange Plaid token." });
  }
});

/**
 * GET /api/plaid/balance
 * Returns account balances for the linked bank.
 * Returns empty accounts array if no bank is linked.
 */
router.get("/balance", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.plaidAccessToken) {
      return res.json({ success: true, linked: false, accounts: [] });
    }
    const response = await plaidClient.accountsBalanceGet({
      access_token: user.plaidAccessToken,
    });
    res.json({ success: true, linked: true, accounts: response.data.accounts });
  } catch (err) {
    console.error("Plaid balance error:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Could not fetch bank balance." });
  }
});

/**
 * DELETE /api/plaid/unlink
 * Removes the stored access token, unlinking the bank account.
 */
router.delete("/unlink", protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { plaidAccessToken: null });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
