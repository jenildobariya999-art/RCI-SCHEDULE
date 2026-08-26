export default async function handler(req, res) {

    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            ok: false,
            error: "POST method required"
        });
    }

    try {

        const body = req.body || {};

        const initData = body.init_data || "";

        if (!initData) {
            return res.status(400).json({
                ok: false,
                error: "Telegram init_data missing"
            });
        }

        /*
         * At this point your Vercel API has received
         * the Telegram Mini App session.
         *
         * IMPORTANT:
         * You still need to connect this API to your
         * TBC backend/database to retrieve Bot.getData().
         */

        return res.status(200).json({

            ok: true,

            bot: {
                id: null,
                name: "TBC Bot",
                username: null,
                status: "online"
            },

            user: {
                id: null,
                first_name: null,
                username: null
            },

            stats: {
                total_users: 0,
                total_balance: 0,
                total_admins: 0,
                total_transactions: 0
            },

            settings: {
                daily_bonus: 0,
                refer_bonus: 0,
                min_withdraw: 0,
                currency: "₹"
            },

            admins: [],
            channels: [],
            transactions: [],
            gateways: [],
            users: []

        });

    } catch (error) {

        return res.status(500).json({
            ok: false,
            error: error.message
        });

    }
}
